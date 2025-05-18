package compiler

import (
	"fmt"
	"go/ast"
	"go/token"
	"go/types"
	"slices"
)

// WriteCompositeLit translates a Go composite literal (ast.CompositeLit) into its
// TypeScript equivalent.
//
// It handles several types of composite literals:
//   - Map literals (e.g., `map[K]V{k1: v1}`): Translated to `new Map([[k1_ts, v1_ts]])`.
//     Values are processed by `writeBoxedValue`.
//   - Array/Slice literals (e.g., `[]T{e1, e2}`, `[N]T{idx: val}`):
//     Translated using the `$.arrayToSlice<T_ts>([...])` runtime helper.
//     It handles both keyed and unkeyed elements, infers length if necessary,
//     and uses zero values for uninitialized array elements.
//     Multi-dimensional arrays/slices pass a depth parameter to `$.arrayToSlice`.
//     Element values are processed by `writeBoxedValue`.
//   - Struct literals:
//   - Named structs (e.g., `MyStruct{F: v}` or `&MyStruct{F: v}`): Translated to
//     `new MyStruct_ts({ F: v_ts, ... })`. The constructor typically uses an `_init` method.
//   - Anonymous structs (e.g., `struct{F int}{F: v}`): Translated to TypeScript
//     object literals `{ F: v_ts, ... }`.
//     It processes keyed elements (`FieldName: Value`) and unkeyed elements (for anonymous
//     structs or arrays). Field values are processed by `writeBoxedValue`.
//     Embedded struct fields are initialized, and explicit initializers for embedded
//     structs (e.g. `Outer{InnerField: InnerType{...}}`) are handled.
//     The function uses `c.analysis` to determine correct value access (e.g., `.value` for boxed fields).
func (c *GoToTSCompiler) WriteCompositeLit(exp *ast.CompositeLit) error {
	// Get the type of the composite literal
	litType := c.pkg.TypesInfo.TypeOf(exp)
	if exp.Type != nil {
		// Handle map literals: map[K]V{k1: v1, k2: v2}
		if _, isMapType := exp.Type.(*ast.MapType); isMapType {
			c.tsw.WriteLiterally("new Map([")

			// Add each key-value pair as an entry
			for i, elm := range exp.Elts {
				if i > 0 {
					c.tsw.WriteLiterally(", ")
				}

				if kv, ok := elm.(*ast.KeyValueExpr); ok {
					c.tsw.WriteLiterally("[")
					if err := c.WriteBoxedValue(kv.Key); err != nil {
						return fmt.Errorf("failed to write map literal key: %w", err)
					}
					c.tsw.WriteLiterally(", ")
					if err := c.WriteBoxedValue(kv.Value); err != nil {
						return fmt.Errorf("failed to write map literal value: %w", err)
					}
					c.tsw.WriteLiterally("]")
				} else {
					return fmt.Errorf("map literal elements must be key-value pairs")
				}
			}

			c.tsw.WriteLiterally("])")
			return nil
		}

		// Handle array literals
		if arrType, isArrayType := exp.Type.(*ast.ArrayType); isArrayType {
			// Check if this is a slice of slices (multi-dimensional array)
			isMultiDimensional := false
			if _, ok := arrType.Elt.(*ast.ArrayType); ok {
				// It's a slice of slices (multi-dimensional array)
				isMultiDimensional = true
				// We'll handle this with depth parameter to arrayToSlice
			}

			c.tsw.WriteLiterally("$.arrayToSlice")

			// write the type annotation
			c.tsw.WriteLiterally("<")
			// Write the element type using the existing function
			c.WriteTypeExpr(arrType.Elt)
			c.tsw.WriteLiterally(">")

			c.tsw.WriteLiterally("([")

			// Use type info to get array length and element type
			var arrayLen int
			var elemType ast.Expr
			var goElemType interface{}
			if typ := c.pkg.TypesInfo.TypeOf(exp.Type); typ != nil {
				if at, ok := typ.Underlying().(*types.Array); ok {
					arrayLen = int(at.Len())
					goElemType = at.Elem()
				}
			}
			if arrType.Len != nil {
				// Try to evaluate the length from the AST if not available from type info
				if bl, ok := arrType.Len.(*ast.BasicLit); ok && bl.Kind == token.INT {
					if _, err := fmt.Sscan(bl.Value, &arrayLen); err != nil {
						return fmt.Errorf("failed to parse array length from basic literal: %w", err)
					}
				}
			}
			elemType = arrType.Elt

			// Map of index -> value
			elements := make(map[int]ast.Expr)
			orderedCount := 0
			maxIndex := -1
			hasKeyedElements := false

			for _, elm := range exp.Elts {
				if kv, ok := elm.(*ast.KeyValueExpr); ok {
					if lit, ok := kv.Key.(*ast.BasicLit); ok && lit.Kind == token.INT {
						var index int
						if _, err := fmt.Sscan(lit.Value, &index); err != nil {
							return fmt.Errorf("failed to parse array index from basic literal: %w", err)
						}
						elements[index] = kv.Value
						if index > maxIndex {
							maxIndex = index
						}
						hasKeyedElements = true
					} else {
						c.tsw.WriteCommentInline("unhandled keyed array literal key type")
						if err := c.WriteBoxedValue(elm); err != nil {
							return fmt.Errorf("failed to write keyed array literal element with unhandled key type: %w", err)
						}
					}
				} else {
					elements[orderedCount] = elm
					if orderedCount > maxIndex {
						maxIndex = orderedCount
					}
					orderedCount++
				}
			}

			// Determine array length
			if arrayLen == 0 {
				// If length is not set, infer from max index or number of elements
				if hasKeyedElements {
					arrayLen = maxIndex + 1
				} else {
					arrayLen = len(exp.Elts)
				}
			}

			for i := 0; i < arrayLen; i++ {
				if i > 0 {
					c.tsw.WriteLiterally(", ")
				}
				if elm, ok := elements[i]; ok && elm != nil {
					if err := c.WriteBoxedValue(elm); err != nil {
						return fmt.Errorf("failed to write array literal element: %w", err)
					}
				} else {
					// Write zero value for element type
					if goElemType != nil {
						c.WriteZeroValueForType(goElemType)
					} else {
						c.WriteZeroValueForType(elemType)
					}
				}
			}
			c.tsw.WriteLiterally("]")

			// If it's a multi-dimensional array/slice, use depth=2 to convert nested arrays
			if isMultiDimensional {
				c.tsw.WriteLiterally(", 2") // Depth of 2 for one level of nesting
			}

			c.tsw.WriteLiterally(")")
			return nil
		} else {
			// Check if this is a struct type
			var structType *types.Struct
			isStructLiteral := false
			isAnonymousStruct := false

			if namedType, ok := litType.(*types.Named); ok {
				if underlyingStruct, ok := namedType.Underlying().(*types.Struct); ok {
					structType = underlyingStruct
					isStructLiteral = true
					// Named struct, use constructor
					c.tsw.WriteLiterally("new ")
					c.WriteTypeExpr(exp.Type)
				}
			} else if ptrType, ok := litType.(*types.Pointer); ok {
				if namedElem, ok := ptrType.Elem().(*types.Named); ok {
					if underlyingStruct, ok := namedElem.Underlying().(*types.Struct); ok {
						structType = underlyingStruct
						isStructLiteral = true // Treat pointer-to-struct literal similarly
						// Named struct pointer, use constructor
						c.tsw.WriteLiterally("new ")
						c.WriteTypeExpr(exp.Type)
					}
				}
			} else if underlyingStruct, ok := litType.Underlying().(*types.Struct); ok {
				// Anonymous struct literal
				structType = underlyingStruct
				isStructLiteral = true
				isAnonymousStruct = true
				// For anonymous structs, don't use constructor, just create object literal
			}

			if isStructLiteral && structType != nil {
				// --- Struct Literal Handling (Nested) ---
				directFields := make(map[string]ast.Expr)
				embeddedFields := make(map[string]map[string]ast.Expr) // map[EmbeddedPropName]map[FieldName]ValueExpr
				explicitEmbedded := make(map[string]ast.Expr)          // Tracks explicitly initialized embedded structs

				// Pre-populate embeddedFields map keys using the correct property name
				for i := 0; i < structType.NumFields(); i++ {
					field := structType.Field(i)
					if field.Anonymous() {
						fieldType := field.Type()
						if ptr, ok := fieldType.(*types.Pointer); ok {
							fieldType = ptr.Elem()
						}
						if named, ok := fieldType.(*types.Named); ok {
							// Use the type name as the property name in TS
							embeddedPropName := named.Obj().Name()
							embeddedFields[embeddedPropName] = make(map[string]ast.Expr)
						}
					}
				}

				// Group literal elements by direct vs embedded fields
				for _, elt := range exp.Elts {
					kv, ok := elt.(*ast.KeyValueExpr)
					if !ok {
						continue
					} // Skip non-key-value
					keyIdent, ok := kv.Key.(*ast.Ident)
					if !ok {
						continue
					} // Skip non-ident keys
					keyName := keyIdent.Name

					// Check if this is an explicit embedded struct initialization
					// e.g., Person: Person{...} or Person: personVar
					if _, isEmbedded := embeddedFields[keyName]; isEmbedded {
						// This is an explicit initialization of an embedded struct
						explicitEmbedded[keyName] = kv.Value
						continue
					}

					isDirectField := false
					for i := range structType.NumFields() {
						field := structType.Field(i)
						if field.Name() == keyName {
							isDirectField = true
							directFields[keyName] = kv.Value
							break
						}
					}

					// For anonymous structs, all fields are direct fields
					if isAnonymousStruct {
						directFields[keyName] = kv.Value
						isDirectField = true
					}

					// If not a direct field, return an error
					if !isDirectField {
						// This field was not found as a direct field in the struct
						return fmt.Errorf("field %s not found in type %s for composite literal",
							keyName, litType.String())
					}
				}

				// Handle the case where an anonymous struct has values without keys
				// Handle the case where an anonymous struct has values without keys.
				// This block processes non-key-value elements and associates them with struct fields.
				if isAnonymousStruct && len(exp.Elts) > 0 && len(directFields) == 0 && structType != nil {
					// Check if any elements in the composite literal are not key-value pairs.
					hasNonKeyValueElts := false
					for _, elt := range exp.Elts {
						// If an element is not a key-value pair, set the flag to true.
						if _, isKV := elt.(*ast.KeyValueExpr); !isKV {
							hasNonKeyValueElts = true
							break
						}
					}

					if hasNonKeyValueElts {
						// Get the fields from the struct type
						for i := 0; i < structType.NumFields(); i++ {
							field := structType.Field(i)
							// If we have a value for this field position
							if i < len(exp.Elts) {
								// Check if it's not a key-value pair
								if _, isKV := exp.Elts[i].(*ast.KeyValueExpr); !isKV {
									directFields[field.Name()] = exp.Elts[i]
								}
							}
						}
					}
				}

				// Write the object literal
				if isAnonymousStruct {
					// For anonymous structs, just write a simple object literal
					c.tsw.WriteLiterally("{")
				} else {
					// For named structs, write the constructor argument
					c.tsw.WriteLiterally("({")
				}

				firstFieldWritten := false

				// Write direct fields that aren't embedded struct names
				directKeys := make([]string, 0, len(directFields))
				for k := range directFields {
					// Skip embedded struct names - we'll handle those separately
					if _, isEmbedded := embeddedFields[k]; !isEmbedded {
						directKeys = append(directKeys, k)
					}
				}
				slices.Sort(directKeys)
				for _, keyName := range directKeys {
					if firstFieldWritten {
						c.tsw.WriteLiterally(", ")
					}
					c.tsw.WriteLiterally(keyName)
					c.tsw.WriteLiterally(": ")
					if err := c.WriteBoxedValue(directFields[keyName]); err != nil {
						return err
					}
					firstFieldWritten = true
				}

				// Write explicitly initialized embedded structs
				explicitKeys := make([]string, 0, len(explicitEmbedded))
				for k := range explicitEmbedded {
					explicitKeys = append(explicitKeys, k)
				}
				slices.Sort(explicitKeys)
				for _, embeddedName := range explicitKeys {
					if firstFieldWritten {
						c.tsw.WriteLiterally(", ")
					}
					c.tsw.WriteLiterally(embeddedName)
					c.tsw.WriteLiterally(": ")

					// Check if the embedded value is a composite literal for a struct
					// If so, extract the fields and write them directly
					if compLit, ok := explicitEmbedded[embeddedName].(*ast.CompositeLit); ok {
						// Write initialization fields directly without the 'new Constructor'
						c.tsw.WriteLiterally("{")
						for i, elem := range compLit.Elts {
							if i > 0 {
								c.tsw.WriteLiterally(", ")
							}
							if err := c.WriteBoxedValue(elem); err != nil {
								return err
							}
						}
						c.tsw.WriteLiterally("}")
					} else {
						// Not a composite literal, write it normally
						if err := c.WriteBoxedValue(explicitEmbedded[embeddedName]); err != nil {
							return err
						}
					}
					firstFieldWritten = true
				}

				// Write embedded fields for structs that weren't explicitly initialized
				embeddedKeys := make([]string, 0, len(embeddedFields))
				for k := range embeddedFields {
					// Skip embedded structs that were explicitly initialized
					if _, wasExplicit := explicitEmbedded[k]; !wasExplicit {
						embeddedKeys = append(embeddedKeys, k)
					}
				}
				slices.Sort(embeddedKeys)
				for _, embeddedPropName := range embeddedKeys {
					fieldsMap := embeddedFields[embeddedPropName]
					if len(fieldsMap) == 0 {
						continue
					} // Skip empty embedded initializers

					if firstFieldWritten {
						c.tsw.WriteLiterally(", ")
					}
					c.tsw.WriteLiterally(embeddedPropName) // Use the Type name as the property key
					c.tsw.WriteLiterally(": {")

					innerKeys := make([]string, 0, len(fieldsMap))
					for k := range fieldsMap {
						innerKeys = append(innerKeys, k)
					}
					slices.Sort(innerKeys)
					for i, keyName := range innerKeys {
						if i > 0 {
							c.tsw.WriteLiterally(", ")
						}
						c.tsw.WriteLiterally(keyName) // Field name within the embedded struct
						c.tsw.WriteLiterally(": ")
						if err := c.WriteBoxedValue(fieldsMap[keyName]); err != nil {
							return err
						}
					}
					c.tsw.WriteLiterally("}")
					firstFieldWritten = true
				}

				// Close the object literal
				if isAnonymousStruct {
					c.tsw.WriteLiterally("}")
				} else {
					c.tsw.WriteLiterally("})")
				}

			} else {
				// Non-struct type or anonymous struct, handle normally (or potentially error for anonymous struct literals?)
				c.tsw.WriteLiterally("({") // Assuming object literal for constructor
				for i, elm := range exp.Elts {
					if i != 0 {
						c.tsw.WriteLiterally(", ")
					}
					if err := c.WriteBoxedValue(elm); err != nil {
						return fmt.Errorf("failed to write literal field: %w", err)
					}
				}
				c.tsw.WriteLiterally("})")
			}
			return nil
		}
	}

	// Untyped composite literal. Let's use type information to determine what it is.
	// First try to get the type information for the expression
	isObject := false
	if tv, ok := c.pkg.TypesInfo.Types[exp]; ok && tv.Type != nil {
		underlying := tv.Type.Underlying()
		switch underlying.(type) {
		case *types.Map, *types.Struct:
			isObject = true
		case *types.Array, *types.Slice:
			isObject = false
		default:
			return fmt.Errorf("unhandled composite literal type: %T", underlying)
		}
	} else {
		return fmt.Errorf("could not determine composite literal type from type information")
	}

	if isObject {
		c.tsw.WriteLiterally("{ ")
	} else {
		c.tsw.WriteLiterally("[ ")
	}

	for i, elm := range exp.Elts {
		if i != 0 {
			c.tsw.WriteLiterally(", ")
		}
		if err := c.WriteBoxedValue(elm); err != nil {
			return fmt.Errorf("failed to write untyped composite literal element: %w", err)
		}
	}
	if isObject {
		c.tsw.WriteLiterally(" }")
	} else {
		c.tsw.WriteLiterally(" ]")
	}
	return nil
}

// WriteBoxedValue translates a Go expression (`ast.Expr`) into its TypeScript equivalent,
// specifically for use as a value within a composite literal (e.g., struct fields,
// map keys/values, or array/slice elements). Its primary goal is to ensure that the
// actual, unboxed value of the expression is used.
//
// How it works:
//   - Identifiers (`*ast.Ident`): Delegates to `c.WriteIdent(ident, true)`, forcing
//     the `accessValue` flag to `true`. This ensures that if `ident` refers to a
//     GoScript boxed variable, the generated TypeScript accesses its underlying `.value`
//     (e.g., `myVar.value`).
//   - Selector Expressions (`*ast.SelectorExpr`, e.g., `obj.Field`): Delegates to
//     `c.WriteSelectorExpr(e)`. This function handles the necessary logic for
//     accessing fields or methods, including any required unboxing if the field
//     itself or the object it's accessed on is boxed (e.g., `obj.value.field` or
//     `obj.field.value`).
//   - Star Expressions (`*ast.StarExpr`, e.g., `*ptr`): Delegates to `c.WriteStarExpr(e)`.
//     This function handles pointer dereferencing, which in GoScript's boxing model
//     often translates to accessing the `.value` field of the pointer (e.g., `ptr.value`).
//   - Basic Literals (`*ast.BasicLit`, e.g., `123`, `"hello"`): Delegates to
//     `c.WriteBasicLit(e)` for direct translation.
//   - Other expression types: Falls back to `c.WriteValueExpr(expr)` for general
//     expression handling. This is important for complex expressions like function
//     calls or binary operations that might appear as values within a composite literal.
//
// Necessity and Distinction from `WriteValueExpr`:
// While `WriteValueExpr` is a general-purpose function for translating Go expressions
// and also unboxes identifiers (by calling `WriteIdent` with `accessValue: true`),
// `WriteBoxedValue` serves a specific and crucial role when called from `WriteCompositeLit`:
//  1. Clarity of Intent: It explicitly signals that for the constituents of a composite
//     literal, the *unboxed value* is mandatory.
//  2. Contract for `WriteCompositeLit`: It ensures that `WriteCompositeLit` receives
//     the correct values for initialization, insulating it from potential changes in
//     the default behavior of `WriteValueExpr` regarding unboxing.
//  3. Prevents Recursion: `WriteValueExpr` handles `*ast.CompositeLit` nodes by
//     calling `WriteCompositeLit`. If `WriteCompositeLit` were to directly call
//     `WriteValueExpr` for its elements, it could lead to unintended recursion or
//     behavior if an element itself was another composite literal. `WriteBoxedValue`
//     acts as a specific intermediary for the *elements*.
//
// In summary, `WriteBoxedValue` is a specialized dispatcher used by `WriteCompositeLit`
// to guarantee that all parts of a Go composite literal are initialized with their
// proper, unboxed TypeScript values.
func (c *GoToTSCompiler) WriteBoxedValue(expr ast.Expr) error {
	if expr == nil {
		return fmt.Errorf("nil expression passed to writeBoxedValue")
	}

	// Handle different expression types
	switch e := expr.(type) {
	case *ast.Ident:
		c.WriteIdent(e, true)
		return nil
	case *ast.SelectorExpr:
		return c.WriteSelectorExpr(e)
	case *ast.StarExpr:
		// For star expressions, delegate to WriteStarExpr which handles dereferencing
		return c.WriteStarExpr(e)
	case *ast.BasicLit:
		c.WriteBasicLit(e)
		return nil
	default:
		// For other expression types, use WriteValueExpr
		return c.WriteValueExpr(expr)
	}
}

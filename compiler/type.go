package compiler

import (
	"fmt"
	"go/ast"
	"go/types"
	"strings"
)

// WriteGoType is the main dispatcher for translating Go types to their TypeScript
// equivalents. It examines the type and delegates to more specialized type writer
// functions based on the specific Go type encountered.
//
// It handles nil types as 'any' with a comment, and dispatches to appropriate
// type-specific writers for all other recognized Go types.
func (c *GoToTSCompiler) WriteGoType(typ types.Type) {
	if typ == nil {
		c.tsw.WriteLiterally("any")
		c.tsw.WriteCommentInline("nil type")
		return
	}

	switch t := typ.(type) {
	case *types.Basic:
		c.WriteBasicType(t)
	case *types.Named:
		c.WriteNamedType(t)
	case *types.Pointer:
		c.WritePointerType(t)
	case *types.Slice:
		c.WriteSliceType(t)
	case *types.Array:
		c.WriteArrayType(t)
	case *types.Map:
		c.WriteMapType(t)
	case *types.Chan:
		c.WriteChannelType(t)
	case *types.Interface:
		c.WriteInterfaceType(t, nil) // No ast.InterfaceType available here
	case *types.Signature:
		c.WriteSignatureType(t)
	case *types.Struct:
		c.WriteStructType(t)
	case *types.Alias:
		c.WriteGoType(t.Underlying())
	default:
		// For other types, just write "any" and add a comment
		c.tsw.WriteLiterally("any")
		c.tsw.WriteCommentInlinef("unhandled type: %T", typ)
	}
}

// WriteZeroValueForType writes the TypeScript representation of the zero value
// for a given Go type.
// It handles `types.Array` by recursively writing zero values for each element
// to form a TypeScript array literal (e.g., `[0, 0, 0]`).
// For `types.Basic` (like `bool`, `string`, numeric types), it writes the
// corresponding TypeScript zero value (`false`, `""`, `0`).
// Other types default to `null`. This function is primarily used for initializing
// arrays and variables where an explicit initializer is absent.
func (c *GoToTSCompiler) WriteZeroValueForType(typ any) {
	switch t := typ.(type) {
	case *types.Array:
		c.tsw.WriteLiterally("[")
		for i := 0; i < int(t.Len()); i++ {
			if i > 0 {
				c.tsw.WriteLiterally(", ")
			}
			c.WriteZeroValueForType(t.Elem())
		}
		c.tsw.WriteLiterally("]")
	case *ast.Expr:
		// For AST expressions, get the type and handle that instead
		if expr := *t; expr != nil {
			if typ := c.pkg.TypesInfo.TypeOf(expr); typ != nil {
				c.WriteZeroValueForType(typ)
				return
			}
		}
		c.tsw.WriteLiterally("null")
	case *types.Basic:
		switch t.Kind() {
		case types.Bool:
			c.tsw.WriteLiterally("false")
		case types.String:
			c.tsw.WriteLiterally(`""`)
		default:
			c.tsw.WriteLiterally("0")
		}
	case *types.Named:
		// Handle named types, especially struct types
		if _, isStruct := t.Underlying().(*types.Struct); isStruct {
			// Initialize struct types with a new instance
			c.tsw.WriteLiterallyf("new %s()", t.Obj().Name())
			return
		}
		// For other named types, use the zero value of the underlying type
		c.WriteZeroValueForType(t.Underlying())
	case *types.Struct:
		// For anonymous struct types, initialize with {}
		c.tsw.WriteLiterally("{}")
	default:
		c.tsw.WriteLiterally("null")
	}
}

// WriteBasicType translates a Go basic type (primitives like int, string, bool)
// to its TypeScript equivalent.
// It handles untyped constants by mapping them to appropriate TypeScript types
// (boolean, number, string, null) and uses GoBuiltinToTypescript for typed primitives.
func (c *GoToTSCompiler) WriteBasicType(t *types.Basic) {
	name := t.Name()

	// Handle untyped constants by mapping them to appropriate TypeScript types
	if t.Info()&types.IsUntyped != 0 {
		switch t.Kind() {
		case types.UntypedBool:
			c.tsw.WriteLiterally("boolean")
			return
		case types.UntypedInt, types.UntypedFloat, types.UntypedComplex, types.UntypedRune:
			c.tsw.WriteLiterally("number")
			return
		case types.UntypedString:
			c.tsw.WriteLiterally("string")
			return
		case types.UntypedNil:
			c.tsw.WriteLiterally("null")
			return
		}
	}

	// For typed basic types, use the existing mapping
	if tsType, ok := GoBuiltinToTypescript(name); ok {
		c.tsw.WriteLiterally(tsType)
	} else {
		c.tsw.WriteLiterally(name)
	}
}

// WriteNamedType translates a Go named type to its TypeScript equivalent.
// It specially handles the error interface as $.GoError, and uses the original
// type name for other named types.
func (c *GoToTSCompiler) WriteNamedType(t *types.Named) {
	// Check if the named type is the error interface
	if iface, ok := t.Underlying().(*types.Interface); ok && iface.String() == "interface{Error() string}" {
		c.tsw.WriteLiterally("$.GoError")
	} else {
		// Use Obj().Name() for the original defined name
		c.tsw.WriteLiterally(t.Obj().Name())
	}
}

// WritePointerType translates a Go pointer type (*T) to its TypeScript equivalent.
// It generates $.Box<T_ts> | null, where T_ts is the translated element type.
func (c *GoToTSCompiler) WritePointerType(t *types.Pointer) {
	c.tsw.WriteLiterally("$.Box<")
	c.WriteGoType(t.Elem())
	c.tsw.WriteLiterally("> | null") // Pointers are always nullable
}

// WriteSliceType translates a Go slice type ([]T) to its TypeScript equivalent.
// It generates $.Slice<T_ts>, where T_ts is the translated element type.
func (c *GoToTSCompiler) WriteSliceType(t *types.Slice) {
	c.tsw.WriteLiterally("$.Slice<")
	c.WriteGoType(t.Elem())
	c.tsw.WriteLiterally(">")
}

// WriteArrayType translates a Go array type ([N]T) to its TypeScript equivalent.
// It generates T_ts[], where T_ts is the translated element type.
func (c *GoToTSCompiler) WriteArrayType(t *types.Array) {
	c.WriteGoType(t.Elem())
	c.tsw.WriteLiterally("[]") // Arrays cannot be nil
}

// WriteMapType translates a Go map type (map[K]V) to its TypeScript equivalent.
// It generates Map<K_ts, V_ts>, where K_ts and V_ts are the translated key
// and element types respectively.
func (c *GoToTSCompiler) WriteMapType(t *types.Map) {
	c.tsw.WriteLiterally("Map<")
	c.WriteGoType(t.Key())
	c.tsw.WriteLiterally(", ")
	c.WriteGoType(t.Elem())
	c.tsw.WriteLiterally(">")
}

// WriteChannelType translates a Go channel type (chan T) to its TypeScript equivalent.
// It generates $.Channel<T_ts>, where T_ts is the translated element type.
func (c *GoToTSCompiler) WriteChannelType(t *types.Chan) {
	c.tsw.WriteLiterally("$.Channel<")
	c.WriteGoType(t.Elem())
	c.tsw.WriteLiterally(">")
}

// WriteFuncType translates a Go function type (`ast.FuncType`) into a TypeScript
// function signature.
// The signature is of the form `(param1: type1, param2: type2) => returnType`.
// - Parameters are written using `WriteFieldList`.
// - Return types:
//   - If there are no results, the return type is `void`.
//   - If there's a single, unnamed result, it's `resultType`.
//   - If there are multiple or named results, it's a tuple type `[typeA, typeB]`.
//   - If `isAsync` is true (indicating the function is known to perform async
//     operations like channel interactions or contains `go` or `defer` with async calls),
//     the return type is wrapped in `Promise<>` (e.g., `Promise<void>`, `Promise<number>`).
func (c *GoToTSCompiler) WriteFuncType(exp *ast.FuncType, isAsync bool) {
	c.tsw.WriteLiterally("(")
	c.WriteFieldList(exp.Params, true) // true = arguments
	c.tsw.WriteLiterally(")")
	if exp.Results != nil && len(exp.Results.List) > 0 {
		// Use colon for return type annotation
		c.tsw.WriteLiterally(": ")
		if isAsync {
			c.tsw.WriteLiterally("Promise<")
		}
		if len(exp.Results.List) == 1 && len(exp.Results.List[0].Names) == 0 {
			// Single unnamed return type
			typ := c.pkg.TypesInfo.TypeOf(exp.Results.List[0].Type)
			c.WriteGoType(typ)
		} else {
			// Multiple or named return types -> tuple
			c.tsw.WriteLiterally("[")
			for i, field := range exp.Results.List {
				if i > 0 {
					c.tsw.WriteLiterally(", ")
				}
				typ := c.pkg.TypesInfo.TypeOf(field.Type)
				c.WriteGoType(typ)
			}
			c.tsw.WriteLiterally("]")
		}
		if isAsync {
			c.tsw.WriteLiterally(">")
		}
	} else {
		// No return value -> void
		if isAsync {
			c.tsw.WriteLiterally(": Promise<void>")
		} else {
			c.tsw.WriteLiterally(": void")
		}
	}
}

// WriteInterfaceType translates a Go interface type to its TypeScript equivalent.
// It specially handles the error interface as $.GoError, and delegates to
// writeInterfaceStructure for other interface types, prepending "null | ".
// If astNode is provided (e.g., from a type spec), comments for methods will be included.
func (c *GoToTSCompiler) WriteInterfaceType(t *types.Interface, astNode *ast.InterfaceType) {
	// Handle the built-in error interface specifically
	if t.String() == "interface{Error() string}" {
		c.tsw.WriteLiterally("$.GoError")
		return
	}

	// Prepend "null | " for all other interfaces.
	// writeInterfaceStructure will handle the actual structure like "{...}" or "any".
	c.tsw.WriteLiterally("null | ")
	c.writeInterfaceStructure(t, astNode)
}

// WriteSignatureType translates a Go function signature to its TypeScript equivalent.
// It generates (param1: type1, param2: type2, ...): returnType for function types.
func (c *GoToTSCompiler) WriteSignatureType(t *types.Signature) {
	c.tsw.WriteLiterally("(")
	c.tsw.WriteLiterally("(")
	params := t.Params()
	for i := 0; i < params.Len(); i++ {
		if i > 0 {
			c.tsw.WriteLiterally(", ")
		}

		param := params.At(i)
		paramSlice, paramIsSlice := param.Type().(*types.Slice)

		paramVariadic := i == params.Len()-1 && t.Variadic()
		if paramVariadic {
			c.tsw.WriteLiterally("...")
		}

		// Use parameter name if available, otherwise use p0, p1, etc.
		if param.Name() != "" {
			c.tsw.WriteLiterally(param.Name())
		} else {
			c.tsw.WriteLiterallyf("p%d", i)
		}
		c.tsw.WriteLiterally(": ")

		if paramVariadic && paramIsSlice {
			c.WriteGoType(paramSlice.Elem())
			c.tsw.WriteLiterally("[]")
		} else {
			c.WriteGoType(param.Type())
		}
	}
	c.tsw.WriteLiterally(")")

	// Handle return types
	c.tsw.WriteLiterally(" => ")
	results := t.Results()
	if results.Len() == 0 {
		c.tsw.WriteLiterally("void")
	} else if results.Len() == 1 {
		c.WriteGoType(results.At(0).Type())
	} else {
		// Multiple return values -> tuple
		c.tsw.WriteLiterally("[")
		for i := 0; i < results.Len(); i++ {
			if i > 0 {
				c.tsw.WriteLiterally(", ")
			}
			c.WriteGoType(results.At(i).Type())
		}
		c.tsw.WriteLiterally("]")
	}
	c.tsw.WriteLiterally(") | null")
}

// writeInterfaceStructure translates a Go `types.Interface` into its TypeScript structural representation.
// If astNode is provided, it's used to fetch comments for methods.
// For example, an interface `interface { MethodA(x int) string; EmbeddedB }` might become
// `{ MethodA(_p0: number): string; } & B_ts`.
func (c *GoToTSCompiler) writeInterfaceStructure(iface *types.Interface, astNode *ast.InterfaceType) {
	// Handle empty interface interface{}
	if iface.NumExplicitMethods() == 0 && iface.NumEmbeddeds() == 0 {
		c.tsw.WriteLiterally("any") // Matches current behavior for interface{}
		return
	}

	// Keep track if we've written any part (methods or first embedded type)
	// to correctly place " & " separators.
	firstPartWritten := false

	// Handle explicit methods
	if iface.NumExplicitMethods() > 0 {
		c.tsw.WriteLiterally("{") // Opening brace for the object type
		c.tsw.Indent(1)
		c.tsw.WriteLine("") // Newline after opening brace, before the first method

		for i := 0; i < iface.NumExplicitMethods(); i++ {
			method := iface.ExplicitMethod(i)
			sig := method.Type().(*types.Signature)

			// Find corresponding ast.Field for comments if astNode is available
			var astField *ast.Field
			if astNode != nil && astNode.Methods != nil {
				for _, f := range astNode.Methods.List {
					// Ensure the field is a named method (not an embedded interface)
					if len(f.Names) > 0 && f.Names[0].Name == method.Name() {
						astField = f
						break
					}
				}
			}

			// Write comments if astField is found
			if astField != nil {
				if astField.Doc != nil {
					c.WriteDoc(astField.Doc) // WriteDoc handles newlines
				}
				if astField.Comment != nil { // For trailing comments on the same line in Go AST
					c.WriteDoc(astField.Comment)
				}
			}

			c.tsw.WriteLiterally(method.Name())
			c.tsw.WriteLiterally("(") // Start params
			params := sig.Params()
			for j := 0; j < params.Len(); j++ {
				if j > 0 {
					c.tsw.WriteLiterally(", ")
				}
				paramVar := params.At(j)
				paramName := paramVar.Name()
				if paramName == "" || paramName == "_" {
					paramName = fmt.Sprintf("_p%d", j)
				}
				c.tsw.WriteLiterally(paramName)
				c.tsw.WriteLiterally(": ")
				c.WriteGoType(paramVar.Type()) // Recursive call for param type
			}
			c.tsw.WriteLiterally(")") // End params

			// Return type
			c.tsw.WriteLiterally(": ")
			results := sig.Results()
			if results.Len() == 0 {
				c.tsw.WriteLiterally("void")
			} else if results.Len() == 1 {
				c.WriteGoType(results.At(0).Type()) // Recursive call for result type
			} else {
				c.tsw.WriteLiterally("[")
				for j := 0; j < results.Len(); j++ {
					if j > 0 {
						c.tsw.WriteLiterally(", ")
					}
					c.WriteGoType(results.At(j).Type()) // Recursive call for result type
				}
				c.tsw.WriteLiterally("]")
			}
			c.tsw.WriteLine("") // newline for each method
		}
		c.tsw.Indent(-1)
		c.tsw.WriteLiterally("}") // Closing brace for the object type
		firstPartWritten = true
	}

	// Handle embedded types
	if iface.NumEmbeddeds() > 0 {
		for i := 0; i < iface.NumEmbeddeds(); i++ {
			if firstPartWritten {
				c.tsw.WriteLiterally(" & ")
			} else {
				// This is the first part being written (no explicit methods, only embedded)
				firstPartWritten = true
			}
			embeddedType := iface.EmbeddedType(i)
			// When WriteGoType encounters an interface, it will call WriteInterfaceType
			// which will pass nil for astNode, so comments for deeply embedded interface literals
			// might not be available unless they are named types.
			c.WriteGoType(embeddedType)
		}
	}
}

// getTypeString is a utility function that converts a Go `types.Type` into its
// TypeScript type string representation. It achieves this by creating a temporary
// `GoToTSCompiler` and `TSCodeWriter` (writing to a `strings.Builder`) and then
// calling `WriteGoType` on the provided Go type. This allows reusing the main
// type translation logic to get a string representation of the TypeScript type.
func (c *GoToTSCompiler) getTypeString(goType types.Type) string {
	var typeStr strings.Builder
	writer := NewTSCodeWriter(&typeStr)
	tempCompiler := NewGoToTSCompiler(writer, c.pkg, c.analysis)
	tempCompiler.WriteGoType(goType)
	return typeStr.String()
}

// WriteStructType translates a Go struct type definition (`ast.StructType`)
// into a TypeScript anonymous object type (e.g., `{ Field1: Type1; Field2: Type2 }`).
// If the struct has no fields, it writes `{}`. Otherwise, it delegates to
// `WriteFieldList` to generate the list of field definitions.
// Note: This is for anonymous struct type literals. Named struct types are usually
// handled as classes via `WriteTypeSpec`.
func (c *GoToTSCompiler) WriteStructType(t *types.Struct) {
	// Generate an interface with the struct's fields
	c.tsw.WriteLiterally("{ ")
	// Add field properties to the interface
	for i := range t.NumFields() {
		field := t.Field(i)
		if i > 0 {
			c.tsw.WriteLiterally("; ")
		}
		c.tsw.WriteLiterally(field.Name() + "?: ")
		c.WriteGoType(field.Type())
	}
	c.tsw.WriteLiterally(" }")
}

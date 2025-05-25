package compiler

import (
	"fmt"
	"go/ast"
	"go/token"
	"go/types"
)

// WriteValueSpec translates a Go value specification (`ast.ValueSpec`),
// which represents `var` or `const` declarations, into TypeScript `let`
// declarations.
//
// For single variable declarations (`var x T = val` or `var x = val` or `var x T`):
//   - It determines if the variable `x` needs to be varrefed (e.g., if its address is taken)
//     using `c.analysis.NeedsVarRef(obj)`.
//   - If variable referenced: `let x: $.VarRef<T_ts> = $.varRef(initializer_ts_or_zero_ts);`
//     The type annotation is `$.VarRef<T_ts>`, and the initializer is wrapped in `$.varRef()`.
//   - If not variable referenced: `let x: T_ts = initializer_ts_or_zero_ts;`
//     The type annotation is `T_ts`. If the initializer is `&unvarrefedVar`, it becomes `$.varRef(unvarrefedVar_ts)`.
//   - If no initializer is provided, the TypeScript zero value (from `WriteZeroValueForType`)
//     is used.
//   - Type `T` (or `T_ts`) is obtained from `obj.Type()` and translated via `WriteGoType`.
//
// For multiple variable declarations (`var a, b = val1, val2` or `a, b := val1, val2`):
//   - It uses TypeScript array destructuring: `let [a, b] = [val1_ts, val2_ts];`.
//   - If initialized from a single multi-return function call (`a, b := func()`),
//     it becomes `let [a, b] = func_ts();`.
//   - If no initializers are provided, it defaults to `let [a,b] = []` (with a TODO
//     to assign correct individual zero values).
//
// Documentation comments associated with the `ValueSpec` are preserved.
func (c *GoToTSCompiler) WriteValueSpec(a *ast.ValueSpec) error {
	if a.Doc != nil {
		c.WriteDoc(a.Doc)
	}
	if a.Comment != nil {
		c.WriteDoc(a.Comment)
	}

	// Handle single variable declaration
	if len(a.Names) == 1 {
		name := a.Names[0]
		obj := c.pkg.TypesInfo.Defs[name]
		if obj == nil {
			return fmt.Errorf("could not resolve type: %v", name)
		}

		goType := obj.Type()
		needsVarRef := c.analysis.NeedsVarRef(obj) // Check if address is taken

		hasInitializer := len(a.Values) > 0
		var initializerExpr ast.Expr
		if hasInitializer {
			initializerExpr = a.Values[0]
		}

		// Check if the initializer will result in an $.arrayToSlice call in TypeScript
		isSliceConversion := false
		if hasInitializer {
			// Case 1: Direct call to $.arrayToSlice in Go source (less common for typical array literals)
			if callExpr, isCallExpr := initializerExpr.(*ast.CallExpr); isCallExpr {
				if selExpr, isSelExpr := callExpr.Fun.(*ast.SelectorExpr); isSelExpr {
					if pkgIdent, isPkgIdent := selExpr.X.(*ast.Ident); isPkgIdent && pkgIdent.Name == "$" {
						if selExpr.Sel.Name == "arrayToSlice" {
							isSliceConversion = true
						}
					}
				}
			}

			// Case 2: Go array or slice literal, which will be compiled to $.arrayToSlice
			// We also check if the original Go type is actually a slice or array.
			if !isSliceConversion { // Only check if not already determined by Case 1
				if _, isCompositeLit := initializerExpr.(*ast.CompositeLit); isCompositeLit {
					switch goType.Underlying().(type) {
					case *types.Slice, *types.Array:
						isSliceConversion = true
					}
				}
			}
		}

		// Start declaration
		c.tsw.WriteLiterally("let ")
		c.tsw.WriteLiterally(name.Name)

		// Write type annotation if:
		// 1. Not a slice conversion (normal case), OR
		// 2. Is a slice conversion but needs varRefing (we need explicit type for $.varRef())
		if !isSliceConversion || needsVarRef {
			c.tsw.WriteLiterally(": ")
			// Write type annotation
			if needsVarRef {
				// If varrefed, the variable holds VarRef<OriginalGoType>
				c.tsw.WriteLiterally("$.VarRef<")

				// Special case: if this is a slice conversion from an array type,
				// we should use the slice type instead of the array type
				if isSliceConversion {
					if arrayType, isArray := goType.Underlying().(*types.Array); isArray {
						// Convert [N]T to $.Slice<T>
						c.tsw.WriteLiterally("$.Slice<")
						c.WriteGoType(arrayType.Elem(), GoTypeContextGeneral)
						c.tsw.WriteLiterally(">")
					} else {
						// For slice types, write as-is (already $.Slice<T>)
						c.WriteGoType(goType, GoTypeContextGeneral)
					}
				} else {
					c.WriteGoType(goType, GoTypeContextGeneral) // Write the original Go type T
				}
				c.tsw.WriteLiterally(">")
			} else {
				// If not varrefed, the variable holds the translated Go type directly
				// Custom logic for non-var-ref'd pointers to structs/interfaces.
				if ptrType, isPtr := goType.(*types.Pointer); isPtr {
					elemType := ptrType.Elem()
					actualElemType := elemType.Underlying() // Get the true underlying type (e.g., struct, interface, basic)

					isStruct := false
					if _, ok := actualElemType.(*types.Struct); ok {
						isStruct = true
					}

					isInterface := false
					if _, ok := actualElemType.(*types.Interface); ok {
						isInterface = true
					}

					if isStruct || isInterface {
						// For non-var-ref'd pointers to structs or interfaces,
						// the type is T | null, not $.VarRef<T> | null.
						c.WriteGoType(elemType, GoTypeContextGeneral) // Write the element type itself (e.g., MyStruct)
						c.tsw.WriteLiterally(" | null")
					} else {
						// For other pointer types (e.g., *int, *string, *[]int, **MyStruct),
						// or pointers to types that are not structs/interfaces,
						// use the standard pointer type translation.
						c.WriteGoType(goType, GoTypeContextGeneral)
					}
				} else {
					// Not a pointer type, write as is.
					c.WriteGoType(goType, GoTypeContextGeneral)
				}
			}
		}

		// Write initializer
		c.tsw.WriteLiterally(" = ")

		// Special case for nil pointer to struct type: (*struct{})(nil)
		if hasInitializer {
			if callExpr, isCallExpr := initializerExpr.(*ast.CallExpr); isCallExpr {
				if starExpr, isStarExpr := callExpr.Fun.(*ast.StarExpr); isStarExpr {
					if _, isStructType := starExpr.X.(*ast.StructType); isStructType {
						// Check if the argument is nil
						if len(callExpr.Args) == 1 {
							if nilIdent, isIdent := callExpr.Args[0].(*ast.Ident); isIdent && nilIdent.Name == "nil" {
								c.tsw.WriteLiterally("null")
								c.tsw.WriteLine("") // Ensure newline after null
								return nil
							}
						}
					}
				}
			}
		}

		if needsVarRef {
			// VarRef variable: let v: VarRef<T> = $.varRef(init_or_zero);
			c.tsw.WriteLiterally("$.varRef(")
			if hasInitializer {
				// Write the compiled initializer expression normally
				if err := c.WriteValueExpr(initializerExpr); err != nil {
					return err
				}
			} else {
				// No initializer, varRef the zero value
				c.WriteZeroValueForType(goType)
			}
			c.tsw.WriteLiterally(")")
		} else {
			// Unvarrefed variable: let v: T = init_or_zero;
			if hasInitializer {
				// Handle &v initializer specifically for unvarrefed variables
				if unaryExpr, isUnary := initializerExpr.(*ast.UnaryExpr); isUnary && unaryExpr.Op == token.AND {
					// Initializer is &v
					// Check if v is varrefed
					needsVarRefOperand := false
					unaryExprXIdent, ok := unaryExpr.X.(*ast.Ident)
					if ok {
						innerObj := c.pkg.TypesInfo.Uses[unaryExprXIdent]
						needsVarRefOperand = innerObj != nil && c.analysis.NeedsVarRef(innerObj)
					}

					// If v is varrefed, assign the varRef itself (v)
					// If v is not varrefed, assign $.varRef(v)
					if needsVarRefOperand {
						// special handling: do not write .value here.
						c.WriteIdent(unaryExprXIdent, false)
					} else {
						// &unvarrefedVar -> $.varRef(unvarrefedVar)
						c.tsw.WriteLiterally("$.varRef(")
						if err := c.WriteValueExpr(unaryExpr.X); err != nil { // Write 'v'
							return err
						}
						c.tsw.WriteLiterally(")")
					}
				} else {
					// Regular initializer, clone if needed
					if shouldApplyClone(c.pkg, initializerExpr) {
						if err := c.WriteValueExpr(initializerExpr); err != nil {
							return err
						}
						c.tsw.WriteLiterally(".clone()")
					} else {
						if err := c.WriteValueExpr(initializerExpr); err != nil {
							return err
						}
					}
				}
			} else {
				// No initializer, use the zero value directly
				c.WriteZeroValueForType(goType)
			}
		}
		c.tsw.WriteLine("") // Finish the declaration line
		return nil
	}

	// --- Multi-variable declaration (existing logic seems okay, but less common for pointers) ---
	c.tsw.WriteLiterally("let ")
	c.tsw.WriteLiterally("[") // Use array destructuring for multi-assign
	for i, name := range a.Names {
		if i != 0 {
			c.tsw.WriteLiterally(", ")
		}
		c.tsw.WriteLiterally(name.Name)
		// TODO: Add type annotations for multi-var declarations if possible/needed
	}
	c.tsw.WriteLiterally("]")
	if len(a.Values) > 0 {
		// TODO: handle other kinds of assignment += -= etc.
		c.tsw.WriteLiterally(" = ")
		if len(a.Values) == 1 && len(a.Names) > 1 {
			// Assign from a single multi-return value
			if err := c.WriteValueExpr(a.Values[0]); err != nil {
				return err
			}
		} else {
			// Assign from multiple values
			c.tsw.WriteLiterally("[")
			for i, val := range a.Values {
				if i != 0 {
					c.tsw.WriteLiterally(", ")
				}
				if err := c.WriteValueExpr(val); err != nil { // Initializers are values
					return err
				}
			}
			c.tsw.WriteLiterally("]")
		}
	} else {
		// No initializer, assign default values (complex for multi-assign)
		// For simplicity, assign default array based on context (needs improvement)
		c.tsw.WriteLiterally(" = []") // Placeholder
		// TODO: Assign correct zero values based on types
	}
	c.tsw.WriteLine("") // Use WriteLine instead of WriteLine(";")
	return nil
}

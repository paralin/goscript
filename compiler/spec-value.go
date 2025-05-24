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
//   - It determines if the variable `x` needs to be boxed (e.g., if its address is taken)
//     using `c.analysis.NeedsVarRef(obj)`.
//   - If variable referenced: `let x: $.VarRef<T_ts> = $.varRef(initializer_ts_or_zero_ts);`
//     The type annotation is `$.VarRef<T_ts>`, and the initializer is wrapped in `$.varRef()`.
//   - If not variable referenced: `let x: T_ts = initializer_ts_or_zero_ts;`
//     The type annotation is `T_ts`. If the initializer is `&unboxedVar`, it becomes `$.varRef(unboxedVar_ts)`.
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
		needsBox := c.analysis.NeedsVarRef(obj) // Check if address is taken

		// Debug logging for ptr variable
		if name.Name == "ptr" {
			fmt.Printf("DEBUG WriteValueSpec: Variable '%s', needsBox=%v, goType=%v\n", name.Name, needsBox, goType)
		}

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
		// 2. Is a slice conversion but needs boxing (we need explicit type for $.varRef())
		if !isSliceConversion || needsBox {
			// Debug logging for ptr variable
			if name.Name == "ptr" {
				fmt.Printf("DEBUG WriteValueSpec: Writing type annotation for '%s', isSliceConversion=%v, needsBox=%v\n", name.Name, isSliceConversion, needsBox)
			}

			c.tsw.WriteLiterally(": ")
			// Write type annotation
			if needsBox {
				// Debug logging for ptr variable
				if name.Name == "ptr" {
					fmt.Printf("DEBUG WriteValueSpec: Writing VarRef type for '%s'\n", name.Name)
				}
				// If boxed, the variable holds VarRef<OriginalGoType>
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
				// Debug logging for ptr variable
				if name.Name == "ptr" {
					fmt.Printf("DEBUG WriteValueSpec: Writing plain type for '%s'\n", name.Name)
				}
				// If not boxed, the variable holds the translated Go type directly
				c.WriteGoType(goType, GoTypeContextGeneral)
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

		if needsBox {
			// Boxed variable: let v: VarRef<T> = $.varRef(init_or_zero);
			c.tsw.WriteLiterally("$.varRef(")
			if hasInitializer {
				// Write the compiled initializer expression normally
				if err := c.WriteValueExpr(initializerExpr); err != nil {
					return err
				}
			} else {
				// No initializer, box the zero value
				c.WriteZeroValueForType(goType)
			}
			c.tsw.WriteLiterally(")")
		} else {
			// Unboxed variable: let v: T = init_or_zero;
			if hasInitializer {
				// Handle &v initializer specifically for unboxed variables
				if unaryExpr, isUnary := initializerExpr.(*ast.UnaryExpr); isUnary && unaryExpr.Op == token.AND {
					// Initializer is &v
					// Check if v is boxed
					needsBoxOperand := false
					unaryExprXIdent, ok := unaryExpr.X.(*ast.Ident)
					if ok {
						innerObj := c.pkg.TypesInfo.Uses[unaryExprXIdent]
						needsBoxOperand = innerObj != nil && c.analysis.NeedsVarRef(innerObj)
					}

					// If v is boxed, assign the box itself (v)
					// If v is not boxed, assign $.varRef(v)
					if needsBoxOperand {
						// special handling: do not write .value here.
						c.WriteIdent(unaryExprXIdent, false)
					} else {
						// &unboxedVar -> $.varRef(unboxedVar)
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

package compiler

import (
	"fmt"
	"go/ast"
	"go/types"
)

// WriteSelectorExpr translates a Go selector expression (`ast.SelectorExpr`)
// used as a value (e.g., `obj.Field`, `pkg.Variable`, `structVar.Method()`)
// into its TypeScript equivalent.
// It distinguishes between package selectors (e.g., `time.Now`) and field/method
// access on an object or struct.
//   - For package selectors, it writes `PackageName.IdentifierName`. The `IdentifierName`
//     is written using `WriteIdent` which handles potential `.value` access if the
//     package-level variable is varrefed.
//   - For field or method access on an object (`exp.X`), it first writes the base
//     expression (`exp.X`) using `WriteValueExpr` (which handles its own varRefing).
//     Then, it writes a dot (`.`) followed by the selected identifier (`exp.Sel`)
//     using `WriteIdent`, which appends `.value` if the field itself is varrefed
//     (e.g., accessing a field of primitive type through a pointer to a struct
//     where the field's address might have been taken).
//
// This function aims to correctly navigate Go's automatic dereferencing and
// TypeScript's explicit varRefing model.
func (c *GoToTSCompiler) WriteSelectorExpr(exp *ast.SelectorExpr) error {
	// Check if this is a package selector (e.g., time.Now)
	if pkgIdent, isPkgIdent := exp.X.(*ast.Ident); isPkgIdent {
		if obj := c.pkg.TypesInfo.ObjectOf(pkgIdent); obj != nil {
			if _, isPkg := obj.(*types.PkgName); isPkg {
				// Package selectors should never use .value on the package name
				c.tsw.WriteLiterally(pkgIdent.Name)
				c.tsw.WriteLiterally(".")
				// Write the selected identifier, allowing .value if it's a varrefed package variable
				c.WriteIdent(exp.Sel, true)
				return nil
			}
		}
	}

	// Check if this is a method value (method being used as a value, not called immediately)
	if c.analysis.IsMethodValue(exp) {
		// This is a method value - we need to bind it properly
		if selection := c.pkg.TypesInfo.Selections[exp]; selection != nil {
			return c.writeMethodValue(exp, selection)
		}
	}

	// --- Special case for dereferenced pointer to struct with field access: (*p).field or (**p).field etc ---
	var baseExpr ast.Expr = exp.X
	// Look inside parentheses if present
	if parenExpr, isParen := exp.X.(*ast.ParenExpr); isParen {
		baseExpr = parenExpr.X
	}

	// Check if we have one or more star expressions (dereferences)
	if starExpr, isStarExpr := baseExpr.(*ast.StarExpr); isStarExpr {
		// Count the levels of dereference and find the innermost expression
		dereferenceCount := 0
		currentExpr := baseExpr
		for {
			if star, ok := currentExpr.(*ast.StarExpr); ok {
				dereferenceCount++
				currentExpr = star.X
			} else {
				break
			}
		}

		// Get the type of the innermost expression (the pointer variable)
		innerType := c.pkg.TypesInfo.TypeOf(currentExpr)
		if innerType != nil {
			// Check if after all dereferences we end up with a struct
			finalType := innerType
			for i := 0; i < dereferenceCount; i++ {
				if ptrType, ok := finalType.(*types.Pointer); ok {
					finalType = ptrType.Elem()
				} else {
					break
				}
			}

			// If the final type is a struct, handle field access specially
			if _, isStruct := finalType.Underlying().(*types.Struct); isStruct {
				// Write the fully dereferenced expression
				if err := c.WriteValueExpr(starExpr); err != nil {
					return fmt.Errorf("failed to write dereferenced expression for field access: %w", err)
				}

				// Check if we need an extra .value for varrefed struct access
				// This happens when the struct being pointed to is varrefed
				needsExtraValue := false
				if ident, ok := currentExpr.(*ast.Ident); ok {
					if obj := c.pkg.TypesInfo.ObjectOf(ident); obj != nil {
						// Check if after dereferencing, we get a varrefed struct
						ptrType := obj.Type()
						for i := 0; i < dereferenceCount; i++ {
							if ptr, ok := ptrType.(*types.Pointer); ok {
								ptrType = ptr.Elem()
							}
						}
						// If the final pointed-to type suggests the struct is varrefed
						// (i.e., the dereference operation results in VarRef<Struct>)
						if c.analysis.NeedsVarRefAccess(obj) {
							needsExtraValue = true
						}
					}
				}

				if needsExtraValue {
					c.tsw.WriteLiterally("!.value")
				}

				// Add .field
				c.tsw.WriteLiterally(".")
				c.WriteIdent(exp.Sel, false) // Don't add .value to the field itself
				return nil
			}
		}
	}
	// --- End Special Case ---

	// Fallback / Normal Case (e.g., obj.Field, pkg.Var, method calls)
	// WriteValueExpr handles adding .value for the base variable itself if it's varrefed.
	if err := c.WriteValueExpr(exp.X); err != nil {
		return fmt.Errorf("failed to write selector base expression: %w", err)
	}

	// Add null assertion for selector expressions when accessing fields/methods on nullable types
	// In Go, accessing fields or calling methods on nil pointers/interfaces panics, so we should throw in TypeScript
	baseType := c.pkg.TypesInfo.TypeOf(exp.X)
	if baseType != nil {
		// Check if the base is a pointer type
		if _, isPtr := baseType.(*types.Pointer); isPtr {
			c.tsw.WriteLiterally("!.")
		} else if _, isInterface := baseType.Underlying().(*types.Interface); isInterface {
			// For interface types, add null assertion since interfaces can be nil
			c.tsw.WriteLiterally("!.")
		} else if callExpr, isCall := exp.X.(*ast.CallExpr); isCall {
			// For function calls that return nullable types, add null assertion
			_ = callExpr // Use the variable to avoid unused error
			c.tsw.WriteLiterally("!.")
		} else {
			// Add .
			c.tsw.WriteLiterally(".")
		}
	} else {
		// Add .
		c.tsw.WriteLiterally(".")
	}

	// Write the field/method name.
	// Pass 'false' to WriteIdent to NOT add '.value' for struct fields.
	// Struct fields use getters/setters, so we don't want to add .value here.
	// The setter will handle the internal .value access.
	c.WriteIdent(exp.Sel, false)
	return nil
}

// writeMethodValue handles method values (methods used as values, not called immediately)
// and generates proper binding code to maintain the 'this' context.
func (c *GoToTSCompiler) writeMethodValue(exp *ast.SelectorExpr, selection *types.Selection) error {
	// Get the method signature to understand the receiver type
	methodObj := selection.Obj().(*types.Func)
	sig := methodObj.Type().(*types.Signature)
	recv := sig.Recv()

	if recv == nil {
		// This shouldn't happen for method values, but handle gracefully
		return fmt.Errorf("method value has no receiver: %s", methodObj.Name())
	}

	// Determine if this is a pointer receiver or value receiver
	recvType := recv.Type()
	isPointerReceiver := false
	if _, ok := recvType.(*types.Pointer); ok {
		isPointerReceiver = true
	}

	// Get the base expression type to understand what we're working with
	baseType := c.pkg.TypesInfo.TypeOf(exp.X)
	baseIsPointer := false
	if _, ok := baseType.(*types.Pointer); ok {
		baseIsPointer = true
	}

	// Write the receiver expression
	if err := c.WriteValueExpr(exp.X); err != nil {
		return fmt.Errorf("failed to write method value receiver: %w", err)
	}

	// Add null assertion if needed
	if baseIsPointer {
		c.tsw.WriteLiterally("!")
	}

	// Handle different receiver type combinations according to Go semantics
	if isPointerReceiver && !baseIsPointer {
		// Pointer receiver method on value type: t.Mp equivalent to (&t).Mp
		// The receiver should be the address of the value
		c.tsw.WriteLiterally(".")
		c.WriteIdent(exp.Sel, false)
		c.tsw.WriteLiterally(".bind(")
		if err := c.WriteValueExpr(exp.X); err != nil {
			return fmt.Errorf("failed to write method value receiver for binding: %w", err)
		}
		if baseIsPointer {
			c.tsw.WriteLiterally("!")
		}
		c.tsw.WriteLiterally(")")
	} else if !isPointerReceiver && baseIsPointer {
		// Value receiver method on pointer type: pt.Mv equivalent to (*pt).Mv
		// The receiver should be a copy of the dereferenced value
		c.tsw.WriteLiterally(".value.")
		c.WriteIdent(exp.Sel, false)
		c.tsw.WriteLiterally(".bind(")
		if err := c.WriteValueExpr(exp.X); err != nil {
			return fmt.Errorf("failed to write method value receiver for binding: %w", err)
		}
		c.tsw.WriteLiterally("!.value.clone())")
	} else if !isPointerReceiver && !baseIsPointer {
		// Value receiver method on value type: t.Mv
		// The receiver should be a copy of the value
		c.tsw.WriteLiterally(".")
		c.WriteIdent(exp.Sel, false)
		c.tsw.WriteLiterally(".bind(")
		if err := c.WriteValueExpr(exp.X); err != nil {
			return fmt.Errorf("failed to write method value receiver for binding: %w", err)
		}
		if baseIsPointer {
			c.tsw.WriteLiterally("!")
		}
		c.tsw.WriteLiterally(".clone())")
	} else {
		// Pointer receiver method on pointer type: pt.Mp
		// The receiver should be the pointer itself
		c.tsw.WriteLiterally(".")
		c.WriteIdent(exp.Sel, false)
		c.tsw.WriteLiterally(".bind(")
		if err := c.WriteValueExpr(exp.X); err != nil {
			return fmt.Errorf("failed to write method value receiver for binding: %w", err)
		}
		if baseIsPointer {
			c.tsw.WriteLiterally("!")
		}
		c.tsw.WriteLiterally(")")
	}

	return nil
}

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

	// --- Special case for dereferenced pointer to struct with field access: (*p).field ---
	var baseExpr ast.Expr = exp.X
	// Look inside parentheses if present
	if parenExpr, isParen := exp.X.(*ast.ParenExpr); isParen {
		baseExpr = parenExpr.X
	}

	if starExpr, isStarExpr := baseExpr.(*ast.StarExpr); isStarExpr {
		// Get the type of the pointer being dereferenced (e.g., type of 'p' in *p)
		ptrType := c.pkg.TypesInfo.TypeOf(starExpr.X)
		if ptrType != nil {
			if ptrTypeUnwrapped, ok := ptrType.(*types.Pointer); ok {
				elemType := ptrTypeUnwrapped.Elem()
				if elemType != nil {
					// If it's a pointer to a struct, handle field access specially
					if _, isStruct := elemType.Underlying().(*types.Struct); isStruct {
						// Get the object for the pointer variable itself (e.g., 'p')
						var ptrObj types.Object
						if ptrIdent, isIdent := starExpr.X.(*ast.Ident); isIdent {
							ptrObj = c.pkg.TypesInfo.ObjectOf(ptrIdent)
						}

						// Write the pointer expression (e.g., p or p.value if p is varrefed)
						if err := c.WriteValueExpr(starExpr.X); err != nil {
							return fmt.Errorf("failed to write pointer expression for (*p).field: %w", err)
						}

						// Add ! for non-null assertion
						c.tsw.WriteLiterally("!")

						// Add .value ONLY if the pointer variable itself needs varrefed access
						// This handles the case where 'p' points to a variable referenced struct (e.g., p = s where s is VarRef<MyStruct>)
						if ptrObj != nil && c.analysis.NeedsVarRefAccess(ptrObj) {
							c.tsw.WriteLiterally(".value")
						}

						// Add .field
						c.tsw.WriteLiterally(".")
						c.WriteIdent(exp.Sel, false) // Don't add .value to the field itself
						return nil
					}
				}
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
	// Pass 'true' to WriteIdent to potentially add '.value' if the field itself
	// needs varrefed access (e.g., accessing a primitive field via pointer where
	// the field's address might have been taken elsewhere - less common but possible).
	// For simple struct field access like p.Val or (*p).Val, WriteIdent(..., true)
	// relies on NeedsVarRefAccess for the field 'Val', which should typically be false.
	c.WriteIdent(exp.Sel, true)
	return nil
}

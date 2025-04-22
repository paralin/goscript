package compiler

import (
	"go/ast"
	"go/types"

	"golang.org/x/tools/go/packages"
)

// filterBlankIdentifiers removes blank identifier entries from LHS and their corresponding RHS values.
func filterBlankIdentifiers(lhs []ast.Expr, rhs []ast.Expr) ([]ast.Expr, []ast.Expr) {
	// for single assignments or no blanks, return as-is
	if len(lhs) <= 1 {
		return lhs, rhs
	}
	var newLhs []ast.Expr
	var newRhs []ast.Expr
	for i, l := range lhs {
		if ident, ok := l.(*ast.Ident); ok && ident.Name == "_" {
			continue
		}
		newLhs = append(newLhs, l)
		if i < len(rhs) {
			newRhs = append(newRhs, rhs[i])
		}
	}
	return newLhs, newRhs
}

// shouldApplyClone determines if an expression needs to be cloned when assigned.
// This happens when the expression represents a value type (like a struct)
// that isn't already a fresh value (like a literal or function call).
// Dereferencing a pointer to a struct (*ptr) results in a value, so it should be cloned.
// Accessing a struct variable directly (myStruct) results in a value, so it should be cloned.
func shouldApplyClone(pkg *packages.Package, expr ast.Expr) bool {
	// 1. Handle literals and function calls first (they create fresh values)
	switch expr.(type) {
	case *ast.CallExpr, *ast.CompositeLit:
		return false
	}

	// 2. Get type information for the expression
	tv, found := pkg.TypesInfo.Types[expr]
	if !found {
		// Cannot determine type, default to no clone
		return false
	}
	t := tv.Type

	// 3. Handle pointer dereference (*ptr)
	if starExpr, ok := expr.(*ast.StarExpr); ok {
		// The type `t` we got is the type *after* dereferencing (e.g., MyStruct).
		// We need to check if the original expression `starExpr.X` was a pointer to a struct.
		tvX, foundX := pkg.TypesInfo.Types[starExpr.X]
		if !foundX {
			return false // Cannot determine original type
		}
		// Check if the type being pointed to (tvX.Type) is a pointer to a named struct or underlying struct.
		if ptrType, isPtr := tvX.Type.(*types.Pointer); isPtr {
			// Check if the element type is a struct
			if _, isStruct := ptrType.Elem().Underlying().(*types.Struct); isStruct {
				return true // Dereferencing a pointer to a struct requires clone
			}
		}
		// If it wasn't a pointer to a struct, no clone needed for dereference
		return false
	}

	// 4. Handle direct variable access (identifiers, selectors)
	// Check if the type `t` itself is a struct type (not a pointer)
	// We need the underlying type in case of named types.
	_, isPtr := t.(*types.Pointer)
	_, isStruct := t.Underlying().(*types.Struct)

	// Clone if it's a struct value (isStruct is true) AND it's not a pointer (!isPtr)
	return isStruct && !isPtr
}

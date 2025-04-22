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
// This happens when the expression is:
// 1. A value type (struct, not a pointer)
// 2. Not a literal or function call (those create fresh values)
func shouldApplyClone(pkg *packages.Package, expr ast.Expr) bool {
	// For identifiers, check the type
	if ident, ok := expr.(*ast.Ident); ok {
		if tv, found := pkg.TypesInfo.Types[ident]; found {
			t := tv.Type
			// If it's not a pointer, apply clone (it's a struct value)
			_, isPtr := t.(*types.Pointer)
			return !isPtr
		}
	}

	// For selector expressions (a.b), check the type if possible
	if sel, ok := expr.(*ast.SelectorExpr); ok {
		if tv, found := pkg.TypesInfo.Types[sel]; found {
			t := tv.Type
			_, isPtr := t.(*types.Pointer)
			return !isPtr
		}
	}

	// For function calls and composite literals, they create fresh values,
	// so no need to clone
	switch expr.(type) {
	case *ast.CallExpr, *ast.CompositeLit:
		return false
	}

	// Default to not cloning if we can't determine
	return false
}

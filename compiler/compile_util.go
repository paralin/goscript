package compiler

import "go/ast"

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

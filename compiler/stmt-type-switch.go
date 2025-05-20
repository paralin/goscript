package compiler

import (
	"fmt"
	"go/ast"

	"github.com/pkg/errors"
)

// WriteStmtTypeSwitch translates a Go `type switch` statement (`ast.TypeSwitchStmt`)
// into its TypeScript equivalent using the `$.typeSwitch` helper.
func (c *GoToTSCompiler) WriteStmtTypeSwitch(stmt *ast.TypeSwitchStmt) error {
	// Outer block for scoping Init variable
	if stmt.Init != nil {
		c.tsw.WriteLine("{")
		c.tsw.Indent(1)
		if err := c.WriteStmt(stmt.Init); err != nil {
			return fmt.Errorf("failed to write type switch init statement: %w", err)
		}
	}

	// Extract the subject expression and case variable identifier
	var subjectExpr ast.Expr
	var caseVarIdent *ast.Ident // The variable in 'v := x.(type)'

	switch assignNode := stmt.Assign.(type) {
	case *ast.AssignStmt: // v := x.(type)
		if len(assignNode.Lhs) != 1 || len(assignNode.Rhs) != 1 {
			return errors.Errorf("TypeSwitchStmt AssignStmt: expected 1 LHS and 1 RHS, got %d and %d", len(assignNode.Lhs), len(assignNode.Rhs))
		}
		ident, ok := assignNode.Lhs[0].(*ast.Ident)
		if !ok {
			return errors.Errorf("TypeSwitchStmt AssignStmt LHS is not *ast.Ident: %T", assignNode.Lhs[0])
		}
		caseVarIdent = ident
		typeAssert, ok := assignNode.Rhs[0].(*ast.TypeAssertExpr)
		if !ok {
			return errors.Errorf("TypeSwitchStmt AssignStmt RHS is not *ast.TypeAssertExpr: %T", assignNode.Rhs[0])
		}
		if typeAssert.Type != nil {
			return errors.Errorf("TypeSwitchStmt AssignStmt TypeAssertExpr.Type is not nil")
		}
		subjectExpr = typeAssert.X
	case *ast.ExprStmt: // x.(type)
		typeAssert, ok := assignNode.X.(*ast.TypeAssertExpr)
		if !ok {
			return errors.Errorf("TypeSwitchStmt ExprStmt.X is not *ast.TypeAssertExpr: %T", assignNode.X)
		}
		if typeAssert.Type != nil {
			return errors.Errorf("TypeSwitchStmt ExprStmt TypeAssertExpr.Type is not nil")
		}
		subjectExpr = typeAssert.X
	default:
		return errors.Errorf("unknown Assign type in TypeSwitchStmt: %T", stmt.Assign)
	}

	// Build the array of case configurations for $.typeSwitch
	c.tsw.WriteLiterally("$.typeSwitch(")
	if err := c.WriteValueExpr(subjectExpr); err != nil {
		c.tsw.Indent(-1)
		c.tsw.WriteLine("} // End TypeSwitchStmt due to error in subject")
		return fmt.Errorf("failed to write subject expression in type switch: %w", err)
	}

	// case list
	c.tsw.WriteLiterally(", [")

	stmtBodyList := stmt.Body.List
	var defaultCaseBody []ast.Stmt

	for i, caseClauseStmt := range stmtBodyList {
		caseClause, ok := caseClauseStmt.(*ast.CaseClause)
		if !ok {
			return errors.Errorf("unexpected statement in TypeSwitchStmt Body: not *ast.CaseClause but %T", caseClauseStmt)
		}

		if len(caseClause.List) == 0 { // Default case
			defaultCaseBody = caseClause.Body
			continue // Process default case after type cases
		}

		// Type case(s)
		if i != 0 {
			c.tsw.WriteLiterally(",")
			c.tsw.WriteLine("")
		}

		c.tsw.WriteLiterally("{ types: [")
		for j, typeExpr := range caseClause.List {
			if j > 0 {
				c.tsw.WriteLiterally(", ")
			}
			c.writeTypeDescription(typeExpr) // Descriptor for $.is or $.typeAssert
		}
		c.tsw.WriteLiterally("], body: (")

		// Add case variable if it exists and is not '_'
		if caseVarIdent != nil && caseVarIdent.Name != "_" {
			c.WriteIdent(caseVarIdent, false) // isDeclaration = false for the parameter
			// Note: TypeScript type inference should handle the parameter type based on the case type(s)
		}

		c.tsw.WriteLiterally(") => {")

		caseClauseBody := caseClause.Body
		if len(caseClauseBody) != 0 {
			c.tsw.Indent(1)
			c.tsw.WriteLine("")
		}

		for _, bodyStmt := range caseClauseBody {
			if err := c.WriteStmt(bodyStmt); err != nil {
				return fmt.Errorf("failed to write statement in type switch case body: %w", err)
			}
		}

		if len(caseClauseBody) != 0 {
			c.tsw.Indent(-1)
		}
		c.tsw.WriteLiterally("}") // Close case body function
		c.tsw.WriteLiterally("}") // Close case object
	}

	c.tsw.WriteLiterally("]") // Close cases array

	// Add default case function if it exists
	if len(defaultCaseBody) != 0 {
		c.tsw.WriteLiterally(", () => {")
		c.tsw.Indent(1)
		c.tsw.WriteLine("")
		for _, bodyStmt := range defaultCaseBody {
			if err := c.WriteStmt(bodyStmt); err != nil {
				return fmt.Errorf("failed to write statement in type switch default case body: %w", err)
			}
		}
		c.tsw.Indent(-1)
		c.tsw.WriteLiterally("}") // Close default case function
	}

	c.tsw.WriteLine(")") // Close $.typeSwitch call
	if stmt.Init != nil {
		c.tsw.Indent(-1)
		c.tsw.WriteLine("}") // Close outer block
	}

	return nil
}

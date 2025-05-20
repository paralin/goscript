package compiler

import (
	"fmt"
	"go/ast"

	"github.com/pkg/errors"
)

// WriteStmtTypeSwitch translates a Go `type switch` statement (`ast.TypeSwitchStmt`)
// into its TypeScript equivalent using `if/else if/else` and the `$.typeAssert` helper.
func (c *GoToTSCompiler) WriteStmtTypeSwitch(stmt *ast.TypeSwitchStmt) error {
	// Outer block for scoping variables
	c.tsw.WriteLine("{")
	c.tsw.Indent(1)

	// Handle initialization statement if present
	if stmt.Init != nil {
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

	// Write the subject value
	c.tsw.WriteLiterally("const subject = ")
	if err := c.WriteValueExpr(subjectExpr); err != nil {
		c.tsw.Indent(-1)
		c.tsw.WriteLine("} // End TypeSwitchStmt due to error in subject")
		return fmt.Errorf("failed to write subject expression in type switch: %w", err)
	}
	c.tsw.WriteLine("")

	hasDefault := false
	defaultCaseBody := []ast.Stmt(nil)
	firstCaseProcessed := false // To manage "if" vs "else if" vs "else"

	for _, caseClauseStmt := range stmt.Body.List {
		caseClause, ok := caseClauseStmt.(*ast.CaseClause)
		if !ok {
			return errors.Errorf("unexpected statement in TypeSwitchStmt Body: not *ast.CaseClause but %T", caseClauseStmt)
		}

		if len(caseClause.List) == 0 { // Default case
			hasDefault = true
			defaultCaseBody = caseClause.Body
			// Default case is handled at the very end of the if-else-if chain
			continue
		}

		// Type case(s)
		if firstCaseProcessed {
			c.tsw.WriteLiterally(" else ")
		} else {
			firstCaseProcessed = true
		}

		if len(caseClause.List) == 1 { // Single type: case T:
			caseTypeExpr := caseClause.List[0]
			
			// For single type cases, use a direct approach with a single type assertion
			if caseVarIdent != nil && caseVarIdent.Name != "_" {
				// If we need the value, use a temporary variable with a unique name per case
				c.tsw.WriteLiterally("if (")
				
				// Create the type assertion result
				c.tsw.WriteLiterally("$.typeAssert<")
				c.WriteTypeExpr(caseTypeExpr) // Type for generic
				c.tsw.WriteLiterally(">(subject, ")
				c.writeTypeDescription(caseTypeExpr) // Type descriptor
				c.tsw.WriteLiterally(").ok")
				
				c.tsw.WriteLiterally(") {")
				c.tsw.WriteLine("")
				c.tsw.Indent(1)
				
				// Declare the case variable inside the block
				c.tsw.WriteLiterally("const ")
				c.WriteIdent(caseVarIdent, false)
				c.tsw.WriteLiterally(" = $.typeAssert<")
				c.WriteTypeExpr(caseTypeExpr)
				c.tsw.WriteLiterally(">(subject, ")
				c.writeTypeDescription(caseTypeExpr)
				c.tsw.WriteLiterally(").value")
				c.tsw.WriteLine("")
				c.tsw.Indent(-1)
			} else {
				// If we don't need the value, just check the .ok property
				c.tsw.WriteLiterally("if ($.typeAssert<")
				c.WriteTypeExpr(caseTypeExpr) // Type for generic
				c.tsw.WriteLiterally(">(subject, ")
				c.writeTypeDescription(caseTypeExpr) // Type descriptor
				c.tsw.WriteLiterally(").ok) {")
			}
		} else { // Multiple types: case T1, T2:
			c.tsw.WriteLiterally("if (")
			for j, typeExpr := range caseClause.List {
				if j > 0 {
					c.tsw.WriteLiterally(" || ")
				}
				c.tsw.WriteLiterally("$.is(subject, ")
				c.writeTypeDescription(typeExpr) // Descriptor for $.is
				c.tsw.WriteLiterally(")")
			}
			c.tsw.WriteLiterally(") {")
			
			// For multi-type case, declare the case variable if needed
			if caseVarIdent != nil && caseVarIdent.Name != "_" {
				c.tsw.WriteLine("")
				c.tsw.Indent(1)
				c.tsw.WriteLiterally("const ")
				c.WriteIdent(caseVarIdent, false)
				c.tsw.WriteLiterally(" = subject")
				c.tsw.WriteLine("")
				c.tsw.Indent(-1)
			}
		}
		
		c.tsw.WriteLine("")
		c.tsw.Indent(1)

		for _, bodyStmt := range caseClause.Body {
			if err := c.WriteStmt(bodyStmt); err != nil {
				return fmt.Errorf("failed to write statement in type switch case body: %w", err)
			}
		}
		c.tsw.Indent(-1)
		c.tsw.WriteLiterally("}")
	}

	// Handle default case
	if hasDefault {
		if firstCaseProcessed { // If there were preceding if/else if blocks for type cases
			c.tsw.WriteLine(" else {") // Default is the final else
		} else { // Default is the only case in the switch
			c.tsw.WriteLine("{ // Default only case")
		}
		c.tsw.Indent(1)
		for _, bodyStmt := range defaultCaseBody {
			if err := c.WriteStmt(bodyStmt); err != nil {
				return fmt.Errorf("failed to write statement in type switch default case body: %w", err)
			}
		}
		c.tsw.Indent(-1)
		c.tsw.WriteLine("}")
	} else if firstCaseProcessed {
		// If there was no default, but there were type cases, the last one needs a newline
		c.tsw.WriteLine("")
	}

	c.tsw.Indent(-1)
	c.tsw.WriteLine("}")
	return nil
}

package compiler

import (
	"fmt"
	"go/ast"

	"github.com/pkg/errors"
)

// WriteStmtTypeSwitch translates a Go `type switch` statement (`ast.TypeSwitchStmt`)
// into its TypeScript equivalent using `if/else if/else` and the `$.typeAssert` helper.
func (c *GoToTSCompiler) WriteStmtTypeSwitch(stmt *ast.TypeSwitchStmt) error {
	// Outer block for scoping Init, subject_val, and temp type assert vars
	c.tsw.WriteLine("{")
	c.tsw.Indent(1)

	if stmt.Init != nil {
		if err := c.WriteStmt(stmt.Init); err != nil {
			return fmt.Errorf("failed to write type switch init statement: %w", err)
		}
	}

	var subjectExpr ast.Expr
	var caseVarIdent *ast.Ident // The 'v' in 'v := x.(type)'

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

	c.tsw.WriteLiterally("const subject_val = ")
	if err := c.WriteValueExpr(subjectExpr); err != nil {
		c.tsw.Indent(-1)
		c.tsw.WriteLine("} // End TypeSwitchStmt due to error in subject_val")
		return fmt.Errorf("failed to write subject expression in type switch: %w", err)
	}
	c.tsw.WriteLine("")

	c.tsw.WriteLine("let ts_typeassert_value: any")  // Will hold the typed value from $.typeAssert
	c.tsw.WriteLine("let ts_typeassert_ok: boolean") // Will hold the ok status
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
			// Default case is handled at the very end of the if-else-if chain.
			// If it's the *only* thing (no type cases), it will be handled after the loop.
			continue
		}

		// Type case(s)
		if firstCaseProcessed {
			c.tsw.WriteLiterally(" else ")
		}
		firstCaseProcessed = true

		if len(caseClause.List) == 1 { // Single type: case T:
			caseTypeExpr := caseClause.List[0]
			c.tsw.WriteLiterally("({value: ts_typeassert_value, ok: ts_typeassert_ok} = $.typeAssert<")
			c.WriteTypeExpr(caseTypeExpr) // Type for generic, no error check
			c.tsw.WriteLiterally(">(subject_val, ")
			c.writeTypeDescription(caseTypeExpr) // Descriptor, no error check
			c.tsw.WriteLiterally("));")
			c.tsw.WriteLine("")
			c.tsw.WriteLiterally("if (ts_typeassert_ok) {")
		} else { // Multiple types: case T1, T2:
			c.tsw.WriteLiterally("if (")
			for j, typeExpr := range caseClause.List {
				if j > 0 {
					c.tsw.WriteLiterally(" || ")
				}
				c.tsw.WriteLiterally("$.is(subject_val, ")
				c.writeTypeDescription(typeExpr) // Descriptor for $.is, no error check
				c.tsw.WriteLiterally(")")
			}
			c.tsw.WriteLiterally(") {")
		}
		c.tsw.WriteLine("")
		c.tsw.Indent(1)

		if caseVarIdent != nil && caseVarIdent.Name != "_" {
			c.tsw.WriteLiterally("const ")
			c.WriteIdent(caseVarIdent, false) // isDeclaration = false for the const
			if len(caseClause.List) == 1 {
				// For single type case, $.typeAssert already gives the correct type to ts_typeassert_value
				c.tsw.WriteLiterally(" = ts_typeassert_value")
			} else {
				// For multi-type case, 'v' gets the type of the original expression (subject_val)
				c.tsw.WriteLiterally(" = subject_val")
			}
			c.tsw.WriteLine("")
		}

		for _, bodyStmt := range caseClause.Body {
			if err := c.WriteStmt(bodyStmt); err != nil {
				return fmt.Errorf("failed to write statement in type switch case body: %w", err)
			}
		}
		c.tsw.Indent(-1)
		c.tsw.WriteLiterally("}") // Close if (ts_typeassert_ok) or if ($.is(...) || ...)
	}

	// Handle default case now
	if hasDefault {
		if firstCaseProcessed { // If there were preceding if/else if blocks for type cases
			c.tsw.WriteLine(" else {") // Default is the final else
		} else { // Default is the only case in the switch
			c.tsw.WriteLine("{ // Default only case")
		}
		c.tsw.Indent(1)
		// caseVarIdent is NOT in scope for default
		for _, bodyStmt := range defaultCaseBody {
			if err := c.WriteStmt(bodyStmt); err != nil {
				return fmt.Errorf("failed to write statement in type switch default case body: %w", err)
			}
		}
		c.tsw.Indent(-1)
		c.tsw.WriteLine("}") // Close default block
	} else if firstCaseProcessed {
		// If there was no default, but there were type cases, the last one needs a newline.
		c.tsw.WriteLine("")
	}

	c.tsw.Indent(-1)
	c.tsw.WriteLine("}")
	return nil
}

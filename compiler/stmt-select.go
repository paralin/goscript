package compiler

import (
	"fmt"
	"go/ast"
	"go/token"

	"github.com/pkg/errors"
)

// caseEndsWithReturn checks if a case body ends with a return statement
func (c *GoToTSCompiler) caseEndsWithReturn(body []ast.Stmt) bool {
	if len(body) == 0 {
		return false
	}

	// Check if the last statement is a return statement
	lastStmt := body[len(body)-1]
	_, isReturn := lastStmt.(*ast.ReturnStmt)
	return isReturn
}

// WriteStmtSelect translates a Go `select` statement into an asynchronous
// TypeScript operation using the `$.selectStatement` runtime helper.
// Go's `select` provides non-deterministic choice over channel operations.
// This is emulated by constructing an array of `SelectCase` objects, one for
// each `case` in the Go `select`, and passing it to `$.selectStatement`.
//
// Each `SelectCase` object includes:
//   - `id`: A unique identifier for the case.
//   - `isSend`: `true` for send operations (`case ch <- val:`), `false` for receives.
//   - `channel`: The TypeScript channel object.
//   - `value` (for sends): The value being sent.
//   - `onSelected: async (result) => { ... }`: A callback executed when this case
//     is chosen. `result` contains `{ value, ok }` for receives.
//   - Inside `onSelected`, assignments for receive operations (e.g., `v := <-ch`,
//     `v, ok := <-ch`) are handled by declaring/assigning variables from `result.value`
//     and `result.ok`.
//   - The original Go case body is then translated within this callback.
//
// A `default` case in Go `select` is translated to a `SelectCase` with `id: -1`
// and its body in the `onSelected` handler. The `$.selectStatement` helper
// is informed if a default case exists.
// The entire `$.selectStatement(...)` call is `await`ed because channel
// operations are asynchronous in the TypeScript model.
func (c *GoToTSCompiler) WriteStmtSelect(exp *ast.SelectStmt) error {
	// This is our implementation of the select statement, which will use Promise.race
	// to achieve the same semantics as Go's select statement.

	// Variable to track whether we have a default case
	hasDefault := false

	// Analyze if all cases end with return statements
	allCasesReturn := true
	for _, stmt := range exp.Body.List {
		if commClause, ok := stmt.(*ast.CommClause); ok {
			if commClause.Comm == nil {
				// Default case - check if it ends with return
				if !c.caseEndsWithReturn(commClause.Body) {
					allCasesReturn = false
				}
			} else {
				// Regular case - check if it ends with return
				if !c.caseEndsWithReturn(commClause.Body) {
					allCasesReturn = false
				}
			}
		}
	}

	// Generate unique variable names for this select statement
	selectID := c.getDeterministicID(exp.Pos()) // Use deterministic position-based ID

	// Start the selectStatement call and the array literal
	c.tsw.WriteLiterallyf("const [_select_has_return_%s, _select_value_%s] = await $.selectStatement(", selectID, selectID)
	c.tsw.WriteLine("[") // Put bracket on new line
	c.tsw.Indent(1)

	// For each case clause, generate a SelectCase object directly into the array literal
	for i, stmt := range exp.Body.List {
		if commClause, ok := stmt.(*ast.CommClause); ok {
			if commClause.Comm == nil {
				// This is a default case
				hasDefault = true
				// Add a SelectCase object for the default case with a special ID
				c.tsw.WriteLiterally("{") // Start object literal
				c.tsw.Indent(1)
				c.tsw.WriteLine("")
				c.tsw.WriteLiterally("id: -1,") // Special ID for default case
				c.tsw.WriteLine("")
				c.tsw.WriteLiterally("isSend: false,") // Default case is neither send nor receive, but needs a value
				c.tsw.WriteLine("")
				c.tsw.WriteLiterally("channel: null,") // No channel for default case
				c.tsw.WriteLine("")
				c.tsw.WriteLiterally("onSelected: async (result) => {") // Mark as async because case body might contain await
				c.tsw.Indent(1)
				c.tsw.WriteLine("")
				// Write the case body
				for _, bodyStmt := range commClause.Body {
					if err := c.WriteStmt(bodyStmt); err != nil {
						return fmt.Errorf("failed to write statement in select default case body (onSelected): %w", err)
					}
				}
				c.tsw.Indent(-1)
				c.tsw.WriteLine("}") // Close onSelected handler
				c.tsw.Indent(-1)
				c.tsw.WriteLiterally("},") // Close SelectCase object and add comma
				c.tsw.WriteLine("")

				continue
			}

			// Generate a unique ID for this case
			caseID := i

			// Start writing the SelectCase object
			c.tsw.WriteLiterally("{") // Start object literal
			c.tsw.Indent(1)
			c.tsw.WriteLine("")
			c.tsw.WriteLiterallyf("id: %d,", caseID)
			c.tsw.WriteLine("")

			// Handle different types of comm statements
			switch comm := commClause.Comm.(type) {
			case *ast.AssignStmt:
				// This is a receive operation with assignment: case v := <-ch: or case v, ok := <-ch:
				if len(comm.Rhs) == 1 {
					if unaryExpr, ok := comm.Rhs[0].(*ast.UnaryExpr); ok && unaryExpr.Op == token.ARROW {
						// It's a receive operation
						c.tsw.WriteLiterally("isSend: false,")
						c.tsw.WriteLine("")
						c.tsw.WriteLiterally("channel: ")
						if err := c.WriteValueExpr(unaryExpr.X); err != nil { // The channel expression
							return fmt.Errorf("failed to write channel expression in select receive case: %w", err)
						}
						c.tsw.WriteLiterally(",")
						c.tsw.WriteLine("")
					} else {
						c.tsw.WriteCommentLinef("unhandled RHS in select assignment case: %T", comm.Rhs[0])
					}
				} else {
					c.tsw.WriteCommentLinef("unhandled RHS count in select assignment case: %d", len(comm.Rhs))
				}
			case *ast.ExprStmt:
				// This is a simple receive: case <-ch:
				if unaryExpr, ok := comm.X.(*ast.UnaryExpr); ok && unaryExpr.Op == token.ARROW {
					c.tsw.WriteLiterally("isSend: false,")
					c.tsw.WriteLine("")
					c.tsw.WriteLiterally("channel: ")
					if err := c.WriteValueExpr(unaryExpr.X); err != nil { // The channel expression
						return fmt.Errorf("failed to write channel expression in select receive case: %w", err)
					}
					c.tsw.WriteLiterally(",")
					c.tsw.WriteLine("")
				} else {
					c.tsw.WriteCommentLinef("unhandled expression in select case: %T", comm.X)
				}
			case *ast.SendStmt:
				// This is a send operation: case ch <- v:
				c.tsw.WriteLiterally("isSend: true,")
				c.tsw.WriteLine("")
				c.tsw.WriteLiterally("channel: ")
				if err := c.WriteValueExpr(comm.Chan); err != nil { // The channel expression
					return fmt.Errorf("failed to write channel expression in select send case: %w", err)
				}
				c.tsw.WriteLiterally(",")
				c.tsw.WriteLine("")
				c.tsw.WriteLiterally("value: ")
				if err := c.WriteValueExpr(comm.Value); err != nil { // The value expression
					return fmt.Errorf("failed to write value expression in select send case: %w", err)
				}
				c.tsw.WriteLiterally(",")
				c.tsw.WriteLine("")
			default:
				c.tsw.WriteCommentLinef("unhandled comm statement in select case: %T", comm)
			}

			// Add the onSelected handler to execute the case body after the select resolves
			c.tsw.WriteLiterally("onSelected: async (result) => {") // Mark as async because case body might contain await
			c.tsw.Indent(1)
			c.tsw.WriteLine("")

			// Handle assignment for channel receives if needed (inside the onSelected handler)
			if assignStmt, ok := commClause.Comm.(*ast.AssignStmt); ok {
				// This is a receive operation with assignment
				if len(assignStmt.Lhs) == 1 {
					// Simple receive: case v := <-ch:
					valIdent, ok := assignStmt.Lhs[0].(*ast.Ident)
					if ok && valIdent.Name != "_" { // Check for blank identifier
						c.tsw.WriteLiterally("const ")
						c.WriteIdent(valIdent, false)
						c.tsw.WriteLiterally(" = result.value")
						c.tsw.WriteLine("")
					}
				} else if len(assignStmt.Lhs) == 2 {
					// Receive with ok: case v, ok := <-ch:
					valIdent, valOk := assignStmt.Lhs[0].(*ast.Ident)
					okIdent, okOk := assignStmt.Lhs[1].(*ast.Ident)

					if valOk && valIdent.Name != "_" {
						c.tsw.WriteLiterally("const ")
						c.WriteIdent(valIdent, false)
						c.tsw.WriteLiterally(" = result.value")
						c.tsw.WriteLine("")
					}

					if okOk && okIdent.Name != "_" {
						c.tsw.WriteLiterally("const ")
						c.WriteIdent(okIdent, false)
						c.tsw.WriteLiterally(" = result.ok")
						c.tsw.WriteLine("")
					}
				}
			}
			// Note: Simple receive (case <-ch:) and send (case ch <- v:) don't require assignment here,
			// as the operation was already performed by selectReceive/selectSend and the result is in 'result'.

			// Write the case body
			for _, bodyStmt := range commClause.Body {
				if err := c.WriteStmt(bodyStmt); err != nil {
					return fmt.Errorf("failed to write statement in select case body (onSelected): %w", err)
				}
			}

			c.tsw.Indent(-1)
			c.tsw.WriteLine("}") // Close onSelected handler
			c.tsw.Indent(-1)
			c.tsw.WriteLiterally("},") // Close SelectCase object and add comma
			c.tsw.WriteLine("")

		} else {
			return errors.Errorf("unknown statement in select body: %T", stmt)
		}
	}

	// Close the array literal and the selectStatement call
	c.tsw.Indent(-1)
	c.tsw.WriteLiterally("], ")
	c.tsw.WriteLiterallyf("%t", hasDefault)
	c.tsw.WriteLiterally(")")
	c.tsw.WriteLine("")

	// Add code to handle the return value from selectStatement
	c.tsw.WriteLiterallyf("if (_select_has_return_%s) {", selectID)
	c.tsw.WriteLine("")
	c.tsw.Indent(1)
	c.tsw.WriteLiterallyf("return _select_value_%s!", selectID)
	c.tsw.WriteLine("")
	c.tsw.Indent(-1)
	c.tsw.WriteLine("}")

	// If all cases return, add a TypeScript-satisfying fallback return
	if allCasesReturn {
		c.tsw.WriteLine("// All cases should return, this fallback should never execute")
		c.tsw.WriteLine("throw new Error('Unexpected: select statement did not return when all cases should return')")
	} else {
		c.tsw.WriteLiterallyf("// If _select_has_return_%s is false, continue execution", selectID)
		c.tsw.WriteLine("")
	}

	return nil
}

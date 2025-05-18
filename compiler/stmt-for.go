package compiler

import (
	"fmt"
	"go/ast"
	"go/token"

	"github.com/pkg/errors"
)

// WriteStmtFor translates a Go `for` statement (`ast.ForStmt`) into a
// TypeScript `for` loop.
// The structure is `for (init_ts; cond_ts; post_ts) { body_ts }`.
//   - The initialization part (`exp.Init`) is translated using `WriteStmtForInit`.
//   - The condition part (`exp.Cond`) is translated using `WriteValueExpr`. If nil,
//     the condition part in TypeScript is empty (resulting in an infinite loop
//     unless broken out of).
//   - The post-iteration part (`exp.Post`) is translated using `WriteStmtForPost`.
//   - The loop body (`exp.Body`) is translated as a block statement using `WriteStmtBlock`.
//
// This function covers standard Go `for` loops (three-part loops, condition-only
// loops, and infinite loops). `for...range` loops are handled by `WriteStmtRange`.
func (c *GoToTSCompiler) WriteStmtFor(exp *ast.ForStmt) error {
	c.tsw.WriteLiterally("for (")
	if exp.Init != nil {
		if err := c.WriteStmtForInit(exp.Init); err != nil { // Use WriteStmtForInit
			return fmt.Errorf("failed to write for loop initialization: %w", err)
		}
	}
	c.tsw.WriteLiterally("; ")
	if exp.Cond != nil {
		if err := c.WriteValueExpr(exp.Cond); err != nil { // Condition is a value
			return fmt.Errorf("failed to write for loop condition: %w", err)
		}
	}
	c.tsw.WriteLiterally("; ")
	if exp.Post != nil {
		if err := c.WriteStmtForPost(exp.Post); err != nil { // Use WriteStmtForPost
			return fmt.Errorf("failed to write for loop post statement: %w", err)
		}
	}
	c.tsw.WriteLiterally(") ")
	if err := c.WriteStmtBlock(exp.Body, false); err != nil {
		return fmt.Errorf("failed to write for loop body: %w", err)
	}
	return nil
}

// WriteStmtForInit translates the initialization part of a Go `for` loop header
// (e.g., `i := 0` or `i = 0` in `for i := 0; ...`) into its TypeScript equivalent.
// - If `stmt` is an `ast.AssignStmt`:
//   - For short variable declarations (`:=`) with multiple variables (e.g., `i, j := 0, 10`),
//     it generates `let i = 0, j = 10`. Each LHS variable is paired with its
//     corresponding RHS value; if RHS values are insufficient, remaining LHS
//     variables are initialized with their zero value using `WriteZeroValue`.
//   - For other assignments (single variable `:=`, or regular `=`), it uses
//     `writeAssignmentCore`. If it's `:=`, `let` is prepended.
//   - If `stmt` is an `ast.ExprStmt` (less common in `for` inits), it translates
//     the expression using `WriteValueExpr`.
//
// Unhandled statement types in the init part result in a comment.
func (c *GoToTSCompiler) WriteStmtForInit(stmt ast.Stmt) error {
	switch s := stmt.(type) {
	case *ast.AssignStmt:
		// Handle assignment in init (e.g., i := 0 or i = 0)
		// For TypeScript for-loop init, we need to handle multi-variable declarations differently
		if s.Tok == token.DEFINE && len(s.Lhs) > 1 && len(s.Rhs) > 0 {
			// For loop initialization with multiple variables (e.g., let i = 0, j = 10)
			c.tsw.WriteLiterally("let ")

			// Handle each LHS variable with its corresponding RHS value
			for i, lhs := range s.Lhs {
				if i > 0 {
					c.tsw.WriteLiterally(", ")
				}

				// Write the LHS variable name
				if err := c.WriteValueExpr(lhs); err != nil {
					return err
				}

				// Write the corresponding RHS, or a default if not enough RHS values
				c.tsw.WriteLiterally(" = ")
				if i < len(s.Rhs) {
					// If there's a corresponding RHS value
					if err := c.WriteValueExpr(s.Rhs[i]); err != nil {
						return err
					}
				} else {
					// No corresponding RHS
					return errors.Errorf("no corresponding rhs to lhs: %v", s)
				}
			}
		} else {
			// Regular single variable or assignment (not declaration)
			if s.Tok == token.DEFINE {
				c.tsw.WriteLiterally("let ")
			}
			// Use existing assignment core logic
			if err := c.writeAssignmentCore(s.Lhs, s.Rhs, s.Tok, false); err != nil {
				return err
			}
		}
		return nil
	case *ast.ExprStmt:
		// Handle expression statement in init
		return c.WriteValueExpr(s.X)
	default:
		return errors.Errorf("unhandled for loop init statement: %T", stmt)
	}
}

// WriteStmtForPost translates the post-iteration part of a Go `for` loop header
// (e.g., `i++` or `i, j = i+1, j-1` in `for ...; i++`) into its TypeScript
// equivalent.
// - If `stmt` is an `ast.IncDecStmt` (e.g., `i++`), it writes `i_ts++`.
// - If `stmt` is an `ast.AssignStmt`:
//   - For multiple variable assignments (e.g., `i, j = i+1, j-1`), it generates
//     TypeScript array destructuring: `[i_ts, j_ts] = [i_ts+1, j_ts-1]`.
//   - For single variable assignments, it uses `writeAssignmentCore`.
//   - If `stmt` is an `ast.ExprStmt` (less common), it translates the expression
//     using `WriteValueExpr`.
//
// Unhandled statement types in the post part result in a comment.
func (c *GoToTSCompiler) WriteStmtForPost(stmt ast.Stmt) error {
	switch s := stmt.(type) {
	case *ast.IncDecStmt:
		// Handle increment/decrement (e.g., i++)
		if err := c.WriteValueExpr(s.X); err != nil { // The expression (e.g., i)
			return err
		}
		tokStr, ok := TokenToTs(s.Tok)
		if !ok {
			return errors.Errorf("unknown incdec token: %v", s.Tok)
		}
		c.tsw.WriteLiterally(tokStr) // The token (e.g., ++)
		return nil
	case *ast.AssignStmt:
		// For multiple variable assignment in post like i, j = i+1, j-1
		// we need to use destructuring in TypeScript like [i, j] = [i+1, j-1]
		if len(s.Lhs) > 1 && len(s.Rhs) > 0 {
			// Write LHS as array destructuring
			c.tsw.WriteLiterally("[")
			for i, lhs := range s.Lhs {
				if i > 0 {
					c.tsw.WriteLiterally(", ")
				}
				if err := c.WriteValueExpr(lhs); err != nil {
					return err
				}
			}
			c.tsw.WriteLiterally("] = [")

			// Write RHS as array
			for i, rhs := range s.Rhs {
				if i > 0 {
					c.tsw.WriteLiterally(", ")
				}
				if err := c.WriteValueExpr(rhs); err != nil {
					return err
				}
			}
			c.tsw.WriteLiterally("]")
		} else {
			// Regular single variable assignment
			// No declaration handling needed in for loop post statements
			if err := c.writeAssignmentCore(s.Lhs, s.Rhs, s.Tok, false); err != nil {
				return err
			}
		}
		return nil
	case *ast.ExprStmt:
		// Handle expression statement in post
		return c.WriteValueExpr(s.X)
	default:
		return errors.Errorf("unhandled for loop post statement: %T", stmt)
	}
}

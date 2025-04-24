package compiler

import (
	"fmt"
	"go/ast"
	"go/token"
	gtypes "go/types"
	"strings"

	gstypes "github.com/paralin/goscript/types"
	"github.com/sanity-io/litter"
	"golang.org/x/tools/go/packages"
)

// WriteStmt writes a statement to the output.
func (c *GoToTSCompiler) WriteStmt(a ast.Stmt) {
	switch exp := a.(type) {
	case *ast.BlockStmt:
		c.WriteStmtBlock(exp, false)
	case *ast.AssignStmt:
		c.WriteStmtAssign(exp)
	case *ast.ReturnStmt:
		c.WriteStmtReturn(exp)
	case *ast.IfStmt:
		c.WriteStmtIf(exp)
	case *ast.ExprStmt:
		c.WriteStmtExpr(exp)
	case *ast.DeclStmt:
		// Handle declarations within a statement list (e.g., short variable declarations)
		// This typically contains a GenDecl
		if genDecl, ok := exp.Decl.(*ast.GenDecl); ok {
			for _, spec := range genDecl.Specs {
				// Value specs within a declaration statement
				if valueSpec, ok := spec.(*ast.ValueSpec); ok {
					c.WriteValueSpec(valueSpec)
				} else {
					c.tsw.WriteCommentLine(fmt.Sprintf("unhandled spec in DeclStmt: %T", spec))
				}
			}
		} else {
			c.tsw.WriteCommentLine(fmt.Sprintf("unhandled declaration type in DeclStmt: %T", exp.Decl))
		}
	case *ast.ForStmt:
		c.WriteStmtFor(exp)
	case *ast.SwitchStmt:
		c.WriteStmtSwitch(exp)
	case *ast.IncDecStmt:
		// Handle increment/decrement (e.g., i++ or i--)
		if err := c.WriteValueExpr(exp.X); err != nil { // The expression (e.g., i)
			// Handle error
		}
		tokStr, ok := gstypes.TokenToTs(exp.Tok)
		if !ok {
			c.tsw.WriteCommentLine(fmt.Sprintf("unknown incdec token: %s", exp.Tok.String()))
		} else {
			c.tsw.WriteLiterally(tokStr) // The token (e.g., ++ or --)
		}
		c.tsw.WriteLine(";") // Add semicolon
	default:
		c.tsw.WriteCommentLine(fmt.Sprintf("unknown statement: %s\n", litter.Sdump(a)))
	}
}

// WriteStmtSwitch writes a switch statement.
func (c *GoToTSCompiler) WriteStmtSwitch(exp *ast.SwitchStmt) {
	// Handle optional initialization statement
	if exp.Init != nil {
		c.tsw.WriteLiterally("{")
		c.tsw.Indent(1)
		c.WriteStmt(exp.Init)
		defer func() {
			c.tsw.Indent(-1)
			c.tsw.WriteLiterally("}")
		}()
	}

	c.tsw.WriteLiterally("switch (")
	// Handle the switch tag (the expression being switched on)
	if exp.Tag != nil {
		c.WriteValueExpr(exp.Tag)
	}
	c.tsw.WriteLiterally(") {")
	c.tsw.WriteLine("")
	c.tsw.Indent(1)

	// Handle case clauses
	for _, stmt := range exp.Body.List {
		if caseClause, ok := stmt.(*ast.CaseClause); ok {
			c.WriteCaseClause(caseClause)
		} else {
			c.tsw.WriteCommentLine(fmt.Sprintf("unhandled statement in switch body: %T", stmt))
		}
	}

	c.tsw.Indent(-1)
	c.tsw.WriteLine("}")
}

// WriteCaseClause writes a case clause within a switch statement.
func (c *GoToTSCompiler) WriteCaseClause(exp *ast.CaseClause) {
	if exp.List == nil {
		// Default case
		c.tsw.WriteLiterally("default:")
		c.tsw.WriteLine("")
	} else {
		// Case with expressions
		c.tsw.WriteLiterally("case ")
		for i, expr := range exp.List {
			if i > 0 {
				c.tsw.WriteLiterally(", ") // Although Go doesn't support multiple expressions per case like this,
			} // TypeScript does, so we'll write it this way for now.
			c.WriteValueExpr(expr)
		}
		c.tsw.WriteLiterally(":")
		c.tsw.WriteLine("")
	}

	c.tsw.Indent(1)
	// Write the body of the case clause
	for _, stmt := range exp.Body {
		c.WriteStmt(stmt)
	}
	// Add break statement (Go's switch has implicit breaks)
	c.tsw.WriteLine("break;")
	c.tsw.Indent(-1)
}

// Overload for backward compatibility
func (c *GoToTSCompiler) WriteStmtCompat(a ast.Stmt) {
	c.WriteStmt(a)
}

// WriteStmtIf writes an if statement.
func (s *GoToTSCompiler) WriteStmtIf(exp *ast.IfStmt) error {
	if exp.Init != nil {
		s.tsw.WriteLiterally("{")
		s.tsw.Indent(1)

		s.WriteStmt(exp.Init)

		defer func() {
			s.tsw.Indent(-1)
			s.tsw.WriteLiterally("}")
		}()
	}

	s.tsw.WriteLiterally("if (")
	if err := s.WriteValueExpr(exp.Cond); err != nil { // Condition is a value
		return err
	}
	s.tsw.WriteLiterally(") ")

	if exp.Body != nil {
		s.WriteStmtBlock(exp.Body, exp.Else != nil)
	} else {
		// Handle nil body case using WriteStmtBlock with an empty block
		s.WriteStmtBlock(&ast.BlockStmt{}, exp.Else != nil)
	}

	// handle else branch
	if exp.Else != nil {
		s.tsw.WriteLiterally(" else ")
		switch elseStmt := exp.Else.(type) {
		case *ast.BlockStmt:
			s.WriteStmtBlock(elseStmt, false)
		case *ast.IfStmt:
			s.WriteStmtIf(elseStmt)
		}
	}
	return nil
}

// WriteStmtReturn writes a return statement.
func (c *GoToTSCompiler) WriteStmtReturn(exp *ast.ReturnStmt) error {
	c.tsw.WriteLiterally("return ")
	if len(exp.Results) > 1 {
		c.tsw.WriteLiterally("[")
	}
	for i, res := range exp.Results {
		if i != 0 {
			c.tsw.WriteLiterally(", ")
		}
		if err := c.WriteValueExpr(res); err != nil { // Return results are values
			return err
		}
	}
	if len(exp.Results) > 1 {
		c.tsw.WriteLiterally("]")
	}
	c.tsw.WriteLine(";") // Add semicolon
	return nil
}

// WriteStmtBlock writes a block statement, preserving comments and blank lines.
func (c *GoToTSCompiler) WriteStmtBlock(exp *ast.BlockStmt, suppressNewline bool) {
	if exp == nil {
		c.tsw.WriteLiterally("{}")
		if !suppressNewline {
			c.tsw.WriteLine("")
		}
		return
	}

	// Opening brace
	c.tsw.WriteLine("{")
	c.tsw.Indent(1)

	// Prepare line info
	var file *token.File
	if c.pkg != nil && c.pkg.Fset != nil && exp.Lbrace.IsValid() {
		file = c.pkg.Fset.File(exp.Lbrace)
	}

	// writeBlank emits a single blank line if gap > 1
	writeBlank := func(prev, curr int) {
		if file != nil && prev > 0 && curr > prev+1 {
			c.tsw.WriteLine("")
		}
	}

	// Track last printed line, start at opening brace
	lastLine := 0
	if file != nil {
		lastLine = file.Line(exp.Lbrace)
	}

	// 1. For each statement: write its leading comments, blank space, then the stmt
	for _, stmt := range exp.List {
		// Get statement's end line and position for inline comment check
		stmtEndLine := 0
		stmtEndPos := token.NoPos
		if file != nil && stmt.End().IsValid() {
			stmtEndLine = file.Line(stmt.End())
			stmtEndPos = stmt.End()
		}

		// Process leading comments for stmt
		comments := c.cmap.Filter(stmt).Comments()
		for _, cg := range comments {
			// Check if this comment group is an inline comment for the current statement
			isInlineComment := false
			if file != nil && cg.Pos().IsValid() && stmtEndPos.IsValid() {
				commentStartLine := file.Line(cg.Pos())
				// Inline if starts on same line as stmt end AND starts after stmt end position
				if commentStartLine == stmtEndLine && cg.Pos() > stmtEndPos {
					isInlineComment = true
				}
			}

			// If it's NOT an inline comment for this statement, write it here
			if !isInlineComment {
				start := 0
				if file != nil && cg.Pos().IsValid() {
					start = file.Line(cg.Pos())
				}
				writeBlank(lastLine, start)
				c.WriteDoc(cg) // WriteDoc will handle the actual comment text
				if file != nil && cg.End().IsValid() {
					lastLine = file.Line(cg.End())
				}
			}
			// If it IS an inline comment, skip it. The statement writer will handle it.
		}

		// the statement itself
		stmtStart := 0
		if file != nil && stmt.Pos().IsValid() {
			stmtStart = file.Line(stmt.Pos())
		}
		writeBlank(lastLine, stmtStart)
		// Call the specific statement writer (e.g., WriteStmtAssign).
		// It is responsible for handling its own inline comment.
		c.WriteStmt(stmt)

		if file != nil && stmt.End().IsValid() {
			// Update lastLine based on the statement's end, *including* potential inline comment handled by WriteStmt*
			lastLine = file.Line(stmt.End())
		}
	}

	// 2. Trailing comments on the block (after last stmt, before closing brace)
	trailing := c.cmap.Filter(exp).Comments()
	for _, cg := range trailing {
		start := 0
		if file != nil && cg.Pos().IsValid() {
			start = file.Line(cg.Pos())
		}
		// only emit if it follows the last content
		if start > lastLine {
			writeBlank(lastLine, start)
			c.WriteDoc(cg)
			if file != nil && cg.End().IsValid() {
				lastLine = file.Line(cg.End())
			}
		}
	}

	// 3. Blank lines before closing brace
	closing := 0
	if file != nil && exp.Rbrace.IsValid() {
		closing = file.Line(exp.Rbrace)
	}
	writeBlank(lastLine, closing)

	// Closing brace
	c.tsw.Indent(-1)
	c.tsw.WriteLiterally("}")

	if !suppressNewline {
		c.tsw.WriteLine("")
	}
}

// writeAssignmentCore writes the core LHS, operator, and RHS of an assignment.
// It does NOT handle blank identifiers, 'let' keyword, or trailing semicolons/comments/newlines.
func (c *GoToTSCompiler) writeAssignmentCore(lhs, rhs []ast.Expr, tok token.Token) error {
	for i, l := range lhs {
		if i != 0 {
			c.tsw.WriteLiterally(", ")
		}
		if err := c.WriteValueExpr(l); err != nil { // LHS is a value
			return err
		}
	}
	c.tsw.WriteLiterally(" ")
	tokStr, ok := gstypes.TokenToTs(tok) // Use explicit gstypes alias
	if !ok {
		c.tsw.WriteLiterally("?= ")
		c.tsw.WriteCommentLine("Unknown token " + tok.String())
	} else {
		c.tsw.WriteLiterally(tokStr)
	}
	c.tsw.WriteLiterally(" ")
	for i, r := range rhs {
		if i != 0 {
			c.tsw.WriteLiterally(", ")
		}
		// Check if we should apply clone for value-type semantics
		if shouldApplyClone(c.pkg, r) {
			if err := c.WriteValueExpr(r); err != nil { // RHS is a value
				return err
			}
			c.tsw.WriteLiterally(".clone()")
		} else {
			if err := c.WriteValueExpr(r); err != nil { // RHS is a value
				return err
			}
		}
	}
	return nil
}

// WriteStmtAssign writes an assign statement.
func (c *GoToTSCompiler) WriteStmtAssign(exp *ast.AssignStmt) error {
	// Handle multi-variable assignment from a single function call returning multiple values.
	if len(exp.Lhs) > 1 && len(exp.Rhs) == 1 {
		if callExpr, ok := exp.Rhs[0].(*ast.CallExpr); ok {
			// This is a multi-variable assignment from a function call.
			// Translate to a TypeScript destructuring assignment.
		} else if typeAssertExpr, ok := exp.Rhs[0].(*ast.TypeAssertExpr); ok {
			// This is a multi-variable assignment from a type assertion.
			// Translate to a TypeScript instanceof check and type assertion.

			// Get the interface and the type being asserted.
			interfaceExpr := typeAssertExpr.X
			assertedType := typeAssertExpr.Type

			// Write the TypeScript code for the type assertion.
			c.tsw.WriteLiterally("let ok: boolean = ")
			c.WriteValueExpr(interfaceExpr)
			c.tsw.WriteLiterally(" instanceof ")
			c.WriteTypeExpr(assertedType)
			c.tsw.WriteLine(";")

			c.tsw.WriteLiterally("let assertedValue: ")
			c.WriteTypeExpr(assertedType)
			c.tsw.WriteLiterally(" | null = ok ? (")
			c.WriteValueExpr(interfaceExpr)
			c.tsw.WriteLiterally(" as ")
			c.WriteTypeExpr(assertedType)
			c.tsw.WriteLiterally(") : null;")
			c.tsw.WriteLine("")

			return nil

			// Determine if 'let' or 'const' is needed for :=
			if exp.Tok == token.DEFINE {
				// For simplicity, use 'let' for := in multi-variable assignments.
				// More advanced analysis might be needed to determine if const is possible.
				c.tsw.WriteLiterally("let ")
			}

			// Write the left-hand side as a destructuring pattern
			c.tsw.WriteLiterally("[")
			for i, lhsExpr := range exp.Lhs {
				if i != 0 {
					c.tsw.WriteLiterally(", ")
				}
				// Write the variable name, omitting '_' for blank identifier
				if ident, ok := lhsExpr.(*ast.Ident); ok && ident.Name != "_" {
					c.WriteIdentValue(ident)
				} else if !ok {
					// Should not happen for valid Go code in this context, but handle defensively
					c.tsw.WriteCommentInline(fmt.Sprintf("unhandled LHS expression in destructuring: %T", lhsExpr))
				}
			}
			c.tsw.WriteLiterally("] = ")

			// Write the right-hand side (the function call)
			if err := c.WriteValueExpr(callExpr); err != nil {
				return fmt.Errorf("failed to write RHS call expression in assignment: %w", err)
			}

			c.tsw.WriteLine(";") // Add semicolon for the statement
			return nil
		}
	}

	// Handle all other assignment cases (one-to-one, multiple RHS expressions, etc.)
	// Ensure LHS and RHS have the same length for valid Go code in these cases
	if len(exp.Lhs) != len(exp.Rhs) {
		c.tsw.WriteCommentLine(fmt.Sprintf("invalid assignment statement: LHS count (%d) != RHS count (%d)", len(exp.Lhs), len(exp.Rhs)))
		return fmt.Errorf("invalid assignment statement: LHS count (%d) != RHS count (%d)", len(exp.Lhs), len(exp.Rhs))
	}

	// Process each assignment pair using the core writer
	for i := range exp.Lhs {
		lhsExpr := exp.Lhs[i]
		rhsExpr := exp.Rhs[i]

		// Check for blank identifier on the left-hand side
		if ident, ok := lhsExpr.(*ast.Ident); ok && ident.Name == "_" {
			// Blank identifier: evaluate the RHS for side effects, but discard the value.
			if err := c.WriteValueExpr(rhsExpr); err != nil {
				return fmt.Errorf("failed to write RHS for blank identifier assignment: %w", err)
			}
			c.tsw.WriteCommentInline("discarded value")
			c.tsw.WriteLine(";") // Each assignment gets its own line
			continue             // Move to the next pair
		}

		// Not a blank identifier: generate an assignment statement.

		// Handle short variable declaration (:=)
		if exp.Tok == token.DEFINE {
			// Use 'let' for the first declaration of a variable.
			// More sophisticated analysis might be needed to determine if it's truly the first declaration
			// in the current scope, but for now, assume := implies a new variable.
			c.tsw.WriteLiterally("let ")
		}

		// Write the core assignment (LHS = RHS)
		// Pass single-element slices for LHS and RHS to writeAssignmentCore
		if err := c.writeAssignmentCore([]ast.Expr{lhsExpr}, []ast.Expr{rhsExpr}, exp.Tok); err != nil {
			return fmt.Errorf("failed to write core assignment: %w", err)
		}

		// Handle trailing inline comment for this specific assignment line
		// This is more complex with multi-variable assignments. For simplicity,
		// we'll associate any comment immediately following the *entire* Go statement
		// with the *last* generated TypeScript assignment line.
		// A more accurate approach would require mapping comments to specific LHS/RHS pairs.
		if i == len(exp.Lhs)-1 { // Only process for the last assignment in the group
			if c.pkg != nil && c.pkg.Fset != nil && exp.End().IsValid() {
				if file := c.pkg.Fset.File(exp.End()); file != nil {
					endLine := file.Line(exp.End())
					// Check comments associated *directly* with the AssignStmt node
					for _, cg := range c.cmap[exp] {
						if cg.Pos().IsValid() && file.Line(cg.Pos()) == endLine && cg.Pos() > exp.End() {
							commentText := strings.TrimSpace(strings.TrimPrefix(cg.Text(), "//"))
							c.tsw.WriteLiterally(" // " + commentText)
							break // Assume only one inline comment per statement
						}
					}
				}
			}
		}

		// Write the newline to finish the statement line
		c.tsw.WriteLine(";") // Add semicolon
	}

	return nil
}

// filterBlankIdentifiers is no longer needed with the new WriteStmtAssign logic.
// Keeping it commented out for now in case it's referenced elsewhere or for future use.
/*
func filterBlankIdentifiers(lhs, rhs []ast.Expr) ([]ast.Expr, []ast.Expr) {
	filteredLhs := []ast.Expr{}
	filteredRhs := []ast.Expr{}
	for i := range lhs {
		if ident, ok := lhs[i].(*ast.Ident); !ok || ident.Name != "_" {
			filteredLhs = append(filteredLhs, lhs[i])
			filteredRhs = append(filteredRhs, rhs[i])
		}
	}
	return filteredLhs, filteredRhs
}
*/

// shouldApplyClone determines if .clone() should be applied to the RHS of an assignment
// to emulate Go's value semantics for structs.
// This requires type information.
func shouldApplyClone(pkg *packages.Package, rhs ast.Expr) bool {
	if pkg == nil || pkg.TypesInfo == nil {
		// Cannot determine type without type info, default to no clone
		return false
	}

	// Get the type of the RHS expression
	tv, found := pkg.TypesInfo.Types[rhs]
	if !found || tv.Type == nil {
		// Type information not found, default to no clone
		return false
	}

	// Check if the underlying type is a struct
	// Also check if it's a named type whose underlying type is a struct
	switch t := tv.Type.Underlying().(type) {
	case *gtypes.Struct:
		// It's a struct, apply clone
		return true
	case *gtypes.Named:
		// It's a named type, check its underlying type
		if _, ok := t.Underlying().(*gtypes.Struct); ok {
			return true
		}
	}

	// Not a struct, do not apply clone
	return false
}

// WriteStmtExpr writes an expr statement.
func (c *GoToTSCompiler) WriteStmtExpr(exp *ast.ExprStmt) error {
	if err := c.WriteValueExpr(exp.X); err != nil { // Expression statement evaluates a value
		return err
	}

	// Handle potential inline comment for ExprStmt
	inlineCommentWritten := false
	if c.pkg != nil && c.pkg.Fset != nil && exp.End().IsValid() {
		if file := c.pkg.Fset.File(exp.End()); file != nil {
			endLine := file.Line(exp.End())
			// Check comments associated *directly* with the ExprStmt node
			for _, cg := range c.cmap[exp] {
				if cg.Pos().IsValid() && file.Line(cg.Pos()) == endLine && cg.Pos() > exp.End() {
					commentText := strings.TrimSpace(strings.TrimPrefix(cg.Text(), "//"))
					c.tsw.WriteLiterally(" // " + commentText)
					inlineCommentWritten = true
					break
				}
			}
			// Also check comments associated with the underlying expression X
			// This might be necessary if the comment map links it to X instead of ExprStmt
			if !inlineCommentWritten {
				for _, cg := range c.cmap[exp.X] {
					if cg.Pos().IsValid() && file.Line(cg.Pos()) == endLine && cg.Pos() > exp.End() {
						commentText := strings.TrimSpace(strings.TrimPrefix(cg.Text(), "//"))
						c.tsw.WriteLiterally(" // " + commentText)
						inlineCommentWritten = true
						break
					}
				}
			}
		}
	}

	// Add semicolon according to design doc (omit semicolons) - REMOVED semicolon
	c.tsw.WriteLine("") // Finish with a newline
	return nil
}

// WriteStmtFor writes a for statement.
func (c *GoToTSCompiler) WriteStmtFor(exp *ast.ForStmt) error {
	c.tsw.WriteLiterally("for (")
	if exp.Init != nil {
		if err := c.WriteForInit(exp.Init); err != nil { // Use WriteForInit
			return err
		}
	}
	c.tsw.WriteLiterally("; ")
	if exp.Cond != nil {
		if err := c.WriteValueExpr(exp.Cond); err != nil {
			return err
		}
	}
	c.tsw.WriteLiterally("; ")
	if exp.Post != nil {
		if err := c.WriteForPost(exp.Post); err != nil { // Use WriteForPost
			return err
		}
	}
	c.tsw.WriteLiterally(") ")
	c.WriteStmtBlock(exp.Body, false)
	return nil
}

// WriteForInit writes the initialization part of a for loop header.
func (c *GoToTSCompiler) WriteForInit(stmt ast.Stmt) error {
	switch s := stmt.(type) {
	case *ast.AssignStmt:
		// Handle assignment in init (e.g., i := 0 or i = 0)
		// Need to handle 'let' for :=
		if s.Tok == token.DEFINE {
			c.tsw.WriteLiterally("let ")
		}
		// Write the core assignment without trailing syntax
		// Blank identifiers should already be handled by filterBlankIdentifiers if needed,
		// but for init statements they are less common. Let's assume simple assignments for now.
		if err := c.writeAssignmentCore(s.Lhs, s.Rhs, s.Tok); err != nil {
			return err
		}
	case *ast.ExprStmt:
		// Handle expression statement in init (less common, but possible)
		if err := c.WriteValueExpr(s.X); err != nil {
			return err
		}
	default:
		c.tsw.WriteCommentLine(fmt.Sprintf("unhandled for loop init statement: %T", stmt))
	}
	return nil
}

// WriteForPost writes the post part of a for loop header.
func (c *GoToTSCompiler) WriteForPost(stmt ast.Stmt) error {
	switch s := stmt.(type) {
	case *ast.IncDecStmt:
		// Handle increment/decrement (e.g., i++)
		if err := c.WriteValueExpr(s.X); err != nil { // The expression (e.g., i)
			return err
		}
		tokStr, ok := gstypes.TokenToTs(s.Tok)
		if !ok {
			c.tsw.WriteLiterally("/* unknown incdec token */")
		} else {
			c.tsw.WriteLiterally(tokStr) // The token (e.g., ++)
		}
	case *ast.AssignStmt:
		// Handle assignment in post (e.g., i = i + 1)
		// No 'let' keyword here
		// Blank identifiers should already be handled by filterBlankIdentifiers if needed.
		if err := c.writeAssignmentCore(s.Lhs, s.Rhs, s.Tok); err != nil {
			return err
		}
	case *ast.ExprStmt:
		// Handle expression statement in post (less common)
		if err := c.WriteValueExpr(s.X); err != nil {
			return err
		}
	default:
		c.tsw.WriteCommentLine(fmt.Sprintf("unhandled for loop post statement: %T", stmt))
	}
	return nil
}

// WriteZeroValue writes the TypeScript zero‐value for a Go type.
func (c *GoToTSCompiler) WriteZeroValue(expr ast.Expr) {
	switch t := expr.(type) {
	case *ast.Ident:
		// Try to resolve identifier type
		if tv, found := c.pkg.TypesInfo.Types[t]; found {
			underlying := tv.Type.Underlying()
			switch u := underlying.(type) {
			case *gtypes.Basic: // Use gotypes alias
				if u.Info()&gtypes.IsNumeric != 0 { // Use gotypes alias
					c.tsw.WriteLiterally("0")
				} else if u.Info()&gtypes.IsString != 0 { // Use gotypes alias
					c.tsw.WriteLiterally(`""`)
				} else if u.Info()&gtypes.IsBoolean != 0 { // Use gotypes alias
					c.tsw.WriteLiterally("false")
				} else {
					c.tsw.WriteLiterally("null // unknown basic type")
				}
			case *gtypes.Struct: // Use gotypes alias
				// Zero value for struct is new instance
				c.tsw.WriteLiterally("new ")
				c.WriteTypeExpr(t) // Write the type name
				c.tsw.WriteLiterally("()")
			case *gtypes.Pointer, *gtypes.Interface, *gtypes.Slice, *gtypes.Map, *gtypes.Chan, *gtypes.Signature: // Use gotypes alias
				// Pointers, interfaces, slices, maps, channels, functions zero value is null/undefined
				c.tsw.WriteLiterally("null")
			default:
				c.tsw.WriteLiterally("null // unknown underlying type")
			}
		} else {
			// Fallback for unresolved identifiers (basic types)
			switch t.Name {
			case "int", "int8", "int16", "int32", "int64", "uint", "uint8", "uint16", "uint32", "uint64", "uintptr", "float32", "float64", "complex64", "complex128":
				c.tsw.WriteLiterally("0")
			case "string":
				c.tsw.WriteLiterally(`""`)
			case "bool":
				c.tsw.WriteLiterally("false")
			default:
				// Assume custom type, might be struct or interface -> null
				c.tsw.WriteLiterally("null // unresolved identifier")
			}
		}
	case *ast.StarExpr, *ast.InterfaceType, *ast.ArrayType, *ast.MapType, *ast.ChanType, *ast.FuncType:
		// Pointers, interfaces, arrays, maps, channels, functions zero value is null/undefined
		c.tsw.WriteLiterally("null")
	case *ast.StructType:
		// Anonymous struct zero value is complex, default to null for now
		c.tsw.WriteLiterally("null")
	default:
		// everything else defaults to null in TS
		c.tsw.WriteLiterally("null")
	}
}

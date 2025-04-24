package compiler

import (
	"fmt"
	"go/ast"
	"go/token"
	gtypes "go/types"
	"strings"

	gstypes "github.com/paralin/goscript/types"
	"github.com/sanity-io/litter"
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
	default:
		c.tsw.WriteCommentLine(fmt.Sprintf("unknown statement: %s\n", litter.Sdump(a)))
	}
}

// Overload for backward compatibility
func (c *GoToTSCompiler) WriteStmtCompat(a ast.Stmt) {
	c.WriteStmt(a)
}

// WriteStmtIf writes an if statement.
func (s *GoToTSCompiler) WriteStmtIf(exp *ast.IfStmt) {
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
	s.WriteValueExpr(exp.Cond) // Condition is a value
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
}

// WriteStmtReturn writes a return statement.
func (c *GoToTSCompiler) WriteStmtReturn(exp *ast.ReturnStmt) {
	c.tsw.WriteLiterally("return ")
	for i, res := range exp.Results {
		if i != 0 {
			c.tsw.WriteLiterally(", ")
		}
		c.WriteValueExpr(res) // Return results are values
	}
	c.tsw.WriteLine("")
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
func (c *GoToTSCompiler) writeAssignmentCore(lhs, rhs []ast.Expr, tok token.Token) {
	for i, l := range lhs {
		if i != 0 {
			c.tsw.WriteLiterally(", ")
		}
		c.WriteValueExpr(l) // LHS is a value
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
			c.WriteValueExpr(r) // RHS is a value
			c.tsw.WriteLiterally(".clone()")
		} else {
			c.WriteValueExpr(r) // RHS is a value
		}
	}
}

// WriteStmtAssign writes an assign statement.
func (c *GoToTSCompiler) WriteStmtAssign(exp *ast.AssignStmt) {
	// skip blank-identifier assignments: ignore single `_ = ...` assignments
	if len(exp.Lhs) == 1 {
		if ident, ok := exp.Lhs[0].(*ast.Ident); ok && ident.Name == "_" {
			return
		}
	}
	// filter out blank identifiers for multi-value assignments: remove any `_` slots
	lhs, rhs := filterBlankIdentifiers(exp.Lhs, exp.Rhs)
	if len(lhs) == 0 {
		return
	}

	// special-case define assignments (`:=`):
	if exp.Tok == token.DEFINE {
		c.tsw.WriteLiterally("let ")
	}

	// Write the core assignment
	c.writeAssignmentCore(lhs, rhs, exp.Tok)

	// Handle trailing inline comment AFTER writing the statement but BEFORE the newline
	if c.pkg != nil && c.pkg.Fset != nil && exp.End().IsValid() {
		if file := c.pkg.Fset.File(exp.End()); file != nil {
			endLine := file.Line(exp.End())
			for _, cg := range c.cmap[exp] {
				if cg.Pos().IsValid() && file.Line(cg.Pos()) == endLine && cg.Pos() > exp.End() {
					commentText := strings.TrimSpace(strings.TrimPrefix(cg.Text(), "//"))
					c.tsw.WriteLiterally(" // " + commentText)
					break
				}
			}
		}
	}

	// Write the newline to finish the statement line
	c.tsw.WriteLine("")
}

// WriteStmtExpr writes an expr statement.
func (c *GoToTSCompiler) WriteStmtExpr(exp *ast.ExprStmt) {
	c.WriteValueExpr(exp.X) // Expression statement evaluates a value

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
}

// WriteStmtFor writes a for statement.
func (c *GoToTSCompiler) WriteStmtFor(exp *ast.ForStmt) {
	c.tsw.WriteLiterally("for (")
	if exp.Init != nil {
		c.WriteForInit(exp.Init) // Use WriteForInit
	}
	c.tsw.WriteLiterally("; ")
	if exp.Cond != nil {
		c.WriteValueExpr(exp.Cond)
	}
	c.tsw.WriteLiterally("; ")
	if exp.Post != nil {
		c.WriteForPost(exp.Post) // Use WriteForPost
	}
	c.tsw.WriteLiterally(") ")
	c.WriteStmtBlock(exp.Body, false)
}

// WriteForInit writes the initialization part of a for loop header.
func (c *GoToTSCompiler) WriteForInit(stmt ast.Stmt) {
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
		c.writeAssignmentCore(s.Lhs, s.Rhs, s.Tok)
	case *ast.ExprStmt:
		// Handle expression statement in init (less common, but possible)
		c.WriteValueExpr(s.X)
	default:
		c.tsw.WriteCommentLine(fmt.Sprintf("unhandled for loop init statement: %T", stmt))
	}
}

// WriteForPost writes the post part of a for loop header.
func (c *GoToTSCompiler) WriteForPost(stmt ast.Stmt) {
	switch s := stmt.(type) {
	case *ast.IncDecStmt:
		// Handle increment/decrement (e.g., i++)
		c.WriteValueExpr(s.X) // The expression (e.g., i)
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
		c.writeAssignmentCore(s.Lhs, s.Rhs, s.Tok)
	case *ast.ExprStmt:
		// Handle expression statement in post (less common)
		c.WriteValueExpr(s.X)
	default:
		c.tsw.WriteCommentLine(fmt.Sprintf("unhandled for loop post statement: %T", stmt))
	}
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

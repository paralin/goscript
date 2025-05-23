package compiler

import (
	"fmt"
	"go/ast"
	"go/token"
	"strings"

	"github.com/pkg/errors"
)

// WriteStmt is a central dispatcher function that translates a Go statement
// (`ast.Stmt`) into its TypeScript equivalent by calling the appropriate
// specialized `WriteStmt*` or `write*` method.
// It handles a wide variety of Go statements:
//   - Block statements (`ast.BlockStmt`): `WriteStmtBlock`.
//   - Assignment statements (`ast.AssignStmt`): `WriteStmtAssign`.
//   - Return statements (`ast.ReturnStmt`): `WriteStmtReturn`.
//   - Defer statements (`ast.DeferStmt`): `WriteStmtDefer`.
//   - If statements (`ast.IfStmt`): `WriteStmtIf`.
//   - Expression statements (`ast.ExprStmt`): `WriteStmtExpr`.
//   - Declaration statements (`ast.DeclStmt`): `WriteStmtDecl`.
//   - For statements (`ast.ForStmt`): `WriteStmtFor`.
//   - Range statements (`ast.RangeStmt`): `WriteStmtRange`.
//   - Switch statements (`ast.SwitchStmt`): `WriteStmtSwitch`.
//   - Increment/decrement statements (`ast.IncDecStmt`): `WriteStmtIncDec`.
//   - Send statements (`ast.SendStmt`): `WriteStmtSend`.
//   - Go statements (`ast.GoStmt`): `WriteStmtGo`.
//   - Select statements (`ast.SelectStmt`): `WriteStmtSelect`.
//   - Branch statements (`ast.BranchStmt`): `WriteStmtBranch`.
//   - Type switch statements (`ast.TypeSwitchStmt`): `WriteStmtTypeSwitch`.
//   - Labeled statements (`ast.LabeledStmt`): `WriteStmtLabeled`.
//
// If an unknown statement type is encountered, it returns an error.
func (c *GoToTSCompiler) WriteStmt(a ast.Stmt) error {
	switch exp := a.(type) {
	case *ast.BlockStmt:
		if err := c.WriteStmtBlock(exp, false); err != nil {
			return fmt.Errorf("failed to write block statement: %w", err)
		}
	case *ast.AssignStmt:
		// special case: if the left side of the assign has () we need a ; to prepend the line
		// ;(myStruct!.value).MyInt = 5
		// otherwise typescript assumes it is a function call
		if len(exp.Lhs) == 1 {
			if lhsSel, ok := exp.Lhs[0].(*ast.SelectorExpr); ok {
				if _, ok := lhsSel.X.(*ast.ParenExpr); ok {
					c.tsw.WriteLiterally(";")
				}
			}
		}

		if err := c.WriteStmtAssign(exp); err != nil {
			return fmt.Errorf("failed to write assignment statement: %w", err)
		}
	case *ast.ReturnStmt:
		if err := c.WriteStmtReturn(exp); err != nil {
			return fmt.Errorf("failed to write return statement: %w", err)
		}
	case *ast.DeferStmt:
		if err := c.WriteStmtDefer(exp); err != nil {
			return fmt.Errorf("failed to write defer statement: %w", err)
		}
	case *ast.IfStmt:
		if err := c.WriteStmtIf(exp); err != nil {
			return fmt.Errorf("failed to write if statement: %w", err)
		}
	case *ast.ExprStmt:
		if err := c.WriteStmtExpr(exp); err != nil {
			return fmt.Errorf("failed to write expression statement: %w", err)
		}
	case *ast.DeclStmt:
		if err := c.WriteStmtDecl(exp); err != nil {
			return fmt.Errorf("failed to write declaration statement: %w", err)
		}
	case *ast.ForStmt:
		if err := c.WriteStmtFor(exp); err != nil {
			return fmt.Errorf("failed to write for statement: %w", err)
		}
	case *ast.RangeStmt:
		// Generate TS for for…range loops, log if something goes wrong
		if err := c.WriteStmtRange(exp); err != nil {
			return fmt.Errorf("failed to write range statement: %w", err)
		}
	case *ast.SwitchStmt:
		if err := c.WriteStmtSwitch(exp); err != nil {
			return fmt.Errorf("failed to write switch statement: %w", err)
		}
	case *ast.IncDecStmt:
		if err := c.WriteStmtIncDec(exp); err != nil {
			return fmt.Errorf("failed to write increment/decrement statement: %w", err)
		}
	case *ast.SendStmt:
		if err := c.WriteStmtSend(exp); err != nil {
			return fmt.Errorf("failed to write send statement: %w", err)
		}
	case *ast.GoStmt:
		if err := c.WriteStmtGo(exp); err != nil {
			return fmt.Errorf("failed to write go statement: %w", err)
		}
	case *ast.SelectStmt:
		// Handle select statement
		if err := c.WriteStmtSelect(exp); err != nil {
			return fmt.Errorf("failed to write select statement: %w", err)
		}
	case *ast.BranchStmt:
		if err := c.WriteStmtBranch(exp); err != nil {
			return fmt.Errorf("failed to write branch statement: %w", err)
		}
	case *ast.TypeSwitchStmt:
		if err := c.WriteStmtTypeSwitch(exp); err != nil {
			return fmt.Errorf("failed to write type switch statement: %w", err)
		}
	case *ast.LabeledStmt:
		if err := c.WriteStmtLabeled(exp); err != nil {
			return fmt.Errorf("failed to write labeled statement: %w", err)
		}
	default:
		return errors.Errorf("unknown statement: %#v\n", a)
	}
	return nil
}

// WriteStmtDecl handles declaration statements (`ast.DeclStmt`),
// such as short variable declarations or type declarations within a statement list.
// It processes `ValueSpec`s and `TypeSpec`s within the declaration.
func (c *GoToTSCompiler) WriteStmtDecl(stmt *ast.DeclStmt) error {
	// This typically contains a GenDecl
	if genDecl, ok := stmt.Decl.(*ast.GenDecl); ok {
		for _, spec := range genDecl.Specs {
			// Value specs within a declaration statement
			if valueSpec, ok := spec.(*ast.ValueSpec); ok {
				if err := c.WriteValueSpec(valueSpec); err != nil {
					return fmt.Errorf("failed to write value spec in declaration statement: %w", err)
				}
			} else if typeSpec, ok := spec.(*ast.TypeSpec); ok {
				if err := c.WriteTypeSpec(typeSpec); err != nil {
					return fmt.Errorf("failed to write type spec in declaration statement: %w", err)
				}
			} else {
				c.tsw.WriteCommentLinef("unhandled spec in DeclStmt: %T", spec)
			}
		}
	} else {
		return errors.Errorf("unhandled declaration type in DeclStmt: %T", stmt.Decl)
	}
	return nil
}

// WriteStmtIncDec handles increment and decrement statements (`ast.IncDecStmt`).
// It writes the expression followed by `++` or `--`.
func (c *GoToTSCompiler) WriteStmtIncDec(stmt *ast.IncDecStmt) error {
	if err := c.WriteValueExpr(stmt.X); err != nil { // The expression (e.g., i)
		return fmt.Errorf("failed to write increment/decrement expression: %w", err)
	}
	tokStr, ok := TokenToTs(stmt.Tok)
	if !ok {
		return errors.Errorf("unknown incdec token: %s", stmt.Tok.String())
	}
	c.tsw.WriteLiterally(tokStr) // The token (e.g., ++)
	c.tsw.WriteLine("")
	return nil
}

// WriteStmtBranch handles branch statements (`ast.BranchStmt`), such as `break` and `continue`.
func (c *GoToTSCompiler) WriteStmtBranch(stmt *ast.BranchStmt) error {
	switch stmt.Tok {
	case token.BREAK:
		c.tsw.WriteLine("break") // No semicolon needed
	case token.CONTINUE:
		c.tsw.WriteLine("continue") // No semicolon needed
	default:
		// This case should ideally not be reached if the Go parser is correct,
		// as ast.BranchStmt only covers break, continue, goto, fallthrough.
		// 'goto' and 'fallthrough' are handled elsewhere or not supported.
		c.tsw.WriteCommentLinef("unhandled branch statement token: %s", stmt.Tok.String())
	}
	return nil
}

// WriteStmtGo translates a Go statement (`ast.GoStmt`) into its TypeScript equivalent.
// It handles `go func(){...}()`, `go namedFunc(args)`, and `go x.Method(args)`.
func (c *GoToTSCompiler) WriteStmtGo(exp *ast.GoStmt) error {
	// Handle goroutine statement
	// Translate 'go func() { ... }()' to 'queueMicrotask(() => { ... compiled body ... })'
	callExpr := exp.Call

	switch fun := callExpr.Fun.(type) {
	case *ast.FuncLit:
		// For function literals, we need to check if the function literal itself is async
		// This happens during analysis in analysisVisitor.Visit for FuncLit nodes
		isAsync := c.analysis.IsFuncLitAsync(fun)
		if isAsync {
			c.tsw.WriteLiterally("queueMicrotask(async () => ")
		} else {
			c.tsw.WriteLiterally("queueMicrotask(() => ")
		}

		// Compile the function literal's body directly
		if err := c.WriteStmtBlock(fun.Body, true); err != nil {
			return fmt.Errorf("failed to write goroutine function literal body: %w", err)
		}

		c.tsw.WriteLine(")") // Close the queueMicrotask statement

	case *ast.Ident:
		// Handle named functions: go namedFunc(args)
		// Get the object for this function
		obj := c.pkg.TypesInfo.Uses[fun]
		if obj == nil {
			return errors.Errorf("could not find object for function: %s", fun.Name)
		}

		// Check if the function is async
		isAsync := c.analysis.IsAsyncFunc(obj)
		if isAsync {
			c.tsw.WriteLiterally("queueMicrotask(async () => {")
		} else {
			c.tsw.WriteLiterally("queueMicrotask(() => {")
		}

		c.tsw.Indent(1)
		c.tsw.WriteLine("")

		// Write the function call, using await if the function is async
		if isAsync {
			c.tsw.WriteLiterally("await ")
		}

		// Write the function name
		c.tsw.WriteLiterally(fun.Name)

		// Write the function arguments
		c.tsw.WriteLiterally("(")
		for i, arg := range callExpr.Args {
			if i != 0 {
				c.tsw.WriteLiterally(", ")
			}
			if err := c.WriteValueExpr(arg); err != nil {
				return fmt.Errorf("failed to write argument %d in goroutine function call: %w", i, err)
			}
		}
		c.tsw.WriteLiterally(")")
		c.tsw.WriteLine("")

		c.tsw.Indent(-1)
		c.tsw.WriteLine("})") // Close the queueMicrotask callback and the statement
	case *ast.SelectorExpr:
		// Handle selector expressions: go x.Method(args)
		// Get the object for the selected method
		obj := c.pkg.TypesInfo.Uses[fun.Sel]
		if obj == nil {
			return errors.Errorf("could not find object for selected method: %s", fun.Sel.Name)
		}

		// Check if the function is async
		isAsync := c.analysis.IsAsyncFunc(obj)
		if isAsync {
			c.tsw.WriteLiterally("queueMicrotask(async () => {")
		} else {
			c.tsw.WriteLiterally("queueMicrotask(() => {")
		}

		c.tsw.Indent(1)
		c.tsw.WriteLine("")

		// Write the function call, using await if the function is async
		if isAsync {
			c.tsw.WriteLiterally("await ")
		}

		// Write the selector expression (e.g., f.Bar)
		// Note: callExpr.Fun is the *ast.SelectorExpr itself
		// For method calls, we need to add null assertion since Go would panic on nil receiver
		if selectorExpr, ok := callExpr.Fun.(*ast.SelectorExpr); ok {
			if err := c.WriteValueExpr(selectorExpr.X); err != nil {
				return fmt.Errorf("failed to write selector base expression in goroutine: %w", err)
			}
			// Add null assertion for method calls - Go would panic if receiver is nil
			c.tsw.WriteLiterally("!.")
			c.WriteIdent(selectorExpr.Sel, true)
		} else {
			if err := c.WriteValueExpr(callExpr.Fun); err != nil {
				return fmt.Errorf("failed to write selector expression in goroutine: %w", err)
			}
		}

		// Write the function arguments
		c.tsw.WriteLiterally("(")
		for i, arg := range callExpr.Args {
			if i != 0 {
				c.tsw.WriteLiterally(", ")
			}
			if err := c.WriteValueExpr(arg); err != nil {
				return fmt.Errorf("failed to write argument %d in goroutine selector function call: %w", i, err)
			}
		}
		c.tsw.WriteLiterally(")")
		c.tsw.WriteLine("")

		c.tsw.Indent(-1)
		c.tsw.WriteLine("})") // Close the queueMicrotask callback and the statement
	case *ast.TypeAssertExpr:
		// Handle type assertion expressions: go x.(func())()
		// We assume this is always synchronous (no async function returned by type assertion)
		c.tsw.WriteLiterally("queueMicrotask(() => {")

		c.tsw.Indent(1)
		c.tsw.WriteLine("")

		// Write the type assertion call
		if err := c.WriteTypeAssertExpr(fun); err != nil {
			return fmt.Errorf("failed to write type assertion expression in goroutine: %w", err)
		}

		// Add non-null assertion since mustTypeAssert throws on failure rather than returning null
		c.tsw.WriteLiterally("!")

		// Write the function arguments
		c.tsw.WriteLiterally("(")
		for i, arg := range callExpr.Args {
			if i != 0 {
				c.tsw.WriteLiterally(", ")
			}
			if err := c.WriteValueExpr(arg); err != nil {
				return fmt.Errorf("failed to write argument %d in goroutine type assertion function call: %w", i, err)
			}
		}
		c.tsw.WriteLiterally(")")
		c.tsw.WriteLine("")

		c.tsw.Indent(-1)
		c.tsw.WriteLine("})") // Close the queueMicrotask callback and the statement
	default:
		return errors.Errorf("unhandled goroutine function type: %T", callExpr.Fun)
	}
	return nil
}

// WriteStmtExpr translates a Go expression statement (`ast.ExprStmt`) into
// its TypeScript equivalent. An expression statement in Go is an expression
// evaluated for its side effects (e.g., a function call).
//   - A special case is a simple channel receive used as a statement (`<-ch`). This
//     is translated to `await ch_ts.receive();` (the value is discarded).
//   - For other expression statements, the underlying expression `exp.X` is translated
//     using `WriteValueExpr`.
//   - It attempts to preserve inline comments associated with the expression statement
//     or its underlying expression `exp.X`.
//
// The translated statement is terminated with a newline.
func (c *GoToTSCompiler) WriteStmtExpr(exp *ast.ExprStmt) error {
	// Handle simple channel receive used as a statement (<-ch)
	if unaryExpr, ok := exp.X.(*ast.UnaryExpr); ok && unaryExpr.Op == token.ARROW {
		// Translate <-ch to await $.chanRecv(ch)
		c.tsw.WriteLiterally("await $.chanRecv(")
		if err := c.WriteValueExpr(unaryExpr.X); err != nil { // Channel expression
			return fmt.Errorf("failed to write channel expression in receive statement: %w", err)
		}
		c.tsw.WriteLiterally(")") // Use chanRecv() as the value is discarded
		c.tsw.WriteLine("")
		return nil
	}

	// Handle other expression statements
	if err := c.WriteValueExpr(exp.X); err != nil { // Expression statement evaluates a value
		return err
	}

	// Handle potential inline comment for ExprStmt
	inlineCommentWritten := false
	if c.pkg != nil && c.pkg.Fset != nil && exp.End().IsValid() {
		if file := c.pkg.Fset.File(exp.End()); file != nil {
			endLine := file.Line(exp.End())
			// Check comments associated *directly* with the ExprStmt node
			for _, cg := range c.analysis.Cmap[exp] {
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
				for _, cg := range c.analysis.Cmap[exp.X] {
					if cg.Pos().IsValid() && file.Line(cg.Pos()) == endLine && cg.Pos() > exp.End() {
						commentText := strings.TrimSpace(strings.TrimPrefix(cg.Text(), "//"))
						c.tsw.WriteLiterally(" // " + commentText)
						inlineCommentWritten = true //nolint:ineffassign
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

// WriteStmtSend translates a Go channel send statement (`ast.SendStmt`),
// which has the form `ch <- value`, into its asynchronous TypeScript equivalent.
// The translation is `await ch_ts.send(value_ts)`.
// Both the channel expression (`exp.Chan`) and the value expression (`exp.Value`)
// are translated using `WriteValueExpr`. The `await` keyword is used because
// channel send operations are asynchronous in the TypeScript model.
// The statement is terminated with a newline.
func (c *GoToTSCompiler) WriteStmtSend(exp *ast.SendStmt) error {
	// Translate ch <- value to await $.chanSend(ch, value)
	c.tsw.WriteLiterally("await $.chanSend(")
	if err := c.WriteValueExpr(exp.Chan); err != nil { // The channel expression
		return fmt.Errorf("failed to write channel expression in send statement: %w", err)
	}
	c.tsw.WriteLiterally(", ")
	if err := c.WriteValueExpr(exp.Value); err != nil { // The value expression
		return fmt.Errorf("failed to write value expression in send statement: %w", err)
	}
	c.tsw.WriteLiterally(")")
	c.tsw.WriteLine("") // Add newline after the statement
	return nil
}

// WriteStmtIf translates a Go `if` statement (`ast.IfStmt`) into its
// TypeScript equivalent.
//   - If the Go `if` has an initialization statement (`exp.Init`), it's wrapped
//     in a TypeScript block `{...}` before the `if` keyword, and the initializer
//     is translated within this block. This emulates Go's `if` statement scope.
//   - The condition (`exp.Cond`) is translated using `WriteValueExpr` and placed
//     within parentheses `(...)`.
//   - The `if` body (`exp.Body`) is translated as a block statement using
//     `WriteStmtBlock`. If `exp.Body` is nil, an empty block `{}` is written.
//   - The `else` branch (`exp.Else`) is handled:
//   - If `exp.Else` is a block statement (`ast.BlockStmt`), it's written as `else { ...body_ts... }`.
//   - If `exp.Else` is another `if` statement (`ast.IfStmt`), it's written as `else if (...) ...`,
//     recursively calling `WriteStmtIf`.
//
// The function aims to produce idiomatic TypeScript `if/else if/else` structures.
func (s *GoToTSCompiler) WriteStmtIf(exp *ast.IfStmt) error {
	if exp.Init != nil {
		s.tsw.WriteLiterally("{") // Write opening brace
		s.tsw.WriteLine("")       // Add newline immediately after opening brace
		s.tsw.Indent(1)           // Indent for the initializer

		if err := s.WriteStmt(exp.Init); err != nil { // Write the initializer
			return err
		}

		// This defer handles closing the synthetic block for the initializer
		defer func() {
			s.tsw.Indent(-1)
			s.tsw.WriteLiterally("}") // Write the closing brace at the now-correct indent level
			s.tsw.WriteLine("")       // Ensure a newline *after* this '}', critical for preventing '}}'
		}()
	}

	s.tsw.WriteLiterally("if (")
	if err := s.WriteValueExpr(exp.Cond); err != nil { // Condition is a value
		return err
	}
	s.tsw.WriteLiterally(") ")

	if exp.Body != nil {
		if err := s.WriteStmtBlock(exp.Body, exp.Else != nil); err != nil {
			return fmt.Errorf("failed to write if body block statement: %w", err)
		}
	} else {
		// Handle nil body case using WriteStmtBlock with an empty block
		if err := s.WriteStmtBlock(&ast.BlockStmt{}, exp.Else != nil); err != nil {
			return fmt.Errorf("failed to write empty block statement in if statement: %w", err)
		}
	}

	// handle else branch
	if exp.Else != nil {
		s.tsw.WriteLiterally(" else ")
		switch elseStmt := exp.Else.(type) {
		case *ast.BlockStmt:
			// Always pass false for suppressNewline here
			if err := s.WriteStmtBlock(elseStmt, false); err != nil {
				return fmt.Errorf("failed to write else block statement in if statement: %w", err)
			}
		case *ast.IfStmt:
			// Recursive call handles its own block formatting
			if err := s.WriteStmtIf(elseStmt); err != nil {
				return fmt.Errorf("failed to write else if statement in if statement: %w", err)
			}
		}
	}
	return nil
}

// WriteStmtReturn translates a Go `return` statement (`ast.ReturnStmt`) into
// its TypeScript equivalent.
//   - It writes the `return` keyword.
//   - If there are multiple return values (`len(exp.Results) > 1`), the translated
//     results are wrapped in a TypeScript array literal `[...]`.
//   - Each result expression in `exp.Results` is translated using `WriteValueExpr`.
//   - If there are no results, it simply writes `return`.
//
// The statement is terminated with a newline.
func (c *GoToTSCompiler) WriteStmtReturn(exp *ast.ReturnStmt) error {
	c.tsw.WriteLiterally("return ")

	// Check if it's a bare named return
	nodeInfo := c.analysis.NodeData[exp]
	if nodeInfo != nil && nodeInfo.IsBareReturn {
		var namedReturns []string
		if nodeInfo.EnclosingFuncDecl != nil {
			if obj := c.pkg.TypesInfo.ObjectOf(nodeInfo.EnclosingFuncDecl.Name); obj != nil {
				if funcInfo := c.analysis.FunctionData[obj]; funcInfo != nil {
					namedReturns = funcInfo.NamedReturns
				}
			}
		} else if nodeInfo.EnclosingFuncLit != nil {
			if funcInfo := c.analysis.FuncLitData[nodeInfo.EnclosingFuncLit]; funcInfo != nil {
				namedReturns = funcInfo.NamedReturns
			}
		}

		if len(namedReturns) > 0 {
			c.tsw.WriteLiterally("[")
			for i, name := range namedReturns {
				if i != 0 {
					c.tsw.WriteLiterally(", ")
				}
				c.tsw.WriteLiterally(name)
			}
			c.tsw.WriteLiterally("]")
		}
	} else {
		// Handle explicit return values
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
	}
	c.tsw.WriteLine("")
	return nil
}

// WriteStmtBlock translates a Go block statement (`ast.BlockStmt`), typically
// `{ ...stmts... }`, into its TypeScript equivalent, carefully preserving
// comments and blank lines to maintain code readability and structure.
//   - It writes an opening brace `{` and indents.
//   - If the analysis (`c.analysis.NeedsDefer`) indicates that the block (or a
//     function it's part of) contains `defer` statements, it injects a
//     `using __defer = new $.DisposableStack();` (or `AsyncDisposableStack` if
//     the context is async or contains async defers) at the beginning of the block.
//     This `__defer` stack is used by `WriteStmtDefer` to register cleanup actions.
//   - It iterates through the statements (`exp.List`) in the block:
//   - Leading comments associated with each statement are written first, with
//     blank lines preserved based on original source line numbers.
//   - The statement itself is then translated using `WriteStmt`.
//   - Inline comments (comments on the same line after a statement) are expected
//     to be handled by the individual statement writers (e.g., `WriteStmtExpr`).
//   - Trailing comments within the block (after the last statement but before the
//     closing brace) are written.
//   - Blank lines before the closing brace are preserved.
//   - Finally, it unindents and writes the closing brace `}`.
//
// If `suppressNewline` is true, the final newline after the closing brace is omitted
// (used, for example, when an `if` block is followed by an `else`).
func (c *GoToTSCompiler) WriteStmtBlock(exp *ast.BlockStmt, suppressNewline bool) error {
	if exp == nil {
		c.tsw.WriteLiterally("{}")
		if !suppressNewline {
			c.tsw.WriteLine("")
		}
		return nil
	}

	// Opening brace
	c.tsw.WriteLine("{")
	c.tsw.Indent(1)

	// Determine if there is any defer to an async function literal in this block
	hasAsyncDefer := false
	for _, stmt := range exp.List {
		if deferStmt, ok := stmt.(*ast.DeferStmt); ok {
			if funcLit, ok := deferStmt.Call.Fun.(*ast.FuncLit); ok {
				if c.analysis.IsFuncLitAsync(funcLit) {
					hasAsyncDefer = true
					break
				}
			}
		}
	}

	// Add using statement if needed, considering async function or async defer
	if c.analysis.NeedsDefer(exp) {
		if c.analysis.IsInAsyncFunction(exp) || hasAsyncDefer {
			c.tsw.WriteLine("await using __defer = new $.AsyncDisposableStack();")
		} else {
			c.tsw.WriteLine("using __defer = new $.DisposableStack();")
		}
	}

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
		comments := c.analysis.Cmap.Filter(stmt).Comments()
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
		if err := c.WriteStmt(stmt); err != nil {
			return fmt.Errorf("failed to write statement in block: %w", err)
		}

		if file != nil && stmt.End().IsValid() {
			// Update lastLine based on the statement's end, *including* potential inline comment handled by WriteStmt*
			lastLine = file.Line(stmt.End())
		}
	}

	// 2. Trailing comments on the block (after last stmt, before closing brace)
	trailing := c.analysis.Cmap.Filter(exp).Comments()
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
	return nil
}

// WriteStmtSwitch translates a Go `switch` statement into its TypeScript equivalent.
//   - If the Go switch has an initialization statement (`exp.Init`), it's wrapped
//     in a TypeScript block `{...}` before the `switch` keyword, and the
//     initializer is translated within this block. This emulates Go's switch scope.
//   - The switch condition (`exp.Tag`):
//   - If `exp.Tag` is present, it's translated using `WriteValueExpr`.
//   - If `exp.Tag` is nil (a "tagless" switch, like `switch { case cond1: ... }`),
//     it's translated as `switch (true)` in TypeScript.
//   - Each case clause (`ast.CaseClause`) in `exp.Body.List` is translated using
//     `WriteCaseClause`.
//
// The overall structure is `[optional_init_block] switch (condition_ts) { ...cases_ts... }`.
func (c *GoToTSCompiler) WriteStmtSwitch(exp *ast.SwitchStmt) error {
	// Handle optional initialization statement
	if exp.Init != nil {
		c.tsw.WriteLiterally("{")
		c.tsw.Indent(1)
		if err := c.WriteStmt(exp.Init); err != nil {
			return fmt.Errorf("failed to write switch initialization statement: %w", err)
		}
		defer func() {
			c.tsw.Indent(-1)
			c.tsw.WriteLiterally("}")
		}()
	}

	c.tsw.WriteLiterally("switch (")
	// Handle the switch tag (the expression being switched on)
	if exp.Tag != nil {
		if err := c.WriteValueExpr(exp.Tag); err != nil {
			return fmt.Errorf("failed to write switch tag expression: %w", err)
		}
	} else {
		c.tsw.WriteLiterally("true") // Write 'true' for switch without expression
	}
	c.tsw.WriteLiterally(") {")
	c.tsw.WriteLine("")
	c.tsw.Indent(1)

	// Handle case clauses
	for _, stmt := range exp.Body.List {
		if caseClause, ok := stmt.(*ast.CaseClause); ok {
			if err := c.WriteCaseClause(caseClause); err != nil {
				return fmt.Errorf("failed to write case clause in switch statement: %w", err)
			}
		} else {
			c.tsw.WriteCommentLinef("unhandled statement in switch body: %T", stmt)
		}
	}

	c.tsw.Indent(-1)
	c.tsw.WriteLine("}")
	return nil
}

// WriteStmtDefer translates a Go `defer` statement into TypeScript code that
// utilizes a disposable stack (`$.DisposableStack` or `$.AsyncDisposableStack`).
// The Go `defer` semantics (LIFO execution at function exit) are emulated by
// registering a cleanup function with this stack.
//   - `defer funcCall()` becomes `__defer.defer(() => { funcCall_ts(); });`.
//   - `defer func(){ ...body... }()` (an immediately-invoked function literal, IIFL)
//     has its body inlined: `__defer.defer(() => { ...body_ts... });`.
//   - If the deferred call is to an async function or an async function literal
//     (determined by `c.analysis.IsInAsyncFunctionMap`), the registered callback
//     is marked `async`: `__defer.defer(async () => { ... });`.
//
// The `__defer` variable is assumed to be declared at the beginning of the
// function scope (see `WriteStmtBlock` or `WriteFuncDeclAsMethod`) using
// `await using __defer = new $.AsyncDisposableStack();` for async functions/contexts
// or `using __defer = new $.DisposableStack();` for sync contexts.
func (c *GoToTSCompiler) WriteStmtDefer(exp *ast.DeferStmt) error {
	// Determine if the deferred call is to an async function literal using analysis
	isAsyncDeferred := false
	if funcLit, ok := exp.Call.Fun.(*ast.FuncLit); ok {
		isAsyncDeferred = c.analysis.IsFuncLitAsync(funcLit)
	}

	// Set async prefix based on pre-computed async status
	asyncPrefix := ""
	if isAsyncDeferred {
		asyncPrefix = "async "
	}

	// Set stack variable based on whether we are in an async function
	stackVar := "__defer"
	c.tsw.WriteLiterallyf("%s.defer(%s() => {", stackVar, asyncPrefix)
	c.tsw.Indent(1)
	c.tsw.WriteLine("")

	// Write the deferred call or inline the body when it's an immediately-invoked
	// function literal (defer func(){ ... }()).
	if funcLit, ok := exp.Call.Fun.(*ast.FuncLit); ok && len(exp.Call.Args) == 0 {
		// Inline the function literal's body to avoid nested arrow invocation.
		for _, stmt := range funcLit.Body.List {
			if err := c.WriteStmt(stmt); err != nil {
				return fmt.Errorf("failed to write statement in deferred function body: %w", err)
			}
		}
	} else {
		// Write the call expression as-is.
		if err := c.WriteValueExpr(exp.Call); err != nil {
			return fmt.Errorf("failed to write deferred call: %w", err)
		}
		c.tsw.WriteLine("")
	}

	c.tsw.Indent(-1)
	c.tsw.WriteLine("});")

	return nil
}

// WriteStmtLabeled handles labeled statements (ast.LabeledStmt), such as "label: statement".
// In TypeScript, this translates to "label: statement" directly.
func (c *GoToTSCompiler) WriteStmtLabeled(stmt *ast.LabeledStmt) error {
	// Write the label name followed by a colon
	c.tsw.WriteLiterally(stmt.Label.Name)
	c.tsw.WriteLiterally(": ")

	// Write the labeled statement
	if err := c.WriteStmt(stmt.Stmt); err != nil {
		return fmt.Errorf("failed to write labeled statement: %w", err)
	}

	return nil
}

package compiler

import (
	"fmt"
	"go/ast"
)

// WriteDecls iterates through a slice of Go top-level declarations (`ast.Decl`)
// and translates each one into its TypeScript equivalent.
// It distinguishes between:
// - Function declarations (`ast.FuncDecl`):
//   - If it's a regular function (no receiver), it delegates to `WriteFuncDeclAsFunction`.
//   - Methods (with receivers) are handled within `WriteTypeSpec` when their
//     associated struct/type is defined, so they are skipped here.
//   - General declarations (`ast.GenDecl`), which can contain imports, constants,
//     variables, or type definitions: It iterates through `d.Specs` and calls
//     `WriteSpec` for each specification.
//
// A newline is added after each processed declaration or spec group for readability.
// Unknown declaration types result in a printed diagnostic message.
func (c *GoToTSCompiler) WriteDecls(decls []ast.Decl) error {
	for _, decl := range decls {
		switch d := decl.(type) {
		case *ast.FuncDecl:
			// Only handle top-level functions here. Methods are handled within WriteTypeSpec.
			if d.Recv == nil {
				if err := c.WriteFuncDeclAsFunction(d); err != nil {
					return err
				}
				c.tsw.WriteLine("") // Add space after function
			}
		case *ast.GenDecl:
			for _, spec := range d.Specs {
				if err := c.WriteSpec(spec); err != nil {
					return err
				}
				c.tsw.WriteLine("") // Add space after spec
			}
		default:
			fmt.Printf("unknown decl: %#v\n", decl)
		}
	}
	return nil
}

// WriteFuncDeclAsFunction translates a Go function declaration (`ast.FuncDecl`)
// that does not have a receiver (i.e., it's a regular function, not a method)
// into a TypeScript function.
//   - Go documentation comments (`decl.Doc`) are preserved.
//   - If the Go function is exported (name starts with an uppercase letter) or is
//     the `main` function, the `export` keyword is added to the TypeScript output.
//   - If the `Analysis` data indicates the function is asynchronous, the `async`
//     keyword is prepended.
//   - The function signature (parameters and return type) is translated using `WriteFuncType`,
//     passing the `isAsync` status.
//   - The function body (`decl.Body`) is translated using `WriteStmt`.
//
// This function specifically handles top-level functions; methods are generated
// by `WriteFuncDeclAsMethod` within the context of their type definition.
func (c *GoToTSCompiler) WriteFuncDeclAsFunction(decl *ast.FuncDecl) error {
	if decl.Recv != nil {
		// This function should not be called for methods.
		// Methods are handled by WriteFuncDeclAsMethod within WriteTypeSpec.
		return nil
	}

	if decl.Doc != nil {
		c.WriteDoc(decl.Doc)
	}

	// Exported functions start with uppercase in Go, or special-case "main" entry point
	isExported := decl.Name.IsExported() || decl.Name.Name == "main"
	if isExported {
		c.tsw.WriteLiterally("export ")
	}

	// Check if this function is async using the analysis data
	var isAsync bool
	if obj := c.pkg.TypesInfo.Defs[decl.Name]; obj != nil {
		isAsync = c.analysis.IsAsyncFunc(obj)
	}
	if isAsync {
		c.tsw.WriteLiterally("async ")
	}

	c.tsw.WriteLiterally("function ")
	if err := c.WriteValueExpr(decl.Name); err != nil { // Function name is a value identifier
		return fmt.Errorf("failed to write function name: %w", err)
	}

	// WriteFuncType needs to be aware if the function is async
	c.WriteFuncType(decl.Type, isAsync) // Write signature (params, return type)
	c.tsw.WriteLiterally(" ")

	if err := c.WriteStmt(decl.Body); err != nil {
		return fmt.Errorf("failed to write function body: %w", err)
	}

	return nil
}

// WriteFuncDeclAsMethod translates a Go function declaration (`ast.FuncDecl`)
// that has a receiver (i.e., it's a method) into a TypeScript class method.
//   - It preserves Go documentation comments (`decl.Doc`).
//   - The method is declared as `public`.
//   - If the `Analysis` data indicates the method is asynchronous, the `async`
//     keyword is prepended.
//   - The method name retains its original Go casing.
//   - Parameters and return types are translated using `WriteFieldList` and
//     `WriteTypeExpr`, respectively. Async methods have their return types
//     wrapped in `Promise<>`.
//   - The method body is translated. If the Go receiver has a name (e.g., `(s *MyStruct)`),
//     a `const receiverName = this;` binding is generated at the start of the
//     TypeScript method body to make `this` available via the Go receiver's name.
//     If the method body requires deferred cleanup (`NeedsDefer`), the appropriate
//     `using __defer = new $.DisposableStack()` (or `AsyncDisposableStack`)
//     is also generated.
//
// This function assumes it is called only for `FuncDecl` nodes that are methods.
func (c *GoToTSCompiler) WriteFuncDeclAsMethod(decl *ast.FuncDecl) error {
	if decl.Doc != nil {
		c.WriteDoc(decl.Doc)
	}

	// Determine if method is async
	var isAsync bool
	if obj := c.pkg.TypesInfo.Defs[decl.Name]; obj != nil {
		isAsync = c.analysis.IsAsyncFunc(obj)
	}

	// Methods are typically public in the TS output
	c.tsw.WriteLiterally("public ")

	// Add async modifier if needed
	if isAsync {
		c.tsw.WriteLiterally("async ")
	}

	// Keep original Go casing for method names
	if err := c.WriteValueExpr(decl.Name); err != nil { // Method name is a value identifier
		return err
	}

	// Write signature (parameters and return type)
	// We adapt the logic from WriteFuncType here, but without the 'function' keyword
	funcType := decl.Type
	c.tsw.WriteLiterally("(")
	if funcType.Params != nil {
		c.WriteFieldList(funcType.Params, true) // true = arguments
	}
	c.tsw.WriteLiterally(")")

	// Handle return type
	if funcType.Results != nil && len(funcType.Results.List) > 0 {
		c.tsw.WriteLiterally(": ")
		if isAsync {
			c.tsw.WriteLiterally("Promise<")
		}
		if len(funcType.Results.List) == 1 {
			// Single return value
			resultType := funcType.Results.List[0].Type
			c.WriteTypeExpr(resultType)
		} else {
			// Multiple return values -> tuple type
			c.tsw.WriteLiterally("[")
			for i, field := range funcType.Results.List {
				if i > 0 {
					c.tsw.WriteLiterally(", ")
				}
				c.WriteTypeExpr(field.Type)
			}
			c.tsw.WriteLiterally("]")
		}
		if isAsync {
			c.tsw.WriteLiterally(">")
		}
	} else {
		// No return value -> void
		if isAsync {
			c.tsw.WriteLiterally(": Promise<void>")
		} else {
			c.tsw.WriteLiterally(": void")
		}
	}

	c.tsw.WriteLiterally(" ")

	// Bind receiver name to this
	if recvField := decl.Recv.List[0]; len(recvField.Names) > 0 {
		recvName := recvField.Names[0].Name
		if recvName != "_" {
			c.tsw.WriteLine("{")
			c.tsw.Indent(1)
			c.tsw.WriteLinef("const %s = this", recvName)

			// Add using statement if needed
			if c.analysis.NeedsDefer(decl.Body) {
				if c.analysis.IsInAsyncFunction(decl) {
					c.tsw.WriteLine("await using __defer = new $.AsyncDisposableStack();")
				} else {
					c.tsw.WriteLine("using cleanup = new $.DisposableStack();")
				}
			}

			// write method body without outer braces
			for _, stmt := range decl.Body.List {
				if err := c.WriteStmt(stmt); err != nil {
					return fmt.Errorf("failed to write statement in function body: %w", err)
				}
			}
			c.tsw.Indent(-1)
			c.tsw.WriteLine("}")

			return nil
		}
	}
	// no named receiver, write whole body
	if err := c.WriteStmt(decl.Body); err != nil {
		return fmt.Errorf("failed to write function body: %w", err)
	}

	return nil
}

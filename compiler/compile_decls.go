package compiler

import (
	"fmt"
	"go/ast"
)

// WriteDecls writes a slice of declarations.
func (c *GoToTSCompiler) WriteDecls(decls []ast.Decl) {
	for _, decl := range decls {
		switch d := decl.(type) {
		case *ast.FuncDecl:
			// Only handle top-level functions here. Methods are handled within WriteTypeSpec.
			if d.Recv == nil {
				c.WriteFuncDeclAsFunction(d)
				c.tsw.WriteLine("") // Add space after function
			}
		case *ast.GenDecl:
			for _, spec := range d.Specs {
				c.WriteSpec(spec)
				c.tsw.WriteLine("") // Add space after spec
			}
		default:
			fmt.Printf("unknown decl: %#v\n", decl)
		}
	}
}

// WriteFuncDeclAsFunction writes a function declaration
// NOTE: This function now ONLY handles regular functions, not methods (functions with receivers).
// Method generation is handled within the type definition writer (e.g., for structs).
func (c *GoToTSCompiler) WriteFuncDeclAsFunction(decl *ast.FuncDecl) {
	if decl.Recv != nil {
		// This function should not be called for methods.
		// Methods are handled by WriteFuncDeclAsMethod within WriteTypeSpec.
		return
	}

	if decl.Doc != nil {
		c.WriteDoc(decl.Doc)
	}

	// Exported functions start with uppercase in Go, or special-case "main" entry point
	isExported := decl.Name.IsExported() || decl.Name.Name == "main"
	if isExported {
		c.tsw.WriteLiterally("export ")
	}

	c.tsw.WriteLiterally("function ")
	c.WriteValueExpr(decl.Name) // Function name is a value identifier
	c.WriteFuncType(decl.Type)  // Write signature (params, return type)
	c.tsw.WriteLiterally(" ")
	c.WriteStmt(decl.Body)
}

package compiler

import (
	"fmt"
	"go/ast"
)

// WriteSpec writes a specification to the output.
func (c *GoToTSCompiler) WriteSpec(a ast.Spec) {
	switch d := a.(type) {
	case *ast.ImportSpec:
		c.WriteImportSpec(d)
	case *ast.ValueSpec:
		c.WriteValueSpec(d)
	case *ast.TypeSpec:
		c.WriteTypeSpec(d)
	default:
		fmt.Printf("unknown spec: %#v\n", a)
	}
}

// WriteTypeSpec writes the type specification to the output.
func (c *GoToTSCompiler) WriteTypeSpec(a *ast.TypeSpec) {
	if a.Doc != nil {
		c.WriteDoc(a.Doc)
	}
	if a.Comment != nil {
		c.WriteDoc(a.Comment)
	}

	switch t := a.Type.(type) {
	case *ast.StructType:
		// write the class definition
		c.tsw.WriteLiterally("class ")
		c.WriteValueExpr(a.Name) // Class name is a value identifier
		c.tsw.WriteLine(" {")
		c.tsw.Indent(1)

		// className is the name of the class type
		className := a.Name.Name
		for _, field := range t.Fields.List {
			c.WriteField(field, false)
		}

		// Find and write methods for this struct
		for _, fileSyntax := range c.pkg.Syntax {
			for _, decl := range fileSyntax.Decls {
				funcDecl, isFunc := decl.(*ast.FuncDecl)
				if !isFunc || funcDecl.Recv == nil || len(funcDecl.Recv.List) == 0 {
					continue // Skip non-functions or functions without receivers
				}

				// Check if the receiver type matches the struct name
				recvField := funcDecl.Recv.List[0]
				recvType := recvField.Type
				// Handle pointer receivers (*MyStruct) and value receivers (MyStruct)
				if starExpr, ok := recvType.(*ast.StarExpr); ok {
					recvType = starExpr.X // Get the type being pointed to
				}

				// Check if the receiver identifier name matches the current struct name
				if ident, ok := recvType.(*ast.Ident); ok && ident.Name == className {
					// Found a method for this struct
					c.tsw.WriteLine("") // Add space between methods
					c.WriteFuncDeclAsMethod(funcDecl)
				}
			}
		}

		// constructor and clone using Object.assign for compactness
		c.tsw.WriteLine("")
		c.tsw.WriteLinef("constructor(init?: Partial<%s>) { if (init) Object.assign(this, init as any); }", className)
		c.tsw.WriteLinef("public clone(): %s { return Object.assign(Object.create(%s.prototype) as %s, this); }", className, className, className)
		c.tsw.Indent(-1)
		c.tsw.WriteLine("}")
	case *ast.InterfaceType:
		c.tsw.WriteLiterally("interface ")
		c.WriteValueExpr(a.Name) // Interface name is a value identifier
		c.tsw.WriteLine(" ")
		c.WriteTypeExpr(a.Type) // The interface definition itself is a type
	default:
		// type alias
		c.tsw.WriteLiterally("type ")
		c.WriteValueExpr(a.Name) // Type alias name is a value identifier
		c.tsw.WriteLiterally(" = ")
		c.WriteTypeExpr(a.Type) // The aliased type
		c.tsw.WriteLine(";")
	}
}

// WriteFuncDeclAsMethod writes a TypeScript method declaration from a Go FuncDecl.
// Assumes it's called only for functions with receivers.
func (c *GoToTSCompiler) WriteFuncDeclAsMethod(decl *ast.FuncDecl) {
	if decl.Doc != nil {
		c.WriteDoc(decl.Doc)
	}

	// Methods are typically public in the TS output
	c.tsw.WriteLiterally("public ")
	// Keep original Go casing for method names
	c.WriteValueExpr(decl.Name) // Method name is a value identifier

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
	} else {
		// No return value -> void
		c.tsw.WriteLiterally(": void")
	}

	c.tsw.WriteLiterally(" ")
	// Bind receiver name to this
	if recvField := decl.Recv.List[0]; len(recvField.Names) > 0 {
		recvName := recvField.Names[0].Name
		if recvName != "_" {
			c.tsw.WriteLine("{")
			c.tsw.Indent(1)
			c.tsw.WriteLinef("const %s = this", recvName)
			// write method body without outer braces
			for _, stmt := range decl.Body.List {
				c.WriteStmt(stmt)
			}
			c.tsw.Indent(-1)
			c.tsw.WriteLine("}")
			return
		}
	}
	// no named receiver, write whole body
	c.WriteStmt(decl.Body)
}

// WriteValueSpec writes the value specification to the output.
func (c *GoToTSCompiler) WriteValueSpec(a *ast.ValueSpec) {
	if a.Doc != nil {
		c.WriteDoc(a.Doc)
	}
	if a.Comment != nil {
		c.WriteDoc(a.Comment)
	}
	c.tsw.WriteLiterally("let ")
	if len(a.Names) == 1 {
		name := a.Names[0]
		c.tsw.WriteLiterally(name.Name)
		if a.Type != nil {
			c.tsw.WriteLiterally(": ")
			c.WriteTypeExpr(a.Type) // Variable type annotation
		}
		if len(a.Values) > 0 {
			c.tsw.WriteLiterally(" = ")
			for i, val := range a.Values {
				if i != 0 {
					c.tsw.WriteLiterally(", ")
				}
				c.WriteValueExpr(val) // Initializer is a value
			}
		}
	} else {
		c.tsw.WriteLiterally("{")
		for i, name := range a.Names {
			if i != 0 {
				c.tsw.WriteLiterally(", ")
			}
			c.tsw.WriteLiterally(name.Name)
		}
		c.tsw.WriteLiterally("}")
		for i, val := range a.Values {
			if i == 0 {
				c.tsw.WriteLiterally(" = ")
			} else {
				c.tsw.WriteLiterally(", ")
			}
			c.WriteValueExpr(val) // Initializers are values
		}
	}
	c.tsw.WriteLine(";")
}

// WriteImportSpec writes an import specification to the output.
func (c *GoToTSCompiler) WriteImportSpec(a *ast.ImportSpec) {
	if a.Doc != nil {
		c.WriteDoc(a.Doc)
	}
	if a.Comment != nil {
		c.WriteDoc(a.Comment)
	}

	goPath := a.Path.Value[1 : len(a.Path.Value)-1]
	impName := packageNameFromGoPath(goPath)
	if a.Name != nil && a.Name.Name != "" {
		impName = a.Name.Name
	}

	importPath := translateGoPathToTypescriptPath(goPath)
	c.imports[impName] = &fileImport{
		importPath: importPath,
		importVars: make(map[string]struct{}),
	}

	c.tsw.WriteImport(impName, importPath)
}

package compiler

import (
	"fmt"
	"go/ast"
	"strings"
)

// WriteSpec writes a specification to the output.
func (c *GoToTSCompiler) WriteSpec(a ast.Spec) error {
	switch d := a.(type) {
	case *ast.ImportSpec:
		c.WriteImportSpec(d)
	case *ast.ValueSpec:
		if err := c.WriteValueSpec(d); err != nil {
			return err
		}
	case *ast.TypeSpec:
		if err := c.WriteTypeSpec(d); err != nil {
			return err
		}
	default:
		return fmt.Errorf("unknown spec type: %T", a)
	}
	return nil
}

// collectMethodNames returns a comma-separated string of method names for a struct
func (c *GoToTSCompiler) collectMethodNames(structName string) string {
	var methodNames []string

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

			// Check if the receiver identifier name matches the struct name
			if ident, ok := recvType.(*ast.Ident); ok && ident.Name == structName {
				// Found a method for this struct
				methodNames = append(methodNames, fmt.Sprintf("'%s'", funcDecl.Name.Name))
			}
		}
	}

	return strings.Join(methodNames, ", ")
}

// collectInterfaceMethods returns a comma-separated string of method names for an interface
func (c *GoToTSCompiler) collectInterfaceMethods(interfaceType *ast.InterfaceType) string {
	var methodNames []string

	if interfaceType.Methods != nil {
		for _, method := range interfaceType.Methods.List {
			if len(method.Names) > 0 {
				// Named method
				methodNames = append(methodNames, fmt.Sprintf("'%s'", method.Names[0].Name))
			} else {
				// Embedded interface - should collect its methods too
				// This is a simplification, as we'd need to resolve the embedded interface
				c.tsw.WriteCommentLine("// Note: Methods from embedded interfaces are not automatically included")
			}
		}
	}

	return strings.Join(methodNames, ", ")
}

// WriteTypeSpec writes the type specification to the output.
func (c *GoToTSCompiler) WriteTypeSpec(a *ast.TypeSpec) error {
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
		if err := c.WriteValueExpr(a.Name); err != nil { // Class name is a value identifier
			return err
		}
		c.tsw.WriteLine(" {")
		c.tsw.Indent(1)

		// className is the name of the class type
		className := a.Name.Name
		for _, field := range t.Fields.List {
			c.WriteField(field, false)
		}

		// Methods for this struct are discovered by scanning all package declarations.
		// Future improvement: use pkg.TypesInfo.MethodSet (go/types) for direct method lookup.
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
					if err := c.WriteFuncDeclAsMethod(funcDecl); err != nil {
						return err
					}
				}
			}
		}

		// constructor and clone using Object.assign for compactness
		c.tsw.WriteLine("")
		c.tsw.WriteLinef("constructor(init?: Partial<%s>) { if (init) Object.assign(this, init as any); }", className)
		c.tsw.WriteLinef("public clone(): %s { return Object.assign(Object.create(%s.prototype) as %s, this); }", className, className, className)

		// Add code to register the type with the runtime system
		c.tsw.WriteLine("")
		c.tsw.WriteLinef("// Register this type with the runtime type system")
		c.tsw.WriteLinef("static __typeInfo = goscript.registerType(")
		c.tsw.WriteLinef("  '%s',", className)
		c.tsw.WriteLinef("  goscript.TypeKind.Struct,")
		c.tsw.WriteLinef("  new %s(),", className)
		c.tsw.WriteLinef("  new Set([%s]),", c.collectMethodNames(className))
		c.tsw.WriteLinef("  %s", className)
		c.tsw.WriteLinef(");")

		c.tsw.Indent(-1)
		c.tsw.WriteLine("}")
	case *ast.InterfaceType:
		c.tsw.WriteLiterally("interface ")
		if err := c.WriteValueExpr(a.Name); err != nil { // Interface name is a value identifier
			return err
		}
		c.tsw.WriteLine(" ")
		c.WriteTypeExpr(a.Type) // The interface definition itself is a type

		// Add code to register the interface with the runtime system
		interfaceName := a.Name.Name
		c.tsw.WriteLine("")
		c.tsw.WriteLinef("// Register this interface with the runtime type system")
		c.tsw.WriteLinef("const %s__typeInfo = goscript.registerType(", interfaceName)
		c.tsw.WriteLinef("  '%s',", interfaceName)
		c.tsw.WriteLinef("  goscript.TypeKind.Interface,")
		c.tsw.WriteLinef("  null,") // Zero value for interface is null
		c.tsw.WriteLinef("  new Set([%s]),", c.collectInterfaceMethods(t))
		c.tsw.WriteLinef("  undefined")
		c.tsw.WriteLinef(");")
	default:
		// type alias
		c.tsw.WriteLiterally("type ")
		if err := c.WriteValueExpr(a.Name); err != nil { // Type alias name is a value identifier
			return err
		}
		c.tsw.WriteLiterally(" = ")
		c.WriteTypeExpr(a.Type) // The aliased type
		c.tsw.WriteLine(";")
	}
	return nil
}

// WriteFuncDeclAsMethod writes a TypeScript method declaration from a Go FuncDecl.
// Assumes it's called only for functions with receivers.
func (c *GoToTSCompiler) WriteFuncDeclAsMethod(decl *ast.FuncDecl) error {
	if decl.Doc != nil {
		c.WriteDoc(decl.Doc)
	}

	// Methods are typically public in the TS output
	c.tsw.WriteLiterally("public ")
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

// WriteValueSpec writes the value specification to the output.
func (c *GoToTSCompiler) WriteValueSpec(a *ast.ValueSpec) error {
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

			// Check if it's an array type declaration without an initial value
			if _, isArrayType := a.Type.(*ast.ArrayType); isArrayType && len(a.Values) == 0 {
				c.tsw.WriteLiterally(" = []")
			}
		}
		if len(a.Values) > 0 {
			c.tsw.WriteLiterally(" = ")
			for i, val := range a.Values {
				if i != 0 {
					c.tsw.WriteLiterally(", ")
				}
				if err := c.WriteValueExpr(val); err != nil { // Initializer is a value
					return err
				}
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
			if err := c.WriteValueExpr(val); err != nil { // Initializers are values
				return err
			}
		}
	}
	c.tsw.WriteLine(";")
	return nil
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

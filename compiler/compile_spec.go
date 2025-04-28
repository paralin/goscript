package compiler

import (
	"fmt"
	"go/ast"
	"go/types"
	gtypes "go/types"
	"sort"
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

// getTypeExprName returns a string representation of a type expression.
func (c *GoToTSCompiler) getTypeExprName(expr ast.Expr) string {
	switch t := expr.(type) {
	case *ast.Ident:
		return t.Name
	case *ast.SelectorExpr:
		return fmt.Sprintf("%s.%s", c.getTypeExprName(t.X), t.Sel.Name)
	case *ast.StarExpr:
		return c.getTypeExprName(t.X) // Unwrap pointer type
	default:
		return "embedded" // Fallback for complex type expressions
	}
}

// collectInterfaceMethods returns a comma-separated string of method names for an interface
func (c *GoToTSCompiler) collectInterfaceMethods(interfaceType *ast.InterfaceType) string {
	// Use a map to ensure uniqueness of method names
	methodNamesMap := make(map[string]struct{})

	if interfaceType.Methods != nil {
		for _, method := range interfaceType.Methods.List {
			if len(method.Names) > 0 {
				// Named method
				methodNamesMap[method.Names[0].Name] = struct{}{}
			} else {
				// Embedded interface - resolve it and collect its methods
				embeddedType := method.Type

				// Resolve the embedded interface using type information
				if tv, ok := c.pkg.TypesInfo.Types[embeddedType]; ok && tv.Type != nil {
					// Get the underlying interface type
					var ifaceType *types.Interface
					if named, ok := tv.Type.(*types.Named); ok {
						if underlying, ok := named.Underlying().(*types.Interface); ok {
							ifaceType = underlying
						}
					} else if underlying, ok := tv.Type.(*types.Interface); ok {
						ifaceType = underlying
					}

					// Collect methods from the interface
					if ifaceType != nil {
						for i := 0; i < ifaceType.NumMethods(); i++ {
							methodNamesMap[ifaceType.Method(i).Name()] = struct{}{}
						}
					}
				} else {
					// Couldn't resolve the embedded interface
					c.tsw.WriteCommentLine("// Note: Some embedded interface methods may not be fully resolved")
				}
			}
		}
	}

	// Convert the map to a slice for a deterministic output order
	var methodNames []string
	for name := range methodNamesMap {
		methodNames = append(methodNames, fmt.Sprintf("'%s'", name))
	}

	// Sort for deterministic output
	sort.Strings(methodNames)

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
		// Detect embedded struct (anonymous field) to support Go struct embedding.
		var embeddedExpr ast.Expr
		for _, f := range t.Fields.List {
			if len(f.Names) == 0 { // anonymous field ⇒ embedded type
				embeddedExpr = f.Type
				break // only the first embedded struct is supported for now
			}
		}
		// Write the class header, adding "extends Embedded" when an embedded struct is present.
		c.tsw.WriteLiterally("class ")
		if err := c.WriteValueExpr(a.Name); err != nil { // Class name is a value identifier
			return err
		}
		c.tsw.WriteLiterally(" ")

		if embeddedExpr != nil {
			// For pointer embedding (*T) unwrap the star so we extend T, not (T|null)
			if star, ok := embeddedExpr.(*ast.StarExpr); ok {
				embeddedExpr = star.X
			}
			c.tsw.WriteLiterally("extends ")
			c.WriteTypeExpr(embeddedExpr) // Embedded type name
			c.tsw.WriteLiterally(" ")
		}

		c.tsw.WriteLine("{")
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
		if embeddedExpr != nil {
			// Determine the embedded type's identifier (strip any package prefix)
			embeddedTypeNameFull := c.getTypeExprName(embeddedExpr)
			propName := embeddedTypeNameFull
			if idx := strings.LastIndex(propName, "."); idx != -1 {
				propName = propName[idx+1:] // keep only the last segment for the property key
			}

			// The init parameter allows either flattened fields or a nested {Embedded: {...}} object
			c.tsw.WriteLinef(
				"constructor(init?: Partial<%s> & { %s?: Partial<%s> }) {",
				className, propName, propName,
			)
			c.tsw.Indent(1)

			// Pass either the nested embedded object or the full init directly to super()
			c.tsw.WriteLinef("super(init?.%s || init);", propName)

			// Copy fields that belong only to this derived class
			c.tsw.WriteLine("if (init) {")
			c.tsw.Indent(1)
			c.tsw.WriteLinef("const { %s, ...rest } = init as any;", propName)
			c.tsw.WriteLine("Object.assign(this, rest);")
			c.tsw.Indent(-1)
			c.tsw.WriteLine("}")

			c.tsw.Indent(-1)
			c.tsw.WriteLine("}")
		} else {
			// For a base class without embedding, use simple constructor
			c.tsw.WriteLinef("constructor(init?: Partial<%s>) { if (init) Object.assign(this, init as any); }", className)
		}
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
		c.tsw.WriteLiterally(" ") // Changed from WriteLine to WriteLiterally
		c.WriteTypeExpr(a.Type)   // The interface definition itself is a type

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

	// Determine if method is async by checking for async operations in the body
	isAsync := c.containsAsyncOperations(decl.Body)

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

	// Check if function body has defer statements
	c.nextBlockNeedsDefer = c.scanForDefer(decl.Body)

	// Save previous async state and set current state based on isAsync
	previousAsyncState := c.inAsyncFunction
	c.inAsyncFunction = isAsync

	// Bind receiver name to this
	if recvField := decl.Recv.List[0]; len(recvField.Names) > 0 {
		recvName := recvField.Names[0].Name
		if recvName != "_" {
			c.tsw.WriteLine("{")
			c.tsw.Indent(1)
			c.tsw.WriteLinef("const %s = this", recvName)

			// Add using statement if needed
			if c.nextBlockNeedsDefer {
				if c.inAsyncFunction {
					c.tsw.WriteLine("await using __defer = new goscript.AsyncDisposableStack();")
				} else {
					c.tsw.WriteLine("using cleanup = new goscript.DisposableStack();")
				}
				c.nextBlockNeedsDefer = false
			}

			// write method body without outer braces
			for _, stmt := range decl.Body.List {
				if err := c.WriteStmt(stmt); err != nil {
					c.inAsyncFunction = previousAsyncState // Restore state before returning error
					return fmt.Errorf("failed to write statement in function body: %w", err)
				}
			}
			c.tsw.Indent(-1)
			c.tsw.WriteLine("}")

			// Restore previous async state
			c.inAsyncFunction = previousAsyncState
			return nil
		}
	}
	// no named receiver, write whole body
	if err := c.WriteStmt(decl.Body); err != nil {
		c.inAsyncFunction = previousAsyncState // Restore state before returning error
		return fmt.Errorf("failed to write function body: %w", err)
	}

	// Restore previous async state
	c.inAsyncFunction = previousAsyncState
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

		// Check if it's an interface type
		isInterface := false
		if c.pkg != nil && c.pkg.TypesInfo != nil && a.Type != nil {
			if tv, ok := c.pkg.TypesInfo.Types[a.Type]; ok && tv.Type != nil {
				_, isInterface = tv.Type.Underlying().(*gtypes.Interface)
			}
		}

		if a.Type != nil {
			c.tsw.WriteLiterally(": ")
			c.WriteTypeExpr(a.Type) // Variable type annotation

			// Append "| null" for interface types
			if isInterface {
				c.tsw.WriteLiterally(" | null")
			}

			// Check if it's an array type declaration without an initial value
			if _, isArrayType := a.Type.(*ast.ArrayType); isArrayType && len(a.Values) == 0 {
				c.tsw.WriteLiterally(" = []")
			} else if isInterface && len(a.Values) == 0 {
				// Interface with no initialization value, initialize to null
				c.tsw.WriteLiterally(" = null")
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

// WriteInterfaceMethodSignature writes a TypeScript interface method signature from a Go ast.Field.
func (c *GoToTSCompiler) WriteInterfaceMethodSignature(field *ast.Field) error {
	// Include comments
	if field.Doc != nil {
		c.WriteDoc(field.Doc)
	}
	if field.Comment != nil {
		c.WriteDoc(field.Comment)
	}

	if len(field.Names) == 0 {
		// Should not happen for named methods in an interface, but handle defensively
		return fmt.Errorf("interface method field has no name")
	}

	methodName := field.Names[0]
	funcType, ok := field.Type.(*ast.FuncType)
	if !ok {
		// Should not happen for valid interface methods, but handle defensively
		c.tsw.WriteCommentInline("unexpected interface method type")
		return fmt.Errorf("interface method type is not a FuncType")
	}

	// Write method name
	c.WriteIdentValue(methodName)

	// Write parameter list (name: type)
	c.tsw.WriteLiterally("(")
	if funcType.Params != nil {
		for i, param := range funcType.Params.List {
			if i > 0 {
				c.tsw.WriteLiterally(", ")
			}
			// Determine parameter name
			paramName := fmt.Sprintf("_p%d", i) // Default placeholder
			if len(param.Names) > 0 && param.Names[0].Name != "" && param.Names[0].Name != "_" {
				paramName = param.Names[0].Name
			}
			c.tsw.WriteLiterally(paramName)
			c.tsw.WriteLiterally(": ")
			c.WriteTypeExpr(param.Type)
		}
	}
	c.tsw.WriteLiterally(")")

	// Write return type
	// Use WriteFuncType's logic for return types, but without the async handling
	if funcType.Results != nil && len(funcType.Results.List) > 0 {
		c.tsw.WriteLiterally(": ")
		if len(funcType.Results.List) == 1 && len(funcType.Results.List[0].Names) == 0 {
			// Single unnamed return type
			c.WriteTypeExpr(funcType.Results.List[0].Type)
		} else {
			// Multiple or named return types -> tuple
			c.tsw.WriteLiterally("[")
			for i, result := range funcType.Results.List {
				if i > 0 {
					c.tsw.WriteLiterally(", ")
				}
				c.WriteTypeExpr(result.Type)
			}
			c.tsw.WriteLiterally("]")
		}
	} else {
		// No return value -> void
		c.tsw.WriteLiterally(": void")
	}

	c.tsw.WriteLine(";") // Semicolon at the end of the method signature
	return nil
}

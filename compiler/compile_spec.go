package compiler

import (
	"fmt"
	"go/ast"
	"go/types"
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

func (c *GoToTSCompiler) collectMethodSignatures(structName string, valueOnly bool) string {
	var methodSignatures []string

	for _, fileSyntax := range c.pkg.Syntax {
		for _, decl := range fileSyntax.Decls {
			funcDecl, isFunc := decl.(*ast.FuncDecl)
			if !isFunc || funcDecl.Recv == nil || len(funcDecl.Recv.List) == 0 {
				continue // Skip non-functions or functions without receivers
			}

			// Check if the receiver type matches the struct name
			recvField := funcDecl.Recv.List[0]
			recvType := recvField.Type

			// Check if this is a pointer receiver
			isPointerRecv := false
			if starExpr, ok := recvType.(*ast.StarExpr); ok {
				isPointerRecv = true
				recvType = starExpr.X // Get the type being pointed to
			}

			// If valueOnly is true, skip pointer receivers
			if valueOnly && isPointerRecv {
				continue
			}

			// Check if the receiver identifier name matches the struct name
			if ident, ok := recvType.(*ast.Ident); ok && ident.Name == structName {
				// Found a method for this struct
				signature := c.buildMethodSignature(funcDecl)
				methodSignatures = append(methodSignatures, signature)
			}
		}
	}

	return strings.Join(methodSignatures, ", ")
}

// buildMethodSignature creates a MethodSig object for a method
func (c *GoToTSCompiler) buildMethodSignature(funcDecl *ast.FuncDecl) string {
	var sb strings.Builder

	sb.WriteString("{ name: '")
	sb.WriteString(funcDecl.Name.Name)
	sb.WriteString("', params: [")

	// Add parameters
	if funcDecl.Type.Params != nil && len(funcDecl.Type.Params.List) > 0 {
		paramSigs := make([]string, 0, len(funcDecl.Type.Params.List))
		for _, param := range funcDecl.Type.Params.List {
			isVariadic := false
			paramType := param.Type

			// Check if parameter is variadic
			if ellipsis, ok := paramType.(*ast.Ellipsis); ok {
				isVariadic = true
				paramType = ellipsis.Elt
			}

			// Build parameter type info
			paramSig := fmt.Sprintf("{ type: %s, isVariadic: %t }",
				c.getTypeReference(paramType),
				isVariadic)

			paramSigs = append(paramSigs, paramSig)
		}
		sb.WriteString(strings.Join(paramSigs, ", "))
	}

	sb.WriteString("], results: [")

	// Add results
	if funcDecl.Type.Results != nil && len(funcDecl.Type.Results.List) > 0 {
		resultSigs := make([]string, 0, len(funcDecl.Type.Results.List))
		for _, result := range funcDecl.Type.Results.List {
			resultSig := fmt.Sprintf("{ type: %s }",
				c.getTypeReference(result.Type))

			resultSigs = append(resultSigs, resultSig)
		}
		sb.WriteString(strings.Join(resultSigs, ", "))
	}

	sb.WriteString("] }")

	return sb.String()
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

// collectInterfaceMethodSignatures returns an array of method signature objects for an interface
func (c *GoToTSCompiler) collectInterfaceMethodSignatures(interfaceType *ast.InterfaceType) string {
	var methodSignatures []string

	if interfaceType.Methods != nil {
		for _, method := range interfaceType.Methods.List {
			if len(method.Names) > 0 {
				// Named method
				methodName := method.Names[0].Name

				// Get the function type
				funcType, ok := method.Type.(*ast.FuncType)
				if !ok {
					continue
				}

				// Build method signature
				sig := c.buildInterfaceMethodSignature(methodName, funcType)
				methodSignatures = append(methodSignatures, sig)
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
							method := ifaceType.Method(i)
							// Get the method signature
							sig, ok := method.Type().(*types.Signature)
							if !ok {
								continue
							}

							// Build parameter signatures
							paramSigs := make([]string, 0, sig.Params().Len())
							for j := 0; j < sig.Params().Len(); j++ {
								param := sig.Params().At(j)
								isVariadic := sig.Variadic() && j == sig.Params().Len()-1
								paramSig := fmt.Sprintf("{ type: %s, isVariadic: %t }",
									c.getTypeReferenceFromType(param.Type()),
									isVariadic)
								paramSigs = append(paramSigs, paramSig)
							}

							// Build result signatures
							resultSigs := make([]string, 0, sig.Results().Len())
							for j := 0; j < sig.Results().Len(); j++ {
								result := sig.Results().At(j)
								resultSig := fmt.Sprintf("{ type: %s }",
									c.getTypeReferenceFromType(result.Type()))
								resultSigs = append(resultSigs, resultSig)
							}

							// Build the full method signature string
							methodSig := fmt.Sprintf("{ name: '%s', params: [%s], results: [%s] }",
								method.Name(),
								strings.Join(paramSigs, ", "),
								strings.Join(resultSigs, ", "))
							methodSignatures = append(methodSignatures, methodSig)
						}
					}
				} else {
					// Couldn't resolve the embedded interface
					methodSignatures = append(methodSignatures,
						"{ name: 'embeddedInterface', params: [], results: [] } /* embedded interface methods */")
				}
			}
		}
	}

	return strings.Join(methodSignatures, ", ")
}

// buildInterfaceMethodSignature creates a MethodSig object for an interface method
func (c *GoToTSCompiler) buildInterfaceMethodSignature(methodName string, funcType *ast.FuncType) string {
	var sb strings.Builder

	sb.WriteString("{ name: '")
	sb.WriteString(methodName)
	sb.WriteString("', params: [")

	// Add parameters
	if funcType.Params != nil && len(funcType.Params.List) > 0 {
		paramSigs := make([]string, 0, len(funcType.Params.List))
		for _, param := range funcType.Params.List {
			isVariadic := false
			paramType := param.Type

			// Check if parameter is variadic
			if ellipsis, ok := paramType.(*ast.Ellipsis); ok {
				isVariadic = true
				paramType = ellipsis.Elt
			}

			// Build parameter type info
			paramSig := fmt.Sprintf("{ type: %s, isVariadic: %t }",
				c.getTypeReference(paramType),
				isVariadic)

			paramSigs = append(paramSigs, paramSig)
		}
		sb.WriteString(strings.Join(paramSigs, ", "))
	}

	sb.WriteString("], results: [")

	// Add results
	if funcType.Results != nil && len(funcType.Results.List) > 0 {
		resultSigs := make([]string, 0, len(funcType.Results.List))
		for _, result := range funcType.Results.List {
			resultSig := fmt.Sprintf("{ type: %s }",
				c.getTypeReference(result.Type))

			resultSigs = append(resultSigs, resultSig)
		}
		sb.WriteString(strings.Join(resultSigs, ", "))
	}

	sb.WriteString("] }")

	return sb.String()
}

// getTypeReference returns a reference to the type's TypeInfo
func (c *GoToTSCompiler) getTypeReference(expr ast.Expr) string {
	switch t := expr.(type) {
	case *ast.Ident:
		switch t.Name {
		case "int":
			return "goscript.INT_TYPE"
		case "string":
			return "goscript.STRING_TYPE"
		case "bool":
			return "goscript.BOOL_TYPE"
		case "float64":
			return "goscript.FLOAT64_TYPE"
		case "byte":
			return "goscript.BYTE_TYPE"
		case "rune":
			return "goscript.RUNE_TYPE"
		case "interface{}":
			return "goscript.EMPTY_INTERFACE_TYPE"
		case "any":
			return "goscript.ANY_TYPE"
		case "error":
			return "goscript.ERROR_TYPE"
		default:
			// User-defined type, reference its type info constant
			return fmt.Sprintf("%s__typeInfo", t.Name)
		}
	case *ast.SelectorExpr:
		// Handle package qualified types
		if x, ok := t.X.(*ast.Ident); ok {
			return fmt.Sprintf("%s.%s__typeInfo", x.Name, t.Sel.Name)
		}
	case *ast.StarExpr:
		// Handle pointer types - create the pointer type info dynamically
		baseTypeName := c.getTypeNameString(t.X)
		// If it's a basic type, construct a pointer to it
		if isBasicType(baseTypeName) {
			return fmt.Sprintf("goscript.makePointerTypeInfo(%s)",
				getBasicTypeConstName(baseTypeName))
		}
		// Create pointer type info dynamically for user-defined types
		return fmt.Sprintf("goscript.makePointerTypeInfo(%s.__typeInfo)", baseTypeName)
	case *ast.ArrayType:
		// Handle array/slice types
		elemType := c.getTypeReference(t.Elt)
		return fmt.Sprintf("{ kind: goscript.GoTypeKind.Slice, name: '[]%s', zero: [], elem: %s }",
			c.getTypeNameString(t.Elt), elemType)
	case *ast.MapType:
		// Handle map types
		keyType := c.getTypeReference(t.Key)
		valueType := c.getTypeReference(t.Value)
		return fmt.Sprintf("{ kind: goscript.GoTypeKind.Map, name: 'map[%s]%s', zero: new Map(), key: %s, value: %s }",
			c.getTypeNameString(t.Key), c.getTypeNameString(t.Value), keyType, valueType)
	}

	// For more complex types, we'd need more sophisticated handling
	return "goscript.EMPTY_INTERFACE_TYPE"
}

// getTypeReferenceFromType returns a reference to the type's TypeInfo from a types.Type
func (c *GoToTSCompiler) getTypeReferenceFromType(typ types.Type) string {
	switch t := typ.(type) {
	case *types.Basic:
		// Map basic Go types to their const references
		name := t.Name()
		return getBasicTypeConstName(name)
	case *types.Pointer:
		// Handle pointer types
		elemType := c.getTypeReferenceFromType(t.Elem())
		// Create pointer type info dynamically
		if isBasicTypeConstRef(elemType) {
			// For pointers to basic types
			return fmt.Sprintf("goscript.makePointerTypeInfo(%s)", elemType)
		}

		// For pointers to named types
		if named, ok := t.Elem().(*types.Named); ok {
			return fmt.Sprintf("goscript.makePointerTypeInfo(%s.__typeInfo)", named.Obj().Name())
		}
	case *types.Slice:
		// Handle slice types
		elemType := c.getTypeReferenceFromType(t.Elem())
		return fmt.Sprintf("{ kind: goscript.GoTypeKind.Slice, name: '[]%s', zero: [], elem: %s }",
			t.Elem().String(), elemType)
	case *types.Map:
		// Handle map types
		keyType := c.getTypeReferenceFromType(t.Key())
		valueType := c.getTypeReferenceFromType(t.Elem())
		return fmt.Sprintf("{ kind: goscript.GoTypeKind.Map, name: 'map[%s]%s', zero: new Map(), key: %s, value: %s }",
			t.Key().String(), t.Elem().String(), keyType, valueType)
	case *types.Named:
		// Handle named types (structs, interfaces, type aliases)
		obj := t.Obj()
		// Special case for the built-in 'error' type
		if obj.Name() == "error" && (obj.Pkg() == nil || obj.Pkg().Path() == "builtin") {
			return "goscript.ERROR_TYPE"
		}
		
		if pkg := obj.Pkg(); pkg != nil {
			// Qualify with package name if not in the current package
			if pkg != c.pkg.Types {
				return fmt.Sprintf("%s.%s__typeInfo", pkg.Name(), obj.Name())
			}
		}
		return fmt.Sprintf("%s__typeInfo", obj.Name())
	case *types.Interface:
		// Handle anonymous interface types (e.g., interface{})
		if t.Empty() {
			return "goscript.EMPTY_INTERFACE_TYPE"
		}
		// TODO: Handle non-empty anonymous interfaces if needed
		return "goscript.EMPTY_INTERFACE_TYPE" // Fallback
	case *types.Signature:
		// Handle function types
		// TODO: Implement function type signature generation if needed
		return "{ kind: goscript.GoTypeKind.Func, name: 'func()', zero: null, params: [], results: [], variadic: false }" // Placeholder
	}

	// Fallback for unhandled types
	return "goscript.EMPTY_INTERFACE_TYPE"
}

// isBasicType checks if a type name represents a Go built-in type
func isBasicType(typeName string) bool {
	switch typeName {
	case "int", "string", "bool", "float64", "byte", "rune", "interface{}", "any", "error":
		return true
	default:
		return false
	}
}

// getBasicTypeConstName returns the constant name for a basic type
func getBasicTypeConstName(typeName string) string {
	switch typeName {
	case "int":
		return "goscript.INT_TYPE"
	case "string":
		return "goscript.STRING_TYPE"
	case "bool":
		return "goscript.BOOL_TYPE"
	case "float64":
		return "goscript.FLOAT64_TYPE"
	case "byte":
		return "goscript.BYTE_TYPE"
	case "rune":
		return "goscript.RUNE_TYPE"
	case "interface{}":
		return "goscript.EMPTY_INTERFACE_TYPE"
	case "any":
		return "goscript.ANY_TYPE"
	case "error":
		return "goscript.ERROR_TYPE"
	default:
		return "goscript.EMPTY_INTERFACE_TYPE"
	}
}

// isBasicTypeConstRef checks if a string is a reference to a basic type constant
func isBasicTypeConstRef(ref string) bool {
	return strings.HasPrefix(ref, "goscript.") &&
		strings.HasSuffix(ref, "_TYPE") &&
		!strings.Contains(ref, "{")
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
			// Add a comment explaining the constructor behavior for embedded structs
			c.tsw.WriteLine("// Handles initialization of embedded struct fields.")
			c.tsw.Indent(1)

			// Pass either the nested embedded object or the full init directly to super()
			// Ensure we pass the object literal for the embedded struct, not a new instance
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

		// Remove the unused collectMethodNames function
		// This was identified by the linter earlier.

		// Add code to register the type with the runtime system
		c.tsw.WriteLine("")

		// Add type information as static property (inside the class)
		// Indentation is already correct here (one level inside the class)
		c.tsw.WriteLine("// Type information for runtime type system")
		c.tsw.WriteLinef("static __typeInfo: goscript.StructTypeInfo = {")
		c.tsw.WriteLinef("  kind: goscript.GoTypeKind.Struct,")
		c.tsw.WriteLinef("  name: '%s',", className)
		c.tsw.WriteLinef("  zero: new %s(),", className)
		c.tsw.WriteLinef("  fields: [], // Fields will be added in a future update")
		c.tsw.WriteLinef("  methods: [%s],", c.collectMethodSignatures(className, true)) // Only value receiver methods
		c.tsw.WriteLinef("  ctor: %s", className)
		c.tsw.WriteLinef("};")

		c.tsw.WriteLine("") // Add space after static property

		c.tsw.Indent(-1)     // Decrease indentation for the closing brace of the class
		c.tsw.WriteLine("}") // Close class definition

		// No need to define separate pointer type info - it will be created dynamically when needed

		return nil // Prevent fallthrough to InterfaceType case
	case *ast.InterfaceType:
		c.tsw.WriteLiterally("interface ")
		if err := c.WriteValueExpr(a.Name); err != nil { // Interface name is a value identifier
			return err
		}
		c.tsw.WriteLiterally(" ") // Changed from WriteLine to WriteLiterally
		c.WriteTypeExpr(a.Type)   // The interface definition itself is a type

		// Add code to define interface type information
		interfaceName := a.Name.Name
		c.tsw.WriteLine("")
		c.tsw.WriteLinef("// Define interface type information")
		c.tsw.WriteLinef("const %s__typeInfo: goscript.InterfaceTypeInfo = {", interfaceName)
		c.tsw.WriteLinef("  kind: goscript.GoTypeKind.Interface,")
		c.tsw.WriteLinef("  name: '%s',", interfaceName)
		c.tsw.WriteLinef("  zero: null,") // Zero value for interface is null
		c.tsw.WriteLinef("  methods: [%s]", c.collectInterfaceMethodSignatures(t))
		c.tsw.WriteLinef("};")
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

	// Set current receiver object for context
	var receiverObj types.Object
	isPointerReceiver := false

	if recvField := decl.Recv.List[0]; len(recvField.Names) > 0 {
		if recvIdent := recvField.Names[0]; recvIdent != nil {
			receiverObj = c.pkg.TypesInfo.Defs[recvIdent]
			c.currentReceiverObj = receiverObj

			// Check if this method has a pointer receiver
			if starExpr, ok := recvField.Type.(*ast.StarExpr); ok {
				isPointerReceiver = true

				// Store this in our map of pointer receiver methods
				if ident, ok := starExpr.X.(*ast.Ident); ok {
					methodKey := ident.Name + "." + decl.Name.Name
					c.pointerReceiverMethods[methodKey] = true
				}
			}
			c.currentReceiverIsPointer = isPointerReceiver
		}
	}

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
					c.currentReceiverObj = nil             // Reset receiver object on error
					c.currentReceiverIsPointer = false     // Reset receiver pointer flag on error
					return fmt.Errorf("failed to write statement in function body: %w", err)
				}
			}
			c.tsw.Indent(-1)
			c.tsw.WriteLine("}")

			// Restore previous async state and reset receiver object
			c.inAsyncFunction = previousAsyncState
			c.currentReceiverObj = nil
			return nil
		}
	}
	// no named receiver, write whole body
	if err := c.WriteStmt(decl.Body); err != nil {
		c.inAsyncFunction = previousAsyncState // Restore state before returning error
		c.currentReceiverObj = nil             // Reset receiver object on error
		return fmt.Errorf("failed to write function body: %w", err)
	}

	// Restore previous async state and reset receiver info
	c.inAsyncFunction = previousAsyncState
	c.currentReceiverObj = nil
	c.currentReceiverIsPointer = false
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
				_, isInterface = tv.Type.Underlying().(*types.Interface)
			}
		}

		// Write type annotation if type is specified
		if a.Type != nil {
			c.tsw.WriteLiterally(": ")
			c.WriteTypeExpr(a.Type)

			// Append "| null" for interface types
			if isInterface {
				c.tsw.WriteLiterally(" | null")
			}
		}

		// Write initialization
		c.tsw.WriteLiterally(" = ")

		if len(a.Values) > 0 {
			// Initialize with provided values
			for i, val := range a.Values {
				if i != 0 {
					c.tsw.WriteLiterally(", ")
				}
				if err := c.WriteValueExpr(val); err != nil {
					return err
				}
			}
		} else {
			// No explicit initialization value, use zero value based on type
			if a.Type != nil {
				// Check if it's a struct type
				isStruct := false
				structName := ""
				if ident, ok := a.Type.(*ast.Ident); ok && ident.Name != "" {
					// Check if it's a known struct type
					if ident.Obj != nil && ident.Obj.Kind == ast.Typ && c.pkg != nil && c.pkg.TypesInfo != nil {
						if tv, ok := c.pkg.TypesInfo.Types[ident]; ok && tv.Type != nil {
							if _, isStructType := tv.Type.Underlying().(*types.Struct); isStructType {
								isStruct = true
								structName = ident.Name
							}
						}
					} else if len(ident.Name) > 0 && ident.Name[0] >= 'A' && ident.Name[0] <= 'Z' {
						// Conservative guess for struct types
						isStruct = true
						structName = ident.Name
					}
				}

				if _, isArrayType := a.Type.(*ast.ArrayType); isArrayType {
					// Array type
					c.tsw.WriteLiterally("[]")
				} else if isInterface {
					// Interface type
					c.tsw.WriteLiterally("null")
				} else if isStruct && structName != "" {
					// Struct type
					c.tsw.WriteLinef("new %s()", structName)
				} else {
					// Other types
					c.WriteZeroValueForType(a.Type)
				}
			} else {
				// If no type specified, fallback to null
				c.tsw.WriteLiterally("null")
			}
		}
	} else {
		// Multiple names (destructuring assignment)
		c.tsw.WriteLiterally("{")
		for i, name := range a.Names {
			if i != 0 {
				c.tsw.WriteLiterally(", ")
			}
			c.tsw.WriteLiterally(name.Name)
		}
		c.tsw.WriteLiterally("}")

		// Always provide an initialization value
		c.tsw.WriteLiterally(" = ")

		if len(a.Values) > 0 {
			// Use provided values
			for i, val := range a.Values {
				if i > 0 {
					c.tsw.WriteLiterally(", ")
				}
				if err := c.WriteValueExpr(val); err != nil { // Initializers are values
					return err
				}
			}
		} else {
			// No explicit values, initialize with an empty array (safest default)
			c.tsw.WriteLiterally("[]")
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

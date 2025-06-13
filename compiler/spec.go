package compiler

import (
	"fmt"
	"go/ast"
	"go/types"
	"strings"

	// types provides type information for Go types.
	"github.com/pkg/errors"
)

// WriteSpec is a dispatcher function that translates a Go specification node
// (`ast.Spec`) into its TypeScript equivalent. It handles different types of
// specifications found within `GenDecl` (general declarations):
// - `ast.ImportSpec` (import declarations): Delegates to `WriteImportSpec`.
// - `ast.ValueSpec` (variable or constant declarations): Delegates to `WriteValueSpec`.
// - `ast.TypeSpec` (type definitions like structs, interfaces): Delegates to `WriteTypeSpec`.
// If an unknown specification type is encountered, it returns an error.
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

func (c *GoToTSCompiler) getEmbeddedFieldKeyName(fieldType types.Type) string {
	trueType := fieldType
	if ptr, isPtr := trueType.(*types.Pointer); isPtr {
		trueType = ptr.Elem()
	}

	if named, isNamed := trueType.(*types.Named); isNamed {
		return named.Obj().Name()
	} else {
		// Fallback for unnamed embedded types, though less common for structs
		fieldKeyName := trueType.String()
		if len(fieldKeyName) > 0 {
			fieldKeyName = strings.ToUpper(fieldKeyName[:1]) + fieldKeyName[1:]
		}
		if dotIndex := strings.LastIndex(fieldKeyName, "."); dotIndex != -1 {
			fieldKeyName = fieldKeyName[dotIndex+1:]
		}
		return fieldKeyName
	}
}

func (c *GoToTSCompiler) writeGetterSetter(fieldName string, fieldType types.Type, doc, comment *ast.CommentGroup, astType ast.Expr) {
	// Use AST type information if available to preserve qualified names
	var fieldTypeStr string
	if astType != nil {
		fieldTypeStr = c.getASTTypeString(astType, fieldType)
	} else {
		fieldTypeStr = c.getTypeString(fieldType)
	}

	// Generate getter
	if doc != nil {
		c.WriteDoc(doc)
	}
	if comment != nil {
		c.WriteDoc(comment)
	}
	c.tsw.WriteLinef("public get %s(): %s {", fieldName, fieldTypeStr)
	c.tsw.Indent(1)
	c.tsw.WriteLinef("return this._fields.%s.value", fieldName)
	c.tsw.Indent(-1)
	c.tsw.WriteLine("}")

	// Generate setter (no comments)
	c.tsw.WriteLinef("public set %s(value: %s) {", fieldName, fieldTypeStr)
	c.tsw.Indent(1)
	c.tsw.WriteLinef("this._fields.%s.value = value", fieldName)
	c.tsw.Indent(-1)
	c.tsw.WriteLine("}")
	c.tsw.WriteLine("")
}

func (c *GoToTSCompiler) writeVarRefedFieldInitializer(fieldName string, fieldType types.Type, isEmbedded bool, astType ast.Expr) {
	c.tsw.WriteLiterally(fieldName)
	c.tsw.WriteLiterally(": $.varRef(")

	if isEmbedded {
		c.writeEmbeddedFieldInitializer(fieldName, fieldType)
	} else {
		c.writeRegularFieldInitializer(fieldName, fieldType, astType)
	}

	c.tsw.WriteLiterally(")")
}

func (c *GoToTSCompiler) writeEmbeddedFieldInitializer(fieldName string, fieldType types.Type) {
	_, isPtr := fieldType.(*types.Pointer)
	_, isInterface := fieldType.Underlying().(*types.Interface)

	if isPtr || isInterface {
		c.tsw.WriteLiterallyf("init?.%s ?? null", fieldName)
		return
	}

	// Check if the embedded type is an interface
	embeddedTypeUnderlying := fieldType
	if named, isNamed := embeddedTypeUnderlying.(*types.Named); isNamed {
		embeddedTypeUnderlying = named.Underlying()
	}

	if _, isInterface := embeddedTypeUnderlying.(*types.Interface); isInterface {
		// For interfaces, use the provided value or null instead of trying to instantiate
		c.tsw.WriteLiterallyf("init?.%s ?? null", fieldName)
		return
	}

	// For structs, instantiate with provided fields
	typeForNew := fieldName
	c.tsw.WriteLiterallyf("new %s(init?.%s)", typeForNew, fieldName)
}

func (c *GoToTSCompiler) writeRegularFieldInitializer(fieldName string, fieldType types.Type, astType ast.Expr) {
	// Check if this is a struct value type that needs cloning
	if c.isStructValueType(fieldType) {
		structTypeNameForClone := c.getTypeString(fieldType)
		c.tsw.WriteLiterallyf("init?.%s?.clone() ?? new %s()", fieldName, structTypeNameForClone)
		return
	}

	c.tsw.WriteLiterallyf("init?.%s ?? ", fieldName)

	// Priority 1: Check if this is a wrapper type
	if c.analysis.IsNamedBasicType(fieldType) {
		// For wrapper types, use the zero value of the underlying type with type casting
		if named, ok := fieldType.(*types.Named); ok {
			c.WriteZeroValueForType(named.Underlying())
			c.tsw.WriteLiterally(" as ")
			c.WriteGoType(fieldType, GoTypeContextGeneral)
		} else if alias, ok := fieldType.(*types.Alias); ok {
			c.WriteZeroValueForType(alias.Underlying())
			c.tsw.WriteLiterally(" as ")
			c.WriteGoType(fieldType, GoTypeContextGeneral)
		} else {
			// Fallback to original behavior
			c.WriteZeroValueForType(fieldType)
		}
		return
	}

	// Priority 2: Handle imported types with basic underlying types (like os.FileMode)
	if c.isImportedBasicType(fieldType) {
		c.writeImportedBasicTypeZeroValue(fieldType)
		return
	}

	// Priority 3: Handle named types
	if named, isNamed := fieldType.(*types.Named); isNamed {
		c.writeNamedTypeZeroValue(named)
		return
	}

	// Priority 4: Handle type aliases
	if alias, isAlias := fieldType.(*types.Alias); isAlias {
		c.writeTypeAliasZeroValue(alias, astType)
		return
	}

	c.WriteZeroValueForType(fieldType)
}

func (c *GoToTSCompiler) isStructValueType(fieldType types.Type) bool {
	if named, ok := fieldType.(*types.Named); ok {
		if _, isStruct := named.Underlying().(*types.Struct); isStruct {
			return true
		}
	}
	return false
}

func (c *GoToTSCompiler) isImportedBasicType(fieldType types.Type) bool {
	// Handle named types
	if named, isNamed := fieldType.(*types.Named); isNamed {
		obj := named.Obj()
		if obj == nil || obj.Pkg() == nil || obj.Pkg() == c.pkg.Types {
			return false // Not imported or is local
		}

		underlying := named.Underlying()
		if underlying == nil {
			return false
		}

		_, isBasic := underlying.(*types.Basic)
		return isBasic
	}

	// Handle type aliases (like os.FileMode = fs.FileMode)
	if alias, isAlias := fieldType.(*types.Alias); isAlias {
		obj := alias.Obj()
		if obj == nil || obj.Pkg() == nil || obj.Pkg() == c.pkg.Types {
			return false // Not imported or is local
		}

		underlying := alias.Underlying()
		if underlying == nil {
			return false
		}

		_, isBasic := underlying.(*types.Basic)
		return isBasic
	}

	return false
}

func (c *GoToTSCompiler) writeImportedBasicTypeZeroValue(fieldType types.Type) {
	if named, ok := fieldType.(*types.Named); ok {
		underlying := named.Underlying()
		// Write zero value of underlying type with type casting
		c.WriteZeroValueForType(underlying)
		c.tsw.WriteLiterally(" as ")
		c.WriteGoType(fieldType, GoTypeContextGeneral)
		return
	}

	if alias, ok := fieldType.(*types.Alias); ok {
		underlying := alias.Underlying()
		// Write zero value of underlying type with type casting
		c.WriteZeroValueForType(underlying)
		c.tsw.WriteLiterally(" as ")
		c.WriteGoType(fieldType, GoTypeContextGeneral)
		return
	}

	// Fallback (should not happen if isImportedBasicType was correct)
	c.WriteZeroValueForType(fieldType)
}

func (c *GoToTSCompiler) writeNamedTypeZeroValue(named *types.Named) {
	// Check if this is a wrapper type first
	if c.analysis.IsNamedBasicType(named) {
		// For wrapper types, use the zero value of the underlying type with type casting
		c.WriteZeroValueForType(named.Underlying())
		c.tsw.WriteLiterally(" as ")
		c.WriteGoType(named, GoTypeContextGeneral)
		return
	}

	// Check if underlying type is an interface
	if _, isInterface := named.Underlying().(*types.Interface); isInterface {
		c.tsw.WriteLiterally("null")
		return
	}

	// Check if underlying type is a struct
	if _, isStruct := named.Underlying().(*types.Struct); isStruct {
		c.WriteZeroValueForType(named)
		return
	}

	// For non-struct, non-interface named types, use constructor
	c.tsw.WriteLiterally("new ")
	c.WriteNamedType(named)
	c.tsw.WriteLiterally("(")
	c.WriteZeroValueForType(named.Underlying())
	c.tsw.WriteLiterally(")")
}

func (c *GoToTSCompiler) writeTypeAliasZeroValue(alias *types.Alias, astType ast.Expr) {
	// Check if this is a wrapper type first
	if c.analysis.IsNamedBasicType(alias) {
		// For wrapper types, use the zero value of the underlying type with type casting
		c.WriteZeroValueForType(alias.Underlying())
		c.tsw.WriteLiterally(" as ")
		c.WriteGoType(alias, GoTypeContextGeneral)
		return
	}

	// Check if underlying type is an interface
	if _, isInterface := alias.Underlying().(*types.Interface); isInterface {
		c.tsw.WriteLiterally("null")
		return
	}

	// Check if underlying type is a struct
	if _, isStruct := alias.Underlying().(*types.Struct); isStruct {
		c.WriteZeroValueForType(alias)
		return
	}

	// For non-struct, non-interface type aliases, use constructor
	c.tsw.WriteLiterally("new ")
	// Use AST type information if available to preserve qualified names
	if astType != nil {
		c.WriteTypeExpr(astType)
	} else {
		c.WriteGoType(alias, GoTypeContextGeneral)
	}
	c.tsw.WriteLiterally("(")
	c.WriteZeroValueForType(alias.Underlying())
	c.tsw.WriteLiterally(")")
}

// hasReceiverMethods checks if a type declaration has any receiver methods defined
func (c *GoToTSCompiler) hasReceiverMethods(typeName string) bool {
	for _, fileSyntax := range c.pkg.Syntax {
		for _, decl := range fileSyntax.Decls {
			funcDecl, isFunc := decl.(*ast.FuncDecl)
			if !isFunc || funcDecl.Recv == nil || len(funcDecl.Recv.List) == 0 {
				continue
			}
			recvField := funcDecl.Recv.List[0]
			recvType := recvField.Type
			if starExpr, ok := recvType.(*ast.StarExpr); ok {
				recvType = starExpr.X
			}

			// Check for both simple identifiers (FileMode) and generic types (FileMode[T])
			var recvTypeName string
			if ident, ok := recvType.(*ast.Ident); ok {
				recvTypeName = ident.Name
			} else if indexExpr, ok := recvType.(*ast.IndexExpr); ok {
				if ident, ok := indexExpr.X.(*ast.Ident); ok {
					recvTypeName = ident.Name
				}
			}

			if recvTypeName == typeName {
				return true
			}
		}
	}
	return false
}

// WriteNamedTypeWithMethods generates TypeScript code for Go named types that have methods.
// Instead of generating a class, it now generates:
// 1. A type alias for the underlying type
// 2. Function declarations for each method (TypeName_MethodName)
// 3. Function implementations for each method
func (c *GoToTSCompiler) WriteNamedTypeWithMethods(a *ast.TypeSpec) error {
	className := a.Name.Name

	// Add export for Go-exported types (but not if inside a function)
	isInsideFunction := false
	if nodeInfo := c.analysis.NodeData[a]; nodeInfo != nil {
		isInsideFunction = nodeInfo.IsInsideFunction
	}

	if !isInsideFunction {
		c.tsw.WriteLiterally("export ")
	}

	// Generate type alias instead of class
	c.tsw.WriteLiterally("type ")
	c.tsw.WriteLiterally(className)
	c.tsw.WriteLiterally(" = ")
	// Use AST-based type writing to preserve qualified names like os.FileInfo
	c.WriteTypeExpr(a.Type)
	c.tsw.WriteLine(";")
	c.tsw.WriteLine("")

	// Generate function declarations and implementations for each method
	for _, fileSyntax := range c.pkg.Syntax {
		for _, decl := range fileSyntax.Decls {
			funcDecl, isFunc := decl.(*ast.FuncDecl)
			if !isFunc || funcDecl.Recv == nil || len(funcDecl.Recv.List) == 0 {
				continue
			}
			recvField := funcDecl.Recv.List[0]
			recvType := recvField.Type
			if starExpr, ok := recvType.(*ast.StarExpr); ok {
				recvType = starExpr.X
			}

			// Check for both simple identifiers (FileMode) and generic types (FileMode[T])
			var recvTypeName string
			if ident, ok := recvType.(*ast.Ident); ok {
				recvTypeName = ident.Name
			} else if indexExpr, ok := recvType.(*ast.IndexExpr); ok {
				if ident, ok := indexExpr.X.(*ast.Ident); ok {
					recvTypeName = ident.Name
				}
			}

			if recvTypeName == className {
				if !isInsideFunction {
					c.tsw.WriteLiterally("export ")
				}

				// Generate function signature: export function TypeName_MethodName(receiver: TypeName, ...args): ReturnType
				c.tsw.WriteLiterally("function ")
				c.tsw.WriteLiterally(className)
				c.tsw.WriteLiterally("_")
				c.tsw.WriteLiterally(funcDecl.Name.Name)
				c.tsw.WriteLiterally("(")

				// First parameter is the receiver - use the original receiver parameter name
				var receiverParamName string = "receiver" // default fallback
				if funcDecl.Recv != nil && len(funcDecl.Recv.List) > 0 {
					if len(funcDecl.Recv.List[0].Names) > 0 {
						if name := funcDecl.Recv.List[0].Names[0]; name != nil && name.Name != "_" {
							receiverParamName = name.Name
						}
					}
				}
				c.tsw.WriteLiterally(receiverParamName)
				c.tsw.WriteLiterally(": ")
				c.tsw.WriteLiterally(className)

				// Add other parameters
				if funcDecl.Type.Params != nil && len(funcDecl.Type.Params.List) > 0 {
					c.tsw.WriteLiterally(", ")
					c.WriteFieldList(funcDecl.Type.Params, true) // true = arguments
				}

				c.tsw.WriteLiterally(")")

				// Add return type
				if funcDecl.Type.Results != nil && len(funcDecl.Type.Results.List) > 0 {
					c.tsw.WriteLiterally(": ")
					if len(funcDecl.Type.Results.List) == 1 {
						c.WriteTypeExpr(funcDecl.Type.Results.List[0].Type)
					} else {
						c.tsw.WriteLiterally("[")
						for i, field := range funcDecl.Type.Results.List {
							if i > 0 {
								c.tsw.WriteLiterally(", ")
							}
							c.WriteTypeExpr(field.Type)
						}
						c.tsw.WriteLiterally("]")
					}
				} else {
					c.tsw.WriteLiterally(": void")
				}

				c.tsw.WriteLine(" {")
				c.tsw.Indent(1)

				// Write method body with receiver as first parameter
				if err := c.writeWrapperFunctionBody(funcDecl, className); err != nil {
					return err
				}

				c.tsw.Indent(-1)
				c.tsw.WriteLine("}")
				c.tsw.WriteLine("")
			}
		}
	}

	return nil
}

// writeWrapperFunctionBody writes the body of a wrapper function, treating the receiver as the first parameter
func (c *GoToTSCompiler) writeWrapperFunctionBody(decl *ast.FuncDecl, typeName string) error {
	// Write function body statements directly - identifier mapping is handled by pre-computed analysis
	if decl.Body != nil {
		for _, stmt := range decl.Body.List {
			if err := c.WriteStmt(stmt); err != nil {
				return err
			}
		}
	}
	return nil
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
		return c.WriteStructTypeSpec(a, t)
	case *ast.InterfaceType:
		return c.WriteInterfaceTypeSpec(a, t)
	default:
		// Check if this type has receiver methods
		if c.hasReceiverMethods(a.Name.Name) {
			return c.WriteNamedTypeWithMethods(a)
		}

		// Always export types for cross-file imports within the same package (but not if inside a function)
		isInsideFunction := false
		if nodeInfo := c.analysis.NodeData[a]; nodeInfo != nil {
			isInsideFunction = nodeInfo.IsInsideFunction
		}

		if !isInsideFunction {
			c.tsw.WriteLiterally("export ")
		}
		c.tsw.WriteLiterally("type ")
		if err := c.WriteValueExpr(a.Name); err != nil {
			return err
		}

		// Write type parameters if present (for generics)
		if a.TypeParams != nil {
			c.WriteTypeParameters(a.TypeParams)
		}

		c.tsw.WriteLiterally(" = ")
		c.WriteTypeExpr(a.Type) // The aliased type
		c.tsw.WriteLine(";")
	}
	return nil
}

// WriteInterfaceTypeSpec writes the TypeScript type for a Go interface type.
func (c *GoToTSCompiler) WriteInterfaceTypeSpec(a *ast.TypeSpec, t *ast.InterfaceType) error {
	// Add export for Go-exported interfaces (but not if inside a function)
	isInsideFunction := false
	if nodeInfo := c.analysis.NodeData[a]; nodeInfo != nil {
		isInsideFunction = nodeInfo.IsInsideFunction
	}

	if !isInsideFunction {
		c.tsw.WriteLiterally("export ")
	}
	c.tsw.WriteLiterally("type ")
	if err := c.WriteValueExpr(a.Name); err != nil {
		return err
	}

	// Write type parameters if present (for generics)
	if a.TypeParams != nil {
		c.WriteTypeParameters(a.TypeParams)
	}

	c.tsw.WriteLiterally(" = ")
	// Get the types.Interface from the ast.InterfaceType.
	// For an interface definition like `type MyInterface interface { M() }`,
	// 't' is the *ast.InterfaceType representing `interface { M() }`.
	// TypesInfo.TypeOf(t) will give the *types.Interface.
	goType := c.pkg.TypesInfo.TypeOf(t)
	if goType == nil {
		return errors.Errorf("could not get type for interface AST node for %s", a.Name.Name)
	}
	ifaceType, ok := goType.(*types.Interface)
	if !ok {
		return errors.Errorf("expected *types.Interface, got %T for %s when processing interface literal", goType, a.Name.Name)
	}
	c.WriteInterfaceType(ifaceType, t) // Pass the *ast.InterfaceType for comment fetching
	c.tsw.WriteLine("")

	// Add code to register the interface with the runtime system
	interfaceName := a.Name.Name
	c.tsw.WriteLine("")
	c.tsw.WriteLinef("$.registerInterfaceType(")
	c.tsw.WriteLinef("  '%s',", interfaceName)
	c.tsw.WriteLinef("  null, // Zero value for interface is null")

	// Collect methods for the interface type
	var interfaceMethods []*types.Func
	if ifaceType != nil { // ifaceType is *types.Interface
		for i := range ifaceType.NumExplicitMethods() {
			interfaceMethods = append(interfaceMethods, ifaceType.ExplicitMethod(i))
		}
		// TODO: Handle embedded interface methods if necessary for full signature collection.
		// For now, explicit methods are covered.
	}
	c.tsw.WriteLiterally("  [")
	c.writeMethodSignatures(interfaceMethods)
	c.tsw.WriteLiterally("]")
	c.tsw.WriteLine("")

	c.tsw.WriteLinef(");")

	return nil
}

// WriteImportSpec translates a Go import specification (`ast.ImportSpec`)
// into a TypeScript import statement.
//
// It extracts the Go import path (e.g., `"path/to/pkg"`) and determines the
// import alias/name for TypeScript. If the Go import has an explicit name
// (e.g., `alias "path/to/pkg"`), that alias is used. Otherwise, the package
// name is derived from the actual Go package name, not the import path.
//
// The Go path is then translated to a TypeScript module path using
// `translateGoPathToTypescriptPath`.
//
// Finally, it writes a TypeScript import statement like `import * as alias from "typescript/path/to/pkg";`
// and records the import details in `c.analysis.Imports` for later use (e.g.,
// resolving qualified identifiers).
func (c *GoToTSCompiler) WriteImportSpec(a *ast.ImportSpec) {
	if a.Doc != nil {
		c.WriteDoc(a.Doc)
	}
	if a.Comment != nil {
		c.WriteDoc(a.Comment)
	}

	goPath := a.Path.Value[1 : len(a.Path.Value)-1]

	// Determine the import name to use in TypeScript
	var impName string
	if a.Name != nil && a.Name.Name != "" {
		// Explicit alias provided: import alias "path/to/pkg"
		impName = a.Name.Name
	} else {
		// No explicit alias, use the actual package name from type information
		// This handles cases where package name differs from the last path segment
		if actualName, err := getActualPackageName(goPath, c.pkg.Imports); err == nil {
			impName = actualName
		} else {
			// Fallback to last segment of path if package not found in type information
			pts := strings.Split(goPath, "/")
			impName = pts[len(pts)-1]
		}
	}

	// Apply sanitization to handle known names like "Promise" -> "PromiseType"
	impName = c.sanitizeIdentifier(impName)

	// All Go package imports are mapped to the @goscript/ scope.
	// The TypeScript compiler will resolve these using tsconfig paths to either
	// handwritten versions (in .goscript-assets) or transpiled versions (in goscript).
	var tsImportPath string
	if goPath == "github.com/aperturerobotics/goscript/builtin" {
		tsImportPath = "@goscript/builtin/index.js"
	} else {
		tsImportPath = "@goscript/" + goPath
	}

	c.analysis.Imports[impName] = &fileImport{
		importPath: tsImportPath,
		importVars: make(map[string]struct{}),
	}

	c.tsw.WriteImport(impName, tsImportPath+"/index.js")
}

func (c *GoToTSCompiler) writeClonedFieldInitializer(fieldName string, fieldType types.Type, isEmbedded bool) {
	c.tsw.WriteLiterally(fieldName)
	c.tsw.WriteLiterally(": $.varRef(")

	if isEmbedded {
		isPointerToStruct := false
		trueType := fieldType
		if ptr, isPtr := trueType.(*types.Pointer); isPtr {
			trueType = ptr.Elem()
			isPointerToStruct = true
		}

		if named, isNamed := trueType.(*types.Named); isNamed {
			_, isUnderlyingStruct := named.Underlying().(*types.Struct)
			if isUnderlyingStruct && !isPointerToStruct { // Is a value struct
				c.tsw.WriteLiterallyf("this._fields.%s.value.clone()", fieldName)
			} else { // Is a pointer to a struct, or not a struct
				c.tsw.WriteLiterallyf("this._fields.%s.value", fieldName)
			}
		} else {
			c.tsw.WriteLiterallyf("this._fields.%s.value", fieldName)
		}
	} else {
		isValueTypeStruct := false
		if named, ok := fieldType.(*types.Named); ok {
			if _, isStruct := named.Underlying().(*types.Struct); isStruct {
				isValueTypeStruct = true
			}
		}

		if isValueTypeStruct {
			c.tsw.WriteLiterallyf("this._fields.%s.value?.clone() ?? null", fieldName)
		} else {
			c.tsw.WriteLiterallyf("this._fields.%s.value", fieldName)
		}
	}

	c.tsw.WriteLiterally(")")
}

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
		_, isPtr := fieldType.(*types.Pointer)
		_, isInterface := fieldType.Underlying().(*types.Interface)
		if isPtr || isInterface {
			c.tsw.WriteLiterallyf("init?.%s ?? null", fieldName)
		} else {
			// Check if the embedded type is an interface
			embeddedTypeUnderlying := fieldType
			if named, isNamed := embeddedTypeUnderlying.(*types.Named); isNamed {
				embeddedTypeUnderlying = named.Underlying()
			}
			if _, isInterface := embeddedTypeUnderlying.(*types.Interface); isInterface {
				// For interfaces, use the provided value or null instead of trying to instantiate
				c.tsw.WriteLiterallyf("init?.%s ?? null", fieldName)
			} else {
				// For structs, instantiate with provided fields
				typeForNew := fieldName
				c.tsw.WriteLiterallyf("new %s(init?.%s)", typeForNew, fieldName)
			}
		}
	} else {
		isStructValueType := false
		var structTypeNameForClone string
		if named, ok := fieldType.(*types.Named); ok {
			if _, isStruct := named.Underlying().(*types.Struct); isStruct {
				isStructValueType = true
				structTypeNameForClone = c.getTypeString(fieldType)
			}
		}

		if isStructValueType {
			c.tsw.WriteLiterallyf("init?.%s?.clone() ?? new %s()", fieldName, structTypeNameForClone)
		} else {
			c.tsw.WriteLiterallyf("init?.%s ?? ", fieldName)
			// Check if this is a named type or type alias and use constructor instead of null
			if named, isNamed := fieldType.(*types.Named); isNamed {
				// This is a named type
				// Check if underlying type is an interface
				if _, isInterface := named.Underlying().(*types.Interface); isInterface {
					// For interfaces, use null as the zero value
					c.tsw.WriteLiterally("null")
				} else if _, isStruct := named.Underlying().(*types.Struct); !isStruct {
					// For non-struct, non-interface named types, use constructor
					c.tsw.WriteLiterally("new ")
					c.WriteNamedType(named)
					c.tsw.WriteLiterally("(")
					c.WriteZeroValueForType(named.Underlying())
					c.tsw.WriteLiterally(")")
				} else {
					c.WriteZeroValueForType(fieldType)
				}
			} else if alias, isAlias := fieldType.(*types.Alias); isAlias {
				// This is a type alias (like os.FileMode)
				// Check if underlying type is an interface
				if _, isInterface := alias.Underlying().(*types.Interface); isInterface {
					// For interface type aliases, use null as the zero value
					c.tsw.WriteLiterally("null")
				} else if _, isStruct := alias.Underlying().(*types.Struct); !isStruct {
					// For non-struct, non-interface type aliases, use constructor
					c.tsw.WriteLiterally("new ")
					// Use AST type information if available to preserve qualified names
					if astType != nil {
						c.WriteTypeExpr(astType)
					} else {
						c.WriteGoType(fieldType, GoTypeContextGeneral)
					}
					c.tsw.WriteLiterally("(")
					c.WriteZeroValueForType(alias.Underlying())
					c.tsw.WriteLiterally(")")
				} else {
					c.WriteZeroValueForType(fieldType)
				}
			} else {
				c.WriteZeroValueForType(fieldType)
			}
		}
	}

	c.tsw.WriteLiterally(")")
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

// WriteNamedTypeWithMethods generates a TypeScript class for a Go named type that has receiver methods
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

	c.tsw.WriteLiterallyf("class %s {", className)
	c.tsw.WriteLine("")
	c.tsw.Indent(1)

	// Constructor that takes the underlying type value
	c.tsw.WriteLiterally("constructor(private _value: ")
	// Use AST-based type writing to preserve qualified names like os.FileInfo
	c.WriteTypeExpr(a.Type)
	c.tsw.WriteLine(") {}")
	c.tsw.WriteLine("")

	// valueOf method to get the underlying value (for type conversions and operations)
	c.tsw.WriteLiterally("valueOf(): ")
	// Use AST-based type writing to preserve qualified names like os.FileInfo
	c.WriteTypeExpr(a.Type)
	c.tsw.WriteLine(" {")
	c.tsw.Indent(1)
	c.tsw.WriteLine("return this._value")
	c.tsw.Indent(-1)
	c.tsw.WriteLine("}")
	c.tsw.WriteLine("")

	// toString method for string conversion
	c.tsw.WriteLine("toString(): string {")
	c.tsw.Indent(1)
	c.tsw.WriteLine("return String(this._value)")
	c.tsw.Indent(-1)
	c.tsw.WriteLine("}")
	c.tsw.WriteLine("")

	// Static from method for type conversion
	c.tsw.WriteLiterallyf("static from(value: ")
	// Use AST-based type writing to preserve qualified names like os.FileInfo
	c.WriteTypeExpr(a.Type)
	c.tsw.WriteLiterallyf("): %s {", className)
	c.tsw.WriteLine("")
	c.tsw.Indent(1)
	c.tsw.WriteLiterallyf("return new %s(value)", className)
	c.tsw.WriteLine("")
	c.tsw.Indent(-1)
	c.tsw.WriteLine("}")

	// Add receiver methods for this type
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
				c.tsw.WriteLine("")
				if err := c.writeNamedTypeMethod(funcDecl); err != nil {
					return err
				}
			}
		}
	}

	c.tsw.Indent(-1)
	c.tsw.WriteLine("}")

	return nil
}

// writeNamedTypeMethod writes a method for a named type, handling receiver binding properly
func (c *GoToTSCompiler) writeNamedTypeMethod(decl *ast.FuncDecl) error {
	_, err := c.writeMethodSignature(decl)
	if err != nil {
		return err
	}

	return c.writeMethodBodyWithReceiverBinding(decl, "this._value")
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

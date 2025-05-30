package compiler

import (
	"fmt"
	"go/ast"
	"go/types"
	"sort"
	"strings"
)

// WriteStructTypeSpec generates the TypeScript class definition for a Go struct type.
// It handles the generation of:
//   - The class declaration.
//   - Getters and setters for all fields (both direct and embedded).
//   - The internal `_fields` property, which stores field values in `$.VarRef` containers
//     to maintain Go's value semantics.
//   - A constructor that initializes the `_fields` and allows partial initialization.
//   - A `clone` method for creating a deep copy of the struct instance.
//   - Methods defined directly on the struct.
//   - Wrapper methods for promoted fields and methods from embedded structs,
//     ensuring correct access and behavior.
func (c *GoToTSCompiler) WriteStructTypeSpec(a *ast.TypeSpec, t *ast.StructType) error {
	// Always export types for cross-file imports within the same package
	// This allows unexported Go types to be imported by other files in the same package
	c.tsw.WriteLiterally("export ")
	c.tsw.WriteLiterally("class ")
	if err := c.WriteValueExpr(a.Name); err != nil {
		return err
	}

	// Write type parameters if present (for generics)
	if a.TypeParams != nil {
		c.WriteTypeParameters(a.TypeParams)
	}

	// Generate the field type interface for GoStruct
	c.tsw.WriteLiterally(" extends $.GoStruct<{")
	
	// Collect field types for the generic interface
	goStructType, ok := c.pkg.TypesInfo.Defs[a.Name].Type().(*types.Named)
	if !ok {
		return fmt.Errorf("could not get named type for %s", a.Name.Name)
	}
	underlyingStruct, ok := goStructType.Underlying().(*types.Struct)
	if !ok {
		return fmt.Errorf("underlying type of %s is not a struct", a.Name.Name)
	}

	first := true
	for i := 0; i < underlyingStruct.NumFields(); i++ {
		field := underlyingStruct.Field(i)
		var fieldKeyName string
		if field.Anonymous() {
			fieldKeyName = c.getEmbeddedFieldKeyName(field.Type())
		} else {
			fieldKeyName = field.Name()
		}
		if fieldKeyName == "_" {
			continue
		}
		if !first {
			c.tsw.WriteLiterally("; ")
		}
		first = false
		fieldTsType := c.getTypeString(field.Type())
		c.tsw.WriteLiterallyf("%s: %s", fieldKeyName, fieldTsType)
	}
	
	c.tsw.WriteLiterally("}> {")
	c.tsw.WriteLine("")
	c.tsw.Indent(1)

	className := a.Name.Name

	// Generate the flattened type string for the constructor init parameter
	flattenedInitType := c.generateFlattenedInitTypeString(goStructType)

	c.tsw.WriteLine("")
	c.tsw.WriteLinef("constructor(init?: Partial<%s>) {", flattenedInitType)
	c.tsw.Indent(1)
	c.tsw.WriteLine("super({")
	c.tsw.Indent(1)

	numFields := underlyingStruct.NumFields()
	if numFields != 0 {
		firstFieldWritten := false
		for i := range numFields {
			field := underlyingStruct.Field(i)
			fieldType := field.Type()
			var fieldKeyName string
			if field.Anonymous() {
				fieldKeyName = c.getEmbeddedFieldKeyName(field.Type())
			} else {
				fieldKeyName = field.Name()
			}

			// Skip underscore fields
			if fieldKeyName == "_" {
				continue
			}

			if firstFieldWritten {
				c.tsw.WriteLine(",")
			}

			c.writeFieldDescriptor(fieldKeyName, fieldType, field.Anonymous())
			firstFieldWritten = true
		}
		if firstFieldWritten {
			c.tsw.WriteLine("")
		}
	}
	c.tsw.Indent(-1)
	c.tsw.WriteLine("}, init)")
	c.tsw.Indent(-1)
	c.tsw.WriteLine("}")
	c.tsw.WriteLine("")

	// Generate the clone method
	cloneReturnType := className
	if a.TypeParams != nil && len(a.TypeParams.List) > 0 {
		cloneReturnType += "<"
		first := true
		for _, field := range a.TypeParams.List {
			for _, name := range field.Names {
				if !first {
					cloneReturnType += ", "
				}
				first = false
				cloneReturnType += name.Name
			}
		}
		cloneReturnType += ">"
	}

	c.tsw.WriteLine("public clone(): this {")
	c.tsw.Indent(1)
	c.tsw.WriteLine("return super.clone()")
	c.tsw.Indent(-1)
	c.tsw.WriteLine("}")

	// Methods for this struct (direct methods)
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

			// Check for both simple identifiers (Pair) and generic types (Pair[T])
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
				if err := c.WriteFuncDeclAsMethod(funcDecl); err != nil {
					return err
				}
			}
		}
	}

	directMethods := make(map[string]bool)
	// Populate directMethods (methods defined directly on this struct type)
	for i := range goStructType.NumMethods() {
		method := goStructType.Method(i)
		sig := method.Type().(*types.Signature)
		if sig.Recv() != nil {
			recvType := sig.Recv().Type()
			if namedRecv, ok := recvType.(*types.Named); ok && namedRecv.Obj() == goStructType.Obj() {
				directMethods[method.Name()] = true
			} else if ptrRecv, ok := recvType.(*types.Pointer); ok {
				if namedElem, ok := ptrRecv.Elem().(*types.Named); ok && namedElem.Obj() == goStructType.Obj() {
					directMethods[method.Name()] = true
				}
			}
		}
	}

	// Add code to register the type with the runtime type system
	c.tsw.WriteLine("")
	c.tsw.WriteLinef("// Register this type with the runtime type system")
	c.tsw.WriteLinef("static __typeInfo = $.registerStructType(")
	c.tsw.WriteLinef("  '%s',", className)
	c.tsw.WriteLinef("  new %s(),", className)
	c.tsw.WriteLiterally("  [")
	// Collect methods for the struct type
	var structMethods []*types.Func
	for i := range goStructType.NumMethods() {
		method := goStructType.Method(i)
		// Ensure it's a method directly on this type (not promoted here, promotion handled separately)
		// Check if receiver is *T or T where T is goStructType
		sig := method.Type().(*types.Signature)
		recv := sig.Recv().Type()
		if ptr, ok := recv.(*types.Pointer); ok {
			recv = ptr.Elem()
		}
		if namedRecv, ok := recv.(*types.Named); ok && namedRecv.Obj() == goStructType.Obj() {
			structMethods = append(structMethods, method)
		}
	}
	c.writeMethodSignatures(structMethods)
	c.tsw.WriteLiterally("],")
	c.tsw.WriteLine("")

	c.tsw.WriteLinef("  %s,", className)
	// Add field type information for type assertions
	c.tsw.WriteLiterally("  {")
	firstField := true
	for i := 0; i < underlyingStruct.NumFields(); i++ {
		field := underlyingStruct.Field(i)
		var fieldKeyName string
		if field.Anonymous() {
			fieldKeyName = c.getEmbeddedFieldKeyName(field.Type())
		} else {
			fieldKeyName = field.Name()
		}
		// Skip underscore fields
		if fieldKeyName == "_" {
			continue
		}
		// fieldTsType := c.getTypeString(field.Type())
		if !firstField {
			c.tsw.WriteLiterally(", ")
		}
		firstField = false
		c.tsw.WriteLiterallyf("%q: ", fieldKeyName)
		c.writeTypeInfoObject(field.Type()) // Use writeTypeInfoObject for field types
	}
	c.tsw.WriteLiterally("}")
	c.tsw.WriteLine("")
	c.tsw.WriteLinef(");")

	c.tsw.Indent(-1)
	c.tsw.WriteLine("}")
	return nil
}

// generateFlattenedInitTypeString generates a TypeScript type string for the
// initialization object passed to a Go struct's constructor (`_init` method in TypeScript).
// The generated type is a `Partial`-like structure, `"{ Field1?: Type1, Field2?: Type2, ... }"`,
// including all direct and promoted fields of the `structType`.
//   - It iterates through the direct fields of the `structType`. Exported fields
//     are included with their TypeScript types (obtained via `WriteGoType`).
//   - For anonymous (embedded) fields, it generates a type like `EmbeddedName?: ConstructorParameters<typeof EmbeddedName>[0]`,
//     allowing initialization of the embedded struct's fields directly within the outer struct's initializer.
//   - It then uses `types.NewMethodSet` and checks for `types.Var` objects that are fields
//     to find promoted fields from embedded structs, adding them to the type string if not already present.
//
// The resulting string is sorted by field name for deterministic output and represents
// the shape of the object expected by the struct's TypeScript constructor.
func (c *GoToTSCompiler) generateFlattenedInitTypeString(structType *types.Named) string {
	if structType == nil {
		return "{}"
	}

	// Use a map to collect unique field names and their types
	fieldMap := make(map[string]string)
	embeddedTypeMap := make(map[string]string) // Stores TS type string for embedded struct initializers

	underlying, ok := structType.Underlying().(*types.Struct)
	if !ok {
		return "{}"
	}

	// First add the direct fields and track embedded types
	for i := 0; i < underlying.NumFields(); i++ {
		field := underlying.Field(i)
		fieldName := field.Name()

		// Skip underscore fields
		if fieldName == "_" {
			continue
		}

		if !field.Exported() && field.Pkg() != c.pkg.Types {
			continue
		}

		if field.Anonymous() {
			fieldType := field.Type()
			if ptr, ok := fieldType.(*types.Pointer); ok {
				fieldType = ptr.Elem()
			}

			if named, ok := fieldType.(*types.Named); ok {
				embeddedName := named.Obj().Name()
				// Check if the embedded type is an interface
				if _, isInterface := fieldType.Underlying().(*types.Interface); isInterface {
					// For embedded interfaces, use the full qualified interface type
					embeddedTypeMap[c.getEmbeddedFieldKeyName(field.Type())] = c.getTypeString(field.Type())
				} else {
					// For embedded structs, use a union type that accepts both the struct type and a partial initialization object
					fieldTypeString := c.generateStructFieldsTypeString(fieldType)
					embeddedTypeMap[c.getEmbeddedFieldKeyName(field.Type())] = fmt.Sprintf("%s | Partial<{%s}>", embeddedName, fieldTypeString)
				}
			}
			continue
		}
		fieldMap[fieldName] = c.getTypeString(field.Type())
	}

	// Promoted fields (handled by Go's embedding, init should use direct/embedded names)
	// The current logic for `generateFlattenedInitTypeString` seems to focus on top-level
	// settable properties in the constructor. Promoted fields are accessed via `this.promotedField`,
	// not typically set directly in `init?` unless the embedded struct itself is named in `init?`.

	// Add embedded types to the field map (these are the names of the embedded structs themselves)
	for embeddedName, embeddedTSType := range embeddedTypeMap {
		fieldMap[embeddedName] = embeddedTSType
	}

	var fieldNames []string
	for name := range fieldMap {
		fieldNames = append(fieldNames, name)
	}
	sort.Strings(fieldNames)

	var fieldDefs []string
	for _, fieldName := range fieldNames {
		fieldDefs = append(fieldDefs, fmt.Sprintf("%s?: %s", fieldName, fieldMap[fieldName]))
	}

	return "{" + strings.Join(fieldDefs, ", ") + "}"
}

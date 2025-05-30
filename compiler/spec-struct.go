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

	c.tsw.WriteLiterally(" ")
	c.tsw.WriteLine("{")
	c.tsw.Indent(1)

	className := a.Name.Name

	goStructType, ok := c.pkg.TypesInfo.Defs[a.Name].Type().(*types.Named)
	if !ok {
		return fmt.Errorf("could not get named type for %s", a.Name.Name)
	}
	underlyingStruct, ok := goStructType.Underlying().(*types.Struct)
	if !ok {
		return fmt.Errorf("underlying type of %s is not a struct", a.Name.Name)
	}

	// Generate getters and setters for each non-embedded field first
	for _, field := range t.Fields.List {
		if len(field.Names) == 0 { // Skip anonymous/embedded fields here; they are handled below or via promotion
			continue
		}
		for _, name := range field.Names {
			fieldName := name.Name
			// Skip underscore fields
			if fieldName == "_" {
				continue
			}
			fieldType := c.pkg.TypesInfo.TypeOf(field.Type)
			if fieldType == nil {
				fieldType = types.Typ[types.Invalid]
			}
			c.writeGetterSetter(fieldName, fieldType, field.Doc, field.Comment)
		}
	}

	// Generate getters and setters for EMBEDDED struct fields themselves
	for i := range underlyingStruct.NumFields() {
		field := underlyingStruct.Field(i)
		if field.Anonymous() {
			fieldKeyName := c.getEmbeddedFieldKeyName(field.Type())
			c.writeGetterSetter(fieldKeyName, field.Type(), nil, nil)
		}
	}

	// Create a mapping from field names to AST types for preserving qualified names
	fieldASTTypes := make(map[string]ast.Expr)
	for _, field := range t.Fields.List {
		if len(field.Names) > 0 {
			for _, name := range field.Names {
				fieldASTTypes[name.Name] = field.Type
			}
		}
	}

	// Define the _fields property type
	c.tsw.WriteLiterally("public _fields: {")
	c.tsw.Indent(1)
	c.tsw.WriteLine("")

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

		// Use AST-based type string when available, fall back to types-based
		astType := fieldASTTypes[fieldKeyName]
		fieldTsType := c.getASTTypeString(astType, field.Type())
		c.tsw.WriteLinef("%s: $.VarRef<%s>;", fieldKeyName, fieldTsType)
	}
	c.tsw.Indent(-1)
	c.tsw.WriteLine("}")

	// Generate the flattened type string for the constructor init parameter
	flattenedInitType := c.generateFlattenedInitTypeString(goStructType, fieldASTTypes)

	c.tsw.WriteLine("")
	c.tsw.WriteLinef("constructor(init?: Partial<%s>) {", flattenedInitType)
	c.tsw.Indent(1)
	c.tsw.WriteLiterally("this._fields = {")

	numFields := underlyingStruct.NumFields()
	if numFields != 0 {
		c.tsw.WriteLine("")
		c.tsw.Indent(1)

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

			c.writeVarRefedFieldInitializer(fieldKeyName, fieldType, field.Anonymous())
			firstFieldWritten = true
		}
		if firstFieldWritten {
			c.tsw.WriteLine("")
		}
		c.tsw.Indent(-1)
	}
	c.tsw.WriteLine("}")

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

	c.tsw.WriteLinef("public clone(): %s {", cloneReturnType)
	c.tsw.Indent(1)
	c.tsw.WriteLinef("const cloned = new %s()", cloneReturnType)
	c.tsw.WriteLine("cloned._fields = {")
	c.tsw.Indent(1)

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

		c.writeClonedFieldInitializer(fieldKeyName, fieldType, field.Anonymous())
		firstFieldWritten = true
	}
	if firstFieldWritten {
		c.tsw.WriteLine("")
	}

	c.tsw.Indent(-1)
	c.tsw.WriteLine("}")
	c.tsw.WriteLine("return cloned")
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

	// Generate getters/setters and wrapper methods for PROMOTED fields/methods from embedded structs
	seenPromotedFields := make(map[string]bool)
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

	for i := range underlyingStruct.NumFields() {
		field := underlyingStruct.Field(i)
		if !field.Anonymous() {
			continue
		}

		embeddedFieldType := field.Type()
		embeddedFieldKeyName := c.getEmbeddedFieldKeyName(field.Type())

		// Skip if not a named type (required for proper embedding promotion)
		trueEmbeddedType := embeddedFieldType
		if ptr, isPtr := trueEmbeddedType.(*types.Pointer); isPtr {
			trueEmbeddedType = ptr.Elem()
		}
		if _, isNamed := trueEmbeddedType.(*types.Named); !isNamed {
			continue
		}

		// Promoted fields
		if namedEmbedded, ok := trueEmbeddedType.(*types.Named); ok {
			if underlyingEmbeddedStruct, ok := namedEmbedded.Underlying().(*types.Struct); ok {
				for j := 0; j < underlyingEmbeddedStruct.NumFields(); j++ {
					promotedField := underlyingEmbeddedStruct.Field(j)
					if !promotedField.Exported() && promotedField.Pkg() != c.pkg.Types {
						continue
					}
					promotedFieldName := promotedField.Name()
					if seenPromotedFields[promotedFieldName] {
						continue
					}
					// Check for conflicts with outer struct's own fields or other promoted fields
					conflict := false
					for k := 0; k < underlyingStruct.NumFields(); k++ {
						if !underlyingStruct.Field(k).Anonymous() && underlyingStruct.Field(k).Name() == promotedFieldName {
							conflict = true
							break
						}
					}
					if conflict {
						continue
					}

					seenPromotedFields[promotedFieldName] = true
					tsPromotedFieldType := c.getTypeString(promotedField.Type())
					c.tsw.WriteLine("")
					c.tsw.WriteLinef("public get %s(): %s {", promotedFieldName, tsPromotedFieldType)
					c.tsw.Indent(1)
					// Check if the embedded type is an interface and add null assertion
					embeddedFieldTypeUnderlying := embeddedFieldType
					if ptr, isPtr := embeddedFieldTypeUnderlying.(*types.Pointer); isPtr {
						embeddedFieldTypeUnderlying = ptr.Elem()
					}
					if named, isNamed := embeddedFieldTypeUnderlying.(*types.Named); isNamed {
						embeddedFieldTypeUnderlying = named.Underlying()
					}
					if _, isInterface := embeddedFieldTypeUnderlying.(*types.Interface); isInterface {
						c.tsw.WriteLinef("return this.%s!.%s", embeddedFieldKeyName, promotedFieldName)
					} else {
						c.tsw.WriteLinef("return this.%s.%s", embeddedFieldKeyName, promotedFieldName)
					}
					c.tsw.Indent(-1)
					c.tsw.WriteLine("}")
					c.tsw.WriteLinef("public set %s(value: %s) {", promotedFieldName, tsPromotedFieldType)
					c.tsw.Indent(1)
					if _, isInterface := embeddedFieldTypeUnderlying.(*types.Interface); isInterface {
						c.tsw.WriteLinef("this.%s!.%s = value", embeddedFieldKeyName, promotedFieldName)
					} else {
						c.tsw.WriteLinef("this.%s.%s = value", embeddedFieldKeyName, promotedFieldName)
					}
					c.tsw.Indent(-1)
					c.tsw.WriteLine("}")
				}
			}
		}

		// Promoted methods
		embeddedMethodSet := types.NewMethodSet(embeddedFieldType) // Use original field type for method set
		for k := range embeddedMethodSet.Len() {
			methodSelection := embeddedMethodSet.At(k)
			method := methodSelection.Obj().(*types.Func)
			methodName := method.Name()

			// Skip if it's not a promoted method (indirect) or if it's shadowed by a direct method or an already processed promoted method
			if len(methodSelection.Index()) == 1 && !directMethods[methodName] && !seenPromotedFields[methodName] {
				// Check for conflict with outer struct's own fields
				conflictWithField := false
				for k_idx := 0; k_idx < underlyingStruct.NumFields(); k_idx++ {
					if !underlyingStruct.Field(k_idx).Anonymous() && underlyingStruct.Field(k_idx).Name() == methodName {
						conflictWithField = true
						break
					}
				}
				if conflictWithField {
					continue
				}

				seenPromotedFields[methodName] = true // Mark as handled to avoid duplicates from other embeddings
				sig := method.Type().(*types.Signature)
				c.tsw.WriteLine("")
				c.tsw.WriteLiterally("public ")
				c.tsw.WriteLiterally(methodName)
				c.tsw.WriteLiterally("(")
				params := sig.Params()
				paramNames := make([]string, params.Len())
				for j := 0; j < params.Len(); j++ {
					param := params.At(j)
					paramName := param.Name()
					if paramName == "" || paramName == "_" {
						paramName = fmt.Sprintf("_p%d", j)
					}
					paramNames[j] = paramName
					if j > 0 {
						c.tsw.WriteLiterally(", ")
					}
					c.tsw.WriteLiterally(paramName)
					c.tsw.WriteLiterally(": ")
					c.WriteGoType(param.Type(), GoTypeContextGeneral)
				}
				c.tsw.WriteLiterally(")")
				results := sig.Results()
				if results.Len() > 0 {
					c.tsw.WriteLiterally(": ")
					if results.Len() == 1 {
						c.WriteGoType(results.At(0).Type(), GoTypeContextFunctionReturn)
					} else {
						c.tsw.WriteLiterally("[")
						for j := 0; j < results.Len(); j++ {
							if j > 0 {
								c.tsw.WriteLiterally(", ")
							}
							c.WriteGoType(results.At(j).Type(), GoTypeContextFunctionReturn)
						}
						c.tsw.WriteLiterally("]")
					}
				} else {
					c.tsw.WriteLiterally(": void")
				}
				c.tsw.WriteLine(" {")
				c.tsw.Indent(1)
				if results.Len() > 0 {
					c.tsw.WriteLiterally("return ")
				}

				assertionPrefix := "this.%s"
				if _, isInterface := embeddedFieldType.Underlying().(*types.Interface); isInterface {
					assertionPrefix = "this.%s!"
				}
				c.tsw.WriteLiterallyf(assertionPrefix+".%s(%s)", embeddedFieldKeyName, methodName, strings.Join(paramNames, ", "))

				c.tsw.WriteLine("")
				c.tsw.Indent(-1)
				c.tsw.WriteLine("}")
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
func (c *GoToTSCompiler) generateFlattenedInitTypeString(structType *types.Named, fieldASTTypes map[string]ast.Expr) string {
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
					// For embedded structs, use ConstructorParameters for field-based initialization
					embeddedTypeMap[c.getEmbeddedFieldKeyName(field.Type())] = fmt.Sprintf("Partial<ConstructorParameters<typeof %s>[0]>", embeddedName)
				}
			}
			continue
		}
		fieldMap[fieldName] = c.getASTTypeString(fieldASTTypes[fieldName], field.Type())
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

package compiler

import (
	"fmt"
	"go/ast"
	"go/types"
	"strings"
)

// WriteStructTypeSpec generates the TypeScript class definition for a Go struct type.
// It handles the generation of:
//   - The class declaration.
//   - Getters and setters for all fields (both direct and embedded).
//   - The internal `_fields` property, which stores field values in `$.Box` containers
//     to maintain Go's value semantics.
//   - A constructor that initializes the `_fields` and allows partial initialization.
//   - A `clone` method for creating a deep copy of the struct instance.
//   - Methods defined directly on the struct.
//   - Wrapper methods for promoted fields and methods from embedded structs,
//     ensuring correct access and behavior.
func (c *GoToTSCompiler) WriteStructTypeSpec(a *ast.TypeSpec, t *ast.StructType) error {
	c.tsw.WriteLiterally("class ")
	if err := c.WriteValueExpr(a.Name); err != nil {
		return err
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
		fieldTsType := c.getTypeString(field.Type())
		c.tsw.WriteLinef("%s: $.Box<%s>;", fieldKeyName, fieldTsType)
	}
	c.tsw.Indent(-1)
	c.tsw.WriteLine("}")

	// Generate the flattened type string for the constructor init parameter
	flattenedInitType := c.generateFlattenedInitTypeString(goStructType)

	c.tsw.WriteLine("")
	c.tsw.WriteLinef("constructor(init?: Partial<%s>) {", flattenedInitType)
	c.tsw.Indent(1)
	c.tsw.WriteLiterally("this._fields = {")

	numFields := underlyingStruct.NumFields()
	if numFields != 0 {
		c.tsw.WriteLine("")
		c.tsw.Indent(1)

		for i := range numFields {
			field := underlyingStruct.Field(i)
			fieldType := field.Type()
			var fieldKeyName string
			if field.Anonymous() {
				fieldKeyName = c.getEmbeddedFieldKeyName(field.Type())
			} else {
				fieldKeyName = field.Name()
			}

			c.writeBoxedFieldInitializer(fieldKeyName, fieldType, field.Anonymous())

			if i < numFields-1 {
				c.tsw.WriteLine(",")
			} else {
				c.tsw.WriteLine("")
			}
		}
		c.tsw.Indent(-1)
	}
	c.tsw.WriteLine("}")

	c.tsw.Indent(-1)
	c.tsw.WriteLine("}")
	c.tsw.WriteLine("")

	// Generate the clone method
	c.tsw.WriteLinef("public clone(): %s {", className)
	c.tsw.Indent(1)
	c.tsw.WriteLinef("const cloned = new %s()", className)
	c.tsw.WriteLine("cloned._fields = {")
	c.tsw.Indent(1)

	for i := range numFields {
		field := underlyingStruct.Field(i)
		fieldType := field.Type()
		var fieldKeyName string
		if field.Anonymous() {
			fieldKeyName = c.getEmbeddedFieldKeyName(field.Type())
		} else {
			fieldKeyName = field.Name()
		}

		c.writeClonedFieldInitializer(fieldKeyName, fieldType, field.Anonymous())

		if i < numFields-1 {
			c.tsw.WriteLine(",")
		} else {
			c.tsw.WriteLine("")
		}
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
			if ident, ok := recvType.(*ast.Ident); ok && ident.Name == className {
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
					c.tsw.WriteLinef("return this.%s.%s", embeddedFieldKeyName, promotedFieldName)
					c.tsw.Indent(-1)
					c.tsw.WriteLine("}")
					c.tsw.WriteLinef("public set %s(value: %s) {", promotedFieldName, tsPromotedFieldType)
					c.tsw.Indent(1)
					c.tsw.WriteLinef("this.%s.%s = value", embeddedFieldKeyName, promotedFieldName)
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
					c.WriteGoType(param.Type())
				}
				c.tsw.WriteLiterally(")")
				results := sig.Results()
				if results.Len() > 0 {
					c.tsw.WriteLiterally(": ")
					if results.Len() == 1 {
						c.WriteGoType(results.At(0).Type())
					} else {
						c.tsw.WriteLiterally("[")
						for j := 0; j < results.Len(); j++ {
							if j > 0 {
								c.tsw.WriteLiterally(", ")
							}
							c.WriteGoType(results.At(j).Type())
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
				c.tsw.WriteLiterallyf("this.%s.%s(%s)", embeddedFieldKeyName, methodName, strings.Join(paramNames, ", "))
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

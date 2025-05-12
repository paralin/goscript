package compiler

import (
	"fmt"
	"go/ast"
	"go/types"
	"strings"

	// types provides type information for Go types.
	"github.com/pkg/errors"
)

func (c *GoToTSCompiler) getEmbeddedFieldKeyName(fieldType types.Type) string {
	trueType := fieldType
	if ptr, isPtr := trueType.(*types.Pointer); isPtr {
		trueType = ptr.Elem()
	}

	if named, isNamed := trueType.(*types.Named); isNamed {
		return named.Obj().Name()
	} else {
		// Fallback for unnamed embedded types, though less common for structs
		fieldKeyName := strings.Title(trueType.String()) // Simple heuristic
		if dotIndex := strings.LastIndex(fieldKeyName, "."); dotIndex != -1 {
			fieldKeyName = fieldKeyName[dotIndex+1:]
		}
		return fieldKeyName
	}
}

func (c *GoToTSCompiler) writeGetterSetter(fieldName string, fieldType types.Type, doc, comment *ast.CommentGroup) {
	fieldTypeStr := c.getTypeString(fieldType)

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

func (c *GoToTSCompiler) writeBoxedFieldInitializer(fieldName string, fieldType types.Type, isEmbedded bool) {
	c.tsw.WriteLiterally(fieldName)
	c.tsw.WriteLiterally(": $.box(")

	if isEmbedded {
		if _, isPtr := fieldType.(*types.Pointer); isPtr {
			c.tsw.WriteLiterallyf("init?.%s ?? null", fieldName)
		} else {
			typeForNew := fieldName
			c.tsw.WriteLiterallyf("new %s(init?.%s)", typeForNew, fieldName)
		}
	} else {
		isStructValueType := false
		var structTypeNameForClone string
		if named, ok := fieldType.(*types.Named); ok {
			if _, isStruct := named.Underlying().(*types.Struct); isStruct {
				isStructValueType = true
				structTypeNameForClone = named.Obj().Name()
			}
		}

		if isStructValueType {
			c.tsw.WriteLiterallyf("init?.%s?.clone() ?? new %s()", fieldName, structTypeNameForClone)
		} else {
			c.tsw.WriteLiterallyf("init?.%s ?? ", fieldName)
			c.WriteZeroValueForType(fieldType)
		}
	}

	c.tsw.WriteLiterally(")")
}

func (c *GoToTSCompiler) writeClonedFieldInitializer(fieldName string, fieldType types.Type, isEmbedded bool) {
	c.tsw.WriteLiterally(fieldName)
	c.tsw.WriteLiterally(": $.box(")

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
		// type alias
		c.tsw.WriteLiterally("type ")
		if err := c.WriteValueExpr(a.Name); err != nil {
			return err
		}
		c.tsw.WriteLiterally(" = ")
		c.WriteTypeExpr(a.Type) // The aliased type
		c.tsw.WriteLine(";")
	}
	return nil
}

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
	for i := 0; i < underlyingStruct.NumFields(); i++ {
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
	c.tsw.WriteLine("this._fields = {")
	c.tsw.Indent(1)

	numFields := underlyingStruct.NumFields()
	for i := 0; i < numFields; i++ {
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

	for i := 0; i < numFields; i++ {
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
	for i := 0; i < goStructType.NumMethods(); i++ {
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

	for i := 0; i < underlyingStruct.NumFields(); i++ {
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
		for k := 0; k < embeddedMethodSet.Len(); k++ {
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

	// Add code to register the type with the runtime system
	c.tsw.WriteLine("")
	c.tsw.WriteLinef("// Register this type with the runtime type system")
	c.tsw.WriteLinef("static __typeInfo = $.registerType(")
	c.tsw.WriteLinef("  '%s',", className)
	c.tsw.WriteLinef("  $.TypeKind.Struct,")
	c.tsw.WriteLinef("  new %s(),", className)
	c.tsw.WriteLinef("  new Set([%s]),", c.collectMethodNames(className)) // collectMethodNames should ideally consider promoted methods too
	c.tsw.WriteLinef("  %s", className)
	c.tsw.WriteLinef(");")

	c.tsw.Indent(-1)
	c.tsw.WriteLine("}")
	return nil
}

// WriteInterfaceTypeSpec writes the TypeScript type for a Go interface type.
func (c *GoToTSCompiler) WriteInterfaceTypeSpec(a *ast.TypeSpec, t *ast.InterfaceType) error {
	c.tsw.WriteLiterally("type ")
	if err := c.WriteValueExpr(a.Name); err != nil {
		return err
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
	c.tsw.WriteLinef("const %s__typeInfo = $.registerType(", interfaceName)
	c.tsw.WriteLinef("  '%s',", interfaceName)
	c.tsw.WriteLinef("  $.TypeKind.Interface,")
	c.tsw.WriteLinef("  null, // Zero value for interface is null")
	c.tsw.WriteLinef("  new Set([%s]),", c.collectInterfaceMethods(t))
	c.tsw.WriteLinef("  undefined")
	c.tsw.WriteLinef(");")

	return nil
}

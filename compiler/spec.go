package compiler

import (
	"fmt"
	"go/ast"
	"go/token"
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
	c.tsw.WriteLiterally("this._fields = {")

	numFields := underlyingStruct.NumFields()
	if numFields != 0 {
		c.tsw.WriteLine("")
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

	// Add code to register the type with the runtime type system
	c.tsw.WriteLine("")
	c.tsw.WriteLinef("// Register this type with the runtime type system")
	c.tsw.WriteLinef("static __typeInfo = $.registerStructType(")
	c.tsw.WriteLinef("  '%s',", className)
	c.tsw.WriteLinef("  new %s(),", className)
	c.tsw.WriteLiterally("  [")
	// Collect methods for the struct type
	var structMethods []*types.Func
	for i := 0; i < goStructType.NumMethods(); i++ {
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
	c.writeMethodSignatures(structMethods, false)
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
	c.tsw.WriteLinef("$.registerInterfaceType(")
	c.tsw.WriteLinef("  '%s',", interfaceName)
	c.tsw.WriteLinef("  null, // Zero value for interface is null")

	// Collect methods for the interface type
	var interfaceMethods []*types.Func
	if ifaceType != nil { // ifaceType is *types.Interface
		for i := 0; i < ifaceType.NumExplicitMethods(); i++ {
			interfaceMethods = append(interfaceMethods, ifaceType.ExplicitMethod(i))
		}
		// TODO: Handle embedded interface methods if necessary for full signature collection.
		// For now, explicit methods are covered.
	}
	c.tsw.WriteLiterally("  [")
	c.writeMethodSignatures(interfaceMethods, true)
	c.tsw.WriteLiterally("]")
	c.tsw.WriteLine("")

	c.tsw.WriteLinef(");")

	return nil
}

// writeTypeInfoObject writes a TypeScript TypeInfo object literal for a given Go type.
func (c *GoToTSCompiler) writeTypeInfoObject(typ types.Type) {
	if typ == nil {
		c.tsw.WriteLiterally("{ kind: $.TypeKind.Basic, name: 'any' }") // Or handle as error
		return
	}

	// If typ is a *types.Named, handle it by reference to break recursion.
	if namedType, ok := typ.(*types.Named); ok {
		if namedType.Obj().Name() == "error" && namedType.Obj().Pkg() == nil { // Check for builtin error
			c.tsw.WriteLiterally("{ kind: $.TypeKind.Interface, name: 'GoError', methods: [{ name: 'Error', args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: 'string' } }] }] }")
		} else {
			// For all other named types, output their name as a string literal.
			// This relies on the type being registered elsewhere (e.g., via registerStructType or registerInterfaceType)
			// so the TypeScript runtime can resolve the reference.
			c.tsw.WriteLiterallyf("%q", namedType.Obj().Name())
		}
		return // Return after handling the named type by reference.
	}

	// If typ is not *types.Named, process its underlying structure.
	underlying := typ.Underlying()
	switch t := underlying.(type) {
	case *types.Basic:
		tsTypeName, _ := GoBuiltinToTypescript(t.Name())
		if tsTypeName == "" {
			tsTypeName = t.Name() // Fallback
		}
		c.tsw.WriteLiterallyf("{ kind: $.TypeKind.Basic, name: %q }", tsTypeName)
	// Note: The original 'case *types.Named:' here for 'underlying' is intentionally omitted.
	// If typ.Underlying() is *types.Named (e.g. type T1 MyInt; type T2 T1;),
	// then writeTypeInfoObject(typ.Underlying()) would be called in some contexts,
	// and that call would handle it via the top-level *types.Named check.
	case *types.Pointer:
		c.tsw.WriteLiterally("{ kind: $.TypeKind.Pointer, elemType: ")
		c.writeTypeInfoObject(t.Elem()) // Recursive call
		c.tsw.WriteLiterally(" }")
	case *types.Slice:
		c.tsw.WriteLiterally("{ kind: $.TypeKind.Slice, elemType: ")
		c.writeTypeInfoObject(t.Elem()) // Recursive call
		c.tsw.WriteLiterally(" }")
	case *types.Array:
		c.tsw.WriteLiterallyf("{ kind: $.TypeKind.Array, length: %d, elemType: ", t.Len())
		c.writeTypeInfoObject(t.Elem()) // Recursive call
		c.tsw.WriteLiterally(" }")
	case *types.Map:
		c.tsw.WriteLiterally("{ kind: $.TypeKind.Map, keyType: ")
		c.writeTypeInfoObject(t.Key()) // Recursive call
		c.tsw.WriteLiterally(", elemType: ")
		c.writeTypeInfoObject(t.Elem()) // Recursive call
		c.tsw.WriteLiterally(" }")
	case *types.Chan:
		dir := "both"
		if t.Dir() == types.SendOnly {
			dir = "send"
		} else if t.Dir() == types.RecvOnly {
			dir = "receive"
		}
		c.tsw.WriteLiterallyf("{ kind: $.TypeKind.Channel, direction: %q, elemType: ", dir)
		c.writeTypeInfoObject(t.Elem()) // Recursive call
		c.tsw.WriteLiterally(" }")
	case *types.Interface: // Anonymous interface or underlying of a non-named type alias
		c.tsw.WriteLiterally("{ kind: $.TypeKind.Interface, methods: [")
		var methods []*types.Func
		for i := 0; i < t.NumExplicitMethods(); i++ {
			methods = append(methods, t.ExplicitMethod(i))
		}
		// TODO: Handle embedded methods for anonymous interfaces if needed.
		c.writeMethodSignatures(methods, true) // Calls writeMethodSignatures -> writeTypeInfoObject
		c.tsw.WriteLiterally("] }")
	case *types.Signature: // Anonymous func type or underlying of a non-named type alias
		c.tsw.WriteLiterally("{ kind: $.TypeKind.Function, params: [")
		for i := 0; i < t.Params().Len(); i++ {
			if i > 0 {
				c.tsw.WriteLiterally(", ")
			}
			c.writeTypeInfoObject(t.Params().At(i).Type()) // Recursive call
		}
		c.tsw.WriteLiterally("], results: [")
		for i := 0; i < t.Results().Len(); i++ {
			if i > 0 {
				c.tsw.WriteLiterally(", ")
			}
			c.writeTypeInfoObject(t.Results().At(i).Type()) // Recursive call
		}
		c.tsw.WriteLiterally("] }")
	case *types.Struct: // Anonymous struct or underlying of a non-named type alias
		c.tsw.WriteLiterally("{ kind: $.TypeKind.Struct, fields: {")
		for i := 0; i < t.NumFields(); i++ {
			if i > 0 {
				c.tsw.WriteLiterally(", ")
			}
			field := t.Field(i)
			c.tsw.WriteLiterallyf("%q: ", field.Name())
			c.writeTypeInfoObject(field.Type()) // Recursive call
		}
		c.tsw.WriteLiterally("}, methods: [] }") // Anonymous structs don't have methods in this context
	default:
		// Fallback, e.g. for types whose underlying isn't one of the above like *types.Tuple or other complex cases.
		c.tsw.WriteLiterallyf("{ kind: $.TypeKind.Basic, name: %q }", typ.String()) // Fallback using the type's string representation
	}
}

// writeMethodSignatures writes an array of TypeScript MethodSignature objects.
func (c *GoToTSCompiler) writeMethodSignatures(methods []*types.Func, isInterface bool) {
	firstMethod := true
	for _, method := range methods {
		if !firstMethod {
			c.tsw.WriteLiterally(", ")
		}
		firstMethod = false

		sig := method.Type().(*types.Signature)
		c.tsw.WriteLiterallyf("{ name: %q, args: [", method.Name())
		for i := 0; i < sig.Params().Len(); i++ {
			if i > 0 {
				c.tsw.WriteLiterally(", ")
			}
			param := sig.Params().At(i)
			c.tsw.WriteLiterallyf("{ name: %q, type: ", param.Name())
			c.writeTypeInfoObject(param.Type())
			c.tsw.WriteLiterally(" }")
		}
		c.tsw.WriteLiterally("], returns: [")
		for i := 0; i < sig.Results().Len(); i++ {
			if i > 0 {
				c.tsw.WriteLiterally(", ")
			}
			result := sig.Results().At(i)
			// Return parameters in Go often don't have names that are relevant for TS signature matching
			c.tsw.WriteLiterally("{ type: ")
			c.writeTypeInfoObject(result.Type())
			c.tsw.WriteLiterally(" }")
		}
		c.tsw.WriteLiterally("] }")
	}
}

// WriteValueSpec translates a Go value specification (`ast.ValueSpec`),
// which represents `var` or `const` declarations, into TypeScript `let`
// declarations.
//
// For single variable declarations (`var x T = val` or `var x = val` or `var x T`):
//   - It determines if the variable `x` needs to be boxed (e.g., if its address is taken)
//     using `c.analysis.NeedsBoxed(obj)`.
//   - If boxed: `let x: $.Box<T_ts> = $.box(initializer_ts_or_zero_ts);`
//     The type annotation is `$.Box<T_ts>`, and the initializer is wrapped in `$.box()`.
//   - If not boxed: `let x: T_ts = initializer_ts_or_zero_ts;`
//     The type annotation is `T_ts`. If the initializer is `&unboxedVar`, it becomes `$.box(unboxedVar_ts)`.
//     If the RHS is a struct value, `.clone()` is applied to maintain Go's value semantics.
//   - If no initializer is provided, the TypeScript zero value (from `WriteZeroValueForType`)
//     is used.
//   - Type `T` (or `T_ts`) is obtained from `obj.Type()` and translated via `WriteGoType`.
//
// For multiple variable declarations (`var a, b = val1, val2` or `a, b := val1, val2`):
//   - It uses TypeScript array destructuring: `let [a, b] = [val1_ts, val2_ts];`.
//   - If initialized from a single multi-return function call (`a, b := func()`),
//     it becomes `let [a, b] = func_ts();`.
//   - If no initializers are provided, it defaults to `let [a,b] = []` (with a TODO
//     to assign correct individual zero values).
//
// Documentation comments associated with the `ValueSpec` are preserved.
func (c *GoToTSCompiler) WriteValueSpec(a *ast.ValueSpec) error {
	if a.Doc != nil {
		c.WriteDoc(a.Doc)
	}
	if a.Comment != nil {
		c.WriteDoc(a.Comment)
	}

	// Handle single variable declaration
	if len(a.Names) == 1 {
		name := a.Names[0]
		obj := c.pkg.TypesInfo.Defs[name]
		if obj == nil {
			return errors.Errorf("could not resolve type: %v", name)
		}

		goType := obj.Type()
		needsBox := c.analysis.NeedsBoxed(obj) // Check if address is taken

		// Start declaration
		c.tsw.WriteLiterally("let ")
		c.tsw.WriteLiterally(name.Name)
		c.tsw.WriteLiterally(": ")

		// Write type annotation
		if needsBox {
			// If boxed, the variable holds Box<OriginalGoType>
			c.tsw.WriteLiterally("$.Box<")
			c.WriteGoType(goType) // Write the original Go type T
			c.tsw.WriteLiterally(">")
		} else {
			// If not boxed, the variable holds the translated Go type directly
			c.WriteGoType(goType)
		}

		// Write initializer
		c.tsw.WriteLiterally(" = ")
		hasInitializer := len(a.Values) > 0
		var initializerExpr ast.Expr
		if hasInitializer {
			initializerExpr = a.Values[0]

			// Special case for nil pointer to struct type: (*struct{})(nil)
			if callExpr, isCallExpr := initializerExpr.(*ast.CallExpr); isCallExpr {
				if starExpr, isStarExpr := callExpr.Fun.(*ast.StarExpr); isStarExpr {
					if _, isStructType := starExpr.X.(*ast.StructType); isStructType {
						// Check if the argument is nil
						if len(callExpr.Args) == 1 {
							if nilIdent, isIdent := callExpr.Args[0].(*ast.Ident); isIdent && nilIdent.Name == "nil" {
								c.tsw.WriteLiterally("null")
								return nil
							}
						}
					}
				}
			}
		}

		if needsBox {
			// Boxed variable: let v: Box<T> = $.box(init_or_zero);
			c.tsw.WriteLiterally("$.box(")
			if hasInitializer {
				// Write the compiled initializer expression normally
				if err := c.WriteValueExpr(initializerExpr); err != nil {
					return err
				}
			} else {
				// No initializer, box the zero value
				c.WriteZeroValueForType(goType)
			}
			c.tsw.WriteLiterally(")")
		} else {
			// Unboxed variable: let v: T = init_or_zero;
			if hasInitializer {
				// Handle &v initializer specifically for unboxed variables
				if unaryExpr, isUnary := initializerExpr.(*ast.UnaryExpr); isUnary && unaryExpr.Op == token.AND {
					// Initializer is &v
					// Check if v is boxed
					needsBoxOperand := false
					unaryExprXIdent, ok := unaryExpr.X.(*ast.Ident)
					if ok {
						innerObj := c.pkg.TypesInfo.Uses[unaryExprXIdent]
						needsBoxOperand = innerObj != nil && c.analysis.NeedsBoxed(innerObj)
					}

					// If v is boxed, assign the box itself (v)
					// If v is not boxed, assign $.box(v)
					if needsBoxOperand {
						// special handling: do not write .value here.
						c.WriteIdent(unaryExprXIdent, false)
					} else {
						// &unboxedVar -> $.box(unboxedVar)
						c.tsw.WriteLiterally("$.box(")
						if err := c.WriteValueExpr(unaryExpr.X); err != nil { // Write 'v'
							return err
						}
						c.tsw.WriteLiterally(")")
					}
				} else {
					// Regular initializer, clone if needed
					if shouldApplyClone(c.pkg, initializerExpr) {
						if err := c.WriteValueExpr(initializerExpr); err != nil {
							return err
						}
						c.tsw.WriteLiterally(".clone()")
					} else {
						if err := c.WriteValueExpr(initializerExpr); err != nil {
							return err
						}
					}
				}
			} else {
				// No initializer, use the zero value directly
				c.WriteZeroValueForType(goType)
			}
		}
		c.tsw.WriteLine("") // Finish the declaration line
		return nil
	}

	// --- Multi-variable declaration (existing logic seems okay, but less common for pointers) ---
	c.tsw.WriteLiterally("let ")
	c.tsw.WriteLiterally("[") // Use array destructuring for multi-assign
	for i, name := range a.Names {
		if i != 0 {
			c.tsw.WriteLiterally(", ")
		}
		c.tsw.WriteLiterally(name.Name)
		// TODO: Add type annotations for multi-var declarations if possible/needed
	}
	c.tsw.WriteLiterally("]")
	if len(a.Values) > 0 {
		// TODO: handle other kinds of assignment += -= etc.
		c.tsw.WriteLiterally(" = ")
		if len(a.Values) == 1 && len(a.Names) > 1 {
			// Assign from a single multi-return value
			if err := c.WriteValueExpr(a.Values[0]); err != nil {
				return err
			}
		} else {
			// Assign from multiple values
			c.tsw.WriteLiterally("[")
			for i, val := range a.Values {
				if i != 0 {
					c.tsw.WriteLiterally(", ")
				}
				if err := c.WriteValueExpr(val); err != nil { // Initializers are values
					return err
				}
			}
			c.tsw.WriteLiterally("]")
		}
	} else {
		// No initializer, assign default values (complex for multi-assign)
		// For simplicity, assign default array based on context (needs improvement)
		c.tsw.WriteLiterally(" = []") // Placeholder
		// TODO: Assign correct zero values based on types
	}
	c.tsw.WriteLine("") // Use WriteLine instead of WriteLine(";")
	return nil
}

// WriteImportSpec translates a Go import specification (`ast.ImportSpec`)
// into a TypeScript import statement.
//
// It extracts the Go import path (e.g., `"path/to/pkg"`) and determines the
// import alias/name for TypeScript. If the Go import has an explicit name
// (e.g., `alias "path/to/pkg"`), that alias is used. Otherwise, the package
// name is derived from the Go path.
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
	impName := packageNameFromGoPath(goPath)
	if a.Name != nil && a.Name.Name != "" {
		impName = a.Name.Name
	}

	importPath := translateGoPathToTypescriptPath(goPath)
	c.analysis.Imports[impName] = &fileImport{
		importPath: importPath,
		importVars: make(map[string]struct{}),
	}

	c.tsw.WriteImport(impName, importPath+"/index.js")
}

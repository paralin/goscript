package compiler

import (
	"fmt"
	"go/ast"
	"go/token"
	"go/types"
	"strings"
)

// GoTypeContext specifies the context in which a Go type is being translated to TypeScript.
// This affects how certain types are handled, particularly interfaces and pointers.
type GoTypeContext int

const (
	// GoTypeContextGeneral is used for general type translation
	GoTypeContextGeneral GoTypeContext = iota
	// GoTypeContextFunctionReturn is used when translating types for function return values.
	// This affects how pointer types are handled (no VarRef wrapper for structs).
	GoTypeContextFunctionReturn
	// GoTypeContextVariadicParam is used when translating types for variadic parameter elements.
	// This affects how interface{} types are handled (no null prefix).
	GoTypeContextVariadicParam
)

// WriteGoType is the main dispatcher for translating Go types to their TypeScript
// equivalents. It examines the type and delegates to more specialized type writer
// functions based on the specific Go type encountered.
//
// The context parameter controls how certain types (especially pointers) are handled:
//   - GoTypeContextGeneral: Standard type translation
//   - GoTypeContextFunctionReturn: Special handling for function return types where
//     pointer-to-struct types become `ClassName | null` instead of `$.VarRef<ClassName> | null`
//   - GoTypeContextVariadicParam: Special handling for variadic parameter elements
//
// It handles nil types as 'any' with a comment, and dispatches to appropriate
// type-specific writers for all other recognized Go types.
func (c *GoToTSCompiler) WriteGoType(typ types.Type, context GoTypeContext) {
	if typ == nil {
		c.tsw.WriteLiterally("any")
		c.tsw.WriteCommentInline("nil type")
		return
	}

	switch t := typ.(type) {
	case *types.Basic:
		c.WriteBasicType(t)
	case *types.Named:
		c.WriteNamedType(t)
	case *types.Pointer:
		if context == GoTypeContextFunctionReturn {
			c.writePointerTypeForFunctionReturn(t)
		} else {
			c.WritePointerType(t, context)
		}
	case *types.Slice:
		c.WriteSliceType(t)
	case *types.Array:
		c.WriteArrayType(t)
	case *types.Map:
		c.WriteMapType(t)
	case *types.Chan:
		c.WriteChannelType(t)
	case *types.Interface:
		if context == GoTypeContextVariadicParam {
			c.writeInterfaceStructure(t, nil) // Skip the "null |" prefix for variadic params
		} else {
			c.WriteInterfaceType(t, nil) // No ast.InterfaceType available here
		}
	case *types.Signature:
		c.WriteSignatureType(t)
	case *types.Struct:
		c.WriteStructType(t)
	case *types.Alias:
		c.WriteGoType(t.Underlying(), context)
	case *types.TypeParam:
		// For type parameters, write the type parameter name (e.g., "T", "K", etc.)
		// Use sanitizeIdentifier to handle conflicts with TypeScript built-in types
		c.tsw.WriteLiterally(c.sanitizeIdentifier(t.Obj().Name()))
	case *types.Union:
		// Handle union types (e.g., string | []byte)
		for i := 0; i < t.Len(); i++ {
			if i > 0 {
				c.tsw.WriteLiterally(" | ")
			}
			term := t.Term(i)
			c.WriteGoType(term.Type(), context)
		}
	default:
		// For other types, just write "any" and add a comment
		c.tsw.WriteLiterally("any")
		c.tsw.WriteCommentInlinef("unhandled type: %T", typ)
	}
}

// writePointerTypeForFunctionReturn translates a Go pointer type (*T) to its TypeScript
// equivalent for function return types. Unlike WritePointerType, this function
// handles pointer-to-struct types specially: they become `ClassName | null` instead
// of `$.VarRef<ClassName> | null` because function return values cannot be addressed.
func (c *GoToTSCompiler) writePointerTypeForFunctionReturn(t *types.Pointer) {
	elemType := t.Elem()

	// Check if the element type is a struct (directly or via a named type)
	isStructType := false
	if _, ok := elemType.Underlying().(*types.Struct); ok {
		isStructType = true
	}

	if isStructType {
		// For pointer-to-struct in function returns, generate ClassName | null
		c.WriteGoType(elemType, GoTypeContextFunctionReturn)
		c.tsw.WriteLiterally(" | null")
	} else {
		// For pointer-to-primitive in function returns, still use varRefing
		c.tsw.WriteLiterally("$.VarRef<")
		c.WriteGoType(elemType, GoTypeContextFunctionReturn)
		c.tsw.WriteLiterally("> | null")
	}
}

// WriteZeroValueForType writes the TypeScript representation of the zero value
// for a given Go type.
// It handles `types.Array` by recursively writing zero values for each element
// to form a TypeScript array literal (e.g., `[0, 0, 0]`).
// For `types.Basic` (like `bool`, `string`, numeric types), it writes the
// corresponding TypeScript zero value (`false`, `""`, `0`).
// For `[]byte`, it writes `new Uint8Array(0)`.
// Other types default to `null`. This function is primarily used for initializing
// arrays and variables where an explicit initializer is absent.
func (c *GoToTSCompiler) WriteZeroValueForType(typ any) {
	switch t := typ.(type) {
	case *types.Array:
		c.tsw.WriteLiterally("[")
		for i := 0; i < int(t.Len()); i++ {
			if i > 0 {
				c.tsw.WriteLiterally(", ")
			}
			c.WriteZeroValueForType(t.Elem())
		}
		c.tsw.WriteLiterally("]")
	case *ast.Expr:
		// For AST expressions, get the type and handle that instead
		if expr := *t; expr != nil {
			if typ := c.pkg.TypesInfo.TypeOf(expr); typ != nil {
				c.WriteZeroValueForType(typ)
				return
			}
		}
		c.tsw.WriteLiterally("null")
	case *types.Basic:
		switch t.Kind() {
		case types.Bool:
			c.tsw.WriteLiterally("false")
		case types.String:
			c.tsw.WriteLiterally(`""`)
		default:
			c.tsw.WriteLiterally("0")
		}
	case *types.Named:
		// Handle named types, especially struct types
		if _, isStruct := t.Underlying().(*types.Struct); isStruct {
			// Initialize struct types with a new instance
			// Use the same logic as WriteNamedType to handle imported types
			c.tsw.WriteLiterally("new ")
			c.WriteNamedType(t)
			c.tsw.WriteLiterally("()")
			return
		}
		// For other named types, use the zero value of the underlying type
		c.WriteZeroValueForType(t.Underlying())
	case *types.Slice:
		// Check if it's a []byte slice
		if elem, ok := t.Elem().(*types.Basic); ok && elem.Kind() == types.Uint8 {
			c.tsw.WriteLiterally("new Uint8Array(0)")
			return
		}
		// For other slice types, default to null
		c.tsw.WriteLiterally("null")
	case *types.Struct:
		// For anonymous struct types, initialize with {}
		c.tsw.WriteLiterally("{}")
	case *types.TypeParam:
		// For type parameters, use null with type assertion to work around TypeScript's strict checking
		// This allows null to be assigned to generic type parameters even when the constraint doesn't explicitly include null
		c.tsw.WriteLiterally("null as any")
	default:
		c.tsw.WriteLiterally("null")
	}
}

// WriteBasicType translates a Go basic type (primitives like int, string, bool)
// to its TypeScript equivalent.
// It handles untyped constants by mapping them to appropriate TypeScript types
// (boolean, number, string, null) and uses GoBuiltinToTypescript for typed primitives.
func (c *GoToTSCompiler) WriteBasicType(t *types.Basic) {
	name := t.Name()

	// Handle untyped constants by mapping them to appropriate TypeScript types
	if t.Info()&types.IsUntyped != 0 {
		switch t.Kind() {
		case types.UntypedBool:
			c.tsw.WriteLiterally("boolean")
			return
		case types.UntypedInt, types.UntypedFloat, types.UntypedComplex, types.UntypedRune:
			c.tsw.WriteLiterally("number")
			return
		case types.UntypedString:
			c.tsw.WriteLiterally("string")
			return
		case types.UntypedNil:
			c.tsw.WriteLiterally("null")
			return
		}
	}

	// For typed basic types, use the existing mapping
	if tsType, ok := GoBuiltinToTypescript(name); ok {
		c.tsw.WriteLiterally(tsType)
	} else {
		c.tsw.WriteLiterally(name)
	}
}

// WriteNamedType translates a Go named type to its TypeScript equivalent.
// It specially handles the error interface as $.GoError, and uses the original
// type name for other named types. For imported types, it writes the qualified
// name using the import alias found from the analysis imports. For generic types, it includes type arguments.
func (c *GoToTSCompiler) WriteNamedType(t *types.Named) {
	// Check if the named type is the error interface
	if iface, ok := t.Underlying().(*types.Interface); ok && iface.String() == "interface{Error() string}" {
		c.tsw.WriteLiterally("$.GoError")
		return
	}

	// Check if this type is from an imported package
	typePkg := t.Obj().Pkg()
	if typePkg != nil && typePkg != c.pkg.Types {
		// This type is from an imported package, find the import alias
		typePkgPath := typePkg.Path()
		typePkgName := typePkg.Name() // Get the actual package name

		// Try to find the import alias by matching the package name or path
		for importAlias := range c.analysis.Imports {
			// First, try to match by the actual package name
			if importAlias == typePkgName {
				// Write the qualified name: importAlias.TypeName
				c.tsw.WriteLiterally(importAlias)
				c.tsw.WriteLiterally(".")
				c.tsw.WriteLiterally(t.Obj().Name())

				// For generic types, include type arguments
				if t.TypeArgs() != nil && t.TypeArgs().Len() > 0 {
					c.tsw.WriteLiterally("<")
					for i := 0; i < t.TypeArgs().Len(); i++ {
						if i > 0 {
							c.tsw.WriteLiterally(", ")
						}
						c.WriteGoType(t.TypeArgs().At(i), GoTypeContextGeneral)
					}
					c.tsw.WriteLiterally(">")
				}
				return
			}

			// Fallback: try to match by path-based package name (for backwards compatibility)
			pts := strings.Split(typePkgPath, "/")
			defaultPkgName := pts[len(pts)-1]
			if importAlias == defaultPkgName || importAlias == typePkgPath {
				// Write the qualified name: importAlias.TypeName
				c.tsw.WriteLiterally(importAlias)
				c.tsw.WriteLiterally(".")
				c.tsw.WriteLiterally(t.Obj().Name())

				// For generic types, include type arguments
				if t.TypeArgs() != nil && t.TypeArgs().Len() > 0 {
					c.tsw.WriteLiterally("<")
					for i := 0; i < t.TypeArgs().Len(); i++ {
						if i > 0 {
							c.tsw.WriteLiterally(", ")
						}
						c.WriteGoType(t.TypeArgs().At(i), GoTypeContextGeneral)
					}
					c.tsw.WriteLiterally(">")
				}
				return
			}
		}
	}

	// Use Obj().Name() for the original defined name (local types or unmatched imports)
	c.tsw.WriteLiterally(t.Obj().Name())

	// For generic types, include type arguments
	if t.TypeArgs() != nil && t.TypeArgs().Len() > 0 {
		c.tsw.WriteLiterally("<")
		for i := 0; i < t.TypeArgs().Len(); i++ {
			if i > 0 {
				c.tsw.WriteLiterally(", ")
			}
			c.WriteGoType(t.TypeArgs().At(i), GoTypeContextGeneral)
		}
		c.tsw.WriteLiterally(">")
	}
}

// WritePointerType translates a Go pointer type (*T) to its TypeScript equivalent.
func (c *GoToTSCompiler) WritePointerType(t *types.Pointer, context GoTypeContext) {
	elemGoType := t.Elem()
	underlyingElemGoType := elemGoType.Underlying()

	// Handle pointers to functions: *func(...) -> func(...) | null
	if _, isSignature := underlyingElemGoType.(*types.Signature); isSignature {
		c.WriteGoType(elemGoType, context) // Write the function signature itself, pass context
		c.tsw.WriteLiterally(" | null")    // Function pointers are nullable
		return
	}

	// Handle pointers to structs or interfaces: *MyStruct -> MyStruct | null
	_, isStruct := underlyingElemGoType.(*types.Struct)
	_, isInterface := underlyingElemGoType.(*types.Interface)

	if isStruct || isInterface {
		// For pointers to structs or interfaces, the TS type is StructName | null or InterfaceName | null.
		// This aligns with VAR_REFS.md and JS/TS object reference semantics.
		// TODO If the target variable is boxed, we have to wrap with VarRef as well?
		c.WriteGoType(elemGoType, context) // Write the struct/interface type directly, pass context
		c.tsw.WriteLiterally(" | null")
	} else {
		// For pointers to other types (primitives, slices, maps, other pointers like **MyStruct),
		// they are generally represented as $.VarRef<T_ts> | null.
		// Example: *int -> $.VarRef<number> | null
		// Example: **MyStruct -> $.VarRef<MyStruct | null> | null (recursive call handles inner part)
		c.tsw.WriteLiterally("$.VarRef<")
		c.WriteGoType(elemGoType, context) // Translate element type, pass context
		c.tsw.WriteLiterally("> | null")   // Pointers are always nullable
	}
}

// WriteSliceType translates a Go slice type ([]T) to its TypeScript equivalent.
// It generates $.Slice<T_ts>, where T_ts is the translated element type.
// For []byte, it generates Uint8Array.
func (c *GoToTSCompiler) WriteSliceType(t *types.Slice) {
	// Check if it's a []byte slice
	if elem, ok := t.Elem().(*types.Basic); ok && elem.Kind() == types.Uint8 {
		c.tsw.WriteLiterally("$.Bytes")
		return
	}
	c.tsw.WriteLiterally("$.Slice<")
	c.WriteGoType(t.Elem(), GoTypeContextGeneral)
	c.tsw.WriteLiterally(">")
}

// WriteArrayType translates a Go array type ([N]T) to its TypeScript equivalent.
// It generates T_ts[], where T_ts is the translated element type.
func (c *GoToTSCompiler) WriteArrayType(t *types.Array) {
	c.WriteGoType(t.Elem(), GoTypeContextGeneral)
	c.tsw.WriteLiterally("[]") // Arrays cannot be nil
}

// WriteMapType translates a Go map type (map[K]V) to its TypeScript equivalent.
// It generates Map<K_ts, V_ts>, where K_ts and V_ts are the translated key
// and element types respectively.
func (c *GoToTSCompiler) WriteMapType(t *types.Map) {
	c.tsw.WriteLiterally("Map<")
	c.WriteGoType(t.Key(), GoTypeContextGeneral)
	c.tsw.WriteLiterally(", ")
	c.WriteGoType(t.Elem(), GoTypeContextGeneral)
	c.tsw.WriteLiterally(">")
}

// WriteChannelType translates a Go channel type (chan T) to its TypeScript equivalent.
// It generates $.Channel<T_ts> | null, where T_ts is the translated element type.
// Channels are nilable in Go, so they are represented as nullable types in TypeScript.
func (c *GoToTSCompiler) WriteChannelType(t *types.Chan) {
	c.tsw.WriteLiterally("$.Channel<")
	c.WriteGoType(t.Elem(), GoTypeContextGeneral)
	c.tsw.WriteLiterally("> | null")
}

// WriteFuncType translates a Go function type (`ast.FuncType`) into a TypeScript
// function signature.
// The signature is of the form `(param1: type1, param2: type2) => returnType`.
// - Parameters are written using `WriteFieldList`.
// - Return types:
//   - If there are no results, the return type is `void`.
//   - If there's a single, unnamed result, it's `resultType`.
//   - If there are multiple or named results, it's a tuple type `[typeA, typeB]`.
//   - If `isAsync` is true (indicating the function is known to perform async
//     operations like channel interactions or contains `go` or `defer` with async calls),
//     the return type is wrapped in `Promise<>` (e.g., `Promise<void>`, `Promise<number>`).
func (c *GoToTSCompiler) WriteFuncType(exp *ast.FuncType, isAsync bool) {
	c.tsw.WriteLiterally("(")
	c.WriteFieldList(exp.Params, true) // true = arguments
	c.tsw.WriteLiterally(")")
	if exp.Results != nil && len(exp.Results.List) > 0 {
		// Use colon for return type annotation
		c.tsw.WriteLiterally(": ")
		if isAsync {
			c.tsw.WriteLiterally("Promise<")
		}
		if len(exp.Results.List) == 1 {
			// Single return type (named or unnamed)
			typ := c.pkg.TypesInfo.TypeOf(exp.Results.List[0].Type)
			c.WriteGoType(typ, GoTypeContextFunctionReturn)
		} else {
			// Multiple return types -> tuple
			c.tsw.WriteLiterally("[")
			for i, field := range exp.Results.List {
				if i > 0 {
					c.tsw.WriteLiterally(", ")
				}
				typ := c.pkg.TypesInfo.TypeOf(field.Type)
				c.WriteGoType(typ, GoTypeContextFunctionReturn)
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
}

// WriteInterfaceType translates a Go interface type to its TypeScript equivalent.
// It specially handles the error interface as $.GoError, and delegates to
// writeInterfaceStructure for other interface types, prepending "null | ".
// If astNode is provided (e.g., from a type spec), comments for methods will be included.
func (c *GoToTSCompiler) WriteInterfaceType(t *types.Interface, astNode *ast.InterfaceType) {
	// Handle the built-in error interface specifically
	if t.String() == "interface{Error() string}" {
		c.tsw.WriteLiterally("$.GoError")
		return
	}

	// Prepend "null | " for all other interfaces.
	// writeInterfaceStructure will handle the actual structure like "{...}" or "any".
	c.tsw.WriteLiterally("null | ")
	c.writeInterfaceStructure(t, astNode)
}

// WriteSignatureType translates a Go function signature to its TypeScript equivalent.
// It generates (param1: type1, param2: type2, ...): returnType for function types.
func (c *GoToTSCompiler) WriteSignatureType(t *types.Signature) {
	c.tsw.WriteLiterally("(")
	c.tsw.WriteLiterally("(")
	params := t.Params()
	for i := 0; i < params.Len(); i++ {
		if i > 0 {
			c.tsw.WriteLiterally(", ")
		}

		param := params.At(i)
		paramSlice, paramIsSlice := param.Type().(*types.Slice)

		paramVariadic := i == params.Len()-1 && t.Variadic()
		if paramVariadic {
			c.tsw.WriteLiterally("...")
		}

		// Use parameter name if available, otherwise use p0, p1, etc.
		if param.Name() != "" {
			c.tsw.WriteLiterally(c.sanitizeIdentifier(param.Name()))
		} else {
			c.tsw.WriteLiterallyf("p%d", i)
		}
		c.tsw.WriteLiterally(": ")

		if paramVariadic && paramIsSlice {
			c.WriteGoType(paramSlice.Elem(), GoTypeContextGeneral)
			c.tsw.WriteLiterally("[]")
		} else {
			c.WriteGoType(param.Type(), GoTypeContextGeneral)
		}
	}
	c.tsw.WriteLiterally(")")

	// Handle return types
	c.tsw.WriteLiterally(" => ")
	results := t.Results()
	if results.Len() == 0 {
		c.tsw.WriteLiterally("void")
	} else if results.Len() == 1 {
		c.WriteGoType(results.At(0).Type(), GoTypeContextFunctionReturn)
	} else {
		// Multiple return values -> tuple
		c.tsw.WriteLiterally("[")
		for i := 0; i < results.Len(); i++ {
			if i > 0 {
				c.tsw.WriteLiterally(", ")
			}
			c.WriteGoType(results.At(i).Type(), GoTypeContextFunctionReturn)
		}
		c.tsw.WriteLiterally("]")
	}
	c.tsw.WriteLiterally(") | null")
}

// writeInterfaceStructure translates a Go `types.Interface` into its TypeScript structural representation.
// If astNode is provided, it's used to fetch comments for methods.
// For example, an interface `interface { MethodA(x int) string; EmbeddedB }` might become
// `{ MethodA(_p0: number): string; } & B_ts`.
func (c *GoToTSCompiler) writeInterfaceStructure(iface *types.Interface, astNode *ast.InterfaceType) {
	// Handle empty interface interface{}
	if iface.NumExplicitMethods() == 0 && iface.NumEmbeddeds() == 0 {
		c.tsw.WriteLiterally("any") // Matches current behavior for interface{}
		return
	}

	// Keep track if we've written any part (methods or first embedded type)
	// to correctly place " & " separators.
	firstPartWritten := false

	// Handle explicit methods
	if iface.NumExplicitMethods() > 0 {
		c.tsw.WriteLiterally("{") // Opening brace for the object type
		c.tsw.Indent(1)
		c.tsw.WriteLine("") // Newline after opening brace, before the first method

		for i := 0; i < iface.NumExplicitMethods(); i++ {
			method := iface.ExplicitMethod(i)
			sig := method.Type().(*types.Signature)

			// Find corresponding ast.Field for comments if astNode is available
			var astField *ast.Field
			if astNode != nil && astNode.Methods != nil {
				for _, f := range astNode.Methods.List {
					// Ensure the field is a named method (not an embedded interface)
					if len(f.Names) > 0 && f.Names[0].Name == method.Name() {
						astField = f
						break
					}
				}
			}

			// Write comments if astField is found
			if astField != nil {
				if astField.Doc != nil {
					c.WriteDoc(astField.Doc) // WriteDoc handles newlines
				}
				if astField.Comment != nil { // For trailing comments on the same line in Go AST
					c.WriteDoc(astField.Comment)
				}
			}

			c.tsw.WriteLiterally(method.Name())
			c.tsw.WriteLiterally("(") // Start params
			params := sig.Params()
			for j := 0; j < params.Len(); j++ {
				if j > 0 {
					c.tsw.WriteLiterally(", ")
				}
				paramVar := params.At(j)
				paramName := paramVar.Name()
				if paramName == "" || paramName == "_" {
					paramName = fmt.Sprintf("_p%d", j)
				}
				c.tsw.WriteLiterally(c.sanitizeIdentifier(paramName))
				c.tsw.WriteLiterally(": ")
				c.WriteGoType(paramVar.Type(), GoTypeContextGeneral) // Recursive call for param type
			}
			c.tsw.WriteLiterally(")") // End params

			// Return type
			c.tsw.WriteLiterally(": ")
			results := sig.Results()
			if results.Len() == 0 {
				c.tsw.WriteLiterally("void")
			} else if results.Len() == 1 {
				c.WriteGoType(results.At(0).Type(), GoTypeContextFunctionReturn) // Recursive call for result type
			} else {
				c.tsw.WriteLiterally("[")
				for j := 0; j < results.Len(); j++ {
					if j > 0 {
						c.tsw.WriteLiterally(", ")
					}
					c.WriteGoType(results.At(j).Type(), GoTypeContextFunctionReturn) // Recursive call for result type
				}
				c.tsw.WriteLiterally("]")
			}
			c.tsw.WriteLine("") // newline for each method
		}
		c.tsw.Indent(-1)
		c.tsw.WriteLiterally("}") // Closing brace for the object type
		firstPartWritten = true
	}

	// Handle embedded types
	if iface.NumEmbeddeds() > 0 {
		for i := 0; i < iface.NumEmbeddeds(); i++ {
			if firstPartWritten {
				c.tsw.WriteLiterally(" & ")
			} else {
				// This is the first part being written (no explicit methods, only embedded)
				firstPartWritten = true
			}
			embeddedType := iface.EmbeddedType(i)
			// When WriteGoType encounters an interface, it will call WriteInterfaceType
			// which will pass nil for astNode, so comments for deeply embedded interface literals
			// might not be available unless they are named types.
			c.WriteGoType(embeddedType, GoTypeContextGeneral)
		}
	}
}

// getTypeString is a utility function that converts a Go `types.Type` into its
// TypeScript type string representation. It achieves this by creating a temporary
// `GoToTSCompiler` and `TSCodeWriter` (writing to a `strings.Builder`) and then
// calling `WriteGoType` on the provided Go type. This allows reusing the main
// type translation logic to get a string representation of the TypeScript type.
func (c *GoToTSCompiler) getTypeString(goType types.Type) string {
	var typeStr strings.Builder
	writer := NewTSCodeWriter(&typeStr)
	tempCompiler := NewGoToTSCompiler(writer, c.pkg, c.analysis)
	tempCompiler.WriteGoType(goType, GoTypeContextGeneral)
	return typeStr.String()
}

// WriteStructType translates a Go struct type definition (`ast.StructType`)
// into a TypeScript anonymous object type (e.g., `{ Field1: Type1; Field2: Type2 }`).
// If the struct has no fields, it writes `{}`. Otherwise, it delegates to
// `WriteFieldList` to generate the list of field definitions.
// Note: This is for anonymous struct type literals. Named struct types are usually
// handled as classes via `WriteTypeSpec`.
func (c *GoToTSCompiler) WriteStructType(t *types.Struct) {
	// Generate an interface with the struct's fields
	c.tsw.WriteLiterally("{ ")
	// Add field properties to the interface
	for i := range t.NumFields() {
		field := t.Field(i)
		if i > 0 {
			c.tsw.WriteLiterally("; ")
		}
		c.tsw.WriteLiterally(field.Name() + "?: ")
		c.WriteGoType(field.Type(), GoTypeContextGeneral)
	}
	c.tsw.WriteLiterally(" }")
}

// WriteTypeParameters translates Go type parameters to TypeScript generic parameters.
// It handles the TypeParams field of ast.FuncDecl and ast.TypeSpec to generate
// TypeScript generic parameter lists like <T extends SomeConstraint, U extends OtherConstraint>.
func (c *GoToTSCompiler) WriteTypeParameters(typeParams *ast.FieldList) {
	if typeParams == nil || len(typeParams.List) == 0 {
		return
	}

	c.tsw.WriteLiterally("<")
	for i, field := range typeParams.List {
		if i > 0 {
			c.tsw.WriteLiterally(", ")
		}
		// Write each type parameter name and constraint
		for j, name := range field.Names {
			if j > 0 {
				c.tsw.WriteLiterally(", ")
			}
			// Use sanitizeIdentifier to handle conflicts with TypeScript built-in types
			c.tsw.WriteLiterally(c.sanitizeIdentifier(name.Name))

			// Write constraint if present
			if field.Type != nil {
				c.tsw.WriteLiterally(" extends ")
				c.WriteTypeConstraint(field.Type)
			}
		}
	}
	c.tsw.WriteLiterally(">")
}

// WriteTypeConstraint translates Go type constraints to TypeScript constraint expressions.
// It handles different constraint types including:
// - Union types: []byte | string -> string | Uint8Array
// - Interface types: interface{Method()} -> {Method(): void}
// - Basic types: any -> any, comparable -> $.Comparable
func (c *GoToTSCompiler) WriteTypeConstraint(constraint ast.Expr) {
	switch t := constraint.(type) {
	case *ast.Ident:
		// Handle predeclared constraints
		switch t.Name {
		case "any":
			c.tsw.WriteLiterally("any")
		case "comparable":
			c.tsw.WriteLiterally("$.Comparable")
		default:
			// Use the type directly
			c.WriteTypeExpr(t)
		}
	case *ast.BinaryExpr:
		// Handle union types like []byte | string
		if t.Op == token.OR {
			c.WriteTypeConstraint(t.X)
			c.tsw.WriteLiterally(" | ")
			c.WriteTypeConstraint(t.Y)
		} else {
			// Fallback for other binary expressions
			c.WriteTypeExpr(constraint)
		}
	case *ast.InterfaceType:
		// Handle interface constraints
		c.WriteTypeExpr(constraint)
	case *ast.ArrayType:
		// Handle []byte specifically
		if ident, ok := t.Elt.(*ast.Ident); ok && ident.Name == "byte" {
			c.tsw.WriteLiterally("$.Bytes")
		} else {
			c.WriteTypeExpr(constraint)
		}
	case *ast.SliceExpr:
		// Handle slice types in constraints
		c.WriteTypeExpr(constraint)
	default:
		// Fallback: use the standard type expression writer
		c.WriteTypeExpr(constraint)
	}
}

package compiler

import (
	"errors"
	"fmt"
	"go/ast"
	"go/token"
	gtypes "go/types"
	"strconv"
	"strings"

	gstypes "github.com/aperturerobotics/goscript/compiler/types"
)

// WriteTypeExpr writes an expression that represents a type.
func (c *GoToTSCompiler) WriteTypeExpr(a ast.Expr) {
	switch exp := a.(type) {
	case *ast.Ident:
		c.WriteIdentType(exp)
	case *ast.SelectorExpr:
		if err := c.WriteSelectorExprType(exp); err != nil {
			c.tsw.WriteCommentInline(fmt.Sprintf("error writing selector expr type: %v", err))
		}
	case *ast.StarExpr:
		c.WriteStarExprType(exp)
	case *ast.StructType:
		c.WriteStructType(exp)
	case *ast.InterfaceType:
		c.WriteInterfaceType(exp)
	case *ast.FuncType:
		// Function types (e.g., in type aliases) use '=>' for return type.
		c.tsw.WriteLiterally("(")
		c.WriteFuncType(exp, false, true) // isAsync=false, useArrowForReturnType=true
		c.tsw.WriteLiterally(") | null")
	case *ast.ArrayType:
		// Translate [N]T to T[]
		c.WriteTypeExpr(exp.Elt)
		c.tsw.WriteLiterally("[]")
	case *ast.MapType:
		// Use Map<K,V> | null for map types to allow null as zero value
		c.tsw.WriteLiterally("Map<")
		c.WriteTypeExpr(exp.Key)
		c.tsw.WriteLiterally(", ")
		c.WriteTypeExpr(exp.Value)
		c.tsw.WriteLiterally("> | null")
	case *ast.ChanType:
		// Translate channel types to goscript.Channel<T>
		c.tsw.WriteLiterally("goscript.Channel<")
		c.WriteTypeExpr(exp.Value) // Write the element type
		c.tsw.WriteLiterally(">")
	default:
		c.tsw.WriteCommentLine(fmt.Sprintf("unhandled type expr: %T (map/chan support pending)", exp))
	}
}

// WriteValueExpr writes an expression that represents a value.
func (c *GoToTSCompiler) WriteValueExpr(a ast.Expr) error {
	switch exp := a.(type) {
	case *ast.Ident:
		c.WriteIdentValue(exp)
		return nil
	case *ast.SelectorExpr:
		return c.WriteSelectorExprValue(exp)
	case *ast.StarExpr:
		return c.WriteStarExprValue(exp)
	case *ast.CallExpr:
		return c.WriteCallExpr(exp)
	case *ast.UnaryExpr:
		return c.WriteUnaryExprValue(exp)
	case *ast.BinaryExpr:
		return c.WriteBinaryExprValue(exp)
	case *ast.BasicLit:
		c.WriteBasicLitValue(exp)
		return nil
	case *ast.CompositeLit:
		return c.WriteCompositeLitValue(exp)
	case *ast.KeyValueExpr:
		return c.WriteKeyValueExprValue(exp)
	case *ast.TypeAssertExpr:
		// Handle type assertion in an expression context
		return c.WriteTypeAssertExpr(exp)
	case *ast.IndexExpr:
		// Handle map access: use Map.get() instead of brackets for reading values
		if tv, ok := c.pkg.TypesInfo.Types[exp.X]; ok {
			// Get the base type (dereference pointer if needed)
			baseType := tv.Type
			isPointer := false
			if ptr, ok := baseType.(*gtypes.Pointer); ok {
				baseType = ptr.Elem()
				isPointer = true
			}

			// Check if it's a map type
			if _, isMap := baseType.Underlying().(*gtypes.Map); isMap {
				if isPointer {
					c.tsw.WriteLiterally("(")
					if err := c.WriteValueExpr(exp.X); err != nil {
						return err
					}
					c.tsw.WriteLiterally(").ref!.get(")
				} else {
					if err := c.WriteValueExpr(exp.X); err != nil {
						return err
					}
					c.tsw.WriteLiterally(".get(")
				}

				if err := c.WriteValueExpr(exp.Index); err != nil {
					return err
				}
				// Note: For map access (reading), Go returns the zero value if the key doesn't exist.
				// We need to handle this in TS. For now, default to 0 or null based on type.
				// A more robust solution would involve checking the expected type of the context.
				// For simplicity, let's add a comment indicating this might need refinement.
				c.tsw.WriteLiterally(")") // No ?? 0 here, get() returns undefined if not found
				// c.tsw.WriteCommentInline("map access might need zero value handling")
				return nil
			}
		}

		// Regular array/slice access: use brackets
		// Check if we're accessing via a pointer
		isPointer := false
		isGoPtr := false
		if c.pkg != nil && c.pkg.TypesInfo != nil {
			if tv, ok := c.pkg.TypesInfo.Types[exp.X]; ok && tv.Type != nil {
				_, isPointer = tv.Type.(*gtypes.Pointer)

				// Check if this might be a GoPtr at runtime (e.g., from an interface variable)
				if ident, ok := exp.X.(*ast.Ident); ok {
					if c.pkg.TypesInfo.Uses[ident] != nil {
						obj := c.pkg.TypesInfo.Uses[ident]
						if obj.Type() != nil {
							if _, isInterface := obj.Type().Underlying().(*gtypes.Interface); isInterface {
								// It's an interface that might contain a pointer at runtime
								isGoPtr = true
							}
						}
					}
				}
			}
		}

		if isPointer {
			// For declared pointer types, use ._ptr directly
			c.tsw.WriteLiterally("(")
			if err := c.WriteValueExpr(exp.X); err != nil {
				return err
			}
			c.tsw.WriteLiterally(")?._ptr?.[")
		} else if isGoPtr {
			// For values that might be GoPtr instances at runtime, use safe access
			c.tsw.WriteLiterally("(")
			c.tsw.WriteLiterally("goscript.isPointer(") // Start the function call
			if err := c.WriteValueExpr(exp.X); err != nil {
				return err
			}
			c.tsw.WriteLiterally(") ? ") // Close the function call and add ternary operator

			// If it's a GoPtr, access through ._ptr
			if err := c.WriteValueExpr(exp.X); err != nil {
				return err
			}
			c.tsw.WriteLiterally("._ptr![")
			if err := c.WriteValueExpr(exp.Index); err != nil {
				return err
			}
			c.tsw.WriteLiterally("] : ")

			// If it's not a GoPtr, access directly
			if err := c.WriteValueExpr(exp.X); err != nil {
				return err
			}
			c.tsw.WriteLiterally("[")
			if err := c.WriteValueExpr(exp.Index); err != nil {
				return err
			}
			c.tsw.WriteLiterally("])")
			return nil
		} else {
			if err := c.WriteValueExpr(exp.X); err != nil {
				return err
			}
			c.tsw.WriteLiterally("[")
		}

		if err := c.WriteValueExpr(exp.Index); err != nil {
			return err
		}
		c.tsw.WriteLiterally("]")
		return nil
	case *ast.SliceExpr:
		// Translate Go slice expression to goscript.slice(x, low, high, max)
		c.tsw.WriteLiterally("goscript.slice(")
		if err := c.WriteValueExpr(exp.X); err != nil {
			return err
		}
		// low argument
		c.tsw.WriteLiterally(", ")
		if exp.Low != nil {
			if err := c.WriteValueExpr(exp.Low); err != nil {
				return err
			}
		} else {
			c.tsw.WriteLiterally("undefined")
		}
		// high argument
		c.tsw.WriteLiterally(", ")
		if exp.High != nil {
			if err := c.WriteValueExpr(exp.High); err != nil {
				return err
			}
		} else {
			c.tsw.WriteLiterally("undefined")
		}
		// max argument (only for full slice expressions)
		if exp.Slice3 {
			c.tsw.WriteLiterally(", ")
			if exp.Max != nil {
				if err := c.WriteValueExpr(exp.Max); err != nil {
					return err
				}
			} else {
				c.tsw.WriteLiterally("undefined")
			}
		}
		c.tsw.WriteLiterally(")")
		return nil
	case *ast.ParenExpr:
		// Translate (X) to (X)
		c.tsw.WriteLiterally("(")
		if err := c.WriteValueExpr(exp.X); err != nil {
			return err
		}
		c.tsw.WriteLiterally(")")
		return nil
	case *ast.FuncLit:
		return c.WriteFuncLitValue(exp)
	// Add cases for SliceExpr etc.
	default:
		c.tsw.WriteCommentLine(fmt.Sprintf("unhandled value expr: %T", exp))
		return nil
	}
}

// WriteTypeAssertExpr writes a type assertion expression.
func (c *GoToTSCompiler) WriteTypeAssertExpr(exp *ast.TypeAssertExpr) error {
	// Generate a call to goscript.typeAssert
	c.tsw.WriteLiterally("goscript.typeAssert<")
	c.WriteTypeExpr(exp.Type) // Write the asserted type for the generic
	c.tsw.WriteLiterally(">(")
	if err := c.WriteValueExpr(exp.X); err != nil { // The interface expression
		return fmt.Errorf("failed to write interface expression in type assertion expression: %w", err)
	}
	c.tsw.WriteLiterally(", ")

	// Get the type info reference for the asserted type
	// We need to use .__typeInfo for user-defined types instead of the old style
	typeInfoRef := c.getTypeInfoRef(exp.Type)
	c.tsw.WriteLiterally(typeInfoRef)

	c.tsw.WriteLiterally(").value") // Always access .value for the panic form

	// TODO: Consider adding a check for 'ok' and throwing an error if false
	// to truly emulate the panic behavior, or create a separate typeAssertPanic helper.
	// For now, just accessing .value relies on typeAssert returning the zero value on failure,
	// which might not be the desired panic behavior.

	return nil
}

// getTypeInfoRef returns the TypeScript reference to the type information for a given AST type expression
func (c *GoToTSCompiler) getTypeInfoRef(typeExpr ast.Expr) string {
	// Check for built-in types first - these are handled the same way regardless
	if ident, isIdent := typeExpr.(*ast.Ident); isIdent {
		switch ident.Name {
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
		}
	}

	// For all other types, use type information to determine if it's an interface or struct
	if c.pkg != nil && c.pkg.TypesInfo != nil {
		if tv, ok := c.pkg.TypesInfo.Types[typeExpr]; ok && tv.Type != nil {
			// Check if it's an interface type
			if _, isInterface := tv.Type.Underlying().(*gtypes.Interface); isInterface {
				// For interfaces, use the __typeInfo suffix format
				switch t := typeExpr.(type) {
				case *ast.Ident:
					return fmt.Sprintf("%s__typeInfo", t.Name)
				case *ast.SelectorExpr:
					if ident, ok := t.X.(*ast.Ident); ok {
						return fmt.Sprintf("%s.%s__typeInfo", ident.Name, t.Sel.Name)
					}
				}
			} else {
				// For non-interfaces (structs, etc.), use the .__typeInfo member format
				switch t := typeExpr.(type) {
				case *ast.Ident:
					return fmt.Sprintf("%s.__typeInfo", t.Name)
				case *ast.SelectorExpr:
					if ident, ok := t.X.(*ast.Ident); ok {
						return fmt.Sprintf("%s.%s.__typeInfo", ident.Name, t.Sel.Name)
					}
				}
			}
		}
	}
	
	// If we reach this point, we couldn't definitely determine the type
	// Fall back to the basic cases based on syntax
	switch t := typeExpr.(type) {
	case *ast.Ident:
		// Default to struct-style for user-defined types without type info
		return fmt.Sprintf("%s.__typeInfo", t.Name)
	case *ast.SelectorExpr:
		// For imported types like pkg.Type, we've handled this in the type info section above
		// This is a fallback if the type info approach failed
		if ident, ok := t.X.(*ast.Ident); ok {
			// Default to struct-style for qualified names without type info
			return fmt.Sprintf("%s.%s.__typeInfo", ident.Name, t.Sel.Name)
		}
	case *ast.StarExpr:
		// Handle pointer types - create the pointer type info dynamically
		baseType := c.getTypeExprName(t.X)
		// Check if it's a basic type
		if isBasicType(baseType) {
			return fmt.Sprintf("goscript.makePointerTypeInfo(%s)",
				getBasicTypeConstName(baseType))
		}
		return fmt.Sprintf("goscript.makePointerTypeInfo(%s.__typeInfo)", baseType)
	case *ast.ArrayType:
		// Handle array/slice types - construct an inline SliceTypeInfo
		elemTypeRef := c.getTypeInfoRef(t.Elt)
		return fmt.Sprintf("{ kind: goscript.GoTypeKind.Slice, name: '[]%s', zero: [], elem: %s }",
			c.getTypeExprName(t.Elt), elemTypeRef)
	case *ast.MapType:
		// Handle map types - construct an inline MapTypeInfo
		keyTypeRef := c.getTypeInfoRef(t.Key)
		valueTypeRef := c.getTypeInfoRef(t.Value)
		return fmt.Sprintf("{ kind: goscript.GoTypeKind.Map, name: 'map[%s]%s', zero: new Map(), key: %s, value: %s }",
			c.getTypeExprName(t.Key), c.getTypeExprName(t.Value), keyTypeRef, valueTypeRef)
	case *ast.InterfaceType:
		// Handle interface{} specifically
		if t.Methods == nil || len(t.Methods.List) == 0 {
			return "goscript.EMPTY_INTERFACE_TYPE"
		}
		// TODO: Handle non-empty anonymous interfaces
		return "goscript.EMPTY_INTERFACE_TYPE"
	}
	// Fallback for unhandled types
	return "goscript.EMPTY_INTERFACE_TYPE"
}

// getTypeNameString returns the string representation of a type name
// This is kept for backward compatibility with existing code
func (c *GoToTSCompiler) getTypeNameString(typeExpr ast.Expr) string {
	switch t := typeExpr.(type) {
	case *ast.Ident:
		return t.Name
	case *ast.SelectorExpr:
		// For imported types like pkg.Type
		if ident, ok := t.X.(*ast.Ident); ok {
			return fmt.Sprintf("%s.%s", ident.Name, t.Sel.Name)
		}
	case *ast.StarExpr:
		// Handle pointer types
		return fmt.Sprintf("*%s", c.getTypeNameString(t.X))
	case *ast.ArrayType:
		// Handle array/slice types
		return fmt.Sprintf("[]%s", c.getTypeNameString(t.Elt))
	case *ast.MapType:
		// Handle map types
		return fmt.Sprintf("map[%s]%s", c.getTypeNameString(t.Key), c.getTypeNameString(t.Value))
	case *ast.InterfaceType:
		// Handle interface{} specifically
		if t.Methods == nil || len(t.Methods.List) == 0 {
			return "interface{}"
		}
		// TODO: Handle non-empty anonymous interfaces?
	}
	// Fallback for other complex types
	return "unknown" // Or perhaps generate a more descriptive placeholder
}

// --- Exported Node-Specific Writers ---

// WriteIdentType writes an identifier used as a type.
func (c *GoToTSCompiler) WriteIdentType(exp *ast.Ident) {
	name := exp.Name

	// Special case for the built-in error interface
	if name == "error" {
		c.tsw.WriteLiterally("goscript.Error")
		return
	}

	if tsname, ok := gstypes.GoBuiltinToTypescript(name); ok {
		name = tsname
	} else {
		// Not a Go builtin. Could be a custom type in the current package,
		// an imported type, or potentially an error.
		// Robust checking requires type information.
		if obj := exp.Obj; obj != nil && obj.Kind != ast.Typ {
			c.tsw.WriteCommentInline(fmt.Sprintf("ident %q used as type? kind=%s", name, obj.Kind))
		}

		// TODO use type information to check

		//else if obj == nil {
		// If obj is nil, it might be a type from an import or undefined.
		// Type checking pass should resolve this.
		// c.tsw.WriteCommentInline(fmt.Sprintf("unresolved ident %q used as type", name))
		//}

		// Assume it's a valid custom type name for now.
	}

	c.tsw.WriteLiterally(name)
}

// WriteIdentValue writes an identifier used as a value (variable, function name, nil).
func (c *GoToTSCompiler) WriteIdentValue(exp *ast.Ident) {
	if exp.Name == "nil" {
		c.tsw.WriteLiterally("null")
	} else {
		c.tsw.WriteLiterally(exp.Name)
	}
}

// WriteSelectorExprType writes a selector expression used as a type (e.g., pkg.Type).
func (c *GoToTSCompiler) WriteSelectorExprType(exp *ast.SelectorExpr) error {
	// Assuming X is a package identifier. Needs refinement with type info.
	if err := c.WriteValueExpr(exp.X); err != nil { // Package name is treated as a value
		return fmt.Errorf("failed to write selector expression package identifier: %w", err)
	}
	c.tsw.WriteLiterally(".")
	c.WriteTypeExpr(exp.Sel) // The selected identifier is treated as a type
	return nil
}

// WriteSelectorExprValue writes a selector expression used as a value (e.g., obj.Field).
func (c *GoToTSCompiler) WriteSelectorExprValue(exp *ast.SelectorExpr) error {
	// Check if we are inside a method with a pointer receiver and the base expression is the receiver.
	if c.currentReceiverObj != nil {
		if ident, ok := exp.X.(*ast.Ident); ok {
			if obj := c.pkg.TypesInfo.Uses[ident]; obj != nil && obj == c.currentReceiverObj {
				// It's the receiver identifier. When we're in a pointer receiver method,
				// 'this' in TS is directly the value type, so access fields/methods directly.
				if c.currentReceiverIsPointer {
					c.tsw.WriteLiterally("this.")
					c.WriteIdentValue(exp.Sel)
					return nil
				}
			}
		}
	}

	// Check if the expression X is a pointer type
	isPointer := false
	isGoPtr := false
	var tvType gtypes.Type
	var baseTypeName string

	if c.pkg != nil && c.pkg.TypesInfo != nil {
		if tv, ok := c.pkg.TypesInfo.Types[exp.X]; ok && tv.Type != nil {
			tvType = tv.Type
			_, isPointer = tv.Type.(*gtypes.Pointer)

			// Get the base type name (for later checking against pointer receiver methods)
			if named, ok := tvType.(*gtypes.Named); ok {
				baseTypeName = named.Obj().Name()
			} else if ptr, ok := tvType.(*gtypes.Pointer); ok {
				if named, ok := ptr.Elem().(*gtypes.Named); ok {
					baseTypeName = named.Obj().Name()
				}
			}

			// Check if this is potentially a GoPtr instance at runtime
			// This handles the case where we might be accessing through an interface variable
			// that actually contains a pointer at runtime
			if ident, ok := exp.X.(*ast.Ident); ok {
				if c.pkg.TypesInfo.Uses[ident] != nil {
					obj := c.pkg.TypesInfo.Uses[ident]
					if obj.Type() != nil {
						if _, isInterface := obj.Type().Underlying().(*gtypes.Interface); isInterface {
							// It's an interface that might contain a pointer at runtime
							isGoPtr = true
						}
					}
				}
			}
		}
	}

	// Determine if we need to check for method with pointer receiver
	mayNeedAddressOfForMethod := false
	methodKey := ""

	if c.pkg != nil && baseTypeName != "" {
		// Check if the selector is a method with a pointer receiver
		methodKey = baseTypeName + "." + exp.Sel.Name
		if c.pointerReceiverMethods[methodKey] {
			// This is a known method with a pointer receiver
			mayNeedAddressOfForMethod = !isPointer // Only need to take address if not already a pointer
		} else if !isPointer && tvType != nil {
			// Check if the selector refers to a method in the type's method set
			if obj := c.pkg.TypesInfo.Uses[exp.Sel]; obj != nil {
				if fun, ok := obj.(*gtypes.Func); ok && fun.Type() != nil {
					// It's a method - check if it has a pointer receiver
					if sig, ok := fun.Type().(*gtypes.Signature); ok && sig.Recv() != nil {
						if _, isPointerRecv := sig.Recv().Type().(*gtypes.Pointer); isPointerRecv {
							// It's a method with pointer receiver being called on a value
							mayNeedAddressOfForMethod = true
							// Remember this for future checks
							c.pointerReceiverMethods[methodKey] = true
						}
					}
				}
			}
		}
	}

	if isPointer {
		// For pointer types (declared as *T), need to access ._ptr property first
		c.tsw.WriteLiterally("(")
		if err := c.WriteValueExpr(exp.X); err != nil {
			return fmt.Errorf("failed to write selector expression pointer object: %w", err)
		}
		c.tsw.WriteLiterally(")?._ptr?.")
		c.WriteIdentValue(exp.Sel)
	} else if isGoPtr {
		// For values that might be GoPtr instances at runtime (interfaces holding pointers),
		// the runtime should handle method dispatch correctly. Just write the direct access.
		if err := c.WriteValueExpr(exp.X); err != nil {
			return fmt.Errorf("failed to write selector expression object (interface): %w", err)
		}
		c.tsw.WriteLiterally(".")
		c.WriteIdentValue(exp.Sel)
	} else if mayNeedAddressOfForMethod {
		// Method with pointer receiver called on a value - implicitly take the address
		// Check if the selector is a method or a field
		obj := c.pkg.TypesInfo.Uses[exp.Sel]
		if _, isMethod := obj.(*gtypes.Func); isMethod {
			// It's a method - generate method call syntax
			c.tsw.WriteLiterally("(goscript.makePtr(")
			if err := c.WriteValueExpr(exp.X); err != nil {
				return fmt.Errorf("failed to write value for implicit pointer conversion (method call): %w", err)
			}
			c.tsw.WriteLiterally("))._ptr!.")
			c.WriteIdentValue(exp.Sel) // Write the method name
			// Note: Arguments for the method call are handled in WriteCallExpr
		} else {
			// It's a field access - generate field access syntax
			c.tsw.WriteLiterally("(goscript.makePtr(")
			if err := c.WriteValueExpr(exp.X); err != nil {
				return fmt.Errorf("failed to write value for implicit pointer conversion (field access): %w", err)
			}
			c.tsw.WriteLiterally("))._ptr!.")
			c.WriteIdentValue(exp.Sel) // Write the field name
		}
	} else {
		// For non-pointer types or when no implicit address-of is needed, access directly
		if err := c.WriteValueExpr(exp.X); err != nil {
			return fmt.Errorf("failed to write selector expression object: %w", err)
		}
		c.tsw.WriteLiterally(".")
		c.WriteIdentValue(exp.Sel)
	}
	return nil
}

// WriteStarExprType writes a pointer type (e.g., *MyStruct).
func (c *GoToTSCompiler) WriteStarExprType(exp *ast.StarExpr) {
	// Use goscript.Ptr<T> for pointer types
	c.tsw.WriteLiterally("goscript.Ptr<")
	c.WriteTypeExpr(exp.X)
	c.tsw.WriteLiterally(">")
}

// WriteStarExprValue writes a pointer dereference value (e.g., *myVar).
func (c *GoToTSCompiler) WriteStarExprValue(exp *ast.StarExpr) error {
	// Dereferencing a pointer in Go (*p) gets the value.
	// In TS with goPtrProxy, we need to access the ._ptr property with proper null checks.
	c.tsw.WriteLiterally("(")
	if err := c.WriteValueExpr(exp.X); err != nil {
		return fmt.Errorf("failed to write star expression operand: %w", err)
	}
	c.tsw.WriteLiterally(")?._ptr") // Use optional chaining for null safety
	return nil
}

// WriteStructType writes a struct type definition.
func (c *GoToTSCompiler) WriteStructType(exp *ast.StructType) {
	if exp.Fields == nil || exp.Fields.NumFields() == 0 {
		c.tsw.WriteLiterally("{}")
		return
	}
	c.WriteFieldList(exp.Fields, false) // false = not arguments
}

// WriteInterfaceType writes an interface type definition.
func (c *GoToTSCompiler) WriteInterfaceType(exp *ast.InterfaceType) {
	// writeInterfaceMethodSignature is a local helper function to write a method signature
	writeInterfaceMethodSignature := func(field *ast.Field) error {
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

	var embeddedInterfaces []string
	var methods []*ast.Field

	if exp.Methods != nil {
		for _, method := range exp.Methods.List {
			if len(method.Names) > 0 {
				// Named method
				methods = append(methods, method)
			} else {
				// Embedded interface - collect the type name using type info
				if tv, ok := c.pkg.TypesInfo.Types[method.Type]; ok && tv.Type != nil {
					if namedType, ok := tv.Type.(*gtypes.Named); ok {
						embeddedInterfaces = append(embeddedInterfaces, namedType.Obj().Name())
					} else {
						c.tsw.WriteCommentLine(fmt.Sprintf("// Unhandled embedded interface type: %T", tv.Type))
					}
				} else {
					c.tsw.WriteCommentLine("// Could not resolve embedded interface type")
				}
			}
		}
	}

	// If there are embedded interfaces, write the extends clause
	if len(embeddedInterfaces) > 0 {
		c.tsw.WriteLiterally("extends ")
		c.tsw.WriteLiterally(strings.Join(embeddedInterfaces, ", "))
		c.tsw.WriteLiterally(" ")
	}

	// Write the interface body on the same line
	c.tsw.WriteLiterally("{")
	c.tsw.WriteLine("") // Newline after opening brace
	c.tsw.Indent(1)

	// Write named methods
	for _, method := range methods {
		if err := writeInterfaceMethodSignature(method); err != nil {
			c.tsw.WriteCommentInline(fmt.Sprintf("error writing interface method signature: %v", err))
		}
	}

	c.tsw.Indent(-1)
	c.tsw.WriteLine("}")
}

// WriteFuncType writes a function type signature.
// useArrowForReturnType determines if '=>' (for type expressions) or ':' (for declarations) is used.
func (c *GoToTSCompiler) WriteFuncType(exp *ast.FuncType, isAsync bool, useArrowForReturnType bool) {
	c.tsw.WriteLiterally("(")
	c.WriteFieldList(exp.Params, true) // true = arguments
	c.tsw.WriteLiterally(")")
	if exp.Results != nil && len(exp.Results.List) > 0 {
		// Use ':' or '=>' for return type annotation
		if useArrowForReturnType {
			c.tsw.WriteLiterally(" => ")
		} else {
			c.tsw.WriteLiterally(": ")
		}
		if isAsync {
			c.tsw.WriteLiterally("Promise<")
		}
		if len(exp.Results.List) == 1 && len(exp.Results.List[0].Names) == 0 {
			// Single unnamed return type
			c.WriteTypeExpr(exp.Results.List[0].Type)
		} else {
			// Multiple or named return types -> tuple
			c.tsw.WriteLiterally("[")
			for i, field := range exp.Results.List {
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
		if useArrowForReturnType {
			if isAsync {
				c.tsw.WriteLiterally(" => Promise<void>")
			} else {
				c.tsw.WriteLiterally(" => void")
			}
		} else {
			if isAsync {
				c.tsw.WriteLiterally(": Promise<void>")
			} else {
				c.tsw.WriteLiterally(": void")
			}
		}
	}
}

// WriteCallExpr writes a function call.
func (c *GoToTSCompiler) WriteCallExpr(exp *ast.CallExpr) error {
	expFun := exp.Fun

	// Handle array type conversions like []rune(string)
	if arrayType, isArrayType := expFun.(*ast.ArrayType); isArrayType {
		// Check if it's a []rune type
		if ident, isIdent := arrayType.Elt.(*ast.Ident); isIdent && ident.Name == "rune" {
			// Check if the argument is a string
			if len(exp.Args) == 1 {
				arg := exp.Args[0]
				if tv, ok := c.pkg.TypesInfo.Types[arg]; ok && tv.Type != nil {
					if basic, isBasic := tv.Type.Underlying().(*gtypes.Basic); isBasic && basic.Kind() == gtypes.String {
						// Translate []rune(stringValue) to goscript.stringToRunes(stringValue)
						c.tsw.WriteLiterally("goscript.stringToRunes(")
						if err := c.WriteValueExpr(arg); err != nil {
							return fmt.Errorf("failed to write argument for []rune(string) conversion: %w", err)
						}
						c.tsw.WriteLiterally(")")
						return nil // Handled []rune(string)
					}
				}
			}
		}
	}

	if funIdent, funIsIdent := expFun.(*ast.Ident); funIsIdent {
		switch funIdent.String() {
		case "println":
			c.tsw.WriteLiterally("console.log(")
			for i, arg := range exp.Args {
				if i != 0 {
					c.tsw.WriteLiterally(", ")
				}
				if err := c.WriteValueExpr(arg); err != nil {
					return err
				}
			}
			c.tsw.WriteLiterally(")")
			return nil
		case "len":
			// Translate len(arg) to goscript.len(arg)
			if len(exp.Args) == 1 {
				c.tsw.WriteLiterally("goscript.len(")
				if err := c.WriteValueExpr(exp.Args[0]); err != nil {
					return err
				}
				c.tsw.WriteLiterally(")")
				return nil // Handled len
			}
			return errors.New("unhandled len call with incorrect number of arguments")
		case "cap":
			// Translate cap(arg) to goscript.cap(arg)
			if len(exp.Args) == 1 {
				c.tsw.WriteLiterally("goscript.cap(")
				if err := c.WriteValueExpr(exp.Args[0]); err != nil {
					return err
				}
				c.tsw.WriteLiterally(")")
				return nil // Handled cap
			}
			return errors.New("unhandled cap call with incorrect number of arguments")
		case "delete":
			// Translate delete(map, key) to goscript.deleteMapEntry(map, key)
			if len(exp.Args) == 2 {
				c.tsw.WriteLiterally("goscript.deleteMapEntry(")
				if err := c.WriteValueExpr(exp.Args[0]); err != nil { // Map
					return err
				}
				c.tsw.WriteLiterally(", ")
				if err := c.WriteValueExpr(exp.Args[1]); err != nil { // Key
					return err
				}
				c.tsw.WriteLiterally(")")
				return nil // Handled delete
			}
			return errors.New("unhandled delete call with incorrect number of arguments")
		case "make":
			// First check if we have a channel type
			if typ := c.pkg.TypesInfo.TypeOf(exp.Args[0]); typ != nil {
				if chanType, ok := typ.Underlying().(*gtypes.Chan); ok {
					// Handle channel creation: make(chan T, bufferSize) or make(chan T)
					c.tsw.WriteLiterally("goscript.makeChannel<")
					c.WriteGoType(chanType.Elem())
					c.tsw.WriteLiterally(">(")

					// If buffer size is provided, add it
					if len(exp.Args) >= 2 {
						if err := c.WriteValueExpr(exp.Args[1]); err != nil {
							return fmt.Errorf("failed to write buffer size in makeChannel: %w", err)
						}
					} else {
						// Default to 0 (unbuffered channel)
						c.tsw.WriteLiterally("0")
					}

					c.tsw.WriteLiterally(", ") // Add comma for zero value argument

					// Write the zero value for the channel's element type
					c.WriteZeroValueForType(chanType.Elem())

					c.tsw.WriteLiterally(")")
					return nil // Handled make for channel
				}
			}
			// Handle make for slices: make([]T, len, cap) or make([]T, len)
			if len(exp.Args) >= 1 {
				// Handle map creation: make(map[K]V)
				if mapType, ok := exp.Args[0].(*ast.MapType); ok {
					c.tsw.WriteLiterally("goscript.makeMap<")
					c.WriteTypeExpr(mapType.Key) // Write the key type
					c.tsw.WriteLiterally(", ")
					c.WriteTypeExpr(mapType.Value) // Write the value type
					c.tsw.WriteLiterally(">()")
					return nil // Handled make for map
				}

				// Handle slice creation
				if _, ok := exp.Args[0].(*ast.ArrayType); ok {
					// Get the slice type information
					sliceType := c.pkg.TypesInfo.TypeOf(exp.Args[0])
					if sliceType == nil {
						return errors.New("could not get type information for slice in make call")
					}
					goElemType, ok := sliceType.Underlying().(*gtypes.Slice)
					if !ok {
						return errors.New("expected slice type for make call")
					}

					c.tsw.WriteLiterally("goscript.makeSlice<")
					c.WriteGoType(goElemType.Elem()) // Write the element type
					c.tsw.WriteLiterally(">(")

					if len(exp.Args) >= 2 {
						if err := c.WriteValueExpr(exp.Args[1]); err != nil { // Length
							return err
						}
						if len(exp.Args) == 3 {
							c.tsw.WriteLiterally(", ")
							if err := c.WriteValueExpr(exp.Args[2]); err != nil { // Capacity
								return err
							}
						} else if len(exp.Args) > 3 {
							return errors.New("makeSlice expects 2 or 3 arguments")
						}
					} else {
						// If no length is provided, default to 0
						c.tsw.WriteLiterally("0")
					}
					c.tsw.WriteLiterally(")")
					return nil // Handled make for slice
				}
			}
			// Fallthrough for unhandled make calls (e.g., channels)
			return errors.New("unhandled make call")
		case "string":
			// Handle string() conversion
			if len(exp.Args) == 1 {
				arg := exp.Args[0]

				// Case 1: Argument is a string literal string("...")
				if basicLit, isBasicLit := arg.(*ast.BasicLit); isBasicLit && basicLit.Kind == token.STRING {
					// Translate string("...") to "..." (no-op)
					c.WriteBasicLitValue(basicLit)
					return nil // Handled string literal conversion
				}

				// Case 2: Argument is a rune (int32) or a call to rune()
				innerCall, isCallExpr := arg.(*ast.CallExpr)

				if isCallExpr {
					// Check if it's a call to rune()
					if innerFunIdent, innerFunIsIdent := innerCall.Fun.(*ast.Ident); innerFunIsIdent && innerFunIdent.String() == "rune" {
						// Translate string(rune(val)) to String.fromCharCode(val)
						if len(innerCall.Args) == 1 {
							c.tsw.WriteLiterally("String.fromCharCode(")
							if err := c.WriteValueExpr(innerCall.Args[0]); err != nil {
								return fmt.Errorf("failed to write argument for string(rune) conversion: %w", err)
							}
							c.tsw.WriteLiterally(")")
							return nil // Handled string(rune)
						}
					}
				}

				// Handle direct string(int32) conversion
				// This assumes 'rune' is int32
				if tv, ok := c.pkg.TypesInfo.Types[arg]; ok {
					if basic, isBasic := tv.Type.Underlying().(*gtypes.Basic); isBasic && basic.Kind() == gtypes.Int32 {
						// Translate string(rune_val) to String.fromCharCode(rune_val)
						c.tsw.WriteLiterally("String.fromCharCode(")
						if err := c.WriteValueExpr(arg); err != nil {
							return fmt.Errorf("failed to write argument for string(int32) conversion: %w", err)
						}
						c.tsw.WriteLiterally(")")
						return nil // Handled string(int32)
					}

					// Case 3: Argument is a slice of runes string([]rune{...})
					if sliceType, isSlice := tv.Type.Underlying().(*gtypes.Slice); isSlice {
						if basic, isBasic := sliceType.Elem().Underlying().(*gtypes.Basic); isBasic && basic.Kind() == gtypes.Int32 {
							// Translate string([]rune) to goscript.runesToString(...)
							c.tsw.WriteLiterally("goscript.runesToString(")
							if err := c.WriteValueExpr(arg); err != nil {
								return fmt.Errorf("failed to write argument for string([]rune) conversion: %w", err)
							}
							c.tsw.WriteLiterally(")")
							return nil // Handled string([]rune)
						}
					}
				}
			}
			// Return error for other unhandled string conversions
			return fmt.Errorf("unhandled string conversion: %s", exp.Fun)
		case "close":
			// Translate close(ch) to ch.close()
			if len(exp.Args) == 1 {
				if err := c.WriteValueExpr(exp.Args[0]); err != nil {
					return fmt.Errorf("failed to write channel in close call: %w", err)
				}
				c.tsw.WriteLiterally(".close()")
				return nil // Handled close
			}
			return errors.New("unhandled close call with incorrect number of arguments")
		case "append":
			// Translate append(slice, elements...) to goscript.append(slice, elements...)
			if len(exp.Args) >= 1 {
				c.tsw.WriteLiterally("goscript.append(")
				// The first argument is the slice
				if err := c.WriteValueExpr(exp.Args[0]); err != nil {
					return fmt.Errorf("failed to write slice in append call: %w", err)
				}
				// The remaining arguments are the elements to append
				for i, arg := range exp.Args[1:] {
					if i > 0 || len(exp.Args) > 1 { // Add comma before elements if there are any
						c.tsw.WriteLiterally(", ")
					}
					if err := c.WriteValueExpr(arg); err != nil {
						return fmt.Errorf("failed to write argument %d in append call: %w", i+1, err)
					}
				}
				c.tsw.WriteLiterally(")")
				return nil // Handled append
			}
			return errors.New("unhandled append call with incorrect number of arguments")
		default:
			// Check if this is an async function call
			if funIdent != nil && c.isAsyncFunc(funIdent.Name) {
				c.tsw.WriteLiterally("await ")
			}

			// Not a special built-in, treat as a regular function call
			if err := c.WriteValueExpr(expFun); err != nil {
				return fmt.Errorf("failed to write function expression in call: %w", err)
			}
			c.tsw.WriteLiterally("(")
			for i, arg := range exp.Args {
				if i != 0 {
					c.tsw.WriteLiterally(", ")
				}
				if err := c.WriteValueExpr(arg); err != nil {
					return fmt.Errorf("failed to write argument %d in call: %w", i, err)
				}
			}
			c.tsw.WriteLiterally(")")
			return nil // Handled regular function call
		}
	} else {
		// Not an identifier (e.g., method call on a value)
		// This could be a method call on a pointer (e.g., ptr.Method())
		// Let WriteSelectorExprValue handle the pointer dereference logic
		if err := c.WriteValueExpr(expFun); err != nil {
			return fmt.Errorf("failed to write method expression in call: %w", err)
		}
	}
	c.tsw.WriteLiterally("(")
	for i, arg := range exp.Args {
		if i != 0 {
			c.tsw.WriteLiterally(", ")
		}
		if err := c.WriteValueExpr(arg); err != nil {
			return fmt.Errorf("failed to write argument %d in call: %w", i, err)
		}
	}
	c.tsw.WriteLiterally(")")
	return nil
}

// WriteUnaryExprValue writes a unary operation on a value.
func (c *GoToTSCompiler) WriteUnaryExprValue(exp *ast.UnaryExpr) error {
	if exp.Op == token.ARROW {
		// Channel receive: <-ch becomes await ch.receive()
		c.tsw.WriteLiterally("await ")
		if err := c.WriteValueExpr(exp.X); err != nil {
			return fmt.Errorf("failed to write channel receive operand: %w", err)
		}
		c.tsw.WriteLiterally(".receive()")
		return nil
	}

	if exp.Op == token.AND {
		// Address-of operator (&) creates a new Go pointer proxy wrapping the value
		c.tsw.WriteLiterally("goscript.makePtr(")
		if err := c.WriteValueExpr(exp.X); err != nil {
			return fmt.Errorf("failed to write unary expression operand for address-of: %w", err)
		}
		c.tsw.WriteLiterally(")")
		return nil
	}

	tokStr, ok := gstypes.TokenToTs(exp.Op)
	if !ok {
		c.tsw.WriteCommentInline(fmt.Sprintf("unhandled unary op: %s", exp.Op.String()))
	} else {
		c.tsw.WriteLiterally(tokStr)
	}
	if err := c.WriteValueExpr(exp.X); err != nil {
		return fmt.Errorf("failed to write unary expression operand: %w", err)
	}
	return nil
}

// WriteBinaryExprValue writes a binary operation on values.
func (c *GoToTSCompiler) WriteBinaryExprValue(exp *ast.BinaryExpr) error {
	// Handle special cases like channel send
	if exp.Op == token.ARROW {
		// Channel send: ch <- val becomes await ch.send(val)
		c.tsw.WriteLiterally("await ")
		if err := c.WriteValueExpr(exp.X); err != nil {
			return fmt.Errorf("failed to write channel send target: %w", err)
		}
		c.tsw.WriteLiterally(".send(")
		if err := c.WriteValueExpr(exp.Y); err != nil {
			return fmt.Errorf("failed to write channel send value: %w", err)
		}
		c.tsw.WriteLiterally(")")
		return nil
	}

	// Check if the operator is a bitwise operator
	isBitwise := false
	switch exp.Op {
	case token.AND, token.OR, token.XOR, token.SHL, token.SHR, token.AND_NOT:
		isBitwise = true
	}

	if isBitwise {
		c.tsw.WriteLiterally("(") // Add opening parenthesis for bitwise operations
	}

	if err := c.WriteValueExpr(exp.X); err != nil {
		return fmt.Errorf("failed to write binary expression left operand: %w", err)
	}
	c.tsw.WriteLiterally(" ")
	tokStr, ok := gstypes.TokenToTs(exp.Op)
	if !ok {
		c.tsw.WriteCommentInline(fmt.Sprintf("unhandled binary op: %s", exp.Op.String()))
		c.tsw.WriteLiterally(" /* op */ ")
	} else {
		c.tsw.WriteLiterally(tokStr)
	}
	c.tsw.WriteLiterally(" ")
	if err := c.WriteValueExpr(exp.Y); err != nil {
		return fmt.Errorf("failed to write binary expression right operand: %w", err)
	}

	if isBitwise {
		c.tsw.WriteLiterally(")") // Add closing parenthesis for bitwise operations
	}

	return nil
}

// WriteBasicLitValue writes a basic literal value.
func (c *GoToTSCompiler) WriteBasicLitValue(exp *ast.BasicLit) {
	if exp.Kind == token.CHAR {
		// Go char literal 'x' is a rune (int32). Translate to its numeric code point.
		// Use strconv.UnquoteChar to handle escape sequences correctly.
		val, _, _, err := strconv.UnquoteChar(exp.Value[1:len(exp.Value)-1], '\'')
		if err != nil {
			c.tsw.WriteCommentInline(fmt.Sprintf("error parsing char literal %s: %v", exp.Value, err))
			c.tsw.WriteLiterally("0") // Default to 0 on error
		} else {
			c.tsw.WriteLiterally(fmt.Sprintf("%d", val))
		}
	} else {
		// Other literals (INT, FLOAT, STRING, IMAG)
		c.tsw.WriteLiterally(exp.Value)
	}
}

/*
WriteCompositeLitValue writes a composite literal value.
For array literals, uses type information to determine array length and element type,
and fills uninitialized elements with the correct zero value.
For map literals, creates a new Map with entries.
*/
func (c *GoToTSCompiler) WriteCompositeLitValue(exp *ast.CompositeLit) error {
	if exp.Type != nil {
		// Handle map literals: map[K]V{k1: v1, k2: v2}
		if _, isMapType := exp.Type.(*ast.MapType); isMapType {
			c.tsw.WriteLiterally("new Map([")

			// Add each key-value pair as an entry
			for i, elm := range exp.Elts {
				if i > 0 {
					c.tsw.WriteLiterally(", ")
				}

				if kv, ok := elm.(*ast.KeyValueExpr); ok {
					c.tsw.WriteLiterally("[")
					if err := c.WriteValueExpr(kv.Key); err != nil {
						return fmt.Errorf("failed to write map literal key: %w", err)
					}
					c.tsw.WriteLiterally(", ")
					if err := c.WriteValueExpr(kv.Value); err != nil {
						return fmt.Errorf("failed to write map literal value: %w", err)
					}
					c.tsw.WriteLiterally("]")
				} else {
					return fmt.Errorf("map literal elements must be key-value pairs")
				}
			}

			c.tsw.WriteLiterally("])")
			return nil
		}

		// Handle array literals
		if arrType, isArrayType := exp.Type.(*ast.ArrayType); isArrayType {
			// Special case: empty slice literal
			if len(exp.Elts) == 0 {
				// Generate: ([] as ElementType[])
				c.tsw.WriteLiterally("([] as ")
				// Write the element type using the existing function
				c.WriteTypeExpr(arrType.Elt)
				c.tsw.WriteLiterally("[])") // Close the type assertion
				return nil                  // Handled empty slice literal
			}

			c.tsw.WriteLiterally("[")
			// Use type info to get array length and element type
			var arrayLen int
			var elemType ast.Expr
			var goElemType interface{}
			if typ := c.pkg.TypesInfo.TypeOf(exp.Type); typ != nil {
				if at, ok := typ.Underlying().(*gtypes.Array); ok {
					arrayLen = int(at.Len())
					goElemType = at.Elem()
				}
			}
			if arrType.Len != nil {
				// Try to evaluate the length from the AST if not available from type info
				if bl, ok := arrType.Len.(*ast.BasicLit); ok && bl.Kind == token.INT {
					if _, err := fmt.Sscan(bl.Value, &arrayLen); err != nil {
						return fmt.Errorf("failed to parse array length from basic literal: %w", err)
					}
				}
			}
			elemType = arrType.Elt

			// Map of index -> value
			elements := make(map[int]ast.Expr)
			orderedCount := 0
			maxIndex := -1
			hasKeyedElements := false

			for _, elm := range exp.Elts {
				if kv, ok := elm.(*ast.KeyValueExpr); ok {
					if lit, ok := kv.Key.(*ast.BasicLit); ok && lit.Kind == token.INT {
						var index int
						if _, err := fmt.Sscan(lit.Value, &index); err != nil {
							return fmt.Errorf("failed to parse array index from basic literal: %w", err)
						}
						elements[index] = kv.Value
						if index > maxIndex {
							maxIndex = index
						}
						hasKeyedElements = true
					} else {
						c.tsw.WriteCommentInline("unhandled keyed array literal key type")
						if err := c.WriteValueExpr(elm); err != nil {
							return fmt.Errorf("failed to write keyed array literal element with unhandled key type: %w", err)
						}
					}
				} else {
					elements[orderedCount] = elm
					if orderedCount > maxIndex {
						maxIndex = orderedCount
					}
					orderedCount++
				}
			}

			// Determine array length
			if arrayLen == 0 {
				// If length is not set, infer from max index or number of elements
				if hasKeyedElements {
					arrayLen = maxIndex + 1
				} else {
					arrayLen = len(exp.Elts)
				}
			}

			for i := 0; i < arrayLen; i++ {
				if i > 0 {
					c.tsw.WriteLiterally(", ")
				}
				if elm, ok := elements[i]; ok && elm != nil {
					if err := c.WriteValueExpr(elm); err != nil {
						return fmt.Errorf("failed to write array literal element: %w", err)
					}
				} else {
					// Write zero value for element type
					if goElemType != nil {
						c.WriteZeroValueForType(goElemType)
					} else {
						c.WriteZeroValueForType(elemType)
					}
				}
			}
			c.tsw.WriteLiterally("]")
			return nil
		} else {
			// Typed literal, likely a struct: new Type({...})
			c.tsw.WriteLiterally("new ")
			c.WriteTypeExpr(exp.Type)
			c.tsw.WriteLiterally("({")
			// Get the type information for the struct being initialized
			structTypeInfo := c.pkg.TypesInfo.TypeOf(exp.Type)
			if structTypeInfo == nil {
				return errors.New("could not get type information for struct in composite literal")
			}
			structType, ok := structTypeInfo.Underlying().(*gtypes.Struct)
			if !ok {
				return errors.New("expected struct type for composite literal")
			}

			for i, elm := range exp.Elts {
				if i != 0 {
					c.tsw.WriteLiterally(", ")
				}

				// Check if this element corresponds to an embedded field
				isEmbeddedField := false
				if kv, ok := elm.(*ast.KeyValueExpr); ok {
					// If it's a KeyValueExpr, check if the key matches an embedded field name
					if keyIdent, ok := kv.Key.(*ast.Ident); ok {
						for j := 0; j < structType.NumFields(); j++ {
							field := structType.Field(j)
							if field.Embedded() && field.Name() == keyIdent.Name {
								isEmbeddedField = true
								break
							}
						}
					}
				} /* else {
					// If it's not a KeyValueExpr, it's an ordered field.
					// We need to find the corresponding field in the struct type.
					// This is more complex and might require tracking the field index.
					// For now, assume non-keyed elements are not embedded structs directly.
					// TODO: Handle ordered embedded struct initialization if needed.
				}*/

				if isEmbeddedField {
					// If it's an embedded field, write the key and then the value as an object literal
					// The value should be a composite literal for the embedded struct.
					if kv, ok := elm.(*ast.KeyValueExpr); ok {
						if err := c.WriteValueExpr(kv.Key); err != nil {
							return fmt.Errorf("failed to write embedded struct field key: %w", err)
						}
						c.tsw.WriteLiterally(": ")
						// The value should be the composite literal for the embedded struct
						if embeddedLit, ok := kv.Value.(*ast.CompositeLit); ok {
							// Write the embedded composite literal, but without the 'new Type({...})' part
							// This means recursively calling WriteCompositeLitValue but with a flag
							// or a different function to indicate it's an embedded literal.
							// For now, let's manually write the object literal structure.
							c.tsw.WriteLiterally("{")
							if embeddedLit.Elts != nil {
								for j, embeddedElm := range embeddedLit.Elts {
									if j > 0 {
										c.tsw.WriteLiterally(", ")
									}
									// Write the fields of the embedded struct
									if err := c.WriteValueExpr(embeddedElm); err != nil {
										return fmt.Errorf("failed to write embedded struct inner field: %w", err)
									}
								}
							}
							c.tsw.WriteLiterally("}")
						} else {
							return fmt.Errorf("expected composite literal for embedded struct initialization")
						}
					} else {
						return fmt.Errorf("expected key-value pair for embedded struct initialization")
					}
				} else {
					// Detect ordered initialiser matching an embedded struct.
					if compLit, ok := elm.(*ast.CompositeLit); ok {
						// Resolve the Go type of this composite literal.
						var compTyp gtypes.Type
						if compLit.Type != nil {
							compTyp = c.pkg.TypesInfo.TypeOf(compLit.Type)
						} else {
							compTyp = c.pkg.TypesInfo.TypeOf(compLit)
						}

						// Try to find an embedded field whose type equals compTyp.
						var embeddedName string
						for j := 0; j < structType.NumFields(); j++ {
							f := structType.Field(j)
							if f.Embedded() && compTyp != nil && gtypes.Identical(f.Type(), compTyp) {
								embeddedName = f.Name()
								break
							}
						}

						if embeddedName != "" { // Ordered embedded struct initialiser detected.
							c.tsw.WriteLiterally(embeddedName)
							c.tsw.WriteLiterally(": {")
							for k, inner := range compLit.Elts {
								if k > 0 {
									c.tsw.WriteLiterally(", ")
								}
								if err := c.WriteValueExpr(inner); err != nil {
									return fmt.Errorf("failed to write embedded struct ordered field: %w", err)
								}
							}
							c.tsw.WriteLiterally("}")
							continue // Skip default handling
						}
					}

					// Not an embedded field, write as a regular field initializer
					if err := c.WriteValueExpr(elm); err != nil {
						return fmt.Errorf("failed to write struct literal field: %w", err)
					}
				}
			}
			c.tsw.WriteLiterally("})")
			return nil
		}
	}

	// Untyped composite literal. Could be array, slice, map.
	// Requires type information for accurate translation.
	// Defaulting to an object literal {} as a slightly safer guess than array []
	// if it contains KeyValueExpr, otherwise default to array.
	isLikelyObject := false
	if len(exp.Elts) > 0 {
		if _, ok := exp.Elts[0].(*ast.KeyValueExpr); ok {
			isLikelyObject = true
		}
	}

	if isLikelyObject {
		c.tsw.WriteLiterally("{ ")
	} else {
		c.tsw.WriteLiterally("[ ")
	}

	for i, elm := range exp.Elts {
		if i != 0 {
			c.tsw.WriteLiterally(", ")
		}
		if err := c.WriteValueExpr(elm); err != nil {
			return fmt.Errorf("failed to write untyped composite literal element: %w", err)
		}
	}
	if isLikelyObject {
		c.tsw.WriteLiterally(" }")
	} else {
		c.tsw.WriteLiterally(" ]")
	}
	// c.tsw.WriteCommentInline("untyped composite literal, type guessed")
	return nil
}

// WriteKeyValueExprValue writes a key-value pair.
// Returns an error if writing the key or value fails.
func (c *GoToTSCompiler) WriteKeyValueExprValue(exp *ast.KeyValueExpr) error {
	// Keep original Go casing for keys
	if err := c.WriteValueExpr(exp.Key); err != nil {
		return fmt.Errorf("failed to write key-value expression key: %w", err)
	}
	c.tsw.WriteLiterally(": ")
	if err := c.WriteValueExpr(exp.Value); err != nil {
		return fmt.Errorf("failed to write key-value expression value: %w", err)
	}
	return nil
}

// WriteFuncLitValue writes a function literal as a TypeScript arrow function.
func (c *GoToTSCompiler) WriteFuncLitValue(exp *ast.FuncLit) error {
	// Determine if the function literal should be async
	isAsync := c.containsAsyncOperations(exp.Body)

	if isAsync {
		c.tsw.WriteLiterally("async ")
	}

	// Write arrow function: (params) => { body }
	c.tsw.WriteLiterally("(")
	c.WriteFieldList(exp.Type.Params, true) // true = arguments
	c.tsw.WriteLiterally(")")

	// Handle return type for function literals
	if exp.Type.Results != nil && len(exp.Type.Results.List) > 0 {
		c.tsw.WriteLiterally(": ")
		if isAsync {
			c.tsw.WriteLiterally("Promise<")
		}
		if len(exp.Type.Results.List) == 1 && len(exp.Type.Results.List[0].Names) == 0 {
			c.WriteTypeExpr(exp.Type.Results.List[0].Type)
		} else {
			c.tsw.WriteLiterally("[")
			for i, field := range exp.Type.Results.List {
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
		if isAsync {
			c.tsw.WriteLiterally(": Promise<void>")
		} else {
			c.tsw.WriteLiterally(": void")
		}
	}

	c.tsw.WriteLiterally(" => ")

	// Save previous async state and set current state based on isAsync
	previousAsyncState := c.inAsyncFunction
	c.inAsyncFunction = isAsync

	// Write function body
	if err := c.WriteStmt(exp.Body); err != nil {
		c.inAsyncFunction = previousAsyncState // Restore state before returning error
		return fmt.Errorf("failed to write function literal body: %w", err)
	}

	// Restore previous async state
	c.inAsyncFunction = previousAsyncState
	return nil
}

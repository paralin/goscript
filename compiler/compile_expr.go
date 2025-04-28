package compiler

import (
	"errors"
	"fmt"
	"go/ast"
	"go/token"
	gtypes "go/types"
	"strconv"
	"strings"

	gstypes "github.com/paralin/goscript/compiler/types"
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
		c.WriteFuncType(exp, false) // Function types are not async
	case *ast.ArrayType:
		// Translate [N]T to T[]
		c.WriteTypeExpr(exp.Elt)
		c.tsw.WriteLiterally("[]")
	case *ast.MapType:
		// Map<K,V> → TS object type { [key: K]: V }
		c.tsw.WriteLiterally("{ [key: ")
		c.WriteTypeExpr(exp.Key)
		c.tsw.WriteLiterally("]: ")
		c.WriteTypeExpr(exp.Value)
		c.tsw.WriteLiterally(" }")
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
			// Check if it's a map type
			if _, isMap := tv.Type.Underlying().(*gtypes.Map); isMap {
				if err := c.WriteValueExpr(exp.X); err != nil {
					return err
				}
				c.tsw.WriteLiterally(".get(")
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
		if err := c.WriteValueExpr(exp.X); err != nil {
			return err
		}
		c.tsw.WriteLiterally("[")
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
	// Get the type name string for the asserted type
	typeName := c.getTypeNameString(exp.Type)

	// Generate a call to goscript.typeAssert
	c.tsw.WriteLiterally("goscript.typeAssert<")
	c.WriteTypeExpr(exp.Type) // Write the asserted type for the generic
	c.tsw.WriteLiterally(">(")
	if err := c.WriteValueExpr(exp.X); err != nil { // The interface expression
		return fmt.Errorf("failed to write interface expression in type assertion expression: %w", err)
	}
	c.tsw.WriteLiterally(", ")
	c.tsw.WriteLiterally(fmt.Sprintf("'%s'", typeName))
	c.tsw.WriteLiterally(").value") // Access the value field directly in expression context
	return nil
}

// getTypeNameString returns the string representation of a type name
func (c *GoToTSCompiler) getTypeNameString(typeExpr ast.Expr) string {
	switch t := typeExpr.(type) {
	case *ast.Ident:
		return t.Name
	case *ast.SelectorExpr:
		// For imported types like pkg.Type
		if ident, ok := t.X.(*ast.Ident); ok {
			return fmt.Sprintf("%s.%s", ident.Name, t.Sel.Name)
		}
	}
	// Default case, use a placeholder for complex types
	return "unknown"
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
	if err := c.WriteValueExpr(exp.X); err != nil {
		return fmt.Errorf("failed to write selector expression object: %w", err)
	}
	c.tsw.WriteLiterally(".")
	c.WriteIdentValue(exp.Sel)
	return nil
}

// WriteStarExprType writes a pointer type (e.g., *MyStruct).
func (c *GoToTSCompiler) WriteStarExprType(exp *ast.StarExpr) {
	// Map pointer types to T | null
	c.WriteTypeExpr(exp.X)
	c.tsw.WriteLiterally(" | null")
}

// WriteStarExprValue writes a pointer dereference value (e.g., *myVar).
func (c *GoToTSCompiler) WriteStarExprValue(exp *ast.StarExpr) error {
	// Dereferencing a pointer in Go (*p) gets the value.
	// In TS, if p is MyStruct | null, accessing the value means just using p.
	// Cloning to emulate value semantics happens during assignment (see WriteStmtAssign).
	if err := c.WriteValueExpr(exp.X); err != nil {
		return fmt.Errorf("failed to write star expression operand: %w", err)
	}
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
		c.tsw.WriteLiterally(" extends ")
		c.tsw.WriteLiterally(strings.Join(embeddedInterfaces, ", "))
	}

	// Write the interface body on the same line
	c.tsw.WriteLiterally("{") // Removed leading space
	c.tsw.WriteLine("")       // Newline after opening brace
	c.tsw.Indent(1)

	// Write named methods
	for _, method := range methods {
		if err := c.WriteInterfaceMethodSignature(method); err != nil {
			c.tsw.WriteCommentInline(fmt.Sprintf("error writing interface method signature: %v", err))
		}
	}

	c.tsw.Indent(-1)
	c.tsw.WriteLine("}")
}

// WriteFuncType writes a function type signature.
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
		if isAsync {
			c.tsw.WriteLiterally(": Promise<void>")
		} else {
			c.tsw.WriteLiterally(": void")
		}
	}
}

// WriteCallExpr writes a function call.
func (c *GoToTSCompiler) WriteCallExpr(exp *ast.CallExpr) error {
	expFun := exp.Fun

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
		// Address-of operator (&) might translate to just the value in TS,
		// or potentially involve reference objects if complex pointer logic is needed.
		// For now, just write the operand.
		if err := c.WriteValueExpr(exp.X); err != nil {
			return fmt.Errorf("failed to write unary expression operand for address-of: %w", err)
		}
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
			c.tsw.WriteLiterally("({ ")
			for i, elm := range exp.Elts {
				if i != 0 {
					c.tsw.WriteLiterally(", ")
				}
				if err := c.WriteValueExpr(elm); err != nil {
					return fmt.Errorf("failed to write struct literal field: %w", err)
				}
			}
			c.tsw.WriteLiterally(" })")
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

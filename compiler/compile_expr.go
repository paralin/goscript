package compiler

import (
	"errors"
	"fmt"
	"go/ast"
	"go/token"
	gtypes "go/types"

	gstypes "github.com/paralin/goscript/types"
)

// WriteTypeExpr writes an expression that represents a type.
func (c *GoToTSCompiler) WriteTypeExpr(a ast.Expr) {
	switch exp := a.(type) {
	case *ast.Ident:
		c.WriteIdentType(exp)
	case *ast.SelectorExpr:
		c.WriteSelectorExprType(exp)
	case *ast.StarExpr:
		c.WriteStarExprType(exp)
	case *ast.StructType:
		c.WriteStructType(exp)
	case *ast.InterfaceType:
		c.WriteInterfaceType(exp)
	case *ast.FuncType:
		c.WriteFuncType(exp)
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
		// channel types are not yet supported in TS output
		c.tsw.WriteCommentInline("channel type")
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
	case *ast.IndexExpr:
		// Translate X[Index] to X[Index]
		if err := c.WriteValueExpr(exp.X); err != nil {
			return err
		}
		c.tsw.WriteLiterally("[")
		if err := c.WriteValueExpr(exp.Index); err != nil {
			return err
		}
		c.tsw.WriteLiterally("]")
		return nil
	case *ast.ParenExpr:
		// Translate (X) to (X)
		c.tsw.WriteLiterally("(")
		if err := c.WriteValueExpr(exp.X); err != nil {
			return err
		}
		c.tsw.WriteLiterally(")")
		return nil
	// Add cases for SliceExpr etc.
	default:
		c.tsw.WriteCommentLine(fmt.Sprintf("unhandled value expr: %T", exp))
		return nil
	}
}

// --- Exported Node-Specific Writers ---

// WriteIdentType writes an identifier used as a type.
func (c *GoToTSCompiler) WriteIdentType(exp *ast.Ident) {
	name := exp.Name
	if tsname, ok := gstypes.GoBuiltinToTypescript(name); ok {
		name = tsname
	} else {
		// Not a Go builtin. Could be a custom type in the current package,
		// an imported type, or potentially an error.
		// Robust checking requires type information.
		if obj := exp.Obj; obj != nil && obj.Kind != ast.Typ {
			c.tsw.WriteCommentInline(fmt.Sprintf("ident %q used as type? kind=%s", name, obj.Kind))
		} else if obj == nil {
			// If obj is nil, it might be a type from an import or undefined.
			// Type checking pass should resolve this.
			// c.tsw.WriteCommentInline(fmt.Sprintf("unresolved ident %q used as type", name))
		}
		// Assume it's a valid custom type name for now.
	}
	c.tsw.WriteLiterally(name)
}

// WriteIdentValue writes an identifier used as a value (variable, function name).
func (c *GoToTSCompiler) WriteIdentValue(exp *ast.Ident) {
	c.tsw.WriteLiterally(exp.Name)
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
	if exp.Methods == nil || exp.Methods.NumFields() == 0 {
		c.tsw.WriteLiterally("{}")
		return
	}
	c.tsw.WriteLine("{")
	c.tsw.Indent(1)
	for _, method := range exp.Methods.List {
		if len(method.Names) > 0 {
			// Keep original Go casing for method names
			methodName := method.Names[0]
			c.WriteIdentValue(methodName)

			// Method signature is a FuncType
			if funcType, ok := method.Type.(*ast.FuncType); ok {
				c.WriteFuncType(funcType)
			} else {
				// Should not happen for valid interfaces, but handle defensively
				c.tsw.WriteCommentInline("unexpected method type")
			}
			c.tsw.WriteLine(";")
		} else {
			// Embedded interface - write the type name
			c.WriteTypeExpr(method.Type)
			c.tsw.WriteLine("; // Embedded interface - requires manual merging or mixin in TS")
		}
	}
	c.tsw.Indent(-1)
	c.tsw.WriteLine("}")
}

// WriteFuncType writes a function type signature.
func (c *GoToTSCompiler) WriteFuncType(exp *ast.FuncType) {
	c.tsw.WriteLiterally("(")
	c.WriteFieldList(exp.Params, true) // true = arguments
	c.tsw.WriteLiterally(")")
	if exp.Results != nil && len(exp.Results.List) > 0 {
		// Use colon for return type annotation
		c.tsw.WriteLiterally(": ")
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
	} else {
		// No return value -> void
		c.tsw.WriteLiterally(": void")
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
		case "make":
			// Handle make for slices: make([]T, len, cap) or make([]T, len)
			if len(exp.Args) >= 2 {
				if arrayType, ok := exp.Args[0].(*ast.ArrayType); ok {
					c.tsw.WriteLiterally("goscript.makeSlice(")
					// Get and write the string representation of the element type
					if typ := c.pkg.TypesInfo.TypeOf(arrayType.Elt); typ != nil {
						// Use the underlying type for basic types like int, string, etc.
						underlyingType := typ.Underlying()
						c.tsw.WriteLiterally(fmt.Sprintf("%q", underlyingType.String()))
					} else {
						// If type info is not available, this is an error condition for makeSlice
						return errors.New("could not determine element type for makeSlice")
					}
					c.tsw.WriteLiterally(", ")
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
					c.tsw.WriteLiterally(")")
					return nil // Handled make for slice
				}
			}
			// Fallthrough for unhandled make calls (e.g., maps, channels)
			return errors.New("unhandled make call")
		default:
			// Not a special built-in, treat as a regular function call
			if err := c.WriteValueExpr(expFun); err != nil {
				return err
			}
			c.tsw.WriteLiterally("(")
			for i, arg := range exp.Args {
				if i != 0 {
					c.tsw.WriteLiterally(", ")
				}
				if err := c.WriteValueExpr(arg); err != nil {
					return err
				}
			}
			c.tsw.WriteLiterally(")")
			return nil // Handled regular function call
		}
	} else {
		// Not an identifier (e.g., method call on a value)
		if err := c.WriteValueExpr(expFun); err != nil {
			return err
		}
	}
	c.tsw.WriteLiterally("(")
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
}

// WriteUnaryExprValue writes a unary operation on a value.
func (c *GoToTSCompiler) WriteUnaryExprValue(exp *ast.UnaryExpr) error {
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
	c.tsw.WriteLiterally(exp.Value)
}

/*
WriteCompositeLitValue writes a composite literal value.
For array literals, uses type information to determine array length and element type,
and fills uninitialized elements with the correct zero value.
*/
func (c *GoToTSCompiler) WriteCompositeLitValue(exp *ast.CompositeLit) error {
	if exp.Type != nil {
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
					fmt.Sscan(bl.Value, &arrayLen)
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
						fmt.Sscan(lit.Value, &index)
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

// WriteZeroValueForType writes the zero value for a given type.
// Handles array types recursively.
func (c *GoToTSCompiler) WriteZeroValueForType(typ interface{}) {
	switch t := typ.(type) {
	case *gtypes.Array:
		c.tsw.WriteLiterally("[")
		for i := 0; i < int(t.Len()); i++ {
			if i > 0 {
				c.tsw.WriteLiterally(", ")
			}
			c.WriteZeroValueForType(t.Elem())
		}
		c.tsw.WriteLiterally("]")
	case *ast.ArrayType:
		// Try to get length from AST
		length := 0
		if bl, ok := t.Len.(*ast.BasicLit); ok && bl.Kind == token.INT {
			fmt.Sscan(bl.Value, &length)
		}
		c.tsw.WriteLiterally("[")
		for i := 0; i < length; i++ {
			if i > 0 {
				c.tsw.WriteLiterally(", ")
			}
			c.WriteZeroValueForType(t.Elt)
		}
		c.tsw.WriteLiterally("]")
	case *gtypes.Basic:
		switch t.Kind() {
		case gtypes.Bool:
			c.tsw.WriteLiterally("false")
		case gtypes.String:
			c.tsw.WriteLiterally(`""`)
		default:
			c.tsw.WriteLiterally("0")
		}
	case *ast.Ident:
		// Try to map Go builtins
		if tsname, ok := gstypes.GoBuiltinToTypescript(t.Name); ok {
			switch tsname {
			case "boolean":
				c.tsw.WriteLiterally("false")
			case "string":
				c.tsw.WriteLiterally(`""`)
			default:
				c.tsw.WriteLiterally("0")
			}
		} else {
			c.tsw.WriteLiterally("null")
		}
	default:
		c.tsw.WriteLiterally("null")
	}
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

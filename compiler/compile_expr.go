package compiler

import (
	"fmt"
	"go/ast"
	"go/token"

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
	// Add cases for ArrayType, MapType, ChanType etc.
	default:
		c.tsw.WriteCommentLine(fmt.Sprintf("unhandled type expr: %T", exp))
	}
}

// WriteValueExpr writes an expression that represents a value.
func (c *GoToTSCompiler) WriteValueExpr(a ast.Expr) {
	switch exp := a.(type) {
	case *ast.Ident:
		c.WriteIdentValue(exp)
	case *ast.SelectorExpr:
		c.WriteSelectorExprValue(exp)
	case *ast.StarExpr:
		c.WriteStarExprValue(exp)
	case *ast.CallExpr:
		c.WriteCallExpr(exp)
	case *ast.UnaryExpr:
		c.WriteUnaryExprValue(exp)
	case *ast.BinaryExpr:
		c.WriteBinaryExprValue(exp)
	case *ast.BasicLit:
		c.WriteBasicLitValue(exp)
	case *ast.CompositeLit:
		c.WriteCompositeLitValue(exp)
	case *ast.KeyValueExpr:
		c.WriteKeyValueExprValue(exp)
	// Add cases for IndexExpr, SliceExpr etc.
	default:
		c.tsw.WriteCommentLine(fmt.Sprintf("unhandled value expr: %T", exp))
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
func (c *GoToTSCompiler) WriteSelectorExprType(exp *ast.SelectorExpr) {
	// Assuming X is a package identifier. Needs refinement with type info.
	c.WriteValueExpr(exp.X) // Package name is treated as a value
	c.tsw.WriteLiterally(".")
	c.WriteTypeExpr(exp.Sel) // The selected identifier is treated as a type
}

// WriteSelectorExprValue writes a selector expression used as a value (e.g., obj.Field).
func (c *GoToTSCompiler) WriteSelectorExprValue(exp *ast.SelectorExpr) {
	c.WriteValueExpr(exp.X)
	c.tsw.WriteLiterally(".")
	// Keep original Go casing
	c.WriteIdentValue(exp.Sel)
}

// WriteStarExprType writes a pointer type (e.g., *MyStruct).
func (c *GoToTSCompiler) WriteStarExprType(exp *ast.StarExpr) {
	// Map pointer types to T | null
	c.WriteTypeExpr(exp.X)
	c.tsw.WriteLiterally(" | null")
}

// WriteStarExprValue writes a pointer dereference value (e.g., *myVar).
func (c *GoToTSCompiler) WriteStarExprValue(exp *ast.StarExpr) {
	// Dereferencing a pointer in Go (*p) gets the value.
	// In TS, if p is MyStruct | null, accessing the value means just using p.
	// Cloning to emulate value semantics happens during assignment (see WriteStmtAssign).
	c.WriteValueExpr(exp.X)
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
func (c *GoToTSCompiler) WriteCallExpr(exp *ast.CallExpr) {
	expFun := exp.Fun
	if funIdent, funIsIdent := expFun.(*ast.Ident); funIsIdent && funIdent.String() == "println" {
		c.tsw.WriteLiterally("console.log")
	} else {
		c.WriteValueExpr(expFun)
	}
	c.tsw.WriteLiterally("(")
	for i, arg := range exp.Args {
		if i != 0 {
			c.tsw.WriteLiterally(", ")
		}
		c.WriteValueExpr(arg)
	}
	c.tsw.WriteLiterally(")")
}

// WriteUnaryExprValue writes a unary operation on a value.
func (c *GoToTSCompiler) WriteUnaryExprValue(exp *ast.UnaryExpr) {
	if exp.Op == token.AND {
		// Address-of operator (&) might translate to just the value in TS,
		// or potentially involve reference objects if complex pointer logic is needed.
		// For now, just write the operand.
		c.WriteValueExpr(exp.X)
		return
	}

	tokStr, ok := gstypes.TokenToTs(exp.Op)
	if !ok {
		c.tsw.WriteCommentInline(fmt.Sprintf("unhandled unary op: %s", exp.Op.String()))
	} else {
		c.tsw.WriteLiterally(tokStr)
	}
	c.WriteValueExpr(exp.X)
}

// WriteBinaryExprValue writes a binary operation on values.
func (c *GoToTSCompiler) WriteBinaryExprValue(exp *ast.BinaryExpr) {
	c.WriteValueExpr(exp.X)
	c.tsw.WriteLiterally(" ")
	tokStr, ok := gstypes.TokenToTs(exp.Op)
	if !ok {
		c.tsw.WriteCommentInline(fmt.Sprintf("unhandled binary op: %s", exp.Op.String()))
		c.tsw.WriteLiterally(" /* op */ ")
	} else {
		c.tsw.WriteLiterally(tokStr)
	}
	c.tsw.WriteLiterally(" ")
	c.WriteValueExpr(exp.Y)
}

// WriteBasicLitValue writes a basic literal value.
func (c *GoToTSCompiler) WriteBasicLitValue(exp *ast.BasicLit) {
	c.tsw.WriteLiterally(exp.Value)
}

// WriteCompositeLitValue writes a composite literal value.
func (c *GoToTSCompiler) WriteCompositeLitValue(exp *ast.CompositeLit) {
	if exp.Type != nil {
		// Typed literal, likely a struct: new Type({...})
		c.tsw.WriteLiterally("new ")
		c.WriteTypeExpr(exp.Type)
		c.tsw.WriteLiterally("({ ") // Use object literal syntax
		for i, elm := range exp.Elts {
			if i != 0 {
				c.tsw.WriteLiterally(", ")
			}
			c.WriteValueExpr(elm) // Elements are likely KeyValueExpr
		}
		c.tsw.WriteLiterally(" })")
		return
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
		c.WriteValueExpr(elm)
	}

	if isLikelyObject {
		c.tsw.WriteLiterally(" }")
	} else {
		c.tsw.WriteLiterally(" ]")
	}
	c.tsw.WriteCommentInline("untyped composite literal, type guessed")
}

// WriteKeyValueExprValue writes a key-value pair.
func (c *GoToTSCompiler) WriteKeyValueExprValue(exp *ast.KeyValueExpr) {
	// Keep original Go casing for keys
	c.WriteValueExpr(exp.Key)
	c.tsw.WriteLiterally(": ")
	c.WriteValueExpr(exp.Value)
}

package compiler

import (
	"go/ast"
	"go/types"
)

// WriteTypeExpr translates a Go abstract syntax tree (AST) expression (`ast.Expr`)
// that represents a type into its TypeScript type equivalent using type information.
//
// It handles various Go type expressions:
// - Basic types (e.g., int, string, bool) -> TypeScript primitives (number, string, boolean)
// - Named types -> TypeScript class/interface names
// - Pointer types (`*T`) -> `$.Box<T_ts> | null`
// - Slice types (`[]T`) -> `$.Slice<T_ts>`
// - Array types (`[N]T`) -> `T_ts[]`
// - Map types (`map[K]V`) -> `Map<K_ts, V_ts>`
// - Channel types (`chan T`) -> `$.Channel<T_ts>`
// - Struct types -> TypeScript object types or class names
// - Interface types -> TypeScript interface types or "any"
// - Function types -> TypeScript function signatures
func (c *GoToTSCompiler) WriteTypeExpr(a ast.Expr) {
	// Get type information for the expression and use WriteGoType
	typ := c.pkg.TypesInfo.TypeOf(a)
	c.WriteGoType(typ)
}

// writeTypeDescription writes the TypeInfo for a type expr.
func (c *GoToTSCompiler) writeTypeDescription(typeExpr ast.Expr) {
	switch t := typeExpr.(type) {
	case *ast.Ident:
		if isPrimitiveType(t.Name) {
			if tsType, ok := GoBuiltinToTypescript(t.Name); ok {
				c.tsw.WriteLiterally("{")
				c.tsw.WriteLiterally("kind: $.TypeKind.Basic, ")
				c.tsw.WriteLiterallyf("name: '%s'", tsType)
				c.tsw.WriteLiterally("}")
			} else {
				// Fallback for other primitive types
				c.tsw.WriteLiterally("{")
				c.tsw.WriteLiterally("kind: $.TypeKind.Basic, ")
				c.tsw.WriteLiterallyf("name: '%s'", t.Name)
				c.tsw.WriteLiterally("}")
			}
		} else {
			// For named types, just use the name string
			c.tsw.WriteLiterallyf("'%s'", t.Name)
		}
	case *ast.SelectorExpr:
		if ident, ok := t.X.(*ast.Ident); ok {
			c.tsw.WriteLiterallyf("'%s.%s'", ident.Name, t.Sel.Name)
		}
	case *ast.ArrayType:
		typeKind := "$.TypeKind.Slice"
		if t.Len != nil {
			typeKind = "$.TypeKind.Array"
		}

		c.tsw.WriteLiterally("{")
		c.tsw.WriteLiterallyf("kind: %s, ", typeKind)
		c.tsw.WriteLiterally("elemType: ")
		c.writeTypeDescription(t.Elt)
		c.tsw.WriteLiterally("}")
	case *ast.StructType:
		c.tsw.WriteLiterally("{")
		c.tsw.WriteLiterally("kind: $.TypeKind.Struct, ")

		// Add field names and types to the struct type info
		if t.Fields != nil && t.Fields.List != nil {
			c.tsw.WriteLiterally("fields: {")

			hasFields := false
			for _, field := range t.Fields.List {
				if len(field.Names) > 0 {
					for _, name := range field.Names {
						if hasFields {
							c.tsw.WriteLiterally(", ")
						}
						c.tsw.WriteLiterallyf("'%s': ", name.Name)
						c.writeTypeDescription(field.Type)
						hasFields = true
					}
				}
			}

			c.tsw.WriteLiterally("}, ")
		} else {
			c.tsw.WriteLiterally("fields: {}, ")
		}

		c.tsw.WriteLiterally("methods: []")

		c.tsw.WriteLiterally("}")
	case *ast.MapType:
		c.tsw.WriteLiterally("{")
		c.tsw.WriteLiterally("kind: $.TypeKind.Map, ")
		c.tsw.WriteLiterally("keyType: ")
		c.writeTypeDescription(t.Key)
		c.tsw.WriteLiterally(", ")
		c.tsw.WriteLiterally("elemType: ")
		c.writeTypeDescription(t.Value)
		c.tsw.WriteLiterally("}")
	case *ast.StarExpr:
		c.tsw.WriteLiterally("{")
		c.tsw.WriteLiterally("kind: $.TypeKind.Pointer, ")
		c.tsw.WriteLiterally("elemType: ")
		c.writeTypeDescription(t.X)
		c.tsw.WriteLiterally("}")
	case *ast.FuncType:
		// For function types, create a type descriptor object with params and results
		c.tsw.WriteLiterally("{")
		c.tsw.WriteLiterally("kind: $.TypeKind.Function")

		// Add name if this is a named function type
		if namedType := c.pkg.TypesInfo.TypeOf(typeExpr); namedType != nil {
			if named, ok := namedType.(*types.Named); ok {
				c.tsw.WriteLiterallyf(", name: '%s'", named.Obj().Name())
			}
		}

		// Add params if present
		if t.Params != nil && len(t.Params.List) > 0 {
			c.tsw.WriteLiterally(", params: [")
			for i, param := range t.Params.List {
				if i > 0 {
					c.tsw.WriteLiterally(", ")
				}
				c.writeTypeDescription(param.Type)
			}
			c.tsw.WriteLiterally("]")
		}

		// Add results if present
		if t.Results != nil && len(t.Results.List) > 0 {
			c.tsw.WriteLiterally(", results: [")
			for i, result := range t.Results.List {
				if i > 0 {
					c.tsw.WriteLiterally(", ")
				}
				c.writeTypeDescription(result.Type)
			}
			c.tsw.WriteLiterally("]")
		}

		c.tsw.WriteLiterally("}")
		return
	case *ast.ChanType:
		c.tsw.WriteLiterally("{")
		c.tsw.WriteLiterally("kind: $.TypeKind.Channel, ")
		c.tsw.WriteLiterally("elemType: ")

		// Add element type
		if ident, ok := t.Value.(*ast.Ident); ok && isPrimitiveType(ident.Name) {
			if tsType, ok := GoBuiltinToTypescript(ident.Name); ok {
				c.tsw.WriteLiterallyf("'%s'", tsType)
			} else {
				c.tsw.WriteLiterallyf("'%s'", ident.Name) // Fallback
			}
		} else {
			c.writeTypeDescription(t.Value)
		}

		// Add direction
		c.tsw.WriteLiterally(", direction: ")
		switch t.Dir {
		case ast.SEND:
			c.tsw.WriteLiterally("'send'")
		case ast.RECV:
			c.tsw.WriteLiterally("'receive'")
		case ast.SEND | ast.RECV: // bidirectional
			c.tsw.WriteLiterally("'both'")
		default:
			// This should not happen, but just in case
			c.tsw.WriteLiterally("'both'")
		}

		c.tsw.WriteLiterally("}")
	default:
		// For other types, use the string representation
		c.tsw.WriteLiterallyf("'%s'", c.getTypeNameString(typeExpr))
	}
}

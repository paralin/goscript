package compiler

import (
	"go/types"
)

func (c *GoToTSCompiler) writeFieldDescriptor(fieldName string, fieldType types.Type, isEmbedded bool) {
	c.tsw.WriteLiterallyf("%s: { type: ", fieldName)
	
	switch t := fieldType.Underlying().(type) {
	case *types.Basic:
		switch t.Kind() {
		case types.String:
			c.tsw.WriteLiterally("String")
		case types.Int, types.Int8, types.Int16, types.Int32, types.Int64,
			types.Uint, types.Uint8, types.Uint16, types.Uint32, types.Uint64,
			types.Float32, types.Float64:
			c.tsw.WriteLiterally("Number")
		case types.Bool:
			c.tsw.WriteLiterally("Boolean")
		default:
			c.tsw.WriteLiterally("Object")
		}
	default:
		c.tsw.WriteLiterally("Object")
	}
	
	c.tsw.WriteLiterally(", default: ")
	
	if isEmbedded {
		_, isPtr := fieldType.(*types.Pointer)
		_, isInterface := fieldType.Underlying().(*types.Interface)
		if isPtr || isInterface {
			c.tsw.WriteLiterally("null")
		} else {
			typeForNew := c.getEmbeddedFieldKeyName(fieldType)
			c.tsw.WriteLiterallyf("new %s()", typeForNew)
		}
		c.tsw.WriteLiterally(", isEmbedded: true")
	} else {
		c.WriteZeroValueForType(fieldType)
	}
	
	c.tsw.WriteLiterally(" }")
}

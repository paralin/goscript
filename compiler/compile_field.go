package compiler

import (
	"fmt"
	"go/ast"
	"unicode"
)

// WriteFieldList writes a field list.
func (c *GoToTSCompiler) WriteFieldList(a *ast.FieldList, isArguments bool) {
	if !isArguments && (a == nil || a.NumFields() == 0) {
		c.tsw.WriteLiterally("{}")
		return
	}

	if !isArguments && a.Opening.IsValid() {
		c.tsw.WriteLine("{")
		c.tsw.Indent(1)
	}
	for _, field := range a.List {
		c.WriteField(field, isArguments)
		if isArguments {
			c.tsw.WriteLiterally(": ")
			c.WriteExpr(field.Type, true)
		}
	}
	if !isArguments && a.Closing.IsValid() {
		c.tsw.Indent(-1)
		c.tsw.WriteLine("}")
	}
}

// WriteField writes a field definition.
func (c *GoToTSCompiler) WriteField(field *ast.Field, isArguments bool) {
	if !isArguments {
		if field.Doc != nil {
			c.WriteDoc(field.Doc)
		}
		if field.Comment != nil {
			c.WriteDoc(field.Comment)
		}
	}
	for _, name := range field.Names {
		if name.IsExported() || isArguments {
			if !isArguments {
				c.tsw.WriteLiterally("public ")
			}
			c.tsw.WriteLiterally(string([]rune{unicode.ToLower(rune(name.Name[0]))}))
			if len(name.Name) > 1 {
				c.tsw.WriteLiterally(name.Name[1:])
			}
		} else {
			c.tsw.WriteLiterally("private ")
			c.tsw.WriteLiterally(name.Name)
			c.tsw.WriteLiterally(": ")
			c.WriteExpr(field.Type, true)
		}
		if !isArguments {
			if field.Tag != nil {
				c.tsw.WriteLiterally(";")
				c.tsw.WriteComment(fmt.Sprintf("tag: %s", field.Tag.Value))
			} else {
				c.tsw.WriteLine(";")
			}
		}
	}
}

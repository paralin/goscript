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
		isExported := name.IsExported()

		// argument names: always lowercase and no access modifier
		if isArguments {
			c.tsw.WriteLiterally(string([]rune{unicode.ToLower(rune(name.Name[0]))}))
			if len(name.Name) > 1 {
				c.tsw.WriteLiterally(name.Name[1:])
			}

		} else if isExported {
			// exported struct fields become public
			c.tsw.WriteLiterally("public ")
			c.tsw.WriteLiterally(string([]rune{unicode.ToLower(rune(name.Name[0]))}))
			if len(name.Name) > 1 {
				c.tsw.WriteLiterally(name.Name[1:])
			}
		} else {
			c.tsw.WriteLiterally("private ")
			// unexported struct fields become private with explicit type
			c.tsw.WriteLiterally(name.Name)
		}

		// write type
		c.tsw.WriteLiterally(": ")
		c.WriteExpr(field.Type, true)

		if !isArguments {
			// write initializer with zero value
			c.tsw.WriteLiterally(" = ")
			c.WriteZeroValue(field.Type)

			// write tag comment if any
			if field.Tag != nil {
				c.tsw.WriteLiterally(";")
				c.tsw.WriteCommentLine(fmt.Sprintf("tag: %s", field.Tag.Value))
			} else {
				c.tsw.WriteLine(";")
			}
		}
	}
}

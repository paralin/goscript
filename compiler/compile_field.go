package compiler

import (
	"fmt"
	"go/ast"
	gtypes "go/types"
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

	// Handle parameter list for function declarations
	for i, field := range a.List {
		if i > 0 && isArguments {
			c.tsw.WriteLiterally(", ")
		}

		if isArguments {
			// For function parameters, write "name: type"
			c.WriteField(field, true)
			c.tsw.WriteLiterally(": ")
			c.WriteTypeExpr(field.Type) // Use WriteTypeExpr for parameter type
		} else {
			// For struct fields and other non-argument fields
			c.WriteField(field, false)
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

		// argument names: keep original casing, no access modifier
		if isArguments {
			c.tsw.WriteLiterally(name.Name)
			// Argument type is handled in WriteFieldList, so continue
			continue
		} else if isExported {
			// exported struct fields become public, keep original casing
			c.tsw.WriteLiterally("public ")
			c.tsw.WriteLiterally(name.Name)
		} else {
			// unexported struct fields become private, keep original casing
			c.tsw.WriteLiterally("private ")
			c.tsw.WriteLiterally(name.Name)
		}

		// Check if field type is an interface
		isInterface := false
		if c.pkg != nil && c.pkg.TypesInfo != nil {
			if tv, ok := c.pkg.TypesInfo.Types[field.Type]; ok && tv.Type != nil {
				_, isInterface = tv.Type.Underlying().(*gtypes.Interface)
			}
		}

		// write type for struct fields (not arguments)
		c.tsw.WriteLiterally(": ")
		c.WriteTypeExpr(field.Type) // Use WriteTypeExpr for field type

		// Append "| null" for interface fields
		if !isArguments && isInterface {
			c.tsw.WriteLiterally(" | null")
		}

		if !isArguments {
			// write initializer with zero value for struct fields
			c.tsw.WriteLiterally(" = ")

			// Special initialization for interface fields
			if isInterface {
				c.tsw.WriteLiterally("null")
			} else {
				c.WriteZeroValueForType(field.Type)
			}

			// write tag comment if any for struct fields
			if field.Tag != nil {
				c.tsw.WriteLiterally(";")
				c.tsw.WriteCommentLine(fmt.Sprintf("tag: %s", field.Tag.Value))
			} else {
				c.tsw.WriteLine(";")
			}
		}
	}
}

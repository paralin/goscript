package compiler

import (
	"go/ast"
)

// WriteDoc writes a comment group.
func (c *GoToTSCompiler) WriteDoc(doc *ast.CommentGroup) {
	for _, comment := range doc.List {
		// codeWriter.WriteComment(comment.Text)
		c.tsw.WriteLine(comment.Text)
	}
}

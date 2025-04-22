package compiler

import (
	"go/ast"
	"strings"
)

// WriteDoc writes a comment group, preserving // and /* */ styles.
func (c *GoToTSCompiler) WriteDoc(doc *ast.CommentGroup) {
	if doc == nil {
		return
	}
	for _, comment := range doc.List {
		// Preserve original comment style (// or /*)
		if strings.HasPrefix(comment.Text, "//") {
			c.tsw.WriteLine(comment.Text)
		} else if strings.HasPrefix(comment.Text, "/*") {
			// Write block comments potentially spanning multiple lines
			// Remove /* and */, then split by newline
			content := strings.TrimSuffix(strings.TrimPrefix(comment.Text, "/*"), "*/")
			lines := strings.Split(content, "\n") // Use \n as Split expects a separator string

			if len(lines) == 1 && !strings.Contains(lines[0], "\n") { // Check again for internal newlines just in case
				// Keep single-line block comments on one line
				c.tsw.WriteLinef("/*%s*/", lines[0])
			} else {
				// Write multi-line block comments
				c.tsw.WriteLine("/*")
				for _, line := range lines {
					// WriteLine handles indentation preamble automatically
					c.tsw.WriteLine(" *" + line) // Add conventional * prefix
				}
				c.tsw.WriteLine(" */")
			}
		} else {
			// Should not happen for valid Go comments, but handle defensively
			c.tsw.WriteCommentLine(" Unknown comment format: " + comment.Text)
		}
	}
}

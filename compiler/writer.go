package compiler

import (
	"fmt"
	"io"
	"strings"
)

// TSCodeWriter writes TypeScript code.
type TSCodeWriter struct {
	w                  io.Writer
	indentLevel        int
	sectionWrittenFlag bool
	lineWritten        bool
}

// NewTSCodeWriter builds a new TypeScript code writer.
func NewTSCodeWriter(w io.Writer) *TSCodeWriter {
	return &TSCodeWriter{w: w}
}

// WriteLinePreamble writes the indentation.
func (w *TSCodeWriter) WriteLinePreamble() {
	w.sectionWrittenFlag = true
	w.lineWritten = false
	for range w.indentLevel {
		w.w.Write([]byte{byte('\t')}) //nolint:errcheck
	}
}

// WriteLine writes a line of code to the output.
func (w *TSCodeWriter) WriteLine(line string) {
	if line != "" && w.lineWritten {
		w.WriteLinePreamble()
	}
	w.w.Write([]byte(line))       //nolint:errcheck
	w.w.Write([]byte{byte('\n')}) //nolint:errcheck
	w.lineWritten = true
}

// WriteLinef writes a formatted line of code to the output.
func (w *TSCodeWriter) WriteLinef(line string, args ...any) {
	l := fmt.Sprintf(line, args...)
	w.WriteLine(l)
}

// Indent changes the indentation level by a delta.
func (w *TSCodeWriter) Indent(count int) {
	w.indentLevel += count
	if w.indentLevel < 0 {
		w.indentLevel = 0
	}
}

// WriteImport writes a TypeScript import.
func (w *TSCodeWriter) WriteImport(symbolName, importPath string) {
	w.WriteLinef("import * as %s from %q", symbolName, importPath)
}

// WriteCommentLine writes a comment as a // line.
func (w *TSCodeWriter) WriteCommentLine(commentText string) {
	lines := strings.Split(commentText, "\n")
	for _, line := range lines {
		w.WriteLinef("// %s", line)
	}
}

// WriteCommentInline write a comment within /* */.
func (w *TSCodeWriter) WriteCommentInline(commentText string) {
	w.w.Write([]byte("/* "))       //nolint:errcheck
	w.w.Write([]byte(commentText)) //nolint:errcheck
	w.w.Write([]byte(" */"))       //nolint:errcheck
}

// WriteLiterally writes something to the output without processing
func (w *TSCodeWriter) WriteLiterally(literal string) {
	w.sectionWrittenFlag = true
	if w.lineWritten {
		w.WriteLinePreamble()
	}
	w.w.Write([]byte(literal)) //nolint:errcheck
}

// WriteSectionTail writes the end of a section.
func (w *TSCodeWriter) WriteSectionTail() {
	if w.sectionWrittenFlag {
		w.WriteLine("")
		w.sectionWrittenFlag = false
	}
}

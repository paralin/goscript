package compiler

import (
	"context"
	"fmt"
	"go/ast"
	"os"
	"path/filepath"

	"golang.org/x/tools/go/packages"
)

// fileImport is an import in a file.
type fileImport struct {
	importPath string
	importVars map[string]struct{}
}

// FileCompiler is the root compiler for a file.
type FileCompiler struct {
	compilerConfig *Config
	codeWriter     *TSCodeWriter
	pkg            *packages.Package
	ast            *ast.File
	fullPath       string

	imports map[string]fileImport
}

// NewFileCompiler builds a new FileCompiler
func NewFileCompiler(
	compilerConf *Config,
	pkg *packages.Package,
	astFile *ast.File,
	fullPath string,
) (*FileCompiler, error) {
	return &FileCompiler{
		compilerConfig: compilerConf,
		pkg:            pkg,
		ast:            astFile,
		fullPath:       fullPath,

		imports: make(map[string]fileImport),
	}, nil
}

// Compile compiles a file.
func (c *FileCompiler) Compile(ctx context.Context) error {
	f := c.ast

	pkgPath := c.pkg.PkgPath
	outputFilePath := TranslateGoFilePathToTypescriptFilePath(pkgPath, filepath.Base(c.fullPath))
	outputFilePathAbs := filepath.Join(c.compilerConfig.OutputPathRoot, outputFilePath)

	if err := os.MkdirAll(filepath.Dir(outputFilePathAbs), 0o755); err != nil {
		return err
	}

	of, err := os.OpenFile(outputFilePathAbs, os.O_RDWR|os.O_CREATE|os.O_TRUNC, 0o644)
	if err != nil {
		return err
	}
	defer of.Close() //nolint:errcheck

	c.codeWriter = NewTSCodeWriter(of)
	// Create comment map
	cmap := ast.NewCommentMap(c.pkg.Fset, f, f.Comments)
	// Pass comment map to compiler
	goWriter := NewGoToTSCompiler(c.codeWriter, c.pkg, cmap)

	// Add import for the goscript runtime using namespace import and alias
	c.codeWriter.WriteLine("import * as goscript from \"@go/builtin\";")
	c.codeWriter.WriteLine("") // Add a newline after the import

	if err := goWriter.WriteDecls(f.Decls); err != nil {
		return fmt.Errorf("failed to write declarations: %w", err)
	}

	return nil
}

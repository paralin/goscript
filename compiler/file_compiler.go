package compiler

import (
	"context"
	"go/ast"
	"golang.org/x/tools/go/packages"
	"os"
	"path/filepath"
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
	ast *ast.File,
	fullPath string,
) (*FileCompiler, error) {
	return &FileCompiler{
		compilerConfig: compilerConf,
		pkg:            pkg,
		ast:            ast,
		fullPath:       fullPath,

		imports: make(map[string]fileImport),
	}, nil
}

// Compile compiles a file.
func (c *FileCompiler) Compile(ctx context.Context) error {
	f := c.ast

	pkgPath := c.pkg.PkgPath
	outputFilePath := translateGoFilePathToTypescriptFilePath(pkgPath, filepath.Base(c.fullPath))
	outputFilePathAbs := filepath.Join(c.compilerConfig.OutputPathRoot, outputFilePath)

	if err := os.MkdirAll(filepath.Dir(outputFilePathAbs), 0755); err != nil {
		return err
	}

	of, err := os.OpenFile(outputFilePathAbs, os.O_RDWR|os.O_CREATE|os.O_TRUNC, 0644)
	if err != nil {
		return err
	}
	defer of.Close()

	c.codeWriter = NewTSCodeWriter(of)
	goWriter := NewGoToTSCompiler(c.codeWriter)
	goWriter.WriteDecls(f.Decls)

	return nil
}

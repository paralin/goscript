package compiler

import (
	"context"
	"os"
	"path/filepath"
	//"go/format"
	"go/parser"
	//"go/token"
	"io/ioutil"
)

// fileImport is an import in a file.
type fileImport struct {
	importPath string
	importVars map[string]struct{}
}

// FileCompiler is the root compiler for a file.
type FileCompiler struct {
	compilerConfig *Config
	pkgPath        string
	fullPath       string
	codeWriter     *TSCodeWriter

	imports map[string]fileImport
}

// NewFileCompiler builds a new FileCompiler
func NewFileCompiler(
	compilerConf *Config,
	pkgPath string,
	fullPath string,
) (*FileCompiler, error) {
	return &FileCompiler{
		compilerConfig: compilerConf,
		pkgPath:        pkgPath,
		fullPath:       fullPath,

		imports: make(map[string]fileImport),
	}, nil
}

// Compile compiles a file.
func (c *FileCompiler) Compile(ctx context.Context) error {
	fread, err := ioutil.ReadFile(c.fullPath)
	if err != nil {
		return err
	}

	f, err := parser.ParseFile(c.compilerConfig.fset, c.fullPath, string(fread), parser.ParseComments|parser.AllErrors)
	if err != nil {
		return err
	}

	outputFilePath := translateGoFilePathToTypescriptFilePath(c.pkgPath, filepath.Base(c.fullPath))
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

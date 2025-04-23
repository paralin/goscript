package compiler

import (
	"context"
	"go/ast"
	"path/filepath"

	"github.com/paralin/goscript/output"
	"github.com/sirupsen/logrus"
	"golang.org/x/tools/go/packages"
)

// PackageCompiler compiles an entire package.
type PackageCompiler struct {
	le           *logrus.Entry
	compilerConf *Config
	outputPath   string
	pkg          *packages.Package
}

// NewPackageCompiler builds a new PackageCompiler.
func NewPackageCompiler(
	le *logrus.Entry,
	compilerConf *Config,
	pkg *packages.Package,
) (*PackageCompiler, error) {
	res := &PackageCompiler{
		le:           le,
		pkg:          pkg,
		compilerConf: compilerConf,
		outputPath:   output.ComputeModulePath(compilerConf.OutputPathRoot, pkg.PkgPath),
	}

	return res, nil
}

// Compile compiles the package.
func (c *PackageCompiler) Compile(ctx context.Context) error {
	// Compile the files in the package one at a time
	for i, f := range c.pkg.Syntax {
		fileName := c.pkg.CompiledGoFiles[i]
		relWdFileName, err := filepath.Rel(c.compilerConf.Dir, fileName)
		if err != nil {
			return err
		}

		c.le.WithField("file", relWdFileName).Debug("compiling file")
		if err := c.CompileFile(ctx, fileName, f); err != nil {
			return err
		}
	}

	return nil
}

// CompileFile compiles a file.
func (p *PackageCompiler) CompileFile(ctx context.Context, name string, syntax *ast.File) error {
	fileCompiler, err := NewFileCompiler(p.compilerConf, p.pkg, syntax, name)
	if err != nil {
		return err
	}
	return fileCompiler.Compile(ctx)
}

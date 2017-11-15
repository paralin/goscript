package compiler

import (
	"context"
	"io/ioutil"
	"path/filepath"
	"strings"

	"github.com/paralin/goscript/output"
	"github.com/sirupsen/logrus"
)

// PackageCompiler compiles an entire package.
type PackageCompiler struct {
	le              *logrus.Entry
	compilerConf    *Config
	pkgPath         string
	outputPath      string
	computedPkgPath string
}

// NewPackageCompiler builds a new PackageCompiler.
func NewPackageCompiler(
	le *logrus.Entry,
	compilerConf *Config,
	pkgPath string,
) (*PackageCompiler, error) {
	res := &PackageCompiler{
		le:              le,
		compilerConf:    compilerConf,
		pkgPath:         pkgPath,
		outputPath:      output.ComputeModulePath(compilerConf.OutputPathRoot, pkgPath),
		computedPkgPath: compilerConf.ComputePackagePath(pkgPath),
	}

	return res, nil
}

// Compile compiles the package.
func (c *PackageCompiler) Compile(ctx context.Context) error {
	// Collect the Go files we need to compile
	// var goFilePaths []string

	files, err := ioutil.ReadDir(c.computedPkgPath)
	if err != nil {
		return err
	}
	for _, f := range files {
		if f.IsDir() {
			continue
		}
		fileName := f.Name()
		if !strings.HasSuffix(fileName, ".go") {
			continue
		}
		if strings.HasPrefix(fileName, ".") {
			continue
		}
		c.le.WithField("file", f.Name()).Debug("compiling file")
		if err := c.CompileFile(ctx, f.Name()); err != nil {
			return err
		}
	}

	return nil
}

// CompileFile compiles a file.
func (p *PackageCompiler) CompileFile(ctx context.Context, name string) error {
	fullPath := filepath.Join(p.computedPkgPath, name)
	fileCompiler, err := NewFileCompiler(p.compilerConf, p.pkgPath, fullPath)
	if err != nil {
		return err
	}
	return fileCompiler.Compile(ctx)
}

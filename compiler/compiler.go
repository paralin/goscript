package compiler

import (
	"context"
	"os"

	"github.com/sirupsen/logrus"
	"golang.org/x/tools/go/packages"
)

// Compiler is the root compiler for a project.
type Compiler struct {
	le     *logrus.Entry
	config Config
	opts   packages.Config
}

// NewCompiler builds a new Compiler
// opts can be nil
func NewCompiler(conf *Config, le *logrus.Entry, opts *packages.Config) (*Compiler, error) {
	if err := conf.Validate(); err != nil {
		return nil, err
	}

	if opts == nil {
		opts = &packages.Config{Env: os.Environ()}
	}
	// opts.Logf = c.le.Debugf
	opts.Tests = false
	opts.Env = append(opts.Env, "GOOS=js", "GOARCH=wasm")
	opts.Dir = conf.Dir
	opts.BuildFlags = conf.BuildFlags

	// NeedName adds Name and PkgPath.
	// NeedFiles adds GoFiles and OtherFiles.
	// NeedCompiledGoFiles adds CompiledGoFiles.
	// NeedImports adds Imports. If NeedDeps is not set, the Imports field will contain
	// "placeholder" Packages with only the ID set.
	// NeedDeps adds the fields requested by the LoadMode in the packages in Imports.
	// NeedExportsFile adds ExportsFile.
	// NeedTypes adds Types, Fset, and IllTyped.
	// NeedSyntax adds Syntax.
	// NeedTypesInfo adds TypesInfo.
	// NeedTypesSizes adds TypesSizes.
	// TODO: disable these if not needed
	opts.Mode |= packages.NeedName |
		packages.NeedFiles |
		packages.NeedCompiledGoFiles |
		packages.NeedImports |
		packages.NeedDeps |
		packages.NeedExportFile |
		packages.NeedTypes |
		packages.NeedSyntax |
		packages.NeedTypesInfo |
		packages.NeedTypesSizes

	return &Compiler{config: *conf, le: le, opts: *opts}, nil
}

// CompilePackages attempts to build packages.
func (c *Compiler) CompilePackages(ctx context.Context, patterns ...string) error {
	opts := c.opts
	opts.Context = ctx

	pkgs, err := packages.Load(&opts, patterns...)
	if err != nil {
		return err
	}

	for _, pkg := range pkgs {
		pkgCompiler, err := NewPackageCompiler(c.le, &c.config, pkg)
		if err != nil {
			return err
		}

		if err := pkgCompiler.Compile(ctx); err != nil {
			return err
		}
	}

	return nil
}

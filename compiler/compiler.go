package compiler

import (
	"context"

	"github.com/sirupsen/logrus"
)

// Compiler is the root compiler for a project.
type Compiler struct {
	le     *logrus.Entry
	config Config
}

// NewCompiler builds a new Compiler
func NewCompiler(conf *Config, le *logrus.Entry) (*Compiler, error) {
	if err := conf.Validate(); err != nil {
		return nil, err
	}

	return &Compiler{config: *conf, le: le}, nil
}

// CompilePackage attempts to build a particular package in the gopath.
func (c *Compiler) CompilePackage(ctx context.Context, pkgPath string) error {
	pkgCompiler, err := NewPackageCompiler(c.le, &c.config, pkgPath)
	if err != nil {
		return err
	}

	return pkgCompiler.Compile(ctx)
}

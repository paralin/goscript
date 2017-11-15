package compiler

import (
	"github.com/pkg/errors"
	"go/token"
	"path/filepath"
)

// Config is the configuration for the compiler
type Config struct {
	fset *token.FileSet
	// GoPathRoot is the GOPATH root.
	GoPathRoot string
	// OutputPathRoot is the output path root.
	OutputPathRoot string
}

// Validate checks the config.
func (c *Config) Validate() error {
	if c.fset == nil {
		c.fset = token.NewFileSet()
	}
	if c == nil {
		return errors.New("config cannot be nil")
	}
	if c.GoPathRoot == "" {
		return errors.New("go path root must be specified")
	}
	if c.OutputPathRoot == "" {
		return errors.New("output path root must be specified")
	}
	return nil
}

// ComputePackagePath computes the path to a package in the gopath.
func (c *Config) ComputePackagePath(pkgPath string) string {
	return filepath.Join(c.GoPathRoot, "src", pkgPath)
}

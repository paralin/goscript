package compiler

import (
	"go/token"

	"github.com/pkg/errors"
)

// Config is the configuration for the compiler
// Dir is the working directory for the compiler. If empty, uses the current working directory.
type Config struct {
	fset *token.FileSet

	// Dir is the working directory for the compiler. If empty, uses the current working directory.
	Dir string
	// OutputPathRoot is the output path root.
	OutputPathRoot string
	// BuildFlags are the Go build flags (tags) to use during analysis.
	BuildFlags []string
}

// Validate checks the config.
func (c *Config) Validate() error {
	if c == nil {
		return errors.New("config cannot be nil")
	}
	if c.fset == nil {
		c.fset = token.NewFileSet()
	}
	if c.OutputPathRoot == "" {
		return errors.New("output path root must be specified")
	}
	return nil
}

package main

import (
	"context"

	"github.com/aperturerobotics/cli"
	"github.com/paralin/goscript/compiler"
	"github.com/pkg/errors"
	"github.com/sirupsen/logrus"
)

var (
	cliCompiler       *compiler.Compiler
	cliCompilerConfig compiler.Config
	cliCompilerPkg    cli.StringSlice
)

// CompileCommands are commands related to compiling code.
var CompileCommands = []*cli.Command{{
	Name:     "compile",
	Category: "compile",
	Usage:    "compile a Go package to TypeScript",
	Action:   compilePackage,
	Before: func(c *cli.Context) (err error) {
		logger := logrus.New()
		logger.SetLevel(logrus.DebugLevel)
		le := logrus.NewEntry(logger)
		cliCompiler, err = compiler.NewCompiler(&cliCompilerConfig, le, nil)
		return
	},
	Flags: []cli.Flag{
		&cli.StringSliceFlag{
			Name:        "package",
			Usage:       "the package(s) to compile",
			Aliases:     []string{"p", "packages"},
			Destination: &cliCompilerPkg,
		},
		&cli.StringFlag{
			Name:        "output",
			Usage:       "the output typescript path to use",
			Destination: &cliCompilerConfig.OutputPathRoot,
			Value:       "./output",
		},
		&cli.StringFlag{
			Name:        "dir",
			Usage:       "the working directory to use for the compiler (default: current directory)",
			Destination: &cliCompilerConfig.Dir,
			Value:       "",
		},
	},
}}

// compilePackage tries to compile the package.
func compilePackage(c *cli.Context) error {
	pkgs := cliCompilerPkg.Value()
	if len(pkgs) == 0 {
		return errors.New("package(s) must be specified")
	}

	return cliCompiler.CompilePackages(context.Background(), pkgs...)
}

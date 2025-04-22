package main

import (
	"context"

	"github.com/aperturerobotics/cli"
	"github.com/paralin/goscript/compiler"
	"github.com/pkg/errors"
	"github.com/sirupsen/logrus"
)

var cliCompiler *compiler.Compiler
var cliCompilerConfig compiler.Config
var cliCompilerPkg string
var test1, test2 = 1, 2

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
		&cli.StringFlag{
			Name:        "package",
			Usage:       "the package to compile",
			Destination: &cliCompilerPkg,
		},
		&cli.StringFlag{
			Name:        "gopath",
			Usage:       "the go root to use",
			Destination: &cliCompilerConfig.GoPathRoot,
			EnvVars:     []string{"GOPATH"},
		},
		&cli.StringFlag{
			Name:        "output",
			Usage:       "the output typescript path to use",
			Destination: &cliCompilerConfig.OutputPathRoot,
			Value:       "./output",
		},
	},
}}

// compilePackage tries to compile the package.
func compilePackage(c *cli.Context) error {
	if cliCompilerPkg == "" {
		return errors.New("package must be specified")
	}

	return cliCompiler.CompilePackages(context.Background(), cliCompilerPkg)
}

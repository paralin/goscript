package main

import (
	"context"

	"github.com/paralin/goscript/compiler"
	"github.com/pkg/errors"
	"github.com/sirupsen/logrus"
	"github.com/urfave/cli"
)

var cliCompiler *compiler.Compiler
var cliCompilerConfig compiler.Config
var cliCompilerPkg string
var test1, test2 = 1, 2

// CompileCommands are commands related to compiling code.
var CompileCommands = []cli.Command{
	cli.Command{
		Name:     "compile",
		Category: "compile",
		Usage:    "builds a particular Go package",
		Action:   compilePackage,
		Before: func(c *cli.Context) (err error) {
			logger := logrus.New()
			logger.SetLevel(logrus.DebugLevel)
			le := logrus.NewEntry(logger)
			cliCompiler, err = compiler.NewCompiler(&cliCompilerConfig, le)
			return
		},
		Flags: []cli.Flag{
			cli.StringFlag{
				Name:        "package",
				Usage:       "the package to compile",
				Destination: &cliCompilerPkg,
			},
			cli.StringFlag{
				Name:        "gopath",
				Usage:       "the gopath / go root to use",
				Destination: &cliCompilerConfig.GoPathRoot,
				EnvVar:      "GOPATH",
			},
			cli.StringFlag{
				Name:        "output",
				Usage:       "the output typescript path to use",
				Destination: &cliCompilerConfig.OutputPathRoot,
				Value:       "./output",
			},
		},
	},
}

// compilePackage tries to compile the package.
func compilePackage(c *cli.Context) error {
	if cliCompilerPkg == "" {
		return errors.New("package must be specified")
	}

	return cliCompiler.CompilePackage(context.Background(), cliCompilerPkg)
}

package main

import (
	"github.com/urfave/cli"
)

func main() {
	app := cli.NewApp()
	app.Authors = []cli.Author{
		cli.Author{Name: "Christian Stewart", Email: "c.stewart@faceit.com"},
	}
	app.Usage = "GoScript compiles Go to Typescript and vise-versa."
	app.Commands = append(app.Commands, CompileCommands...)
	app.RunAndExitOnError()
}

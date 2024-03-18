package main

import (
	"os"

	"github.com/urfave/cli/v2"
)

func main() {
	app := cli.NewApp()

	app.Authors = []*cli.Author{
		{Name: "Christian Stewart", Email: "christian@aperture.us"},
	}
	app.Usage = "GoScript compiles Go to Typescript and vise-versa."

	app.Commands = append(app.Commands, CompileCommands...)

	if err := app.Run(os.Args); err != nil {
		os.Stderr.WriteString(err.Error() + "\n")
	}
}

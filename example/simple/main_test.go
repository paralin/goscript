package main_test

import (
	"context"
	"os"
	"os/exec"
	"path/filepath"
	"testing"

	"github.com/paralin/goscript/compiler"
	"github.com/sirupsen/logrus"
)

func TestBuildRunExampleSimple(t *testing.T) {
	// Set up paths
	projectDir, err := filepath.Abs(".")
	if err != nil {
		t.Fatalf("failed to determine project directory: %v", err)
	}
	outputDir := filepath.Join(projectDir, "output")

	// Initialize the compiler
	logger := logrus.New()
	logger.SetLevel(logrus.DebugLevel)
	le := logrus.NewEntry(logger)

	conf := &compiler.Config{
		GoPathRoot:     projectDir,
		OutputPathRoot: outputDir,
	}
	if err := conf.Validate(); err != nil {
		t.Fatalf("invalid compiler config: %v", err)
	}

	comp, err := compiler.NewCompiler(conf, le, nil)
	if err != nil {
		t.Fatalf("failed to create compiler: %v", err)
	}

	// Compile the package
	if err := comp.CompilePackages(context.Background(), "."); err != nil {
		t.Fatalf("compilation failed: %v", err)
	}

	// Run the compiled TypeScript file
	cmd := exec.Command("tsx", "--tsconfig", "./tsconfig.json", "./main.ts")
	cmd.Dir = projectDir
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	if err := cmd.Run(); err != nil {
		t.Fatalf("run failed: %v", err)
	}
}

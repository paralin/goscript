package compiler

import (
	"context"
	"os"
	"path/filepath"
	"testing"

	"github.com/sirupsen/logrus"
)

func TestEmitBuiltinOption(t *testing.T) {
	// Create a temporary directory for the test output
	tempDir, err := os.MkdirTemp("", "goscript-test-emit-builtin")
	if err != nil {
		t.Fatalf("Failed to create temp dir: %v", err)
	}
	defer os.RemoveAll(tempDir)

	// Setup logger
	log := logrus.New()
	log.SetLevel(logrus.DebugLevel)
	le := logrus.NewEntry(log)

	// Case 1: DisableEmitBuiltin = true (default behavior in compliance tests)
	t.Run("DisableEmitBuiltin=true", func(t *testing.T) {
		outputDir := filepath.Join(tempDir, "disabled")
		config := &Config{
			OutputPath:         outputDir,
			AllDependencies:    true,
			DisableEmitBuiltin: true,
		}

		compiler, err := NewCompiler(config, le, nil)
		if err != nil {
			t.Fatalf("Failed to create compiler: %v", err)
		}

		// Compile a package that depends on builtin (time)
		_, err = compiler.CompilePackages(context.Background(), "time")
		if err != nil {
			t.Fatalf("Compilation failed: %v", err)
		}

		// Check that handwritten packages like unsafe aren't emitted when DisableEmitBuiltin=true
		unsafePath := filepath.Join(outputDir, "@goscript/unsafe")
		if _, err := os.Stat(unsafePath); !os.IsNotExist(err) {
			t.Errorf("unsafe package was emitted when DisableEmitBuiltin=true")
		}

		// Also check for runtime package
		runtimePath := filepath.Join(outputDir, "@goscript/runtime")
		if _, err := os.Stat(runtimePath); !os.IsNotExist(err) {
			t.Errorf("runtime package was emitted when DisableEmitBuiltin=true")
		}

		// But time package should have been emitted
		timePath := filepath.Join(outputDir, "@goscript/time")
		if _, err := os.Stat(timePath); os.IsNotExist(err) {
			t.Errorf("time package was not emitted")
		}
	})

	// Case 2: DisableEmitBuiltin = false (new behavior for third-party projects)
	t.Run("DisableEmitBuiltin=false", func(t *testing.T) {
		outputDir := filepath.Join(tempDir, "enabled")
		config := &Config{
			OutputPath:         outputDir,
			AllDependencies:    true,
			DisableEmitBuiltin: false,
		}

		compiler, err := NewCompiler(config, le, nil)
		if err != nil {
			t.Fatalf("Failed to create compiler: %v", err)
		}

		// Compile a package that depends on builtin (time)
		_, err = compiler.CompilePackages(context.Background(), "time")
		if err != nil {
			t.Fatalf("Compilation failed: %v", err)
		}

		// Time package should also have been emitted
		timePath := filepath.Join(outputDir, "@goscript/time")
		if _, err := os.Stat(timePath); os.IsNotExist(err) {
			t.Errorf("time package was not emitted")
		}
	})
}

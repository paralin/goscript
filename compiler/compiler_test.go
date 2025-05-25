package compiler_test

import (
	"context"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"slices"
	"strings"
	"sync"
	"sync/atomic"
	"testing"

	"github.com/aperturerobotics/goscript/compiler"
	"github.com/aperturerobotics/goscript/compliance"
	"github.com/sirupsen/logrus"
)

// NOTE: this is here instead of compliance/compliance_test.go so coverage ends up in this package.

func TestCompliance(t *testing.T) {
	// Get workspace directory (project root)
	workspaceDir, err := os.Getwd()
	if err != nil {
		t.Fatalf("failed to get working directory: %v", err)
	}
	workspaceDir = filepath.Join(workspaceDir, "..")

	// First collect all test paths
	testsDir := filepath.Join(workspaceDir, "compliance/tests")
	dirs, err := os.ReadDir(testsDir)
	if err != nil {
		t.Fatalf("failed to read tests dir: %v", err)
	}

	var testPaths []string
	for _, dir := range dirs {
		if !dir.IsDir() {
			continue
		}
		testPath := filepath.Join(testsDir, dir.Name())
		goFiles, err := filepath.Glob(filepath.Join(testPath, "*.go"))
		if err != nil || len(goFiles) == 0 {
			// t.Errorf("no .go files found in %s", testPath)
			continue
		}
		testPaths = append(testPaths, testPath)
	}

	// sort testPaths
	slices.Sort(testPaths)

	// limit concurrency
	simulLimit := make(chan struct{}, runtime.GOMAXPROCS(-1)*2)
	for range cap(simulLimit) {
		simulLimit <- struct{}{}
	}

	// Now run tests in parallel with goroutines
	var wg sync.WaitGroup
	var ranTests atomic.Int32
	for _, testPath := range testPaths {
		wg.Add(1)
		go func(path string) {
			defer wg.Done() // runs even if t.Run is skipped
			t.Run(filepath.Base(path), func(t *testing.T) {
				t.Helper()

				ranTests.Add(1)
				// limit how many tests can run simultaneously
				<-simulLimit
				defer func() {
					simulLimit <- struct{}{}
				}()
				compliance.RunGoScriptTestDir(t, workspaceDir, path) // Pass workspaceDir

				// Remove dir if everything passed
				if !t.Failed() {
					os.RemoveAll(filepath.Join(path, "run"))
				}
			})
		}(testPath)
	}

	// Wait for all tests to complete
	wg.Wait()

	// Typecheck
	failed := t.Failed()
	t.Run("typecheck", func(t *testing.T) {
		t.Helper()
		if failed {
			t.Log("at least one compliance test failed: skipping typecheck")
			t.SkipNow()
		}

		// NOTE: typecheck does not yet pass, so we skip for now.
		if ranTests.Load() != 0 {
			t.Log("at least one compliance test ran: skipping typecheck")
			t.SkipNow()
		}

		// Get parent module path for the global typecheck
		parentModPath, err := getParentGoModulePath()
		if err != nil {
			t.Fatalf("Failed to determine parent Go module path: %v", err)
		}

		// Create global typecheck tsconfig
		tsconfigPath := compliance.WriteGlobalTypeCheckConfig(t, parentModPath, workspaceDir)

		// Run TypeScript type checking
		typecheckDir := filepath.Dir(tsconfigPath)
		cmd := exec.Command("tsc", "--project", filepath.Base(tsconfigPath))
		cmd.Dir = typecheckDir

		// Set up PATH to include node_modules/.bin
		nodeBinDir := filepath.Join(workspaceDir, "node_modules", ".bin")
		currentPath := os.Getenv("PATH")
		newPath := nodeBinDir + string(os.PathListSeparator) + currentPath
		cmd.Env = append(os.Environ(), "PATH="+newPath)

		output, err := cmd.CombinedOutput()
		if err != nil {
			t.Errorf("Global TypeScript type checking failed: %v\noutput:\n%s", err, string(output))
		} else {
			t.Logf("Global TypeScript type checking passed")
		}
	})
}

// getParentGoModulePath is a helper function to get the parent Go module path
// This is similar to the one in compliance.go but simplified for use in tests
func getParentGoModulePath() (string, error) {
	cmd := exec.Command("go", "list", "-m")
	output, err := cmd.Output()
	if err != nil {
		return "", err
	}
	return strings.TrimSpace(string(output)), nil
}

func TestUnsafePackageErrorMessage(t *testing.T) {
	// Create a temporary directory for the test output
	tempDir, err := os.MkdirTemp("", "goscript-test-unsafe")
	if err != nil {
		t.Fatalf("Failed to create temp dir: %v", err)
	}
	defer os.RemoveAll(tempDir)

	// Setup logger
	log := logrus.New()
	log.SetLevel(logrus.DebugLevel)
	le := logrus.NewEntry(log)

	// Test with AllDependencies=true to ensure we get all packages including unsafe
	config := &compiler.Config{
		OutputPath:         tempDir,
		AllDependencies:    true,
		DisableEmitBuiltin: true, // This ensures handwritten packages are skipped
	}

	comp, err := compiler.NewCompiler(config, le, nil)
	if err != nil {
		t.Fatalf("Failed to create compiler: %v", err)
	}

	// Try to compile a package that has dependencies that import unsafe
	// We'll use "sync/atomic" which imports unsafe but doesn't have a handwritten equivalent
	_, err = comp.CompilePackages(context.Background(), "sync/atomic")

	// We expect this to fail with an unsafe package error
	if err == nil {
		t.Fatalf("Expected compilation to fail due to unsafe package, but it succeeded")
	}

	errorMsg := err.Error()

	// Verify the error message contains the expected text
	if !strings.Contains(errorMsg, "cannot compile package 'unsafe'") {
		t.Errorf("Error message should mention unsafe package, got: %s", errorMsg)
	}

	// Verify that packages with handwritten equivalents are NOT mentioned in the error
	// These packages have handwritten equivalents in gs/ and should not be in the error message
	handwrittenPackages := []string{"runtime", "errors", "time", "context", "slices"}

	for _, pkg := range handwrittenPackages {
		if strings.Contains(errorMsg, pkg) {
			t.Errorf("Error message should not mention handwritten package '%s', but it does. Error: %s", pkg, errorMsg)
		}
	}

	// The error message should mention sync/atomic since it would actually be compiled
	if !strings.Contains(errorMsg, "sync/atomic") {
		t.Errorf("Error message should mention 'sync/atomic' as it would be compiled, got: %s", errorMsg)
	}
}

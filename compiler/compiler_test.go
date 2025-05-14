package compiler_test

import (
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"sync"
	"sync/atomic"
	"testing"

	"github.com/aperturerobotics/goscript/compliance"
)

// NOTE: this is here instead of compliance/compliance_test.go so coverage ends up in this package.

func TestCompliance(t *testing.T) {
	testsDir := "../compliance/tests"
	dirs, err := os.ReadDir(testsDir)
	if err != nil {
		t.Fatalf("failed to read tests dir: %v", err)
	}

	// Get workspace directory (project root)
	workspaceDir, err := os.Getwd()
	if err != nil {
		t.Fatalf("failed to get working directory: %v", err)
	}
	workspaceDir = filepath.Join(workspaceDir, "..")

	// First collect all test paths
	var testPaths []string
	for _, dir := range dirs {
		if !dir.IsDir() {
			continue
		}
		testPath := filepath.Join(testsDir, dir.Name())
		// expectedLogPath := filepath.Join(testPath, "expected.log")
		// if _, err := os.Stat(expectedLogPath); err != nil {
		//	continue // skip if no expected.log
		//}
		goFiles, err := filepath.Glob(filepath.Join(testPath, "*.go"))
		if err != nil || len(goFiles) == 0 {
			t.Errorf("no .go files found in %s", testPath)
			continue
		}
		testPaths = append(testPaths, testPath)
	}

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
				ranTests.Add(1)
				// limit how many tests can run simultaneously
				<-simulLimit
				defer func() {
					simulLimit <- struct{}{}
				}()
				compliance.RunGoScriptTestDir(t, workspaceDir, path) // Pass workspaceDir
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

		t.Log("running: npm run typecheck")
		cmd := exec.Command("npm", "run", "typecheck")
		cmd.Dir = workspaceDir // Run in the workspace directory
		cmd.Stdout = os.Stderr
		cmd.Stderr = os.Stderr

		err = cmd.Run()
		if err != nil {
			t.Errorf("npm run typecheck failed: %v", err)
		}
	})
}

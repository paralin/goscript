package compliance

import (
	"os"
	"path/filepath"
	"testing"
)

func TestCompliance(t *testing.T) {
	testsDir := "./tests"
	dirs, err := os.ReadDir(testsDir)
	if err != nil {
		t.Fatalf("failed to read tests dir: %v", err)
	}
	for _, dir := range dirs {
		if !dir.IsDir() {
			continue
		}
		testPath := filepath.Join(testsDir, dir.Name())
		expectedLogPath := filepath.Join(testPath, "expected.log")
		if _, err := os.Stat(expectedLogPath); err != nil {
			continue // skip if no expected.log
		}
		goFiles, err := filepath.Glob(filepath.Join(testPath, "*.go"))
		if err != nil || len(goFiles) == 0 {
			t.Errorf("no .go files found in %s", testPath)
			continue
		}
		t.Run(dir.Name(), func(t *testing.T) {
			RunGoScriptTestDir(t, testPath)
		})
	}
}

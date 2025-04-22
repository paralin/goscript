package compliance

import (
	"bytes"
	"context"
	"io"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"testing"

	"github.com/paralin/goscript/compiler"
	"github.com/sirupsen/logrus"
)

// TestCase defines a single Go-to-TypeScript compliance test.
type TestCase struct {
	Name           string
	GoSource       string
	ExpectedOutput string
}

// PrepareTempTestDir creates a temp dir, copies .go files, and writes go.mod. Returns tempDir path.
func PrepareTempTestDir(t *testing.T, testDir string) string {
	t.Helper()
	tempDir, err := os.MkdirTemp("", "goscript-test-")
	if err != nil {
		t.Fatalf("failed to create temp dir: %v", err)
	}

	goModPath := filepath.Join(tempDir, "go.mod")
	goModContent := []byte("module tempmod\n\ngo 1.24\n")
	if err := os.WriteFile(goModPath, goModContent, 0644); err != nil {
		os.RemoveAll(tempDir)
		t.Fatalf("failed to write go.mod: %v", err)
	}

	goFiles, err := filepath.Glob(filepath.Join(testDir, "*.go"))
	if err != nil || len(goFiles) == 0 {
		os.RemoveAll(tempDir)
		t.Fatalf("no .go files found in %s", testDir)
	}
	for _, src := range goFiles {
		base := filepath.Base(src)
		dst := filepath.Join(tempDir, base)
		data, err := os.ReadFile(src)
		if err != nil {
			os.RemoveAll(tempDir)
			t.Fatalf("failed to read %s: %v", src, err)
		}
		if err := os.WriteFile(dst, data, 0644); err != nil {
			os.RemoveAll(tempDir)
			t.Fatalf("failed to write %s: %v", dst, err)
		}
	}
	return tempDir
}

// ReadExpectedLog reads expected.log from testDir.
func ReadExpectedLog(t *testing.T, testDir string) string {
	t.Helper()
	expectedLogPath := filepath.Join(testDir, "expected.log")
	expected, err := os.ReadFile(expectedLogPath)
	if err != nil {
		t.Fatalf("failed to read expected.log in %s: %v", testDir, err)
	}
	return string(expected)
}

// CompileGoToTypeScript compiles Go files in tempDir to TypeScript outputDir.
func CompileGoToTypeScript(t *testing.T, tempDir, outputDir string, le *logrus.Entry) {
	t.Helper()
	conf := &compiler.Config{
		Dir:            tempDir,
		OutputPathRoot: outputDir,
	}
	if err := conf.Validate(); err != nil {
		t.Fatalf("invalid compiler config: %v", err)
	}
	comp, err := compiler.NewCompiler(conf, le, nil)
	if err != nil {
		t.Fatalf("failed to create compiler: %v", err)
	}
	if err := comp.CompilePackages(context.Background(), "."); err != nil {
		t.Fatalf("compilation failed: %v", err)
	}
}

// WriteTypeScriptRunner writes a runner.ts file to tempDir.
func WriteTypeScriptRunner(t *testing.T, tempDir string) string {
	t.Helper()
	tsRunner := filepath.Join(tempDir, "runner.ts")
	runnerContent := "import { main } from './output/@go/tempmod/main.gs.js';\nmain();\n"
	if err := os.WriteFile(tsRunner, []byte(runnerContent), 0644); err != nil {
		t.Fatalf("failed to write runner: %v", err)
	}
	return tsRunner
}

// RunTypeScriptRunner runs the runner.ts file using tsx and returns its stdout.
func RunTypeScriptRunner(t *testing.T, tempDir, tsRunner string) string {
	t.Helper()
	cmd := exec.Command("tsx", tsRunner)
	cmd.Dir = tempDir
	var outBuf, errBuf bytes.Buffer
	cmd.Stdout = io.MultiWriter(&outBuf, os.Stderr)
	cmd.Stderr = os.Stderr
	if err := cmd.Run(); err != nil {
		t.Fatalf("run failed: %v\nstderr: %s", err, errBuf.String())
	}
	return outBuf.String()
}

// RunGoScriptTestDir compiles all .go files in testDir, runs the generated TypeScript, and compares output to expected.log.
func RunGoScriptTestDir(t *testing.T, testDir string) {
	t.Helper()

	log := logrus.New()
	log.SetLevel(logrus.DebugLevel)
	le := logrus.NewEntry(log)

	tempDir := PrepareTempTestDir(t, testDir)
	defer os.RemoveAll(tempDir)

	expected := ReadExpectedLog(t, testDir)

	outputDir := filepath.Join(tempDir, "output")
	CompileGoToTypeScript(t, tempDir, outputDir, le)

	tsRunner := WriteTypeScriptRunner(t, tempDir)
	actual := strings.TrimSpace(RunTypeScriptRunner(t, tempDir, tsRunner))
	exp := strings.TrimSpace(expected)
	if actual != exp {
		t.Fatalf("output mismatch\nExpected:\n%s\nActual:\n%s", exp, actual)
	} else {
		le.Infof("output correct: %s", actual)
	}
}

package compliance

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt" // Added for Sprintf
	"io"
	"maps" // Added for maps.Clone
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"testing"

	"github.com/aperturerobotics/goscript/compiler"
	"github.com/sirupsen/logrus"
)

// baseTsConfig is the base tsconfig.json content.
var baseTsConfig = map[string]any{
	"compilerOptions": map[string]any{
		"lib":                        []string{"es2020", "DOM"},
		"module":                     "nodenext",
		"moduleResolution":           "nodenext",
		"allowImportingTsExtensions": true,
		"noEmit":                     true,
		"sourceMap":                  true,
	},
}

// TestCase defines a single Go-to-TypeScript compliance test.
type TestCase struct {
	Name           string
	GoSource       string
	ExpectedOutput string
}

// PrepareTempTestDir creates a temp dir, copies .go files, and writes go.mod. Returns tempDir path.
func PrepareTempTestDir(t *testing.T, testDir string) string {
	t.Helper()

	// Construct the target run directory path
	tempDir := filepath.Join(testDir, "run")
	testName := filepath.Base(testDir)

	// Remove the directory if it already exists to ensure a clean state.
	if err := os.RemoveAll(tempDir); err != nil {
		t.Fatalf("failed to remove existing test run directory %s: %v", tempDir, err)
	}
	if err := os.MkdirAll(tempDir, 0o755); err != nil {
		t.Fatalf("failed to create test run directory %s: %v", tempDir, err)
	}
	t.Logf("Test run directory: %s", tempDir)

	// create a module so Go ignores this path
	goModPath := filepath.Join(testDir, "go.mod")
	goModContent := []byte(fmt.Sprintf("module %s\n\ngo 1.24\n", testName))
	if err := os.WriteFile(goModPath, goModContent, 0o644); err != nil {
		// No os.RemoveAll(tempDir) here as we want to keep the dir for debugging
		t.Fatalf("failed to write go.mod: %v", err)
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

func CompileGoToTypeScript(t *testing.T, testDir, tempDir, outputDir string, le *logrus.Entry) {
	t.Helper()
	conf := &compiler.Config{
		Dir:            testDir,
		OutputPathRoot: outputDir,
	}
	if err := conf.Validate(); err != nil {
		t.Fatalf("invalid compiler config: %v", err)
	}

	// Log each .go file and its mapped .gs.ts output file and contents
	var goFiles []string
	err := filepath.WalkDir(testDir, func(path string, d os.DirEntry, err error) error {
		if err != nil {
			return err
		}
		if d.IsDir() && d.Name() == "run" {
			return filepath.SkipDir
		}
		if !d.IsDir() && strings.HasSuffix(d.Name(), ".go") {
			goFiles = append(goFiles, path)
		}
		return nil
	})
	if err != nil {
		t.Fatalf("failed to walk directory %s: %v", testDir, err)
	}
	if len(goFiles) == 0 {
		t.Fatalf("no .go files found in %s", testDir)
	}

	for _, src := range goFiles {
		srcRel, err := filepath.Rel(testDir, src)
		if err != nil {
			t.Fatal(err.Error())
		}
		t.Logf("Found Go file: %s", srcRel)
	}

	comp, err := compiler.NewCompiler(conf, le, nil)
	if err != nil {
		t.Fatalf("failed to create compiler: %v", err)
	}

	// Collect unique package paths relative to testDir
	packagePaths := make(map[string]struct{})
	for _, src := range goFiles {
		relPath, err := filepath.Rel(testDir, src)
		if err != nil {
			t.Fatal(err.Error())
		}
		pkgPath := filepath.Dir(relPath)
		if pkgPath == "." {
			pkgPath = ""
		}
		packagePaths[pkgPath] = struct{}{}
	}

	// Convert map keys to a slice
	var pkgsToCompile []string
	for pkg := range packagePaths {
		pkgsToCompile = append(pkgsToCompile, "./"+pkg)
	}

	t.Logf("Compiling packages: %v", pkgsToCompile)
	cmpErr := comp.CompilePackages(context.Background(), pkgsToCompile...)
	if cmpErr != nil {
		t.Errorf("compilation failed: %v", cmpErr)
	}

	// Log generated TypeScript files and copy them back to testDir
	testName := filepath.Base(testDir)
	stripPathPrefix := "@goscript/" + testName + "/"
	if err := filepath.WalkDir(outputDir, func(path string, d os.DirEntry, err error) error {
		if err != nil {
			t.Logf("error walking path %s: %v", path, err)
			return nil
		}
		// Determine the destination path in the original testDir
		relPath, err := filepath.Rel(outputDir, path)
		if err != nil {
			t.Logf("failed to get relative path for %s: %v", path, err)
			return nil // Continue walking
		}
		fileName := filepath.Base(relPath)

		// relPath is like "@goscript/testname/file.gs.ts"
		if !strings.HasPrefix(relPath, stripPathPrefix) {
			return nil
		}
		destPath := filepath.Join(testDir, strings.TrimPrefix(relPath, stripPathPrefix))

		if fileName == "index.ts" {
			// copy index.ts as is
			copyFile(path, destPath)
		} else if strings.HasSuffix(fileName, ".gs.ts") { // Look specifically for .gs.ts files
			// Read the generated content
			generatedContent, err := os.ReadFile(path)
			if err != nil {
				t.Logf("could not read generated file %s: %v", path, err)
				return nil // Continue walking
			}

			// Determine the original Go file name
			goFileName := strings.TrimSuffix(fileName, ".gs.ts") + ".go"

			// Construct the comment
			comment := fmt.Sprintf("// Generated file based on %s\n// Updated when compliance tests are re-run, DO NOT EDIT!\n\n", goFileName)

			// Prepend the comment to the generated content
			finalContent := append([]byte(comment), generatedContent...)

			if err := os.WriteFile(destPath, finalContent, 0o644); err != nil {
				t.Logf("failed to write file %s: %v", destPath, err)
				return err
			}

			t.Logf("generated content written to %s:\n%s", destPath, string(finalContent))
		}
		return nil
	}); err != nil {
		t.Fatalf("error while walking: %v", err.Error())
	}

	if cmpErr != nil {
		t.Fatalf("compilation failed: %v", cmpErr)
	}
}

// WriteTypeScriptRunner writes a runner.ts file to tempDir.
func WriteTypeScriptRunner(t *testing.T, testDir, tempDir string) string {
	t.Helper()

	// Find the Go source file in the temp directory
	goFiles, err := filepath.Glob(filepath.Join(testDir, "*.go"))
	if err != nil || len(goFiles) == 0 {
		t.Fatalf("could not find Go source file in test dir %s: %v", testDir, err)
	}
	if len(goFiles) > 1 {
		// For simplicity, assume only one relevant Go file per test case for now.
		t.Logf("warning: found multiple Go files in %s, using the first one: %s", tempDir, goFiles[0])
	}
	goSourceBase := filepath.Base(goFiles[0])
	tsFileName := strings.TrimSuffix(goSourceBase, ".go") + ".gs.ts"
	testName := filepath.Base(testDir)
	tsImportPath := fmt.Sprintf("./output/@goscript/%s/%s", testName, tsFileName)

	// Import the main function from the compiled code
	runnerContent := fmt.Sprintf(runnerContentTemplate, tsImportPath)

	tsRunner := filepath.Join(tempDir, "runner.ts")
	if err := os.WriteFile(tsRunner, []byte(runnerContent), 0o644); err != nil {
		t.Fatalf("failed to write runner: %v", err)
	}
	return tsRunner
}

// RunTypeScriptRunner runs the runner.ts file using tsx and returns its stdout.
func RunTypeScriptRunner(t *testing.T, workspaceDir, tempDir, tsRunner string) string {
	t.Helper()
	cmd := exec.Command("tsx", tsRunner)
	cmd.Dir = tempDir

	// Prepend node_modules/.bin to PATH
	nodeBinDir := filepath.Join(workspaceDir, "node_modules", ".bin")
	currentPath := os.Getenv("PATH")
	newPath := fmt.Sprintf("%s%c%s", nodeBinDir, os.PathListSeparator, currentPath)
	cmd.Env = append(os.Environ(), "PATH="+newPath) // Set the modified PATH

	var outBuf, errBuf bytes.Buffer
	cmd.Stdout = io.MultiWriter(&outBuf, os.Stderr)
	cmd.Stderr = os.Stderr // Keep stderr going to the test output for debugging
	if err := cmd.Run(); err != nil {
		t.Fatalf("run failed: %v\nstderr: %s", err, errBuf.String())
	}
	return outBuf.String()
}

// copyFile copies a file from src to dst.
func copyFile(src, dst string) error {
	sourceFile, err := os.Open(src)
	if err != nil {
		return fmt.Errorf("failed to open source file %s: %w", src, err)
	}
	defer sourceFile.Close() //nolint:errcheck

	// Ensure destination directory exists
	destDir := filepath.Dir(dst)
	if err := os.MkdirAll(destDir, 0o755); err != nil {
		return fmt.Errorf("failed to create destination directory %s: %w", destDir, err)
	}

	destFile, err := os.Create(dst)
	if err != nil {
		return fmt.Errorf("failed to create destination file %s: %w", dst, err)
	}
	defer destFile.Close() //nolint:errcheck

	if _, err := io.Copy(destFile, sourceFile); err != nil {
		return fmt.Errorf("failed to copy file content from %s to %s: %w", src, dst, err)
	}

	// Ensure data is synced to disk
	if err := destFile.Sync(); err != nil {
		return fmt.Errorf("failed to sync destination file %s: %w", dst, err)
	}

	return nil
}

// WriteTypeCheckConfig writes a tsconfig.json file in the test directory that extends the root tsconfig.json
func WriteTypeCheckConfig(t *testing.T, workspaceDir, testDir string) string {
	t.Helper()

	// Find the .gs.ts files in the test directory
	gsTsFiles, err := filepath.Glob(filepath.Join(testDir, "*.gs.ts"))
	if err != nil || len(gsTsFiles) == 0 {
		t.Fatalf("could not find .gs.ts files in test dir %s: %v", testDir, err)
	}

	// Construct the include list with relative paths
	var includes []string
	for _, file := range gsTsFiles {
		includes = append(includes, filepath.Base(file))
	}

	absTestDir, err := filepath.Abs(testDir)
	if err != nil {
		t.Fatalf("failed to get absolute path for %s: %v", testDir, err)
	}

	absWorkspaceDir, err := filepath.Abs(workspaceDir)
	if err != nil {
		t.Fatalf("failed to get absolute path for %s: %v", workspaceDir, err)
	}

	relWorkspacePath, err := filepath.Rel(absTestDir, absWorkspaceDir)
	if err != nil {
		t.Fatalf("failed to get relative path from %s to %s: %v", absTestDir, absWorkspaceDir, err)
	}

	// Ensure the path uses forward slashes for JSON compatibility
	relWorkspacePathForJSON := filepath.ToSlash(relWorkspacePath)
	rootTsConfigPath := filepath.ToSlash(filepath.Join(relWorkspacePathForJSON, "tsconfig.json"))

	// Create tsconfig.json content by cloning the base config
	tsconfig := maps.Clone(baseTsConfig)
	tsconfig["extends"] = rootTsConfigPath
	tsconfig["include"] = includes

	testName := filepath.Base(testDir)
	compilerOptions := maps.Clone(tsconfig["compilerOptions"].(map[string]interface{}))
	compilerOptions["baseUrl"] = "."
	builtinTsPathForJSON := filepath.ToSlash(filepath.Join(relWorkspacePathForJSON, "builtin", "builtin.ts"))
	compilerOptions["paths"] = map[string][]string{
		fmt.Sprintf("@goscript/%s/*", testName): {"./*"}, // generated code
		"@goscript/builtin":                     {builtinTsPathForJSON},
	}
	tsconfig["compilerOptions"] = compilerOptions

	tsconfigContentBytes, err := json.MarshalIndent(tsconfig, "", "  ")
	if err != nil {
		t.Fatalf("failed to marshal tsconfig to JSON: %v", err)
	}

	// Write tsconfig.json to the test directory
	tsconfigPath := filepath.Join(testDir, "tsconfig.json")
	if err := os.WriteFile(tsconfigPath, append(tsconfigContentBytes, '\n'), 0o644); err != nil {
		t.Fatalf("failed to write tsconfig.json to test dir: %v", err)
	}

	return tsconfigPath
}

// RunTypeScriptTypeCheck runs tsc --project tsconfig.json to typecheck the generated .gs.ts files.
func RunTypeScriptTypeCheck(t *testing.T, workspaceDir, testDir string, tsconfigPath string) {
	t.Helper()

	// Create a sub-test for the typecheck
	t.Run("TypeCheck", func(t *testing.T) {
		cmd := exec.Command("tsc", "--project", "tsconfig.json")
		cmd.Dir = testDir

		// Prepend node_modules/.bin to PATH
		nodeBinDir := filepath.Join(workspaceDir, "node_modules", ".bin")
		currentPath := os.Getenv("PATH")
		newPath := fmt.Sprintf("%s%c%s", nodeBinDir, os.PathListSeparator, currentPath)
		cmd.Env = append(os.Environ(), "PATH="+newPath) // Set the modified PATH

		var outBuf, errBuf bytes.Buffer
		cmd.Stdout = &outBuf
		cmd.Stderr = &errBuf

		if err := cmd.Run(); err != nil {
			t.Fatalf("TypeScript type checking failed: %v\nstdout: %s\nstderr: %s", err, outBuf.String(), errBuf.String())
		}

		t.Logf("TypeScript type checking passed")
	})
}

// runner.ts template for WriteTypeScriptRunner
const runnerContentTemplate = `import { main } from %q;
// NOTE: To debug: add a breakpoint, open a JavaScript Debug Terminal, and tsx runner.ts
await (async () => {
  await main();
  await new Promise(resolve => setTimeout(resolve, 100));
})();
`

// RunGoScriptTestDir compiles all .go files in testDir, runs the generated TypeScript, and compares output to expected.log.
func RunGoScriptTestDir(t *testing.T, workspaceDir, testDir string) {
	t.Helper()

	log := logrus.New()
	log.SetLevel(logrus.DebugLevel)
	le := logrus.NewEntry(log)

	// Check for skip-test file
	skipTestPath := filepath.Join(testDir, "skip-test")
	if _, err := os.Stat(skipTestPath); err == nil {
		t.Skipf("Skipping test %s: skip-test file found", filepath.Base(testDir))
		return // Skip the test
	} else if !os.IsNotExist(err) {
		// If there was an error other than "not exists", fail the test
		t.Fatalf("failed to check for skip-test file in %s: %v", testDir, err)
	}

	tempDir := PrepareTempTestDir(t, testDir)

	// Create tsconfig.json in the temporary directory for path aliases
	builtinTsPath := filepath.Join(workspaceDir, "builtin", "builtin.ts") // Use passed workspaceDir
	// Ensure the path uses forward slashes for JSON compatibility, even on Windows
	builtinTsPathForJSON := filepath.ToSlash(builtinTsPath)

	// Create tsconfig.json content by cloning the base config
	tsconfig := maps.Clone(baseTsConfig)
	compilerOptions := maps.Clone(tsconfig["compilerOptions"].(map[string]interface{}))
	compilerOptions["baseUrl"] = "."
	compilerOptions["paths"] = map[string][]string{
		"@goscript/*":       {"./output/@goscript/*"}, // generated code
		"@goscript/builtin": {builtinTsPathForJSON},
	}
	tsconfig["compilerOptions"] = compilerOptions

	tsconfigContentBytes, err := json.MarshalIndent(tsconfig, "", "  ")
	if err != nil {
		t.Fatalf("failed to marshal tsconfig to JSON: %v", err)
	}
	// Add a newline to the end of the JSON content
	tsconfigPath := filepath.Join(tempDir, "tsconfig.json")
	if err := os.WriteFile(tsconfigPath, tsconfigContentBytes, 0o644); err != nil {
		t.Fatalf("failed to write tsconfig.json to temp dir: %v", err)
	}

	// Create package.json in the temporary directory to set type: module
	packageJsonContent := `{"type": "module"}` + "\n"
	packageJsonPath := filepath.Join(tempDir, "package.json")
	if err := os.WriteFile(packageJsonPath, []byte(packageJsonContent), 0o644); err != nil {
		t.Fatalf("failed to write package.json to temp dir: %v", err)
	}

	outputDir := filepath.Join(tempDir, "output")

	var tsRunner string
	t.Run("Compile", func(t *testing.T) {
		CompileGoToTypeScript(t, testDir, tempDir, outputDir, le) // Pass testDir to enable copying output files back to the test directory

		// Copy the goscript runtime file to the temp directory
		// Use absolute path to avoid issues with changing working directories
		runtimeSrc := filepath.Join(workspaceDir, "builtin", "builtin.ts") // Use passed workspaceDir
		runtimeDst := filepath.Join(tempDir, "builtin.ts")                 // Rename to builtin.ts in temp dir
		if err := copyFile(runtimeSrc, runtimeDst); err != nil {
			t.Fatalf("failed to copy goscript runtime file: %v", err)
		}

		tsRunner = WriteTypeScriptRunner(t, testDir, tempDir)
	})

	// Check for expect-fail file
	expectFailPath := filepath.Join(testDir, "expect-fail")
	if _, err := os.Stat(expectFailPath); err == nil {
		t.Skipf("Skipping test %s: expect-fail file found", filepath.Base(testDir))
		return // Skip the test
	} else if !os.IsNotExist(err) {
		// If there was an error other than "not exists", fail the test
		t.Fatalf("failed to check for expect-fail file in %s: %v", testDir, err)
	}

	var actual string
	t.Run("Run", func(t *testing.T) {
		actual = strings.TrimSpace(RunTypeScriptRunner(t, workspaceDir, tempDir, tsRunner)) // Pass workspaceDir
	})

	t.Run("Compare", func(t *testing.T) {
		expectedLogPath := filepath.Join(testDir, "expected.log")
		expectedBytes, err := os.ReadFile(expectedLogPath)

		// If expected.log doesn't exist, generate it using `go run` on the original source
		if os.IsNotExist(err) {
			// Find the Go source file(s) in the original test directory
			goFiles, globErr := filepath.Glob(filepath.Join(testDir, "*.go"))
			if globErr != nil || len(goFiles) == 0 {
				t.Logf("expected.log not found, generating from Go source in %s", testDir)
				t.Fatalf("could not find Go source file(s) in test dir %s to generate expected.log: %v", testDir, globErr)
			}

			// Run `go run`
			goRunCmd := exec.Command("go", "run", "./")
			goRunCmd.Dir = testDir // Run in the context of the test directory
			var goRunOut bytes.Buffer
			goRunCmd.Stdout = &goRunOut
			goRunCmd.Stderr = &goRunOut
			if runErr := goRunCmd.Run(); runErr != nil {
				t.Fatalf("failed to run 'go run ./' in %s to generate expected.log: %v", testDir, runErr)
			}

			// Write the output of `go run` to expected.log
			expectedOutputFromGo := strings.TrimSpace(goRunOut.String())
			if writeErr := os.WriteFile(expectedLogPath, []byte(expectedOutputFromGo), 0o644); writeErr != nil {
				t.Fatalf("failed to write generated expected.log: %v", writeErr)
			}
			expectedBytes = []byte(expectedOutputFromGo) // Use the newly generated content for comparison
		} else if err != nil {
			// If there was another error reading expected.log, fail the test
			t.Fatalf("failed to read existing expected.log in %s: %v", testDir, err)
		}

		// Always compare the TypeScript output (`actual`) against the expected output (from file or generated)
		exp := strings.TrimSpace(string(expectedBytes))
		if actual != exp {
			// If mismatch, write the actual TS output to a .actual.log file for easier debugging
			actualLogPath := filepath.Join(testDir, "actual.log")
			os.WriteFile(actualLogPath, []byte(actual), 0o644) //nolint:errcheck
			t.Fatalf("output mismatch (TS vs Go)\nExpected (from Go):\n%s\nActual (from TS):\n%s", exp, actual)
		} else {
			// If match, remove any stale .actual.log file
			actualLogPath := filepath.Join(testDir, "actual.log")
			os.Remove(actualLogPath) //nolint:errcheck
		}
	})

	// Check for skip-typecheck file
	skipTypeCheckPath := filepath.Join(testDir, "skip-typecheck")
	if _, err := os.Stat(skipTypeCheckPath); err == nil {
		t.Logf("Skipping TypeScript type checking for %s: skip-typecheck file found", filepath.Base(testDir))
		return // Skip the type checking
	} else if !os.IsNotExist(err) {
		// If there was an error other than "not exists", fail the test
		t.Fatalf("failed to check for skip-typecheck file in %s: %v", testDir, err)
	}

	// Check for expect-typecheck-fail file
	expectTypeCheckFailPath := filepath.Join(testDir, "expect-typecheck-fail")
	if _, err := os.Stat(expectTypeCheckFailPath); err == nil {
		t.Logf("Skipping TypeScript type checking for %s: expect-typecheck-fail file found", filepath.Base(testDir))
		return // Skip the type checking
	} else if !os.IsNotExist(err) {
		// If there was an error other than "not exists", fail the test
		t.Fatalf("failed to check for expect-typecheck-fail file in %s: %v", testDir, err)
	}

	// Write tsconfig.json for type checking
	tsconfigPathForCheck := WriteTypeCheckConfig(t, workspaceDir, testDir)
	RunTypeScriptTypeCheck(t, workspaceDir, testDir, tsconfigPathForCheck)
}

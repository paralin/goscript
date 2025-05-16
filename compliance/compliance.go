package compliance

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"io/fs"
	"maps"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"sync"
	"testing"

	"github.com/aperturerobotics/goscript/compiler"
	"github.com/sirupsen/logrus"
)

// baseTsConfig is the base tsconfig.json content.
// It provides common TypeScript compiler options used across different tsconfig.json files
// generated during testing, such as for running the compiled code and for type-checking.
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
// This type is typically used when defining a suite of tests programmatically,
// though the current compliance test setup primarily relies on directory-based tests.
type TestCase struct {
	// Name is the name of the test case.
	Name string
	// GoSource is the Go source code for the test.
	GoSource string
	// ExpectedOutput is the expected output when the compiled TypeScript is run.
	ExpectedOutput string
}

var (
	// parentGoModulePath stores the Go module path of the project containing goscript.
	// It's determined once by getParentGoModulePath.
	parentGoModulePath string
	// parentGoModulePathOnce ensures that the parent Go module path is determined only once.
	parentGoModulePathOnce sync.Once
	// parentGoModulePathErr stores any error encountered while determining the parent Go module path.
	parentGoModulePathErr error
)

// getParentGoModulePath retrieves the Go module path of the parent project.
// It executes `go list -m` once and caches the result for subsequent calls.
// This path is used to construct import paths for generated TypeScript files.
func getParentGoModulePath() (string, error) {
	parentGoModulePathOnce.Do(func() {
		cmd := exec.Command("go", "list", "-m")
		var out, errBuf bytes.Buffer
		cmd.Stdout = &out
		cmd.Stderr = &errBuf
		if err := cmd.Run(); err != nil {
			parentGoModulePathErr = fmt.Errorf("failed to execute 'go list -m': %w, stderr: %s", err, errBuf.String())
			return
		}
		path := strings.TrimSpace(out.String())
		if path == "" {
			parentGoModulePathErr = fmt.Errorf("'go list -m' returned an empty string")
			return
		}
		parentGoModulePath = path
	})
	return parentGoModulePath, parentGoModulePathErr
}

// PrepareTestRunDir creates a temporary directory structure for running a single compliance test.
// It creates a "run" subdirectory within the provided testDir.
// This "run" directory will house the compiled TypeScript, runner scripts, and other temporary files.
// It ensures a clean state by removing the "run" directory if it already exists.
func PrepareTestRunDir(t *testing.T, testDir string) string {
	t.Helper()

	// Construct the target run directory path
	tempDir := filepath.Join(testDir, "run")

	// Remove the directory if it already exists to ensure a clean state.
	if err := os.RemoveAll(tempDir); err != nil {
		t.Fatalf("failed to remove existing test run directory %s: %v", tempDir, err)
	}
	if err := os.MkdirAll(tempDir, 0o755); err != nil {
		t.Fatalf("failed to create test run directory %s: %v", tempDir, err)
	}

	return tempDir
}

// ReadExpectedLog reads the content of the "expected.log" file from the given testDir.
// This file contains the expected stdout output when the Go version of the test is run.
// It's used to compare against the output of the compiled TypeScript code.
func ReadExpectedLog(t *testing.T, testDir string) string {
	t.Helper()
	expectedLogPath := filepath.Join(testDir, "expected.log")
	expected, err := os.ReadFile(expectedLogPath)
	if err != nil {
		t.Fatalf("failed to read expected.log in %s: %v", testDir, err)
	}
	return string(expected)
}

// CompileGoToTypeScript compiles Go source files from a test directory into TypeScript.
// It uses the goscript compiler to perform the compilation.
//
// Parameters:
//   - t: The testing.T instance for logging and assertions.
//   - parentModulePath: The Go module path of the parent project (e.g., "github.com/user/repo").
//   - testDir: The directory containing the Go source files for the test (can be relative or absolute).
//   - tempDir: The temporary directory where compilation artifacts (like the output directory) are managed.
//     This is typically the "run" subdirectory created by PrepareTestRunDir (can be relative or absolute).
//   - outputDir: The directory within tempDir where the compiled TypeScript files will be placed,
//     structured under "@goscript/PARENT_MODULE_PATH/compliance/tests/TEST_NAME/...".
//   - le: A logrus.Entry for logging.
//
// The function walks the testDir to find all .go files, determines their package structure,
// and then invokes the goscript compiler.
// After compilation, it copies the generated .gs.ts files and any index.ts files
// from the outputDir back into the original testDir, adding a header comment to the .gs.ts files.
// This allows the generated TypeScript to be reviewed and committed alongside the Go source.
func CompileGoToTypeScript(t *testing.T, parentModulePath, testDir, tempDir, outputDir string, le *logrus.Entry) {
	t.Helper()

	// Convert relative paths to absolute paths for internal use
	var err error
	testDir, err = filepath.Abs(testDir)
	if err != nil {
		t.Fatalf("failed to get absolute path for test directory %s: %v", testDir, err)
	}

	tempDir, err = filepath.Abs(tempDir)
	if err != nil {
		t.Fatalf("failed to get absolute path for temp directory %s: %v", tempDir, err)
	}
	conf := &compiler.Config{
		Dir:             testDir,
		OutputPathRoot:  outputDir,
		AllDependencies: true,
	}
	if err := conf.Validate(); err != nil {
		t.Fatalf("invalid compiler config: %v", err)
	}

	var goFiles []string
	err = filepath.WalkDir(testDir, func(path string, d os.DirEntry, err error) error {
		if err != nil {
			return err
		}
		if d.IsDir() && (d.Name() == "run" || d.Name() == "output") { // Also skip "output" if it exists in testDir
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

	packagePaths := make(map[string]struct{})
	for _, src := range goFiles {
		relPath, err := filepath.Rel(testDir, src)
		if err != nil {
			t.Fatal(err.Error())
		}
		pkgPath := filepath.Dir(relPath)
		// filepath.Dir(".") is ".", normalize to empty string for root package
		if pkgPath == "." {
			pkgPath = ""
		}
		packagePaths[pkgPath] = struct{}{}
	}

	var pkgsToCompile []string
	for pkg := range packagePaths {
		if pkg == "" {
			pkgsToCompile = append(pkgsToCompile, "./") // Compile package in current dir
		} else {
			pkgsToCompile = append(pkgsToCompile, "./"+pkg)
		}
	}

	t.Logf("Compiling packages: %v", pkgsToCompile)
	cmpErr := comp.CompilePackages(context.Background(), pkgsToCompile...)
	// We will check cmpErr after attempting to copy files.

	// Log generated TypeScript files and copy them back to testDir
	testName := filepath.Base(testDir)
	// testModulePathSegment is the Go package path segment for this test, e.g., "your.module/compliance/tests/actualtestname"
	testModulePathSegment := filepath.ToSlash(filepath.Join(parentModulePath, "compliance", "tests", testName))
	// generatedPathPrefix is the file system path prefix within outputDir/@goscript/
	// e.g., "@goscript/your.module/compliance/tests/actualtestname" (using OS specific separators)
	generatedPathPrefix := filepath.Join("@goscript", filepath.FromSlash(testModulePathSegment))

	walkErr := filepath.WalkDir(outputDir, func(path string, d os.DirEntry, walkErrInner error) error {
		if walkErrInner != nil {
			t.Logf("error walking path %s: %v", path, walkErrInner)
			return nil // Continue walking if possible
		}
		if d.IsDir() {
			return nil // Only process files
		}

		relPathToOutputRoot, errRel := filepath.Rel(outputDir, path)
		if errRel != nil {
			t.Logf("failed to get relative path for %s from %s: %v", path, outputDir, errRel)
			return nil
		}

		if !strings.HasPrefix(relPathToOutputRoot, generatedPathPrefix) {
			return nil // File is not part of this test's direct package outputs
		}

		// filePathRelativeToTestModule is like "file.gs.ts" or "subpkg/file.gs.ts"
		filePathRelativeToTestModule := strings.TrimPrefix(relPathToOutputRoot, generatedPathPrefix)
		filePathRelativeToTestModule = strings.TrimPrefix(filePathRelativeToTestModule, string(filepath.Separator))

		if filePathRelativeToTestModule == "" {
			// This could happen if relPathToOutputRoot matched generatedPathPrefix exactly,
			// which implies it's a directory (already skipped) or an improperly named file.
			t.Logf("Skipping path %s, empty relative path after stripping prefix %s", relPathToOutputRoot, generatedPathPrefix)
			return nil
		}

		destPath := filepath.Join(testDir, filePathRelativeToTestModule)
		fileName := filepath.Base(destPath)

		if err := os.MkdirAll(filepath.Dir(destPath), 0o755); err != nil {
			t.Logf("failed to create directory for %s: %v", destPath, err)
			return err // Stop walking on error
		}

		if fileName == "index.ts" {
			if err := copyFile(path, destPath); err != nil {
				t.Logf("failed to copy index.ts from %s to %s: %v", path, destPath, err)
				return err
			}
		} else if strings.HasSuffix(fileName, ".gs.ts") {
			generatedContent, readErr := os.ReadFile(path)
			if readErr != nil {
				t.Logf("could not read generated file %s: %v", path, readErr)
				return nil // Continue walking
			}

			goFileRelativePath := strings.TrimSuffix(filePathRelativeToTestModule, ".gs.ts") + ".go"
			comment := fmt.Sprintf("// Generated file based on %s\n// Updated when compliance tests are re-run, DO NOT EDIT!\n\n", goFileRelativePath)
			finalContent := append([]byte(comment), generatedContent...)

			if writeErr := os.WriteFile(destPath, finalContent, 0o644); writeErr != nil {
				t.Logf("failed to write file %s: %v", destPath, writeErr)
				return writeErr // Stop walking on error
			}
		}
		return nil
	})

	if walkErr != nil {
		t.Fatalf("error while processing generated files: %v", walkErr)
	}
	if cmpErr != nil {
		t.Fatalf("compilation failed: %v", cmpErr)
	}
}

// WriteTypeScriptRunner generates a "runner.ts" file in the tempDir.
// This runner script imports the main function from the compiled TypeScript output
// of the test and executes it.
//
// Parameters:
//   - t: The testing.T instance for logging and assertions.
//   - parentModulePath: The Go module path of the parent project.
//   - testDir: The directory containing the original Go source files for the test.
//     This is used to determine the primary Go file and thus the entry point for the TypeScript runner.
//   - tempDir: The temporary directory (e.g., "testDir/run") where "runner.ts" will be written.
//
// The function attempts to find a .go file (preferring one in the root of testDir)
// to determine the corresponding .gs.ts file that should contain the `main` function.
// It then constructs an import path for this .gs.ts file relative to the tempDir's structure
// (e.g., "./output/@goscript/PARENT_MODULE/compliance/tests/TEST_NAME/main.gs.ts").
// The content of "runner.ts" is based on runnerContentTemplate.
// Returns the path to the generated "runner.ts" file.
func WriteTypeScriptRunner(t *testing.T, parentModulePath, testDir, tempDir string) string {
	t.Helper()

	// Find a .go file in the root of testDir to determine the main TS file name.
	// This assumes the primary runnable 'main' is in a Go file directly in testDir.
	goFiles, err := filepath.Glob(filepath.Join(testDir, "*.go"))
	if err != nil || len(goFiles) == 0 {
		// Attempt to find any .go file if not in root, for tests with main in subpackage.
		// This is a simple heuristic, might need refinement if complex structures are common.
		_ = filepath.WalkDir(testDir, func(path string, d os.DirEntry, walkErr error) error {
			if walkErr != nil || d.IsDir() || !strings.HasSuffix(d.Name(), ".go") {
				return walkErr
			}
			if len(goFiles) == 0 { // Take the first one found
				goFiles = append(goFiles, path)
			}
			return filepath.SkipDir // Found one, stop searching this branch.
		})
		if len(goFiles) == 0 {
			t.Fatalf("could not find any Go source file in test dir %s or its subdirectories: %v", testDir, err)
		}
	}

	if len(goFiles) > 1 {
		t.Logf("warning: found multiple Go files in %s, using the first one for runner: %s", testDir, goFiles[0])
	}

	// Determine tsFileName relative to the test's package root
	// e.g. if goFiles[0] is testDir/sub/main.go, relGoPath is sub/main.go
	relGoPath, _ := filepath.Rel(testDir, goFiles[0])
	tsFileRelPath := strings.TrimSuffix(relGoPath, ".go") + ".gs.ts"

	testName := filepath.Base(testDir)
	// Construct import path: ./output/@goscript/PARENT_MODULE/compliance/tests/TEST_NAME/TS_FILE_REL_PATH
	rawImportPath := fmt.Sprintf("./output/@goscript/%s/compliance/tests/%s/%s",
		parentModulePath,
		testName,
		filepath.ToSlash(tsFileRelPath), // Ensure forward slashes for module path part
	)
	tsImportPath := filepath.ToSlash(rawImportPath) // Ensure overall path uses forward slashes

	runnerContent := fmt.Sprintf(runnerContentTemplate, tsImportPath)
	tsRunner := filepath.Join(tempDir, "runner.ts")
	if err := os.WriteFile(tsRunner, []byte(runnerContent), 0o644); err != nil {
		t.Fatalf("failed to write runner.ts: %v", err)
	}
	return tsRunner
}

// RunTypeScriptRunner executes the generated "runner.ts" script using `tsx`.
// It captures and returns the standard output of the script.
//
// Parameters:
//   - t: The testing.T instance for logging and assertions.
//   - workspaceDir: The root directory of the goscript workspace. This is used to find
//     the `tsx` executable in `node_modules/.bin`.
//   - tempDir: The directory where "runner.ts" and its `tsconfig.json` are located.
//     The `tsx` command is executed from this directory.
//   - tsRunner: The path to the "runner.ts" file, typically within tempDir.
//
// The function sets up the PATH environment variable to include the local `node_modules/.bin`
// directory so `tsx` can be found. It then runs the script and returns its stdout.
// If the script execution fails, it calls t.Fatalf.
func RunTypeScriptRunner(t *testing.T, workspaceDir, tempDir, tsRunner string) string {
	t.Helper()
	cmd := exec.Command("tsx", tsRunner)
	cmd.Dir = tempDir

	nodeBinDir := filepath.Join(workspaceDir, "node_modules", ".bin")
	currentPath := os.Getenv("PATH")
	newPath := fmt.Sprintf("%s%c%s", nodeBinDir, os.PathListSeparator, currentPath)
	cmd.Env = append(os.Environ(), "PATH="+newPath)

	var outBuf, errBuf bytes.Buffer
	cmd.Stdout = io.MultiWriter(&outBuf, os.Stdout) // Changed to os.Stdout for easier debugging
	cmd.Stderr = io.MultiWriter(&errBuf, os.Stderr) // Keep stderr going to test output
	if err := cmd.Run(); err != nil {
		t.Fatalf("run failed: %v\nstdout: %s\nstderr: %s", err, outBuf.String(), errBuf.String())
	}
	return outBuf.String()
}

// copyFile copies a file from a source path (src) to a destination path (dst).
// It creates the destination directory if it does not exist.
func copyFile(src, dst string) error {
	sourceFile, err := os.Open(src)
	if err != nil {
		return fmt.Errorf("failed to open source file %s: %w", src, err)
	}
	defer sourceFile.Close()

	destDir := filepath.Dir(dst)
	if err := os.MkdirAll(destDir, 0o755); err != nil {
		return fmt.Errorf("failed to create destination directory %s: %w", destDir, err)
	}

	destFile, err := os.Create(dst)
	if err != nil {
		return fmt.Errorf("failed to create destination file %s: %w", dst, err)
	}
	defer destFile.Close()

	if _, err := io.Copy(destFile, sourceFile); err != nil {
		return fmt.Errorf("failed to copy file content from %s to %s: %w", src, dst, err)
	}

	if err := destFile.Sync(); err != nil {
		return fmt.Errorf("failed to sync destination file %s: %w", dst, err)
	}
	return nil
}

// WriteTypeCheckConfig generates a "tsconfig.json" file in the testDir.
// This tsconfig.json is specifically configured for type-checking the .gs.ts files
// that were generated by CompileGoToTypeScript and copied back into the testDir.
//
// Parameters:
//   - t: The testing.T instance for logging and assertions.
//   - parentModulePath: The Go module path of the parent project.
//   - workspaceDir: The root directory of the goscript workspace. Used to locate the
//     root `tsconfig.json` and the `builtin.ts` file.
//   - testDir: The directory of the specific compliance test. The "tsconfig.json" will be
//     written here, and paths within it will be relative to this directory.
//
// The generated tsconfig.json extends the root tsconfig.json from the workspace.
// It includes all "*.gs.ts" and "index.ts" files found recursively within testDir.
// It sets up "paths" aliases for:
//   - The test's own generated package: "@goscript/PARENT_MODULE/compliance/tests/TEST_NAME/*" -> "./*"
//   - The goscript builtin types: "@goscript/builtin" -> relative path to "workspaceDir/builtin/builtin.ts"
//
// Returns the path to the generated "tsconfig.json" file.
func WriteTypeCheckConfig(t *testing.T, parentModulePath, workspaceDir, testDir string) string {
	t.Helper()

	var gsTsFiles []string
	err := filepath.WalkDir(testDir, func(path string, d fs.DirEntry, err error) error {
		if err != nil {
			return err
		}
		if !d.IsDir() && (strings.HasSuffix(d.Name(), ".gs.ts") || d.Name() == "index.ts") {
			gsTsFiles = append(gsTsFiles, path)
		}
		if d.IsDir() && d.Name() == "run" {
			return filepath.SkipDir
		}
		return nil
	})
	if err != nil {
		t.Fatalf("failed to glob for .gs.ts files in %s: %v", testDir, err)
	}
	if len(gsTsFiles) == 0 {
		t.Logf("no .gs.ts files found in %s for type checking config, this might be ok if test expects no output.", testDir)
		// Create a minimal tsconfig anyway, tsc might complain if it's missing during --project.
	}

	var includes []string
	for _, file := range gsTsFiles {
		relFile, errRel := filepath.Rel(testDir, file)
		if errRel != nil {
			t.Fatalf("failed to get relative path for %s from %s: %v", file, testDir, errRel)
		}
		includes = append(includes, filepath.ToSlash(relFile)) // Ensure forward slashes for JSON
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
	rootTsConfigPath := filepath.ToSlash(filepath.Join(relWorkspacePath, "tsconfig.json"))

	tsconfig := maps.Clone(baseTsConfig)
	tsconfig["extends"] = rootTsConfigPath
	if len(includes) > 0 {
		tsconfig["include"] = includes
	} else {
		// if no files, tsc might error. Specify no files explicitly.
		tsconfig["files"] = []string{}
	}

	testName := filepath.Base(testDir)
	compilerOptions := maps.Clone(tsconfig["compilerOptions"].(map[string]interface{}))
	compilerOptions["baseUrl"] = "." // testDir is baseUrl

	// For paths in tsconfig, it's often better to use relative paths from baseUrl if possible,
	// but for @goscript/builtin, pointing to the canonical one is important.
	// It needs to be relative from testDir (baseUrl) to workspaceDir/builtin/builtin.ts
	builtinTsRelPath := filepath.ToSlash(filepath.Join(relWorkspacePath, "builtin", "builtin.ts"))

	// Alias for this test's own generated packages
	testPkgGoPathPrefix := fmt.Sprintf("%s/compliance/tests/%s", parentModulePath, testName)
	compilerOptions["paths"] = map[string][]string{
		fmt.Sprintf("@goscript/%s/*", testPkgGoPathPrefix): {"./*"}, // Maps to files in testDir/*
		"@goscript/builtin": {builtinTsRelPath},
	}
	tsconfig["compilerOptions"] = compilerOptions

	tsconfigContentBytes, err := json.MarshalIndent(tsconfig, "", "  ")
	if err != nil {
		t.Fatalf("failed to marshal tsconfig to JSON: %v", err)
	}

	tsconfigPath := filepath.Join(testDir, "tsconfig.json")
	if err := os.WriteFile(tsconfigPath, append(tsconfigContentBytes, '\n'), 0o644); err != nil {
		t.Fatalf("failed to write tsconfig.json to %s: %v", tsconfigPath, err)
	}
	return tsconfigPath
}

// RunTypeScriptTypeCheck executes the TypeScript compiler (`tsc`) to perform type checking
// on the generated TypeScript files in a test directory.
//
// Parameters:
//   - t: The testing.T instance for logging and assertions.
//   - workspaceDir: The root directory of the goscript workspace. Used to find the `tsc`
//     executable in `node_modules/.bin`.
//   - testDir: The directory of the specific compliance test, where the `tsconfig.json`
//     (generated by WriteTypeCheckConfig) is located.
//   - tsconfigPath: The path to the `tsconfig.json` file to be used for type checking.
//     This is typically `testDir/tsconfig.json`.
//
// The function runs `tsc --project <tsconfigPath>` from the testDir.
// It sets up the PATH environment variable to include the local `node_modules/.bin`.
// If type checking fails, it calls t.Fatalf.
func RunTypeScriptTypeCheck(t *testing.T, workspaceDir, testDir string, tsconfigPath string) {
	t.Helper()
	t.Run("TypeCheck", func(t *testing.T) {
		// tsconfigPath is already testDir/tsconfig.json
		cmd := exec.Command("tsc", "--project", filepath.Base(tsconfigPath)) // Use "tsconfig.json"
		cmd.Dir = testDir                                                    // Run tsc from the test directory where tsconfig.json is located

		nodeBinDir := filepath.Join(workspaceDir, "node_modules", ".bin")
		currentPath := os.Getenv("PATH")
		newPath := fmt.Sprintf("%s%c%s", nodeBinDir, os.PathListSeparator, currentPath)
		cmd.Env = append(os.Environ(), "PATH="+newPath)

		output, err := cmd.CombinedOutput() // Capture both stdout and stderr
		if err != nil {
			t.Fatalf("TypeScript type checking failed: %v\noutput:\n%s", err, string(output))
		}
	})
}

const runnerContentTemplate = `import { main } from %q;
// NOTE: To debug: add a breakpoint, open a JavaScript Debug Terminal, and tsx runner.ts
await (async () => {
  await main();
  await new Promise(resolve => setTimeout(resolve, 100)); // Allow microtasks to settle
})();
`

// RunGoScriptTestDir orchestrates the full lifecycle of a single compliance test
// located in a specific directory (testDir).
//
// The process involves:
// 1. Determining the parent Go module path.
// 2. Checking for a "skip-test" file; if present, the test is skipped.
// 3. Preparing a test run directory within testDir.
// 4. Setting up a "tsconfig.json" and "package.json" in the "run" directory for executing the compiled TypeScript.
// 5. Compiling Go source files from testDir to TypeScript, placing them in "run/output/...".
//   - Generated .gs.ts and index.ts files are copied back to testDir.
//     6. Writing a "runner.ts" script in the "run" directory to execute the compiled test.
//     7. If an "expect-fail" file is not present in testDir:
//     a. Running the "runner.ts" script using `tsx`.
//     b. Comparing its output against "expected.log" (generating it from `go run ./` if it doesn't exist).
//   - If outputs differ, "actual.log" is written to testDir.
//     8. If "skip-typecheck" or "expect-typecheck-fail" files are not present:
//     a. Writing a "tsconfig.json" in testDir for type checking the generated .gs.ts files.
//     b. Running `tsc` to perform the type check.
//
// Parameters:
//   - t: The testing.T instance for logging and assertions.
//   - workspaceDir: The root directory of the goscript workspace (can be relative or absolute).
//   - testDir: The directory containing the Go source files and configuration for a single compliance test (can be relative or absolute).
func RunGoScriptTestDir(t *testing.T, workspaceDir, testDir string) {
	t.Helper()

	var err error
	testDir, err = filepath.Abs(testDir)
	if err != nil {
		t.Fatalf("failed to get absolute path for test directory %s: %v", testDir, err)
	}

	workspaceDir, err = filepath.Abs(workspaceDir)
	if err != nil {
		t.Fatalf("failed to get absolute path for workspace directory %s: %v", workspaceDir, err)
	}

	log := logrus.New()
	log.SetLevel(logrus.DebugLevel)
	le := logrus.NewEntry(log)

	parentModPath, err := getParentGoModulePath()
	if err != nil {
		t.Fatalf("Failed to determine parent Go module path: %v", err)
	}

	skipTestPath := filepath.Join(testDir, "skip-test")
	if _, err := os.Stat(skipTestPath); err == nil {
		t.Skipf("Skipping test %s: skip-test file found", filepath.Base(testDir))
		return
	} else if !os.IsNotExist(err) {
		t.Fatalf("failed to check for skip-test file in %s: %v", testDir, err)
	}

	tempDir := PrepareTestRunDir(t, testDir)

	// tsconfig.json for the runner execution in tempDir
	runnerTsConfig := maps.Clone(baseTsConfig)
	runnerCompilerOptions := maps.Clone(runnerTsConfig["compilerOptions"].(map[string]interface{}))
	runnerCompilerOptions["baseUrl"] = "." // tempDir is baseUrl
	runnerCompilerOptions["paths"] = map[string][]string{
		"@goscript/*":       {"./output/@goscript/*"},           // Maps to tempDir/output/@goscript/*
		"@goscript/builtin": {"../../../../builtin/builtin.ts"}, // Maps to workspace/builtin/builtin.ts
	}
	runnerTsConfig["compilerOptions"] = runnerCompilerOptions

	runnerTsConfigContentBytes, err := json.MarshalIndent(runnerTsConfig, "", "  ")
	if err != nil {
		t.Fatalf("failed to marshal runner tsconfig to JSON: %v", err)
	}
	runnerTsConfigPath := filepath.Join(tempDir, "tsconfig.json")
	if err := os.WriteFile(runnerTsConfigPath, append(runnerTsConfigContentBytes, '\n'), 0o644); err != nil {
		t.Fatalf("failed to write runner tsconfig.json to temp dir: %v", err)
	}

	packageJsonContent := `{"type": "module"}` + "\n"
	packageJsonPath := filepath.Join(tempDir, "package.json")
	if err := os.WriteFile(packageJsonPath, []byte(packageJsonContent), 0o644); err != nil {
		t.Fatalf("failed to write package.json to temp dir: %v", err)
	}

	outputDir := filepath.Join(tempDir, "output")
	var tsRunner string

	t.Run("Compile", func(t *testing.T) {
		CompileGoToTypeScript(t, parentModPath, testDir, tempDir, outputDir, le)
		// Note: Removed copy of builtin.ts to tempDir; tsconfig paths should handle resolution.
		tsRunner = WriteTypeScriptRunner(t, parentModPath, testDir, tempDir)
	})

	expectFailPath := filepath.Join(testDir, "expect-fail")
	if _, err := os.Stat(expectFailPath); err == nil {
		t.Skipf("Skipping test execution for %s: expect-fail file found", filepath.Base(testDir))
		// Proceed to type checking unless skipped
	} else if !os.IsNotExist(err) {
		t.Fatalf("failed to check for expect-fail file in %s: %v", testDir, err)
	} else {
		// Only run and compare if not expecting failure
		var actual string
		t.Run("Run", func(t *testing.T) {
			actual = strings.TrimSpace(RunTypeScriptRunner(t, workspaceDir, tempDir, tsRunner))
		})

		t.Run("Compare", func(t *testing.T) {
			expectedLogPath := filepath.Join(testDir, "expected.log")
			expectedBytes, errRead := os.ReadFile(expectedLogPath)

			if os.IsNotExist(errRead) {
				t.Logf("expected.log not found in %s, generating from Go source", testDir)
				goRunCmd := exec.Command("go", "run", "./") // Assumes main package in testDir
				goRunCmd.Dir = testDir
				var goRunOutBuf, goRunErrBuf bytes.Buffer
				goRunCmd.Stdout = &goRunOutBuf
				goRunCmd.Stderr = &goRunErrBuf
				if runErr := goRunCmd.Run(); runErr != nil {
					t.Fatalf("failed to run 'go run ./' in %s to generate expected.log: %v\nStderr: %s", testDir, runErr, goRunErrBuf.String())
				}
				expectedOutputFromGo := strings.TrimSpace(goRunOutBuf.String())
				if writeErr := os.WriteFile(expectedLogPath, []byte(expectedOutputFromGo+"\n"), 0o644); writeErr != nil {
					t.Fatalf("failed to write generated expected.log: %v", writeErr)
				}
				expectedBytes = []byte(expectedOutputFromGo)
				t.Logf("Generated expected.log with content:\n%s", expectedOutputFromGo)
			} else if errRead != nil {
				t.Fatalf("failed to read existing expected.log in %s: %v", testDir, errRead)
			}

			exp := strings.TrimSpace(string(expectedBytes))
			if actual != exp {
				actualLogPath := filepath.Join(testDir, "actual.log")
				os.WriteFile(actualLogPath, []byte(actual+"\n"), 0o644)
				t.Errorf("output mismatch (TS vs Go)\nExpected (from Go):\n%s\nActual (from TS):\n%s", exp, actual)
			} else {
				os.Remove(filepath.Join(testDir, "actual.log")) //nolint:errcheck
			}
		})
	}

	skipTypeCheckPath := filepath.Join(testDir, "skip-typecheck")
	if _, err := os.Stat(skipTypeCheckPath); err == nil {
		t.Logf("Skipping TypeScript type checking for %s: skip-typecheck file found", filepath.Base(testDir))
		return
	} else if !os.IsNotExist(err) {
		t.Fatalf("failed to check for skip-typecheck file in %s: %v", testDir, err)
	}

	expectTypeCheckFailPath := filepath.Join(testDir, "expect-typecheck-fail")
	if _, err := os.Stat(expectTypeCheckFailPath); err == nil {
		t.Logf("Skipping TypeScript type checking for %s as failure is expected (expect-typecheck-fail found)", filepath.Base(testDir))
		// Potentially, one could run the type check here and assert that it *does* fail.
		// For now, just skipping.
		return
	}

	tsconfigPathForCheck := WriteTypeCheckConfig(t, parentModPath, workspaceDir, testDir)
	RunTypeScriptTypeCheck(t, workspaceDir, testDir, tsconfigPathForCheck)
}

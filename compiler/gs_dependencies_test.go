package compiler

import (
	"testing"

	"github.com/sirupsen/logrus"
)

func TestReadGsPackageMetadata(t *testing.T) {
	// Create a basic compiler configuration
	config := &Config{
		OutputPath: "./test_output",
		Dir:        ".",
	}

	// Create a logger (set to warn level to reduce noise in tests)
	logger := logrus.New()
	logger.SetLevel(logrus.WarnLevel)
	le := logrus.NewEntry(logger)

	// Create a compiler
	comp, err := NewCompiler(config, le, nil)
	if err != nil {
		t.Fatalf("Failed to create compiler: %v", err)
	}

	// Test reading metadata from the bytes package
	metadata, err := comp.ReadGsPackageMetadata("gs/bytes")
	if err != nil {
		t.Fatalf("Failed to read metadata: %v", err)
	}

	// Check that we found the expected dependencies
	if len(metadata.Dependencies) == 0 {
		t.Errorf("Expected at least one dependency, got none")
	}

	// Check for the specific "iter" dependency
	foundIter := false
	for _, dep := range metadata.Dependencies {
		if dep == "iter" {
			foundIter = true
			break
		}
	}

	if !foundIter {
		t.Errorf("Expected to find 'iter' dependency, got dependencies: %v", metadata.Dependencies)
	}

	// Also check for other expected dependencies from the bytes package
	expectedDeps := []string{"errors", "io", "iter", "unicode", "unicode/utf8", "unsafe"}
	for _, expected := range expectedDeps {
		found := false
		for _, dep := range metadata.Dependencies {
			if dep == expected {
				found = true
				break
			}
		}
		if !found {
			t.Errorf("Expected to find dependency '%s', got dependencies: %v", expected, metadata.Dependencies)
		}
	}
}

func TestReadGsPackageMetadataWithAsyncMethods(t *testing.T) {
	// Create a basic compiler configuration
	config := &Config{
		OutputPath: "./test_output",
		Dir:        ".",
	}

	// Create a logger (set to warn level to reduce noise in tests)
	logger := logrus.New()
	logger.SetLevel(logrus.WarnLevel)
	le := logrus.NewEntry(logger)

	// Create a compiler
	comp, err := NewCompiler(config, le, nil)
	if err != nil {
		t.Fatalf("Failed to create compiler: %v", err)
	}

	// Test reading metadata from the sync package (which has async methods)
	metadata, err := comp.ReadGsPackageMetadata("gs/sync")
	if err != nil {
		t.Fatalf("Failed to read metadata: %v", err)
	}

	// Check that we have async methods
	if len(metadata.AsyncMethods) == 0 {
		t.Errorf("Expected at least one async method for sync package, got none")
	}

	// Check for specific async methods
	expectedAsyncMethods := []string{"Mutex.Lock", "WaitGroup.Wait", "RWMutex.Lock"}
	for _, methodName := range expectedAsyncMethods {
		if isAsync, exists := metadata.AsyncMethods[methodName]; !exists {
			t.Errorf("Expected to find async method '%s'", methodName)
		} else if !isAsync {
			t.Errorf("Expected method '%s' to be async, but it's not", methodName)
		}
	}
}

func TestReadGsPackageMetadataNonExistent(t *testing.T) {
	// Create a basic compiler configuration
	config := &Config{
		OutputPath: "./test_output",
		Dir:        ".",
	}

	// Create a logger (set to warn level to reduce noise in tests)
	logger := logrus.New()
	logger.SetLevel(logrus.WarnLevel)
	le := logrus.NewEntry(logger)

	// Create a compiler
	comp, err := NewCompiler(config, le, nil)
	if err != nil {
		t.Fatalf("Failed to create compiler: %v", err)
	}

	// Test reading metadata from a non-existent package
	metadata, err := comp.ReadGsPackageMetadata("gs/nonexistent")
	if err != nil {
		t.Fatalf("Expected no error for non-existent package, got: %v", err)
	}

	// Should return empty metadata for non-existent packages
	if len(metadata.Dependencies) != 0 {
		t.Errorf("Expected empty dependencies for non-existent package, got: %v", metadata.Dependencies)
	}

	if len(metadata.AsyncMethods) != 0 {
		t.Errorf("Expected empty async methods for non-existent package, got: %v", metadata.AsyncMethods)
	}
}

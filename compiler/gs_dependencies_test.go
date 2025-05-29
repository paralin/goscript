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

	// Check that we found the expected dependency
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
}

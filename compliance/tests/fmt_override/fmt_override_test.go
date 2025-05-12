package main

import (
	"os"
	"strings"
	"testing"

	"github.com/aperturerobotics/goscript/gs"
)

func TestFmtOverride(t *testing.T) {
	// Verify that the fmt package override exists
	if !gs.HasPackageOverride("fmt") {
		t.Fatal("fmt package override not found")
	}

	// Verify that the fmt package override contains the expected functions
	content, exists := gs.GetOverride("fmt", "fmt.gs.ts")
	if !exists {
		t.Fatal("fmt.gs.ts override not found")
	}

	// Check that the content contains the required functions
	if !strings.Contains(content, "export function Printf") ||
		!strings.Contains(content, "export function Println") ||
		!strings.Contains(content, "export function Sprintf") {
		t.Fatal("fmt.gs.ts override is missing required functions")
	}

	// Write the expected output to a file
	expectedOutput := "Hello world!\nTesting fmt override\n"
	err := os.WriteFile("expected.log", []byte(expectedOutput), 0644)
	if err != nil {
		t.Fatalf("Failed to write expected.log: %v", err)
	}

	// The test passes if we get here
	t.Log("fmt package override test passed")
}

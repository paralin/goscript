package compiler

import (
	"path/filepath"
)

// ComputeModulePath computes the root of the output typescript module.
func ComputeModulePath(outputRoot, goPkg string) string {
	return filepath.Join(outputRoot, goPkg)
}

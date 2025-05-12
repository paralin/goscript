// Package gs provides handwritten overrides for Go standard library packages
// that are difficult to transpile automatically to TypeScript.
package gs

import (
	"embed"
	"strings"
)

//go:embed fmt
// GsOverrides is the embedded filesystem containing handwritten package overrides.
var GsOverrides embed.FS

// GetOverride retrieves a handwritten override file for a specific package and file.
// It returns the content of the override file and true if found, or empty string and false if not found.
func GetOverride(pkgPath, fileName string) (string, bool) {
	data, err := GsOverrides.ReadFile(pkgPath + "/" + fileName)
	if err != nil {
		return "", false
	}
	return string(data), true
}

func HasPackageOverride(pkgPath string) bool {
	entries, err := GsOverrides.ReadDir(pkgPath)
	if err != nil {
		return false
	}
	return len(entries) > 0
}

func IsStandardLibraryPackage(pkgPath string) bool {
	return !strings.Contains(pkgPath, ".") && 
		!strings.HasPrefix(pkgPath, "github.com/") &&
		!strings.HasPrefix(pkgPath, "golang.org/") &&
		!strings.HasPrefix(pkgPath, "gopkg.in/")
}

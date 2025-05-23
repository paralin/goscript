package compiler

import (
	"fmt"
	"path/filepath"
	"strings"
)

// ComputeModulePath computes the root of the output typescript module.
func ComputeModulePath(outputRoot, goPkg string) string {
	return filepath.Join(outputRoot, translateGoPathToTypescriptPath(goPkg))
}

var typeScriptGoStubPrefix = "@ts/"

// translateGoPathToTypescriptPath translates a go package import path to a typescript import path.
func translateGoPathToTypescriptPath(goImportPath string) string {
	if strings.HasPrefix(goImportPath, typeScriptGoStubPrefix) {
		return goImportPath[len(typeScriptGoStubPrefix):]
	}
	return fmt.Sprintf("@goscript/%s", goImportPath)
}

// packageNameFromGoPath attempts to determine the package name from the last segment of the go path.
func packageNameFromGoPath(goPkgPath string) string {
	pts := strings.Split(goPkgPath, "/")
	return pts[len(pts)-1]
}

// TranslateGoFilePathToTypescriptFilePath converts the go package path and typescript filename to output path within the typescript output dir
func TranslateGoFilePathToTypescriptFilePath(goPkgPath, goCodeFilename string) string {
	op := translateGoPathToTypescriptPath(goPkgPath)
	baseFilename := goCodeFilename[:len(goCodeFilename)-3]
	baseFilename = fmt.Sprintf("%s.gs.ts", baseFilename)
	return filepath.Join(op, baseFilename)
}

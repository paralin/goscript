package io

// GsDependencies lists the import paths that this gs/ package requires
// These dependencies will be automatically copied when this package is included
var GsDependencies = []string{
	"errors",
	"internal/oserror",
	"path",
	"time",
	"unicode/utf8",
}

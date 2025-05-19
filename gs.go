package goscript

import "embed"

// GsOverrides gs/ tree contains hand-written TypeScript packages corresponding to Go packages.
//
//go:embed gs
var GsOverrides embed.FS

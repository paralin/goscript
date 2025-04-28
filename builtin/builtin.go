package builtin

import (
	_ "embed"
)

// BuiltinTs contains the contents of the builtin.ts file which provides
// runtime support for GoScript compiled code.
//
//go:embed builtin.ts
var BuiltinTs string

package main

import (
	"github.com/aperturerobotics/goscript/compliance/tests/package_import/subpkg"
)

func main() {
	println(subpkg.Greet("world"))
}

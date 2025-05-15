package main

import (
	"package_import/subpkg"
)

func main() {
	println(subpkg.Greet("world"))
}

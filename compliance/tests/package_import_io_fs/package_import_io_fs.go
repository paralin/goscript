package main

import "io/fs"

func main() {
	// Test ValidPath function
	valid1 := fs.ValidPath("hello/world.txt")
	println("ValidPath('hello/world.txt'):", valid1)

	valid2 := fs.ValidPath("../invalid")
	println("ValidPath('../invalid'):", valid2)

	valid3 := fs.ValidPath(".")
	println("ValidPath('.'):", valid3)

	valid4 := fs.ValidPath("")
	println("ValidPath(''):", valid4)

	// Test error constants
	println("ErrInvalid:", fs.ErrInvalid.Error())
	println("ErrNotExist:", fs.ErrNotExist.Error())
	println("ErrExist:", fs.ErrExist.Error())
	println("ErrPermission:", fs.ErrPermission.Error())
	println("ErrClosed:", fs.ErrClosed.Error())

	// Test FileMode constants
	println("ModeDir:", int(fs.ModeDir))
	println("ModePerm:", int(fs.ModePerm))

	println("test finished")
}

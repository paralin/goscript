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

	// Test all FileMode constants
	println("ModeDir:", int(fs.ModeDir))
	println("ModeAppend:", int(fs.ModeAppend))
	println("ModeExclusive:", int(fs.ModeExclusive))
	println("ModeTemporary:", int(fs.ModeTemporary))
	println("ModeSymlink:", int(fs.ModeSymlink))
	println("ModeDevice:", int(fs.ModeDevice))
	println("ModeNamedPipe:", int(fs.ModeNamedPipe))
	println("ModeSocket:", int(fs.ModeSocket))
	println("ModeSetuid:", int(fs.ModeSetuid))
	println("ModeSetgid:", int(fs.ModeSetgid))
	println("ModeCharDevice:", int(fs.ModeCharDevice))
	println("ModeSticky:", int(fs.ModeSticky))
	println("ModeIrregular:", int(fs.ModeIrregular))
	println("ModeType:", int(fs.ModeType))
	println("ModePerm:", int(fs.ModePerm))

	// Test FileMode methods
	mode := fs.FileMode(fs.ModeDir | 0755)
	println("FileMode.IsDir():", mode.IsDir())
	println("FileMode.IsRegular():", mode.IsRegular())
	println("FileMode.Perm():", int(mode.Perm()))
	println("FileMode.Type():", int(mode.Type()))
	println("FileMode.String():", mode.String())

	regularMode := fs.FileMode(0644)
	println("Regular file IsDir():", regularMode.IsDir())
	println("Regular file IsRegular():", regularMode.IsRegular())

	println("test finished")
}

package main

import "path"

func main() {
	// Test Clean function
	cleaned := path.Clean("/a/b/../c/./d")
	println("Clean result:", cleaned)

	// Test Join function
	joined := path.Join("a", "b", "c")
	println("Join result:", joined)

	// Test Base function
	base := path.Base("/a/b/c.txt")
	println("Base result:", base)

	// Test Dir function
	dir := path.Dir("/a/b/c.txt")
	println("Dir result:", dir)

	// Test Ext function
	ext := path.Ext("/a/b/c.txt")
	println("Ext result:", ext)

	// Test IsAbs function
	isAbs := path.IsAbs("/a/b/c")
	println("IsAbs result:", isAbs)

	// Test Split function
	dir2, file := path.Split("/a/b/c.txt")
	println("Split dir:", dir2)
	println("Split file:", file)

	// Test Match function
	matched, err := path.Match("*.txt", "file.txt")
	if err != nil {
		println("Match error:", err.Error())
	} else {
		println("Match result:", matched)
	}

	println("test finished")
}

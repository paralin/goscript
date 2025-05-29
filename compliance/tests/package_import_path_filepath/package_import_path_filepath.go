package main

import "path/filepath"

func main() {
	// Test Basic path operations
	path := "dir/subdir/file.txt"

	// Test Base
	base := filepath.Base(path)
	println("Base:", base)

	// Test Dir
	dir := filepath.Dir(path)
	println("Dir:", dir)

	// Test Ext
	ext := filepath.Ext(path)
	println("Ext:", ext)

	// Test Clean
	dirty := "dir//subdir/../subdir/./file.txt"
	clean := filepath.Clean(dirty)
	println("Clean:", clean)

	// Test Join
	joined := filepath.Join("dir", "subdir", "file.txt")
	println("Join:", joined)

	// Test Split
	dir2, file := filepath.Split(path)
	println("Split dir:", dir2)
	println("Split file:", file)

	// Test IsAbs
	abs := filepath.IsAbs("/absolute/path")
	println("IsAbs /absolute/path:", abs)
	rel := filepath.IsAbs("relative/path")
	println("IsAbs relative/path:", rel)

	// Test ToSlash and FromSlash
	windowsPath := "dir\\subdir\\file.txt"
	slashed := filepath.ToSlash(windowsPath)
	println("ToSlash:", slashed)
	backslashed := filepath.FromSlash("dir/subdir/file.txt")
	println("FromSlash:", backslashed)

	// Test VolumeName
	vol := filepath.VolumeName("C:\\Windows\\System32")
	println("VolumeName:", vol)

	// Test Match
	matched, err := filepath.Match("*.txt", "file.txt")
	if err == nil {
		println("Match *.txt file.txt:", matched)
	}

	matched2, err2 := filepath.Match("dir/*", "dir/file.txt")
	if err2 == nil {
		println("Match dir/* dir/file.txt:", matched2)
	}

	// Test HasPrefix
	hasPrefix := filepath.HasPrefix("/usr/local/bin", "/usr/local")
	println("HasPrefix /usr/local/bin /usr/local:", hasPrefix)

	// Test IsLocal
	local := filepath.IsLocal("file.txt")
	println("IsLocal file.txt:", local)
	nonLocal := filepath.IsLocal("../file.txt")
	println("IsLocal ../file.txt:", nonLocal)

	// Test SplitList
	pathList := "/usr/bin:/usr/local/bin:/bin"
	split := filepath.SplitList(pathList)
	println("SplitList length:", len(split))
	for i, p := range split {
		println("SplitList", i, ":", p)
	}

	println("test finished")
}

// Generated file based on package_import_path_filepath.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as $ from "@goscript/builtin/builtin.js";

import * as filepath from "@goscript/path/filepath/index.js"

export async function main(): Promise<void> {
	// Test Basic path operations
	let path = "dir/subdir/file.txt"

	// Test Base
	let base = filepath.Base(path)
	console.log("Base:", base)

	// Test Dir
	let dir = filepath.Dir(path)
	console.log("Dir:", dir)

	// Test Ext
	let ext = filepath.Ext(path)
	console.log("Ext:", ext)

	// Test Clean
	let dirty = "dir//subdir/../subdir/./file.txt"
	let clean = filepath.Clean(dirty)
	console.log("Clean:", clean)

	// Test Join
	let joined = filepath.Join("dir", "subdir", "file.txt")
	console.log("Join:", joined)

	// Test Split
	let [dir2, file] = filepath.Split(path)
	console.log("Split dir:", dir2)
	console.log("Split file:", file)

	// Test IsAbs
	let abs = filepath.IsAbs("/absolute/path")
	console.log("IsAbs /absolute/path:", abs)
	let rel = filepath.IsAbs("relative/path")
	console.log("IsAbs relative/path:", rel)

	// Test ToSlash and FromSlash
	let windowsPath = "dir\\subdir\\file.txt"
	let slashed = filepath.ToSlash(windowsPath)
	console.log("ToSlash:", slashed)
	let backslashed = filepath.FromSlash("dir/subdir/file.txt")
	console.log("FromSlash:", backslashed)

	// Test VolumeName
	let vol = filepath.VolumeName("C:\\Windows\\System32")
	console.log("VolumeName:", vol)

	// Test Match
	let [matched, err] = filepath.Match("*.txt", "file.txt")
	if (err == null) {
		console.log("Match *.txt file.txt:", matched)
	}

	let [matched2, err2] = filepath.Match("dir/*", "dir/file.txt")
	if (err2 == null) {
		console.log("Match dir/* dir/file.txt:", matched2)
	}

	// Test HasPrefix
	let hasPrefix = filepath.HasPrefix("/usr/local/bin", "/usr/local")
	console.log("HasPrefix /usr/local/bin /usr/local:", hasPrefix)

	// Test IsLocal
	let local = filepath.IsLocal("file.txt")
	console.log("IsLocal file.txt:", local)
	let nonLocal = filepath.IsLocal("../file.txt")
	console.log("IsLocal ../file.txt:", nonLocal)

	// Test SplitList
	let pathList = "/usr/bin:/usr/local/bin:/bin"
	let split = filepath.SplitList(pathList)
	console.log("SplitList length:", $.len(split))
	for (let i = 0; i < $.len(split); i++) {
		const p = split![i]
		{
			console.log("SplitList", i, ":", p)
		}
	}

	console.log("test finished")
}


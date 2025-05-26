// Generated file based on package_import_path.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as $ from "@goscript/builtin/builtin.js";

import * as path from "@goscript/path/index.js"

export async function main(): Promise<void> {
	// Test Clean function
	let cleaned = path.Clean("/a/b/../c/./d")
	console.log("Clean result:", cleaned)

	// Test Join function
	let joined = path.Join("a", "b", "c")
	console.log("Join result:", joined)

	// Test Base function
	let base = path.Base("/a/b/c.txt")
	console.log("Base result:", base)

	// Test Dir function
	let dir = path.Dir("/a/b/c.txt")
	console.log("Dir result:", dir)

	// Test Ext function
	let ext = path.Ext("/a/b/c.txt")
	console.log("Ext result:", ext)

	// Test IsAbs function
	let isAbs = path.IsAbs("/a/b/c")
	console.log("IsAbs result:", isAbs)

	// Test Split function
	let [dir2, file] = path.Split("/a/b/c.txt")
	console.log("Split dir:", dir2)
	console.log("Split file:", file)

	// Test Match function
	let [matched, err] = path.Match("*.txt", "file.txt")
	if (err != null) {
		console.log("Match error:", err!.Error())
	} else {
		console.log("Match result:", matched)
	}

	console.log("test finished")
}


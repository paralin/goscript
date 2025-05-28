// Generated file based on package_import_testing_fstest.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as $ from "@goscript/builtin/builtin.js";

import * as fstest from "@goscript/testing/fstest/index.js"

import * as time from "@goscript/time/index.js"

export async function main(): Promise<void> {
	// Create a MapFS with some test files

	// fs.ModeDir
	let fsys = ({"hello.txt": new fstest.MapFile({Data: $.stringToBytes("Hello, World!")}), "dir/subfile.txt": new fstest.MapFile({Data: $.stringToBytes("This is a subfile")}), "dir": new fstest.MapFile({Mode: (0o755 | ((1 << (32 - 1 - 20))))}), "binary.bin": new fstest.MapFile({Data: new Uint8Array([0x48, 0x65, 0x6c, 0x6c, 0x6f]), ModTime: time.Date(2023, 1, 1, 0, 0, 0, 0, time.UTC)})})

	// Test Open and read a file
	let [file, err] = fsys.Open("hello.txt")
	if (err != null) {
		console.log("Error opening hello.txt:", err!.Error())
		return 
	}

	let data = new Uint8Array(20)
	let n: number
	[n, err] = file!.Read(data)
	if (err != null) {
		console.log("Error reading hello.txt:", err!.Error())
		return 
	}
	console.log("Read from hello.txt:", $.bytesToString($.goSlice(data, undefined, n)))
	file!.Close()

	// Test ReadFile
	let content: $.Bytes
	[content, err] = fsys.ReadFile("dir/subfile.txt")
	if (err != null) {
		console.log("Error reading dir/subfile.txt:", err!.Error())
		return 
	}
	console.log("ReadFile dir/subfile.txt:", $.bytesToString(content))

	// Test Stat
	let info: FileInfo
	[info, err] = fsys.Stat("hello.txt")
	if (err != null) {
		console.log("Error stating hello.txt:", err!.Error())
		return 
	}
	console.log("hello.txt size:", info!.Size())
	console.log("hello.txt name:", info!.Name())

	// Test ReadDir
	let entries: $.Slice<DirEntry>
	[entries, err] = fsys.ReadDir(".")
	if (err != null) {
		console.log("Error reading directory:", err!.Error())
		return 
	}
	console.log("Directory entries:")
	for (let _i = 0; _i < $.len(entries); _i++) {
		const entry = entries![_i]
		{
			console.log("  Entry:", entry!.Name(), "IsDir:", entry!.IsDir())
		}
	}

	// Test ReadDir on subdirectory
	let dirEntries: $.Slice<DirEntry>
	[dirEntries, err] = fsys.ReadDir("dir")
	if (err != null) {
		console.log("Error reading dir:", err!.Error())
		return 
	}
	console.log("Dir entries:")
	for (let _i = 0; _i < $.len(dirEntries); _i++) {
		const entry = dirEntries![_i]
		{
			console.log("  Entry:", entry!.Name(), "IsDir:", entry!.IsDir())
		}
	}

	// Test Glob
	let matches: $.Slice<string>
	[matches, err] = fsys.Glob("*.txt")
	if (err != null) {
		console.log("Error globbing *.txt:", err!.Error())
		return 
	}
	console.log("Glob *.txt matches:")
	for (let _i = 0; _i < $.len(matches); _i++) {
		const match = matches![_i]
		{
			console.log("  Match:", match)
		}
	}

	// Test Sub
	let subFS: FS
	[subFS, err] = fsys.Sub("dir")
	if (err != null) {
		console.log("Error creating sub filesystem:", err!.Error())
		return 
	}

	let subContent: $.Bytes
	[subContent, err] = $.mustTypeAssert<$.VarRef<fstest.MapFS> | null>(subFS, {kind: $.TypeKind.Pointer, elemType: 'fstest.MapFS'})!.ReadFile("subfile.txt")
	if (err != null) {
		console.log("Error reading from sub filesystem:", err!.Error())
		return 
	}
	console.log("Sub filesystem content:", $.bytesToString(subContent))

	console.log("testing/fstest MapFS test completed")
}


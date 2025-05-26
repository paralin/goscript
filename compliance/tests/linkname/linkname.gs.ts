// Generated file based on linkname.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as $ from "@goscript/builtin/builtin.js";

import * as os from "@goscript/os/index.js"

import * as _ from "@goscript/unsafe/index.js"

export function osOpen(name: string): [os.File | null, $.GoError] {}

export async function main(): Promise<void> {
	using __defer = new $.DisposableStack();
	// Test basic os package functionality
	let [file, err] = os.Open("/dev/null")
	if (err != null) {
		console.log("error opening file:", err!.Error())
		return 
	}
	__defer.defer(() => {
		file!.Close()
	});

	// Test the linkname function - this should be equivalent to os.Open
	let [file2, err2] = osOpen("/dev/null")
	if (err2 != null) {
		console.log("error opening file with linkname:", err2!.Error())
		return 
	}
	__defer.defer(() => {
		file2!.Close()
	});

	console.log("linkname directive compiled successfully")
	console.log("test finished")
}


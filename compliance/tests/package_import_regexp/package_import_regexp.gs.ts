// Generated file based on package_import_regexp.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as $ from "@goscript/builtin/builtin.js";

import * as regexp from "@goscript/regexp/index.js"

export async function main(): Promise<void> {
	let [re, err] = regexp.Compile("hello")
	if (err != null) {
		console.log("Error compiling regexp:", err!.Error())
		return 
	}

	let matched = re!.MatchString("hello world")
	console.log("Match result:", matched)

	let result = re!.FindString("hello world")
	console.log("Find result:", result)

	console.log("Regexp package test completed")
}


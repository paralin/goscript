// Generated file based on package_import_strings.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as $ from "@goscript/builtin/index.js";

import * as strings from "@goscript/strings/index.js"

export async function main(): Promise<void> {
	// This should trigger the unhandled make call error
	// strings.Builder uses make internally for its buffer
	let builder: strings.Builder = new strings.Builder()
	builder.WriteString("Hello")
	builder.WriteString(" ")
	builder.WriteString("World")

	let result = builder.String()
	console.log("Result:", result)

	// Also test direct make with strings.Builder
	let builderPtr = new strings.Builder({})
	builderPtr!.WriteString("Direct make test")
	console.log("Direct:", builderPtr!.String())
}


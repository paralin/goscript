// Generated file based on package_import_time.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as $ from "@goscript/builtin/builtin.js";

import * as time from "@goscript/time/index.js"

export async function main(): Promise<void> {
	let now = time.Now().clone()
	let setTime = time.Date(2025, time.May, 15, 1, 10, 42, 0, time.UTC).clone()
	if (now.Sub(setTime) < $.multiplyDuration(time.Hour, 24)) {
		console.log("expected we are > 24 hrs past may 15, incorrect")
	}

	console.log("preset time", setTime.String())
}


// Generated file based on go_type_assertion.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as $ from "@goscript/builtin/builtin.js";

export function main(): void {
	let x: null | any = (): void => {
		console.log("goroutine executed")
	}

	queueMicrotask(() => {
		$.mustTypeAssert<(() => void) | null>(x, {kind: $.TypeKind.Function})!()
	})
	console.log("main finished")
}


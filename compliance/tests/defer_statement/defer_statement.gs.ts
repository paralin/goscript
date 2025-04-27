// Generated file based on defer_statement.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as goscript from "@go/builtin";

export async function main(): Promise<void> {
	using cleanup = new goscript.DisposableStack();
	cleanup.defer(() => {
		console.log("deferred")
	});
	console.log("main")
}


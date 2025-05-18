// Generated file based on defer_statement.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as $ from "@goscript/builtin";

export function main(): void {
	using __defer = new $.DisposableStack();
	__defer.defer(() => {
		console.log("deferred")
	});
	console.log("main")
}


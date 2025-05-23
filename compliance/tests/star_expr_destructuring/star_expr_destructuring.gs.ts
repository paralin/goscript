// Generated file based on star_expr_destructuring.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as $ from "@goscript/builtin/builtin.js";

function returnTwoValues(): [number, string] {
	return [42, "hello"]
}

export function main(): void {
	let a: $.Box<number> = $.box(0)
	let b: $.Box<string> = $.box("")

	// Create pointers - these will be properly boxed
	let pA: $.Box<number> | null = a
	let pB: $.Box<string> | null = b

	// This should trigger the "unhandled LHS expression in destructuring: *ast.StarExpr" error
	{
	  const _tmp = returnTwoValues()
	  pA!.value = _tmp[0]
	  pB!.value = _tmp[1]
	}

	console.log("a:", a!.value)
	console.log("b:", b!.value)
}


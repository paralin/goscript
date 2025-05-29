// Generated file based on star_expr_destructuring.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as $ from "@goscript/builtin/index.js";

export function returnTwoValues(): [number, string] {
	return [42, "hello"]
}

export async function main(): Promise<void> {
	let a: $.VarRef<number> = $.varRef(0)
	let b: $.VarRef<string> = $.varRef("")

	// Create pointers - these will be properly varrefed
	let pA: $.VarRef<number> | null = a
	let pB: $.VarRef<string> | null = b

	// This should trigger the "unhandled LHS expression in destructuring: *ast.StarExpr" error
	{
	  const _tmp = returnTwoValues()
	  pA!.value = _tmp[0]
	  pB!.value = _tmp[1]
	}

	console.log("a:", a!.value)
	console.log("b:", b!.value)
}


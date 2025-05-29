import * as $ from "@goscript/builtin/index.js";

let supportsCloseOnExec: boolean = false

// hostname function for JavaScript environment - return mock data
export function hostname(): [string, $.GoError] {
	return ["goscript", null]
}


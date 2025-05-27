import * as $ from "@goscript/builtin/builtin.js";

import * as errors from "@goscript/errors/index.js"

import * as runtime from "@goscript/runtime/index.js"

export function executable(): [string, $.GoError] {
	return ["", errors.New("Executable not implemented for " + runtime.GOOS)]
}


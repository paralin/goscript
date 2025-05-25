import * as $ from "@goscript/builtin/builtin.js";

// For go:linkname
import * as _ from "@goscript/unsafe/index.js"

//go:noescape
export function Compare(a: Uint8Array, b: Uint8Array): number {}

export function CompareString(a: string, b: string): number {
	return abigen_runtime_cmpstring(a, b)
}

//go:linkname abigen_runtime_cmpstring runtime.cmpstring
export function abigen_runtime_cmpstring(a: string, b: string): number {}


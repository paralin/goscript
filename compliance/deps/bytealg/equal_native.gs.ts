import * as $ from "@goscript/builtin/builtin.js";

import * as unsafe from "@goscript/unsafe/index.js"

//go:linkname abigen_runtime_memequal runtime.memequal
export function abigen_runtime_memequal(a: Pointer, b: Pointer, size: uintptr): boolean {}

//go:linkname abigen_runtime_memequal_varlen runtime.memequal_varlen
export function abigen_runtime_memequal_varlen(a: Pointer, b: Pointer): boolean {}


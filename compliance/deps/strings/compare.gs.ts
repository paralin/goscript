import * as $ from "@goscript/builtin/builtin.js";

import * as bytealg from "@goscript/internal/bytealg/index.js"

// Compare returns an integer comparing two strings lexicographically.
// The result will be 0 if a == b, -1 if a < b, and +1 if a > b.
//
// Use Compare when you need to perform a three-way comparison (with
// [slices.SortFunc], for example). It is usually clearer and always faster
// to use the built-in string comparison operators ==, <, >, and so on.
export function Compare(a: string, b: string): number {
	return bytealg.CompareString(a, b)
}


import * as $ from "@goscript/builtin/builtin.js";

import * as stringslite from "@goscript/internal/stringslite/index.js"

// Clone returns a fresh copy of s.
// It guarantees to make a copy of s into a new allocation,
// which can be important when retaining only a small substring
// of a much larger string. Using Clone can help such programs
// use less memory. Of course, since using Clone makes a copy,
// overuse of Clone can make programs use more memory.
// Clone should typically be used only rarely, and only when
// profiling indicates that it is needed.
// For strings of length zero the string "" will be returned
// and no allocation is made.
export function Clone(s: string): string {
	return stringslite.Clone(s)
}


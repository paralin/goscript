import * as $ from "@goscript/builtin/builtin.js";

// Equal reports whether a and b
// are the same length and contain the same bytes.
// A nil argument is equivalent to an empty slice.
//
// Equal is equivalent to bytes.Equal.
// It is provided here for convenience,
// because some packages cannot depend on bytes.
export function Equal(a: Uint8Array, b: Uint8Array): boolean {
	// Neither cmd/compile nor gccgo allocates for these string conversions.
	// There is a test for this in package bytes.
	return $.bytesToString(a) == $.bytesToString(b)
}


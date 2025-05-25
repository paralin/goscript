import * as $ from "@goscript/builtin/builtin.js";

export function LastIndexByte(s: Uint8Array, c: number): number {
	for (let i = $.len(s) - 1; i >= 0; i--) {
		if (s![i] == c) {
			return i
		}
	}
	return -1
}

export function LastIndexByteString(s: string, c: number): number {
	for (let i = $.len(s) - 1; i >= 0; i--) {
		if ($.indexString(s, i) == c) {
			return i
		}
	}
	return -1
}


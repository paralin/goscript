import * as $ from "@goscript/builtin/builtin.js";

export function Count(b: Uint8Array, c: number): number {
	let n = 0
	for (let _i = 0; _i < $.len(b); _i++) {
		const x = b![_i]
		{
			if (x == c) {
				n++
			}
		}
	}
	return n
}

export function CountString(s: string, c: number): number {
	let n = 0
	for (let i = 0; i < $.len(s); i++) {
		if ($.indexString(s, i) == c) {
			n++
		}
	}
	return n
}


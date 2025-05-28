import * as $ from "@goscript/builtin/builtin.js";
import { ValueOf } from "./type.js";
import { ValueError } from "./types.js";

// Simple swapper implementation using JavaScript array operations
export function Swapper(slice: any): (i: number, j: number) => void {
	const v = ValueOf(slice);
	
	if (v.Kind().valueOf() !== 23) { // Not a slice
		$.panic(new ValueError({Kind: v.Kind(), Method: "Swapper"}));
	}
	
	// For JavaScript arrays, we can use simple element swapping
	if (Array.isArray(slice)) {
		return (i: number, j: number) => {
			if (i >= 0 && j >= 0 && i < slice.length && j < slice.length) {
				const temp = slice[i];
				slice[i] = slice[j];
				slice[j] = temp;
			}
		};
	}
	
	// For other slice-like objects, try to access via indexing
	return (i: number, j: number) => {
		try {
			const temp = slice[i];
			slice[i] = slice[j];
			slice[j] = temp;
		} catch (e) {
			// Ignore errors for now
		}
	};
}

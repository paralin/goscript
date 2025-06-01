// Generated file based on type_declaration_receiver.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as $ from "@goscript/builtin/index.js";

export type FileMode = number;

export function FileMode_String(fm: FileMode): string {
	if (fm == 0) {
		return "none"
	}
	return "some"
}

export function FileMode_IsZero(fm: FileMode): boolean {
	return fm == 0
}

export function FileMode_Add(fm: FileMode, val: number): FileMode {
	return (fm + val as FileMode)
}


export type CustomString = string;

export function CustomString_Length(cs: CustomString): number {
	return $.len(cs)
}

export function CustomString_Upper(cs: CustomString): string {
	let s = cs
	let result = ""
	{
		const _runes = $.stringToRunes(s)
		for (let i = 0; i < _runes.length; i++) {
			const r = _runes[i]
			{
				if (r >= 97 && r <= 122) {
					result += $.runeOrStringToString(r - 32)
				}
				 else {
					result += $.runeOrStringToString(r)
				}
			}
		}
	}
	return result
}


export async function main(): Promise<void> {
	// Test FileMode type with receiver methods
	let fm: FileMode = 0
	console.log("FileMode(0).String():", FileMode_String(fm))
	console.log("FileMode(0).IsZero():", FileMode_IsZero(fm))

	// Test method calls on type conversion
	console.log("FileMode(5).String():", FileMode_String((5 as FileMode)))
	console.log("FileMode(5).IsZero():", FileMode_IsZero((5 as FileMode)))

	// Test method chaining
	let result = FileMode_Add((3 as FileMode), 2)
	console.log("FileMode(3).Add(2):", result)
	console.log("FileMode(3).Add(2).String():", FileMode_String(result))

	// Test CustomString type
	let cs: CustomString = "hello"
	console.log("CustomString(\"hello\").Length():", CustomString_Length(cs))
	console.log("CustomString(\"hello\").Upper():", CustomString_Upper(cs))

	// Test method calls on type conversion
	console.log("CustomString(\"world\").Length():", CustomString_Length(("world" as CustomString)))
	console.log("CustomString(\"world\").Upper():", CustomString_Upper(("world" as CustomString)))
}


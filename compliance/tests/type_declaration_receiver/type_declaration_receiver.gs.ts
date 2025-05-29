// Generated file based on type_declaration_receiver.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as $ from "@goscript/builtin/index.js";

export class FileMode {
	constructor(private _value: number) {}

	valueOf(): number {
		return this._value
	}

	toString(): string {
		return String(this._value)
	}

	static from(value: number): FileMode {
		return new FileMode(value)
	}

	// String returns a string representation of the FileMode
	public String(): string {
		const fm = this._value
		if (fm == 0) {
			return "none"
		}
		return "some"
	}

	// IsZero checks if the FileMode is zero
	public IsZero(): boolean {
		const fm = this._value
		return fm == 0
	}

	// Add adds a value to the FileMode
	public Add(val: number): FileMode {
		const fm = this._value
		return new FileMode(fm.valueOf() + val)
	}
}

export class CustomString {
	constructor(private _value: string) {}

	valueOf(): string {
		return this._value
	}

	toString(): string {
		return String(this._value)
	}

	static from(value: string): CustomString {
		return new CustomString(value)
	}

	// Length returns the length of the custom string
	public Length(): number {
		const cs = this._value
		return $.len(cs)
	}

	// Upper converts to uppercase
	public Upper(): string {
		const cs = this._value
		let s = cs
		let result = ""
		{
			const _runes = $.stringToRunes(s)
			for (let i = 0; i < _runes.length; i++) {
				const r = _runes[i]
				{
					if (r >= 97 && r <= 122) {
						result += $.runeOrStringToString(r - 32)
					} else {
						result += $.runeOrStringToString(r)
					}
				}
			}
		}
		return result
	}
}

export async function main(): Promise<void> {
	// Test FileMode type with receiver methods
	let fm: FileMode = new FileMode(0)
	console.log("FileMode(0).String():", fm.String())
	console.log("FileMode(0).IsZero():", fm.IsZero())

	// Test method calls on type conversion
	console.log("FileMode(5).String():", new FileMode(5)!.String())
	console.log("FileMode(5).IsZero():", new FileMode(5)!.IsZero())

	// Test method chaining
	let result = new FileMode(3)!.Add(2)
	console.log("FileMode(3).Add(2):", result.valueOf())
	console.log("FileMode(3).Add(2).String():", result.String())

	// Test CustomString type
	let cs: CustomString = new CustomString("hello")
	console.log("CustomString(\"hello\").Length():", cs.Length())
	console.log("CustomString(\"hello\").Upper():", cs.Upper())

	// Test method calls on type conversion
	console.log("CustomString(\"world\").Length():", new CustomString("world")!.Length())
	console.log("CustomString(\"world\").Upper():", new CustomString("world")!.Upper())
}


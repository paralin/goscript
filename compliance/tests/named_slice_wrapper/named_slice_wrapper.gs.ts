// Generated file based on named_slice_wrapper.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as $ from "@goscript/builtin/index.js";

import * as os from "@goscript/os/index.js"

export class ByName {
	constructor(private _value: $.Slice<os.FileInfo>) {}

	valueOf(): $.Slice<os.FileInfo> {
		return this._value
	}

	toString(): string {
		return String(this._value)
	}

	static from(value: $.Slice<os.FileInfo>): ByName {
		return new ByName(value)
	}

	public Len(): number {
		const a = this._value
		return $.len(a)
	}

	public Less(i: number, j: number): boolean {
		const a = this._value
		return a![i]!.Name() < a![j]!.Name()
	}

	public Swap(i: number, j: number): void {
		const a = this._value
		;[a![i], a![j]] = [a![j], a![i]]
	}
}

export async function main(): Promise<void> {
	// Create a ByName instance to test the wrapper
	let files: ByName = new ByName($.makeSlice<os.FileInfo>(2))
	console.log("Length:", files.Len())

	// Test type conversion
	let slice: $.Slice<os.FileInfo> = files.valueOf()
	console.log("Slice length:", $.len(slice))
}


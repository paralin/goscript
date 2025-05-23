// Generated file based on boxing_deref_struct.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as $ from "@goscript/builtin/builtin.js";

class MyStruct {
	public get MyInt(): number {
		return this._fields.MyInt.value
	}
	public set MyInt(value: number) {
		this._fields.MyInt.value = value
	}

	public _fields: {
		MyInt: $.Box<number>;
	}

	constructor(init?: Partial<{MyInt?: number}>) {
		this._fields = {
			MyInt: $.box(init?.MyInt ?? 0)
		}
	}

	public clone(): MyStruct {
		const cloned = new MyStruct()
		cloned._fields = {
			MyInt: $.box(this._fields.MyInt.value)
		}
		return cloned
	}

	// Register this type with the runtime type system
	static __typeInfo = $.registerStructType(
	  'MyStruct',
	  new MyStruct(),
	  [],
	  MyStruct,
	  {"MyInt": { kind: $.TypeKind.Basic, name: "number" }}
	);
}

export function main(): void {
	// We need to make sure we don't add .value for this
	let myStruct = new MyStruct({})
	;myStruct!.MyInt = 5
	console.log(myStruct!.MyInt)

	let myOtherStruct = new MyStruct({MyInt: 1})
	if ((myOtherStruct !== myStruct)) {
		console.log("expected not equal")
	}
}


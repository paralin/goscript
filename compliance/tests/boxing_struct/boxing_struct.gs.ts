// Generated file based on boxing_struct.go
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
	// 'val' is a value type, but its address is taken, so it should be boxed in TS.
	let val: $.Box<MyStruct> = $.box(new MyStruct({MyInt: 10}))
	let ptrToVal = val

	// Accessing pointer value, should use .value
	console.log("ptrToVal.MyInt:", ptrToVal!.value.MyInt)

	// Accessing pointer value, should use .value
	let myIntVal = ptrToVal!.value.MyInt
	console.log("myIntVal:", myIntVal)
}


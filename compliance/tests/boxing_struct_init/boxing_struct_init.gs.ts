// Generated file based on boxing_struct_init.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as $ from "@goscript/builtin";

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
	  new Set([]),
	  MyStruct
	);
}

export function main(): void {
	// Scenario 1: Value type that NeedsBoxed
	// 'val' is a value type, but its address is taken, so it should be boxed in TS.
	let val: $.Box<MyStruct> = $.box(new MyStruct({MyInt: 10}))
	let ptrToVal = val

	// Accessing field on boxed value type: Should generate val.value.MyInt
	val!.value.MyInt = 20

	// Scenario 2: Pointer type
	// We never take the address of ptr so it should not be boxed.
	let ptr = new MyStruct({MyInt: 30})

	// Accessing field on pointer type: Should generate ptr.MyInt
	ptr.MyInt = 40
	console.log("ptr.MyInt:", ptr.MyInt) // Expected: 40

	// Accessing pointer value, should use .value
	console.log("ptrToVal.MyInt:", ptrToVal!.value.MyInt)

	let myIntVal = ptrToVal!.value.MyInt
	console.log("myIntVal:", myIntVal)
}


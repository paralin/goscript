// Generated file based on struct_private_field_ptr.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as $ from "@goscript/builtin";

class MyStruct {
	public get myPrivate(): $.Box<number> | null {
		return this._fields.myPrivate.value
	}
	public set myPrivate(value: $.Box<number> | null) {
		this._fields.myPrivate.value = value
	}

	public _fields: {
		myPrivate: $.Box<$.Box<number> | null>;
	}

	constructor(init?: Partial<{myPrivate?: $.Box<number> | null}>) {
		this._fields = {
			myPrivate: $.box(init?.myPrivate ?? null)
		}
	}

	public clone(): MyStruct {
		const cloned = new MyStruct()
		cloned._fields = {
			myPrivate: $.box(this._fields.myPrivate.value)
		}
		return cloned
	}

	// Register this type with the runtime type system
	static __typeInfo = $.registerStructType(
	  'MyStruct',
	  new MyStruct(),
	  new Set([]),
	  MyStruct,
	  {myPrivate: "$.Box<number> | null"}
	);
}

export function main(): void {
	let myStruct = new MyStruct({myPrivate: null})
	let intVar: $.Box<number> = $.box(10)
	myStruct.myPrivate = intVar
	intVar!.value = 15
	console.log(myStruct.myPrivate!.value)
}


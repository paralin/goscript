// Generated file based on struct_private_field.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as $ from "@goscript/builtin";

class MyStruct {
	public get myPrivate(): number {
		return this._fields.myPrivate.value
	}
	public set myPrivate(value: number) {
		this._fields.myPrivate.value = value
	}

	public _fields: {
		myPrivate: $.Box<number>;
	}

	constructor(init?: Partial<{myPrivate?: number}>) {
		this._fields = {
			myPrivate: $.box(init?.myPrivate ?? 0)
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
	static __typeInfo = $.registerType(
	  'MyStruct',
	  $.TypeKind.Struct,
	  new MyStruct(),
	  new Set([]),
	  MyStruct
	);
}

export function main(): void {
	let myStruct = new MyStruct({myPrivate: 4})
	myStruct.myPrivate = 10
	console.log(myStruct.myPrivate);
}


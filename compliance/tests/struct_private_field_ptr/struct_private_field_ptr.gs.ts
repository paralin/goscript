// Generated file based on struct_private_field_ptr.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as $ from "@goscript/builtin/index.js";

export class MyStruct {
	public get myPrivate(): $.VarRef<number> | null {
		return this._fields.myPrivate.value
	}
	public set myPrivate(value: $.VarRef<number> | null) {
		this._fields.myPrivate.value = value
	}

	public _fields: {
		myPrivate: $.VarRef<$.VarRef<number> | null>;
	}

	constructor(init?: Partial<{myPrivate?: $.VarRef<number> | null}>) {
		this._fields = {
			myPrivate: $.varRef(init?.myPrivate ?? // DEBUG: Field myPrivate has type *int (*types.Pointer)
			// DEBUG: Using default zero value
			null)
		}
	}

	public clone(): MyStruct {
		const cloned = new MyStruct()
		cloned._fields = {
			myPrivate: $.varRef(this._fields.myPrivate.value)
		}
		return cloned
	}

	// Register this type with the runtime type system
	static __typeInfo = $.registerStructType(
	  'MyStruct',
	  new MyStruct(),
	  [],
	  MyStruct,
	  {"myPrivate": { kind: $.TypeKind.Pointer, elemType: { kind: $.TypeKind.Basic, name: "number" } }}
	);
}

export async function main(): Promise<void> {
	let myStruct = new MyStruct({myPrivate: null})
	let intVar: $.VarRef<number> = $.varRef(10)
	myStruct!.myPrivate = intVar
	intVar!.value = 15
	console.log(myStruct!.myPrivate!.value)
}


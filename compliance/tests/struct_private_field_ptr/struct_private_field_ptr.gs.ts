// Generated file based on struct_private_field_ptr.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as $ from "@goscript/builtin/index.js";

export class MyStruct extends $.GoStruct<{myPrivate: $.VarRef<number> | null}> {

	constructor(init?: Partial<{myPrivate?: $.VarRef<number> | null}>) {
		super({
			myPrivate: { type: Object, default: null }
		}, init)
	}

	public clone(): this {
		return super.clone()
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


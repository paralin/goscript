// Generated file based on struct_private_field.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as $ from "@goscript/builtin/index.js";

export class MyStruct extends $.GoStruct<{myPrivate: number}> {

	constructor(init?: Partial<{myPrivate?: number}>) {
		super({
			myPrivate: { type: Number, default: 0 }
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
	  {"myPrivate": { kind: $.TypeKind.Basic, name: "number" }}
	);
}

export async function main(): Promise<void> {
	let myStruct = new MyStruct({myPrivate: 4})
	myStruct!.myPrivate = 10
	console.log(myStruct!.myPrivate)
}


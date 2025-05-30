// Generated file based on varref_deref_struct.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as $ from "@goscript/builtin/index.js";

export class MyStruct extends $.GoStruct<{MyInt: number}> {

	constructor(init?: Partial<{MyInt?: number}>) {
		super({
			MyInt: { type: Number, default: 0 }
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
	  {"MyInt": { kind: $.TypeKind.Basic, name: "number" }}
	);
}

export async function main(): Promise<void> {
	// We need to make sure we don't add .value for this
	let myStruct = new MyStruct({})
	;myStruct!.MyInt = 5
	console.log(myStruct!.MyInt)

	let myOtherStruct = new MyStruct({MyInt: 1})
	if ((myOtherStruct !== myStruct)) {
		console.log("expected not equal")
	}
}


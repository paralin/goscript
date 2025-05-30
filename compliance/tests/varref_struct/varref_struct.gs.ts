// Generated file based on varref_struct.go
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
	// 'val' is a value type, but its address is taken, so it should be varrefed in TS.
	let val = $.varRef(new MyStruct({MyInt: 10}))
	let ptrToVal = val

	// Accessing pointer value, should use .value
	console.log("ptrToVal.MyInt:", ptrToVal!.value!.MyInt)

	// Accessing pointer value, should use .value
	let myIntVal = ptrToVal!.value!.MyInt
	console.log("myIntVal:", myIntVal)
}


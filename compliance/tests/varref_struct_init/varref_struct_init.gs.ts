// Generated file based on varref_struct_init.go
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
	// Scenario 1: Value type that NeedsVarRef
	// 'val' is a value type, but its address is taken, so it should be varrefed in TS.
	let val = $.varRef(new MyStruct({MyInt: 10}))
	let ptrToVal = val // Makes NeedsVarRefAccess(val) true

	// Accessing field on varrefed value type: Should generate val.value.MyInt
	val!.value.MyInt = 20

	// Scenario 2: Pointer type
	// We never take the address of ptr so it should not be varrefed.
	let ptr = new MyStruct({MyInt: 30})

	// Accessing field on pointer type: Should generate ptr.MyInt
	ptr!.MyInt = 40
	console.log("ptr.MyInt:", ptr!.MyInt) // Expected: 40

	// Accessing pointer value, should use .value
	console.log("ptrToVal.MyInt:", ptrToVal!.value!.MyInt)

	let myIntVal = ptrToVal!.value!.MyInt
	console.log("myIntVal:", myIntVal)
}


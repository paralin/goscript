// Generated file based on copy_independence.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as $ from "@goscript/builtin/index.js";

export class MyStruct extends $.GoStruct<{MyInt: number; MyString: string}> {

	constructor(init?: Partial<{MyInt?: number, MyString?: string}>) {
		super({
			MyInt: { type: Number, default: 0 },
			MyString: { type: String, default: "" }
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
	  {"MyInt": { kind: $.TypeKind.Basic, name: "number" }, "MyString": { kind: $.TypeKind.Basic, name: "string" }}
	);
}

export async function main(): Promise<void> {
	let structPointer = new MyStruct({MyInt: 4, MyString: "hello world"})
	let dereferencedStructCopy = structPointer!.clone()
	dereferencedStructCopy.MyString = "original dereferenced copy modified"
	let valueCopy1 = dereferencedStructCopy.clone()
	valueCopy1.MyString = "value copy 1"
	let valueCopy2 = dereferencedStructCopy.clone()
	valueCopy2.MyString = "value copy 2"
	let pointerCopy = structPointer

	// === Verifying Copy Independence ===
	// Expected: "hello world"
	console.log("pointerCopy (points to original structPointer): Expected: hello world, Actual: " + pointerCopy!.MyString)
	// Expected: "original dereferenced copy modified"
	console.log("dereferencedStructCopy (modified after copies were made): Expected: original dereferenced copy modified, Actual: " + dereferencedStructCopy.MyString)
	// Expected: "value copy 1"
	console.log("valueCopy1: Expected: value copy 1, Actual: " + valueCopy1.MyString)
	// Expected: "value copy 2"
	console.log("valueCopy2: Expected: value copy 2, Actual: " + valueCopy2.MyString)
}


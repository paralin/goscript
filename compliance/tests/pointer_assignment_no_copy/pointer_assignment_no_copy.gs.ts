// Generated file based on pointer_assignment_no_copy.go
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
	let original = new MyStruct({MyInt: 10, MyString: "original"})

	// === Pointer Assignment (No Copy) ===
	// Assigning a pointer variable to another pointer variable.
	let pointerCopy = original

	// Modify the struct through the original pointer.
	original!.MyString = "modified original"

	// The change should be reflected when accessing through the copied pointer.
	// Expected: "modified original"
	console.log("Pointer copy value: Expected: modified original, Actual: " + pointerCopy!.MyString)

	// Modify the struct through the copied pointer.
	pointerCopy!.MyInt = 20

	// The change should be reflected when accessing through the original pointer.
	// Expected: 20
	console.log("Original value after pointer copy modification: Expected: 20, Actual:", original!.MyInt)
}


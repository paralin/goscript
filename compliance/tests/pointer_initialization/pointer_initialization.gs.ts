// Generated file based on pointer_initialization.go
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
	// === Pointer Initialization ===
	// Create a pointer to a MyStruct instance using a composite literal.
	let structPointer = new MyStruct({MyInt: 4, MyString: "hello world"})
	// Expected: "hello world"
	console.log("Initial MyString (via pointer): Expected: hello world, Actual: " + structPointer!.MyString)
}


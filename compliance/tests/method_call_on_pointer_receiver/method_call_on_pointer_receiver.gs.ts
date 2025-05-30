// Generated file based on method_call_on_pointer_receiver.go
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

	// GetMyString returns the MyString field.
	public GetMyString(): string {
		const m = this
		return m.MyString
	}

	// Register this type with the runtime type system
	static __typeInfo = $.registerStructType(
	  'MyStruct',
	  new MyStruct(),
	  [{ name: "GetMyString", args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: "string" } }] }],
	  MyStruct,
	  {"MyInt": { kind: $.TypeKind.Basic, name: "number" }, "MyString": { kind: $.TypeKind.Basic, name: "string" }}
	);
}

export async function main(): Promise<void> {
	let structPointer = new MyStruct({MyInt: 4, MyString: "hello world"})
	// === Method Call on Pointer Receiver ===
	// Calling a method with a pointer receiver (*MyStruct) using a pointer variable.
	console.log("Method call on pointer (structPointer): Expected: hello world, Actual: " + structPointer!.GetMyString())
}


// Generated file based on method_call_on_pointer_receiver.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as goscript from "@goscript/builtin";

class MyStruct {
	public MyInt: number
	public MyString: string

	constructor(init?: Partial<{MyInt?: number, MyString?: string}>) {
		this.MyInt = init?.MyInt ?? 0
		this.MyString = init?.MyString ?? ""
	}

	public clone(): MyStruct {
		return new MyStruct({
			MyInt: this.MyInt,
			MyString: this.MyString,
		})
	}

	// GetMyString returns the MyString field.
	public GetMyString(): string {
		const m = this
		return m.MyString
	}

	// Register this type with the runtime type system
	static __typeInfo = goscript.registerType(
	  'MyStruct',
	  goscript.TypeKind.Struct,
	  new MyStruct(),
	  new Set(['GetMyString']),
	  MyStruct
	);
}

export function main(): void {
	let structPointer: goscript.Box<MyStruct> | null = goscript.box(new MyStruct({MyInt: 4, MyString: "hello world"}))
	// === Method Call on Pointer Receiver ===
	// Calling a method with a pointer receiver (*MyStruct) using a pointer variable.
	console.log("Method call on pointer (structPointer): Expected: hello world, Actual: " + structPointer.GetMyString())
}


// Generated file based on method_call_on_pointer_receiver.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as goscript from "@goscript/builtin";

class MyStruct {
	public MyInt: number = 0;
	public MyString: string = "";
	
	// GetMyString returns the MyString field.
	public GetMyString(): string {
		const m = this
		return m.MyString
	}
	
	constructor(init?: Partial<MyStruct>) { if (init) Object.assign(this, init as any); }
	public clone(): MyStruct { return Object.assign(Object.create(MyStruct.prototype) as MyStruct, this); }
	
	// Register this type with the runtime type system
	static __typeInfo = goscript.registerType(
	  'MyStruct',
	  goscript.TypeKind.Struct,
	  new MyStruct(),
	  new Set(['GetMyString']),
	  MyStruct
	);
}

export async function main(): Promise<void> {
	let structPointer = new MyStruct({MyInt: 4, MyString: "hello world"})
	// === Method Call on Pointer Receiver ===
	// Calling a method with a pointer receiver (*MyStruct) using a pointer variable.
	console.log("Method call on pointer (structPointer): Expected: hello world, Actual: " + structPointer.GetMyString())
}


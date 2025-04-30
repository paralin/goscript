// Generated file based on method_call_on_pointer_receiver.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as goscript from "@goscript/builtin";

class MyStruct {
	public MyInt: number = 0;
	public MyString: string = "";

	// GetMyString returns the MyString field.
	public GetMyString(): string {
		const m = this
		return this.MyString
	}

	constructor(init?: Partial<MyStruct>) { if (init) Object.assign(this, init as any); }
	public clone(): MyStruct { return Object.assign(Object.create(MyStruct.prototype) as MyStruct, this); }

	// Type information for runtime type system
	static __typeInfo: goscript.StructTypeInfo = {
	  kind: goscript.GoTypeKind.Struct,
	  name: 'MyStruct',
	  zero: new MyStruct(),
	  fields: [], // Fields will be added in a future update
	  methods: [],
	  ctor: MyStruct
	};

}

export async function main(): Promise<void> {
	let structPointer = goscript.makePtr(new MyStruct({MyInt: 4, MyString: "hello world"}))
	// === Method Call on Pointer Receiver ===
	// Calling a method with a pointer receiver (*MyStruct) using a pointer variable.
	console.log("Method call on pointer (structPointer): Expected: hello world, Actual: " + (structPointer)?._ptr?.GetMyString())
}


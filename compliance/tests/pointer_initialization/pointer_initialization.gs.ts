// Generated file based on pointer_initialization.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as goscript from "@go/builtin";

class MyStruct {
	public MyInt: number = 0;
	public MyString: string = "";
	private myBool: boolean = false;
	
	constructor(init?: Partial<MyStruct>) { if (init) Object.assign(this, init as any); }
	public clone(): MyStruct { return Object.assign(Object.create(MyStruct.prototype) as MyStruct, this); }
}

export async function main(): Promise<void> {
	// === Pointer Initialization ===
	// Create a pointer to a MyStruct instance using a composite literal.
	let structPointer = new MyStruct({ MyInt: 4, MyString: "hello world" })
	// Expected: "hello world"
	console.log("Initial MyString (via pointer): Expected: hello world, Actual: " + structPointer.MyString)
}


// Generated file based on simple_deref_assignment.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as goscript from "@go/builtin";

class MyStruct {
	public MyInt: number = 0;
	public MyString: string = "";
	private myBool: boolean = false;
	
	constructor(init?: Partial<MyStruct>) { if (init) Object.assign(this, init as any); }
	public clone(): MyStruct { return Object.assign(Object.create(MyStruct.prototype) as MyStruct, this); }
}

export function main(): void {
	let structPointer = new MyStruct({ MyInt: 4, MyString: "hello world" })
	// === Simple Dereference Assignment (Value Copy) ===
	let simpleDereferencedCopy = structPointer.clone()
	// Modifying the copy does not affect the original struct pointed to by structPointer.
	simpleDereferencedCopy.MyString = "modified dereferenced copy"
	// Expected: "hello world"
	console.log("Original structPointer after modifying simpleDereferencedCopy: Expected: hello world, Actual: " + structPointer.MyString)
	// Expected: "modified dereferenced copy"
	console.log("Simple Dereferenced Copy: Expected: modified dereferenced copy, Actual: " + simpleDereferencedCopy.MyString)
}


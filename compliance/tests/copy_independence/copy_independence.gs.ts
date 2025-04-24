// Generated file based on copy_independence.go
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
	// Setup from previous steps (simplified for this test)
	let structPointer = new MyStruct({ MyInt: 4, MyString: "hello world" })
	let dereferencedStructCopy = structPointer.clone()
	dereferencedStructCopy.MyString = "original dereferenced copy modified"
	let valueCopy1 = dereferencedStructCopy.clone()
	valueCopy1.MyString = "value copy 1"
	let valueCopy2 = dereferencedStructCopy.clone()
	valueCopy2.MyString = "value copy 2"
	let pointerCopy = structPointer
	
	// === Verifying Copy Independence ===
	// Expected: "hello world"
	console.log("pointerCopy (points to original structPointer): Expected: hello world, Actual: " + pointerCopy.MyString)
	// Expected: "original dereferenced copy modified"
	console.log("dereferencedStructCopy (modified after copies were made): Expected: original dereferenced copy modified, Actual: " + dereferencedStructCopy.MyString)
	// Expected: "value copy 1"
	console.log("valueCopy1: Expected: value copy 1, Actual: " + valueCopy1.MyString)
	// Expected: "value copy 2"
	console.log("valueCopy2: Expected: value copy 2, Actual: " + valueCopy2.MyString)
}


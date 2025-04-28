// Generated file based on value_type_copy_behavior.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as goscript from "@goscript/builtin";

class MyStruct {
	public MyInt: number = 0;
	public MyString: string = "";
	
	constructor(init?: Partial<MyStruct>) { if (init) Object.assign(this, init as any); }
	public clone(): MyStruct { return Object.assign(Object.create(MyStruct.prototype) as MyStruct, this); }
	
	// Register this type with the runtime type system
	static __typeInfo = goscript.registerType(
	  'MyStruct',
	  goscript.TypeKind.Struct,
	  new MyStruct(),
	  new Set([]),
	  MyStruct
	);
}

export async function main(): Promise<void> {
	let dereferencedStructCopy = new MyStruct({MyString: "original"})
	// === Value-Type Copy Behavior ===
	// Assigning a struct (value type) creates independent copies.
	let valueCopy1 = dereferencedStructCopy.clone()
	let valueCopy2 = dereferencedStructCopy.clone()
	let pointerCopy = dereferencedStructCopy
	// Modifications to one copy do not affect others or the original.
	valueCopy1.MyString = "value copy 1"
	dereferencedStructCopy.MyString = "original dereferenced copy modified" // Modify the source of the copies
	valueCopy2.MyString = "value copy 2"
	// Expected: "value copy 1"
	console.log("valueCopy1: Expected: value copy 1, Actual: " + valueCopy1.MyString)
	// Expected: "original dereferenced copy modified"
	console.log("dereferencedStructCopy (modified after copies were made): Expected: original dereferenced copy modified, Actual: " + dereferencedStructCopy.MyString)
	// Expected: "value copy 2"
	console.log("valueCopy2: Expected: value copy 2, Actual: " + valueCopy2.MyString)
}


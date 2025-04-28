// Generated file based on pointer_composite_literal_assignment.go
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
	// === Pointer Composite Literal Assignment ===
	// Creating a pointer to a struct directly using a composite literal with &
	let structPointer = new MyStruct({MyInt: 42, MyString: "composite literal pointer"})

	// Access fields through the pointer
	// Expected: 42
	console.log("MyInt via pointer: Expected: 42, Actual:", structPointer.MyInt)
	// Expected: "composite literal pointer"
	console.log("MyString via pointer: Expected: composite literal pointer, Actual: " + structPointer.MyString)

	// Modify through the pointer
	structPointer.MyInt = 99
	// Expected: 99
	console.log("MyInt after modification: Expected: 99, Actual:", structPointer.MyInt)
}


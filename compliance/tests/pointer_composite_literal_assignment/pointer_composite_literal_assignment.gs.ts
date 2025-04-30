// Generated file based on pointer_composite_literal_assignment.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as goscript from "@goscript/builtin";

class MyStruct {
	public MyInt: number = 0;
	public MyString: string = "";

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
	// === Pointer Composite Literal Assignment ===
	// Creating a pointer to a struct directly using a composite literal with &
	let structPointer = goscript.makePtr(new MyStruct({MyInt: 42, MyString: "composite literal pointer"}))

	// Access fields through the pointer
	// Expected: 42
	console.log("MyInt via pointer: Expected: 42, Actual:", (structPointer)?._ptr?.MyInt)
	// Expected: "composite literal pointer"
	console.log("MyString via pointer: Expected: composite literal pointer, Actual: " + (structPointer)?._ptr?.MyString)

	// Modify through the pointer
	(structPointer)?._ptr?.MyInt = 99
	// Expected: 99
	console.log("MyInt after modification: Expected: 99, Actual:", (structPointer)?._ptr?.MyInt)
}


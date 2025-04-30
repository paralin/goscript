// Generated file based on pointer_initialization.go
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
	// === Pointer Initialization ===
	// Create a pointer to a MyStruct instance using a composite literal.
	let structPointer = new MyStruct({MyInt: 4, MyString: "hello world"})
	// Expected: "hello world"
	console.log("Initial MyString (via pointer): Expected: hello world, Actual: " + structPointer?.MyString)
}


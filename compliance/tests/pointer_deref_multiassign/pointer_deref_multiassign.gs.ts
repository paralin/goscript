// Generated file based on pointer_deref_multiassign.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as goscript from "@goscript/builtin";

class MyStruct {
	public MyInt: number = 0;
	public MyString: string = "";
	public myBool: boolean = false;

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
	// === Pointer Dereference and Multi-Assignment ===
	// Dereference structPointer to get a copy of the struct.
	// Also demonstrates multi-variable assignment and the use of the blank identifier '_'.
	let dereferencedStructCopy = (structPointer)?._ptr.clone()
	let unusedString = "hello" // testing _ set
}


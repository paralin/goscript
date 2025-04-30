// Generated file based on struct_pointer_interface_fields.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as goscript from "@goscript/builtin";

interface MyInterface {
	Method(): void;
}

// Define interface type information
const MyInterface__typeInfo: goscript.InterfaceTypeInfo = {
  kind: goscript.GoTypeKind.Interface,
  name: 'MyInterface',
  zero: null,
  methods: [{ name: 'Method', params: [], results: [] }]
};

class MyStruct {
	public PointerField: goscript.Ptr<number> = null;
	public InterfaceField: MyInterface | null = null;

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
	let s = new MyStruct({})
	console.log(s.PointerField)
	console.log(s.InterfaceField)

	let i = 10
	s.PointerField = goscript.makePtr(i)
	console.log(s.PointerField)

	let mi: MyInterface | null = null;
	s.InterfaceField = (goscript.isAssignable(mi, MyInterface__typeInfo) ? mi : null)
	console.log(s.InterfaceField)
}


// Generated file based on struct_pointer_interface_fields.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as goscript from "@goscript/builtin";

interface MyInterface {
	Method(): void;
}

// Register this interface with the runtime type system
const MyInterface__typeInfo = goscript.registerType(
  'MyInterface',
  goscript.GoTypeKind.Interface,
  null,
  [{ name: 'Method', params: [], results: [] }],
  undefined
);

class MyStruct {
	public PointerField: goscript.Ptr<number> = null;
	public InterfaceField: MyInterface | null = null;

	constructor(init?: Partial<MyStruct>) { if (init) Object.assign(this, init as any); }
	public clone(): MyStruct { return Object.assign(Object.create(MyStruct.prototype) as MyStruct, this); }

	// Type information for runtime type system
	static __typeInfo = goscript.registerType(
	  'MyStruct',
	  goscript.GoTypeKind.Struct,
	  new MyStruct(),
	  [],
	  MyStruct
	);

}

// Register pointer type
const MyStruct__ptrTypeInfo = goscript.registerType(
  '*MyStruct',
  goscript.GoTypeKind.Pointer,
  null,
  [],
  MyStruct.__typeInfo
);

export async function main(): Promise<void> {
	let s = new MyStruct({})
	console.log(s.PointerField)
	console.log(s.InterfaceField)

	let i = 10
	s.PointerField = new goscript.GoPtr(i)
	console.log(s.PointerField)

	let mi: MyInterface | null = null;
	s.InterfaceField = (goscript.isAssignable(mi, goscript.getType('MyInterface')!) ? mi : null)
	console.log(s.InterfaceField)
}


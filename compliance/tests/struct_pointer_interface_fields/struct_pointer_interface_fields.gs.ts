// Generated file based on struct_pointer_interface_fields.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as goscript from "@goscript/builtin";

interface MyInterface {
	Method(): void;
}

// Register this interface with the runtime type system
const MyInterface__typeInfo = goscript.registerType(
  'MyInterface',
  goscript.TypeKind.Interface,
  null,
  new Set(['Method']),
  undefined
);

class MyStruct {
	public PointerField: number | null = null;
	public InterfaceField: MyInterface | null = null;

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
	let s = new MyStruct({})
	console.log(s.PointerField)
	console.log(s.InterfaceField)

	let i = 10
	s.PointerField = i
	console.log(s.PointerField)

	let mi: MyInterface | null = null;
	s.InterfaceField = mi
	console.log(s.InterfaceField)
}


// Generated file based on interface_to_interface_type_assertion.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as goscript from "@goscript/builtin";

interface MyInterface {
	Method1(): number;
}

// Register this interface with the runtime type system
const MyInterface__typeInfo = goscript.registerType(
  'MyInterface',
  goscript.TypeKind.Interface,
  null,
  new Set(['Method1']),
  undefined
);

class MyStruct {
	public Value: number = 0;
	
	public Method1(): number {
		const m = this
		return m.Value
	}
	
	constructor(init?: Partial<MyStruct>) { if (init) Object.assign(this, init as any); }
	public clone(): MyStruct { return Object.assign(Object.create(MyStruct.prototype) as MyStruct, this); }
	
	// Register this type with the runtime type system
	static __typeInfo = goscript.registerType(
	  'MyStruct',
	  goscript.TypeKind.Struct,
	  new MyStruct(),
	  new Set(['Method1']),
	  MyStruct
	);
}

interface MyOtherInterface {
	Method1(): number;
}

// Register this interface with the runtime type system
const MyOtherInterface__typeInfo = goscript.registerType(
  'MyOtherInterface',
  goscript.TypeKind.Interface,
  null,
  new Set(['Method1']),
  undefined
);

export async function main(): Promise<void> {
	let i: MyInterface | null = null;
	let s = new MyStruct({Value: 10})
	i = s.clone()
	
	let { ok: ok } = goscript.typeAssert<MyOtherInterface>(i, 'MyOtherInterface')
	if (ok) {
		console.log("Type assertion successful")
	} else {
		console.log("Type assertion failed")
	}
}


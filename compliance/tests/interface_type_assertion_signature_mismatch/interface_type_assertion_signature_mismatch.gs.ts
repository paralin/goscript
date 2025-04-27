// Generated file based on interface_type_assertion_signature_mismatch.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as goscript from "@go/builtin";

interface InterfaceA {
	DoSomething(_p0: number): string;
}

// Register this interface with the runtime type system
const InterfaceA__typeInfo = goscript.registerType(
  'InterfaceA',
  goscript.TypeKind.Interface,
  null,
  new Set(['DoSomething']),
  undefined
);

interface InterfaceB {
	DoSomething(_p0: string): string;
}

// Register this interface with the runtime type system
const InterfaceB__typeInfo = goscript.registerType(
  'InterfaceB',
  goscript.TypeKind.Interface,
  null,
  new Set(['DoSomething']),
  undefined
);

class MyStruct {
	public Name: string = "";
	
	public DoSomething(val: number): string {
		const m = this
		console.log("MyStruct.DoSomething called")
		return "done"
	}
	
	constructor(init?: Partial<MyStruct>) { if (init) Object.assign(this, init as any); }
	public clone(): MyStruct { return Object.assign(Object.create(MyStruct.prototype) as MyStruct, this); }
	
	// Register this type with the runtime type system
	static __typeInfo = goscript.registerType(
	  'MyStruct',
	  goscript.TypeKind.Struct,
	  new MyStruct(),
	  new Set(['DoSomething']),
	  MyStruct
	);
}

export async function main(): Promise<void> {
	let a: InterfaceA;
	let s = new MyStruct({ Name: "TestStruct" })
	a = s.clone()
	
	// This assertion should fail at runtime because InterfaceB.DoSomething has a different signature
	let { ok: ok } = goscript.typeAssert<InterfaceB>(a, 'InterfaceB')
	if (ok) {
		console.log("Type assertion to InterfaceB successful")
	} else {
		console.log("Type assertion to InterfaceB failed")
	}
	
	// This assertion should succeed
	({ ok: ok } = goscript.typeAssert<InterfaceA>(a, 'InterfaceA'))
	if (ok) {
		console.log("Type assertion to InterfaceA successful")
	} else {
		console.log("Type assertion to InterfaceA failed")
	}
	
	// Call the method on the asserted interface to ensure the generated code works
	// This is not strictly necessary for the type assertion test but good practice
	// if the assertion to InterfaceA succeeds.
	{let { value: assertedA, ok: ok } = goscript.typeAssert<InterfaceA>(a, 'InterfaceA')
		if (ok) {
			assertedA.DoSomething(123)
		}
	}}


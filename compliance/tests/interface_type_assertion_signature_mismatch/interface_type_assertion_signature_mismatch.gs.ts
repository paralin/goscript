// Generated file based on interface_type_assertion_signature_mismatch.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as goscript from "@goscript/builtin";

interface InterfaceA {
	DoSomething(_p0: number): string;
}

// Define interface type information
const InterfaceA__typeInfo: goscript.InterfaceTypeInfo = {
  kind: goscript.GoTypeKind.Interface,
  name: 'InterfaceA',
  zero: null,
  methods: [{ name: 'DoSomething', params: [{ type: goscript.INT_TYPE, isVariadic: false }], results: [{ type: goscript.STRING_TYPE }] }]
};

interface InterfaceB {
	DoSomething(_p0: string): string;
}

// Define interface type information
const InterfaceB__typeInfo: goscript.InterfaceTypeInfo = {
  kind: goscript.GoTypeKind.Interface,
  name: 'InterfaceB',
  zero: null,
  methods: [{ name: 'DoSomething', params: [{ type: goscript.STRING_TYPE, isVariadic: false }], results: [{ type: goscript.STRING_TYPE }] }]
};

class MyStruct {
	public Name: string = "";

	public DoSomething(val: number): string {
		const m = this
		console.log("MyStruct.DoSomething called")
		return "done"
	}

	constructor(init?: Partial<MyStruct>) { if (init) Object.assign(this, init as any); }
	public clone(): MyStruct { return Object.assign(Object.create(MyStruct.prototype) as MyStruct, this); }

	// Type information for runtime type system
	static __typeInfo: goscript.StructTypeInfo = {
	  kind: goscript.GoTypeKind.Struct,
	  name: 'MyStruct',
	  zero: new MyStruct(),
	  fields: [], // Fields will be added in a future update
	  methods: [{ name: 'DoSomething', params: [{ type: goscript.INT_TYPE, isVariadic: false }], results: [{ type: goscript.STRING_TYPE }] }],
	  ctor: MyStruct
	};

}

export async function main(): Promise<void> {
	let a: any | null = null;
	let s = new MyStruct({Name: "TestStruct"})
	a = (goscript.isAssignable(s, goscript.EMPTY_INTERFACE_TYPE) ? s : null)

	// This assertion should fail at runtime because InterfaceB.DoSomething has a different signature
	let { ok: ok } = goscript.typeAssert<InterfaceB>(a, InterfaceB__typeInfo)
	if (ok) {
		console.log("Type assertion to InterfaceB successful")
	} else {
		console.log("Type assertion to InterfaceB failed")
	}

	// This assertion should succeed
	({ ok: ok } = goscript.typeAssert<InterfaceA>(a, InterfaceA__typeInfo))
	if (ok) {
		console.log("Type assertion to InterfaceA successful")
	} else {
		console.log("Type assertion to InterfaceA failed")
	}

	// Call the method on the asserted interface to ensure the generated code works
	// This is not strictly necessary for the type assertion test but good practice
	// if the assertion to InterfaceA succeeds.
	{let { value: assertedA, ok: ok } = goscript.typeAssert<InterfaceA>(a, InterfaceA__typeInfo)
		if (ok) {
			assertedA.DoSomething(123)
		}
	}}


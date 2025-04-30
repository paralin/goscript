// Generated file based on interface_to_interface_type_assertion.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as goscript from "@goscript/builtin";

interface MyInterface {
	Method1(): number;
}

// Define interface type information
const MyInterface__typeInfo: goscript.InterfaceTypeInfo = {
  kind: goscript.GoTypeKind.Interface,
  name: 'MyInterface',
  zero: null,
  methods: [{ name: 'Method1', params: [], results: [{ type: goscript.INT_TYPE }] }]
};

class MyStruct {
	public Value: number = 0;

	public Method1(): number {
		const m = this
		return m.Value
	}

	constructor(init?: Partial<MyStruct>) { if (init) Object.assign(this, init as any); }
	public clone(): MyStruct { return Object.assign(Object.create(MyStruct.prototype) as MyStruct, this); }

	// Type information for runtime type system
	static __typeInfo: goscript.StructTypeInfo = {
	  kind: goscript.GoTypeKind.Struct,
	  name: 'MyStruct',
	  zero: new MyStruct(),
	  fields: [], // Fields will be added in a future update
	  methods: [{ name: 'Method1', params: [], results: [{ type: goscript.INT_TYPE }] }],
	  ctor: MyStruct
	};

}

interface MyOtherInterface {
	Method1(): number;
}

// Define interface type information
const MyOtherInterface__typeInfo: goscript.InterfaceTypeInfo = {
  kind: goscript.GoTypeKind.Interface,
  name: 'MyOtherInterface',
  zero: null,
  methods: [{ name: 'Method1', params: [], results: [{ type: goscript.INT_TYPE }] }]
};

export async function main(): Promise<void> {
	let i: MyInterface | null = null;
	let s = new MyStruct({Value: 10})
	i = (goscript.isAssignable(s, MyInterface__typeInfo) ? s : null)

	let { ok: ok } = goscript.typeAssert<MyOtherInterface>(i, MyOtherInterface__typeInfo)
	if (ok) {
		console.log("Type assertion successful")
	} else {
		console.log("Type assertion failed")
	}
}


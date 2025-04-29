// Generated file based on interface_type_assertion.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as goscript from "@goscript/builtin";

interface MyInterface {
	Method1(): number;
}

// Register this interface with the runtime type system
const MyInterface__typeInfo = goscript.registerType(
  'MyInterface',
  goscript.GoTypeKind.Interface,
  null,
  [{ name: 'Method1', params: [], results: [{ type: goscript.getType('int')! }] }],
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

	// Type information for runtime type system
	static __typeInfo = goscript.registerType(
	  'MyStruct',
	  goscript.GoTypeKind.Struct,
	  new MyStruct(),
	  [{ name: 'Method1', params: [], results: [{ type: goscript.getType('int')! }] }],
	  MyStruct
	);

}

export async function main(): Promise<void> {
	let i: MyInterface | null = null;
	let s = new MyStruct({Value: 10})
	i = (goscript.isAssignable(s, goscript.getType('MyInterface')!) ? s : null)

	let { ok: ok } = goscript.typeAssert<MyStruct>(i, 'MyStruct')
	if (ok) {
		console.log("Type assertion successful")
	} else {
		console.log("Type assertion failed")
	}

	// try a second time since this generates something different when using = and not :=
	({ ok: ok } = goscript.typeAssert<goscript.Ptr<MyStruct>>(i, '*MyStruct'))

	// expected
	if (ok) {
		console.log("Type assertion successful")
	} else {
		// expected
		console.log("Type assertion failed")
	}
}


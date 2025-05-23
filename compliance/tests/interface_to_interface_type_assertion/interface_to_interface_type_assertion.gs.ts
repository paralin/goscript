// Generated file based on interface_to_interface_type_assertion.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as $ from "@goscript/builtin/builtin.js";

type MyInterface = null | {
	Method1(): number
}

$.registerInterfaceType(
  'MyInterface',
  null, // Zero value for interface is null
  [{ name: "Method1", args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: "number" } }] }]
);

class MyStruct {
	public get Value(): number {
		return this._fields.Value.value
	}
	public set Value(value: number) {
		this._fields.Value.value = value
	}

	public _fields: {
		Value: $.Box<number>;
	}

	constructor(init?: Partial<{Value?: number}>) {
		this._fields = {
			Value: $.box(init?.Value ?? 0)
		}
	}

	public clone(): MyStruct {
		const cloned = new MyStruct()
		cloned._fields = {
			Value: $.box(this._fields.Value.value)
		}
		return cloned
	}

	public Method1(): number {
		const m = this
		return m.Value
	}

	// Register this type with the runtime type system
	static __typeInfo = $.registerStructType(
	  'MyStruct',
	  new MyStruct(),
	  [{ name: "Method1", args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: "number" } }] }],
	  MyStruct,
	  {"Value": { kind: $.TypeKind.Basic, name: "number" }}
	);
}

type MyOtherInterface = null | {
	Method1(): number
}

$.registerInterfaceType(
  'MyOtherInterface',
  null, // Zero value for interface is null
  [{ name: "Method1", args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: "number" } }] }]
);

export function main(): void {
	let i: MyInterface = null
	let s = new MyStruct({Value: 10})
	i = s.clone()

	let { ok: ok } = $.typeAssert<MyOtherInterface>(i, 'MyOtherInterface')
	if (ok) {
		console.log("Type assertion successful")
	} else {
		console.log("Type assertion failed")
	}
}


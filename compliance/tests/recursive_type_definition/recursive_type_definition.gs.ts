// Generated file based on recursive_type_definition.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as $ from "@goscript/builtin/builtin.js";

type A = null | {
	MethodA(a: A): void
}

$.registerInterfaceType(
  'A',
  null, // Zero value for interface is null
  [{ name: "MethodA", args: [{ name: "a", type: "A" }], returns: [] }]
);

class B {
	public _fields: {
	}

	constructor(init?: Partial<{}>) {
		this._fields = {}
	}

	public clone(): B {
		const cloned = new B()
		cloned._fields = {
		}
		return cloned
	}

	public MethodB(valB: B | null): void {
		const b = this
	}

	// Register this type with the runtime type system
	static __typeInfo = $.registerStructType(
	  'B',
	  new B(),
	  [{ name: "MethodB", args: [{ name: "valB", type: { kind: $.TypeKind.Pointer, elemType: "B" } }], returns: [] }],
	  B,
	  {}
	);
}

type C = null | {
	MethodC(d: D): void
}

$.registerInterfaceType(
  'C',
  null, // Zero value for interface is null
  [{ name: "MethodC", args: [{ name: "d", type: "D" }], returns: [] }]
);

type D = null | {
	MethodD(c: C): void
}

$.registerInterfaceType(
  'D',
  null, // Zero value for interface is null
  [{ name: "MethodD", args: [{ name: "c", type: "C" }], returns: [] }]
);

export function main(): void {
	console.log("recursive type definition test")
}


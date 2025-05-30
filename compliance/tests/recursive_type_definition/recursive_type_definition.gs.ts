// Generated file based on recursive_type_definition.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as $ from "@goscript/builtin/index.js";

export type A = null | {
	MethodA(a: A): void
}

$.registerInterfaceType(
  'A',
  null, // Zero value for interface is null
  [{ name: "MethodA", args: [{ name: "a", type: "A" }], returns: [] }]
);

export class B extends $.GoStruct<{}> {

	constructor(init?: Partial<{}>) {
		super({
		}, init)
	}

	public clone(): this {
		return super.clone()
	}

	public MethodB(valB: B | null): void {
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

export type C = null | {
	MethodC(d: D): void
}

$.registerInterfaceType(
  'C',
  null, // Zero value for interface is null
  [{ name: "MethodC", args: [{ name: "d", type: "D" }], returns: [] }]
);

export type D = null | {
	MethodD(c: C): void
}

$.registerInterfaceType(
  'D',
  null, // Zero value for interface is null
  [{ name: "MethodD", args: [{ name: "c", type: "C" }], returns: [] }]
);

export async function main(): Promise<void> {
	console.log("recursive type definition test")
}


// Generated file based on interface_type_assertion.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as $ from "@goscript/builtin/index.js";

export type MyInterface = null | {
	Method1(): number
}

$.registerInterfaceType(
  'MyInterface',
  null, // Zero value for interface is null
  [{ name: "Method1", args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: "number" } }] }]
);

export class MyStruct extends $.GoStruct<{Value: number}> {

	constructor(init?: Partial<{Value?: number}>) {
		super({
			Value: { type: Number, default: 0 }
		}, init)
	}

	public clone(): this {
		return super.clone()
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

export async function main(): Promise<void> {
	let i: MyInterface = null
	let s = new MyStruct({Value: 10})
	i = s.clone()

	let { ok: ok } = $.typeAssert<MyStruct>(i, 'MyStruct')
	if (ok) {
		console.log("Type assertion successful")
	} else {
		console.log("Type assertion failed")
	}

	// try a second time since this generates something different when using = and not :=
	({ ok: ok } = $.typeAssert<MyStruct | null>(i, {kind: $.TypeKind.Pointer, elemType: 'MyStruct'}))

	// expected
	if (ok) {
		console.log("Type assertion successful")
	} else {
		// expected
		console.log("Type assertion failed")
	}

	// assign result to a variable
	let { value: val, ok: ok2 } = $.typeAssert<MyStruct>(i, 'MyStruct')
	if (!ok2) {
		console.log("type assertion failed")
	} else {
		console.log("type assertion success", val.Value)
	}
}


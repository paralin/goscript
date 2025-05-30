// Generated file based on type_assertion_duplicate_vars.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as $ from "@goscript/builtin/index.js";

export type Interface = null | {
	Method(): string
}

$.registerInterfaceType(
  'Interface',
  null, // Zero value for interface is null
  [{ name: "Method", args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: "string" } }] }]
);

export class ConcreteA extends $.GoStruct<{}> {

	constructor(init?: Partial<{}>) {
		super({
		}, init)
	}

	public clone(): this {
		return super.clone()
	}

	public Method(): string {
		return "A"
	}

	// Register this type with the runtime type system
	static __typeInfo = $.registerStructType(
	  'ConcreteA',
	  new ConcreteA(),
	  [{ name: "Method", args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: "string" } }] }],
	  ConcreteA,
	  {}
	);
}

export class ConcreteB extends $.GoStruct<{}> {

	constructor(init?: Partial<{}>) {
		super({
		}, init)
	}

	public clone(): this {
		return super.clone()
	}

	public Method(): string {
		return "B"
	}

	// Register this type with the runtime type system
	static __typeInfo = $.registerStructType(
	  'ConcreteB',
	  new ConcreteB(),
	  [{ name: "Method", args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: "string" } }] }],
	  ConcreteB,
	  {}
	);
}

export class Container extends $.GoStruct<{hasA: boolean; hasB: boolean}> {

	constructor(init?: Partial<{hasA?: boolean, hasB?: boolean}>) {
		super({
			hasA: { type: Boolean, default: false },
			hasB: { type: Boolean, default: false }
		}, init)
	}

	public clone(): this {
		return super.clone()
	}

	// Register this type with the runtime type system
	static __typeInfo = $.registerStructType(
	  'Container',
	  new Container(),
	  [],
	  Container,
	  {"hasA": { kind: $.TypeKind.Basic, name: "boolean" }, "hasB": { kind: $.TypeKind.Basic, name: "boolean" }}
	);
}

export async function main(): Promise<void> {
	let iface: Interface = new ConcreteA({})

	let c = new Container({})

	// Multiple type assertions that should generate unique variable names
	let _gs_ta_val_418_: ConcreteA
	let _gs_ta_ok_418_: boolean
	({ value: _gs_ta_val_418_, ok: _gs_ta_ok_418_ } = $.typeAssert<ConcreteA>(iface, 'ConcreteA'))
	c.hasA = _gs_ta_ok_418_
	let _gs_ta_val_449_: ConcreteB
	let _gs_ta_ok_449_: boolean
	({ value: _gs_ta_val_449_, ok: _gs_ta_ok_449_ } = $.typeAssert<ConcreteB>(iface, 'ConcreteB'))
	c.hasB = _gs_ta_ok_449_

	console.log("hasA:", c.hasA)
	console.log("hasB:", c.hasB)
}


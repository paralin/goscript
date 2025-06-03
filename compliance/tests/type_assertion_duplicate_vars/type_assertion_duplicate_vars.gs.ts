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

export class ConcreteA {
	public _fields: {
	}

	constructor(init?: Partial<{}>) {
		this._fields = {}
	}

	public clone(): ConcreteA {
		const cloned = new ConcreteA()
		cloned._fields = {
		}
		return cloned
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

export class ConcreteB {
	public _fields: {
	}

	constructor(init?: Partial<{}>) {
		this._fields = {}
	}

	public clone(): ConcreteB {
		const cloned = new ConcreteB()
		cloned._fields = {
		}
		return cloned
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

export class Container {
	public get hasA(): boolean {
		return this._fields.hasA.value
	}
	public set hasA(value: boolean) {
		this._fields.hasA.value = value
	}

	public get hasB(): boolean {
		return this._fields.hasB.value
	}
	public set hasB(value: boolean) {
		this._fields.hasB.value = value
	}

	public _fields: {
		hasA: $.VarRef<boolean>;
		hasB: $.VarRef<boolean>;
	}

	constructor(init?: Partial<{hasA?: boolean, hasB?: boolean}>) {
		this._fields = {
			hasA: $.varRef(init?.hasA ?? false),
			hasB: $.varRef(init?.hasB ?? false)
		}
	}

	public clone(): Container {
		const cloned = new Container()
		cloned._fields = {
			hasA: $.varRef(this._fields.hasA.value),
			hasB: $.varRef(this._fields.hasB.value)
		}
		return cloned
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


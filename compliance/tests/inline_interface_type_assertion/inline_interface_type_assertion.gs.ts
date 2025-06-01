// Generated file based on inline_interface_type_assertion.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as $ from "@goscript/builtin/index.js";

export class Greeter {
	public _fields: {
	}

	constructor(init?: Partial<{}>) {
		this._fields = {}
	}

	public clone(): Greeter {
		const cloned = new Greeter()
		cloned._fields = {
		}
		return cloned
	}

	public Greet(): string {
		return "Hello from Greeter"
	}

	// Register this type with the runtime type system
	static __typeInfo = $.registerStructType(
	  'Greeter',
	  new Greeter(),
	  [{ name: "Greet", args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: "string" } }] }],
	  Greeter,
	  {}
	);
}

export type Stringer = null | {
	String(): string
}

$.registerInterfaceType(
  'Stringer',
  null, // Zero value for interface is null
  [{ name: "String", args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: "string" } }] }]
);

export class MyStringer {
	public _fields: {
	}

	constructor(init?: Partial<{}>) {
		this._fields = {}
	}

	public clone(): MyStringer {
		const cloned = new MyStringer()
		cloned._fields = {
		}
		return cloned
	}

	public String(): string {
		return "MyStringer implementation"
	}

	// Register this type with the runtime type system
	static __typeInfo = $.registerStructType(
	  'MyStringer',
	  new MyStringer(),
	  [{ name: "String", args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: "string" } }] }],
	  MyStringer,
	  {}
	);
}

export async function main(): Promise<void> {
	let i: null | any = null
	i = new Greeter({})

	// Successful type assertion to an inline interface
	let { value: g, ok: ok } = $.typeAssert<null | {
		Greet(): string
	}>(i, {kind: $.TypeKind.Interface, methods: [{ name: 'Greet', args: [], returns: [{ type: {kind: $.TypeKind.Basic, name: 'string'} }] }]})
	if (ok) {
		console.log("Greet assertion successful:", g!.Greet())
	}
	 else {
		console.log("Greet assertion failed")
	}

	// Failing type assertion to a different inline interface
	let { value: s, ok: ok2 } = $.typeAssert<null | {
		NonExistentMethod(): number
	}>(i, {kind: $.TypeKind.Interface, methods: [{ name: 'NonExistentMethod', args: [], returns: [{ type: {kind: $.TypeKind.Basic, name: 'number'} }] }]})
	if (ok2) {
		console.log("NonExistentMethod assertion successful (unexpected):", s!.NonExistentMethod())
	}
	 else {
		console.log("NonExistentMethod assertion failed as expected")
	}

	// Successful type assertion to a named interface, where the asserted value also implements an inline interface method
	let j: null | any = null
	j = new MyStringer({})

	// Assert 'j' (which holds MyStringer) to an inline interface that MyStringer satisfies.
	let { value: inlineMs, ok: ok4 } = $.typeAssert<null | {
		String(): string
	}>(j, {kind: $.TypeKind.Interface, methods: [{ name: 'String', args: [], returns: [{ type: {kind: $.TypeKind.Basic, name: 'string'} }] }]})
	if (ok4) {
		console.log("Inline String assertion successful:", inlineMs!.String())
	}
	 else {
		console.log("Inline String assertion failed")
	}

	// Test case: variable of named interface type, asserted to inline interface
	let k: Stringer = null
	k = new MyStringer({})

	let { value: inlineK, ok: ok5 } = $.typeAssert<null | {
		String(): string
	}>(k, {kind: $.TypeKind.Interface, methods: [{ name: 'String', args: [], returns: [{ type: {kind: $.TypeKind.Basic, name: 'string'} }] }]})
	if (ok5) {
		console.log("k.(interface{ String() string }) successful:", inlineK!.String())
	}
	 else {
		console.log("k.(interface{ String() string }) failed")
	}

	// Test case: nil value of an inline interface type assigned to interface{}
	let l: null | any = null

	let { value: ptr, ok: ok6 } = $.typeAssert<{ Name?: string } | null>(l, {kind: $.TypeKind.Pointer, elemType: {kind: $.TypeKind.Struct, fields: {'Name': {kind: $.TypeKind.Basic, name: 'string'}}, methods: []}})
	if (ok6) {
		if (ptr == null) {
			console.log("l.(*struct{ Name string }) successful, ptr is nil as expected")
		}
		 else {
			console.log("l.(*struct{ Name string }) successful, but ptr is not nil (unexpected)")
		}
	}
	 else {
		console.log("l.(*struct{ Name string }) failed (unexpected)")
	}
}


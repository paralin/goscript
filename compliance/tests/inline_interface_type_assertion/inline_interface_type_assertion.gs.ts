// Generated file based on inline_interface_type_assertion.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as $ from "@goscript/builtin";

class Greeter {
	public _fields: {
	}

	constructor(init?: Partial<{}>) {
		this._fields = {
		}
	}

	public clone(): Greeter {
		const cloned = new Greeter()
		cloned._fields = {
		}
		return cloned
	}

	public Greet(): string {
		const g = this
		return "Hello from Greeter"
	}

	// Register this type with the runtime type system
	static __typeInfo = $.registerType(
	  'Greeter',
	  $.TypeKind.Struct,
	  new Greeter(),
	  new Set(['Greet']),
	  Greeter
	);
}

type Stringer = any/* interface: interface{String() string} */

const Stringer__typeInfo = $.registerType(
  'Stringer',
  $.TypeKind.Interface,
  null, // Zero value for interface is null
  new Set(['String']),
  undefined
);

class MyStringer {
	public _fields: {
	}

	constructor(init?: Partial<{}>) {
		this._fields = {
		}
	}

	public clone(): MyStringer {
		const cloned = new MyStringer()
		cloned._fields = {
		}
		return cloned
	}

	public String(): string {
		const ms = this
		return "MyStringer implementation"
	}

	// Register this type with the runtime type system
	static __typeInfo = $.registerType(
	  'MyStringer',
	  $.TypeKind.Struct,
	  new MyStringer(),
	  new Set(['String']),
	  MyStringer
	);
}

export function main(): void {
	let i: any/* interface: interface{} */ = null
	i = new Greeter({})

	// Successful type assertion to an inline interface
	let { value: g, ok: ok } = $.typeAssert<any/* interface: interface{Greet() string} */>(i, 'unknown')
	if (ok) {
		console.log("Greet assertion successful:", g.Greet())
	} else {
		console.log("Greet assertion failed")
	}

	// Failing type assertion to a different inline interface
	let { value: s, ok: ok2 } = $.typeAssert<any/* interface: interface{NonExistentMethod() int} */>(i, 'unknown')
	if (ok2) {
		console.log("NonExistentMethod assertion successful (unexpected):", s.NonExistentMethod())
	} else {
		console.log("NonExistentMethod assertion failed as expected")
	}

	// Successful type assertion to a named interface, where the asserted value also implements an inline interface method
	let j: any/* interface: interface{} */ = null
	j = new MyStringer({})

	// Assert 'j' (which holds MyStringer) to an inline interface that MyStringer satisfies.
	let { value: inlineMs, ok: ok4 } = $.typeAssert<any/* interface: interface{String() string} */>(j, 'unknown')
	if (ok4) {
		console.log("Inline String assertion successful:", inlineMs.String())
	} else {
		console.log("Inline String assertion failed")
	}

	// Test case: variable of named interface type, asserted to inline interface
	let k: Stringer = null
	k = new MyStringer({})

	let { value: inlineK, ok: ok5 } = $.typeAssert<any/* interface: interface{String() string} */>(k, 'unknown')
	if (ok5) {
		console.log("k.(interface{ String() string }) successful:", inlineK.String())
	} else {
		console.log("k.(interface{ String() string }) failed")
	}
}


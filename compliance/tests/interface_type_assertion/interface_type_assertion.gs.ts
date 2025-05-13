// Generated file based on interface_type_assertion.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as $ from "@goscript/builtin";

type MyInterface = null | {
	Method1(): number
}

const MyInterface__typeInfo = $.registerType(
  'MyInterface',
  $.TypeKind.Interface,
  null, // Zero value for interface is null
  new Set(['Method1']),
  undefined
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
	static __typeInfo = $.registerType(
	  'MyStruct',
	  $.TypeKind.Struct,
	  new MyStruct(),
	  new Set(['Method1']),
	  MyStruct
	);
}

export function main(): void {
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
	({ ok: ok } = $.typeAssert<$.Box<MyStruct> | null>(i, {kind: $.TypeKind.Pointer, elemType: 'MyStruct'}))

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


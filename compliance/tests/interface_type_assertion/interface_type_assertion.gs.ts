// Generated file based on interface_type_assertion.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as $ from "@goscript/builtin";

type MyInterface = null | {
	Method1(): number
}

$.registerInterfaceType(
  'MyInterface',
  null, // Zero value for interface is null
  new Set(['Method1']),
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
	  new Set(["Method1"]),
	  MyStruct
	);
}

export function main(): void {
	let i: MyInterface = null
	let s = new MyStruct({Value: 10})
	i = s.clone()

	let _typeAssertResult_0 = $.typeAssert<MyStruct>(i, 'MyStruct')
	let ok = _typeAssertResult_0.ok
if (ok) {
		console.log("Type assertion successful")
	} else {
		console.log("Type assertion failed")
	}

	// try a second time since this generates something different when using = and not :=
	(_typeAssertResult_1 = $.typeAssert<$.Box<MyStruct> | null>(i, {kind: $.TypeKind.Pointer, elemType: 'MyStruct'}))
	ok = _typeAssertResult_1.ok

	// expected
	if (ok) {
		console.log("Type assertion successful")
	} else {
		// expected
		console.log("Type assertion failed")
	}

	// assign result to a variable
	let _typeAssertResult_2 = $.typeAssert<MyStruct>(i, 'MyStruct')
	let val = _typeAssertResult_2.value
let ok2 = _typeAssertResult_2.ok
if (!ok2) {
		console.log("type assertion failed")
	} else {
		console.log("type assertion success", val.Value)
	}
}


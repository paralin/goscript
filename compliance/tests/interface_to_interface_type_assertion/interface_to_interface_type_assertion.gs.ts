// Generated file based on interface_to_interface_type_assertion.go
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

type MyOtherInterface = null | {
	Method1(): number
}

$.registerInterfaceType(
  'MyOtherInterface',
  null, // Zero value for interface is null
  new Set(['Method1']),
);

export function main(): void {
	let i: MyInterface = null
	let s = new MyStruct({Value: 10})
	i = s.clone()

	let _typeAssertResult_0 = $.typeAssert<MyOtherInterface>(i, 'MyOtherInterface')
	let ok_0 = _typeAssertResult_0.ok
if (ok_0) {
		console.log("Type assertion successful")
	} else {
		console.log("Type assertion failed")
	}
}


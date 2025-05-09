// Generated file based on method_call_on_pointer_via_value.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as $ from "@goscript/builtin";

class MyStruct {
	public get MyInt(): number {
		return this._fields.MyInt.value
	}
	public set MyInt(value: number) {
		this._fields.MyInt.value = value
	}

	public _fields: {
		MyInt: $.Box<number>;
	}

	constructor(init?: Partial<{MyInt?: number}>) {
		this._fields = {
			MyInt: $.box(init?.MyInt ?? 0)
		}
	}

	public clone(): MyStruct {
		const cloned = new MyStruct()
		cloned._fields = {
			MyInt: $.box(this._fields.MyInt.value)
		}
		return cloned
	}

	// SetValue sets the MyInt field (pointer receiver).
	public SetValue(v: number): void {
		const m = this
		m.MyInt = v
	}

	// GetValue returns the MyInt field (value receiver for verification).
	public GetValue(): number {
		const m = this
		return m.MyInt
	}

	// Register this type with the runtime type system
	static __typeInfo = $.registerType(
	  'MyStruct',
	  $.TypeKind.Struct,
	  new MyStruct(),
	  new Set(['SetValue', 'GetValue']),
	  MyStruct
	);
}

export function main(): void {
	// Create a struct value
	let msValue = new MyStruct({MyInt: 100})

	// === Method Call on Pointer Receiver via Value ===
	// Call the pointer-receiver method using the value variable.
	// Go implicitly takes the address of msValue (&msValue) to call SetValue.
	msValue.SetValue(200)

	// Verify the value was modified through the method call.
	// Expected: 200
	;console.log("Value after pointer method call via value: Expected: 200, Actual:", msValue.GetValue())
}


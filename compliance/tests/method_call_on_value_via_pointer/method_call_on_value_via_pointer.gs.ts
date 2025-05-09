// Generated file based on method_call_on_value_via_pointer.go
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

	// GetValue returns the MyInt field (value receiver).
	public GetValue(): number {
		const m = this
		return m.MyInt
	}

	// Register this type with the runtime type system
	static __typeInfo = $.registerType(
	  'MyStruct',
	  $.TypeKind.Struct,
	  new MyStruct(),
	  new Set(['GetValue']),
	  MyStruct
	);
}

export function main(): void {
	// Create a struct value
	let msValue: $.Box<MyStruct> = $.box(new MyStruct({MyInt: 100}))
	// Create a pointer to the struct value
	let msPointer = msValue

	// === Method Call on Value Receiver via Pointer ===
	// Call the value-receiver method using the pointer variable.
	// Go implicitly dereferences msPointer to call GetValue on the value.
	// Expected: 100
	console.log("Value via pointer call: Expected: 100, Actual:", msPointer!.value.GetValue());

	// Modify the value through the original value variable
	msValue!.value.MyInt = 200

	// The pointer still points to the modified value
	// Expected: 200
	console.log("Value via pointer call after modification: Expected: 200, Actual:", msPointer!.value.GetValue());
}


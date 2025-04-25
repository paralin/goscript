// Generated file based on method_call_on_pointer_via_value.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as goscript from "@go/builtin";

class MyStruct {
	public MyInt: number = 0;
	
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
	
	constructor(init?: Partial<MyStruct>) { if (init) Object.assign(this, init as any); }
	public clone(): MyStruct { return Object.assign(Object.create(MyStruct.prototype) as MyStruct, this); }
}

export function main(): void {
	// Create a struct value
	let msValue = new MyStruct({ MyInt: 100 })
	
	// === Method Call on Pointer Receiver via Value ===
	// Call the pointer-receiver method using the value variable.
	// Go implicitly takes the address of msValue (&msValue) to call SetValue.
	msValue.SetValue(200)
	
	// Verify the value was modified through the method call.
	// Expected: 200
	console.log("Value after pointer method call via value: Expected: 200, Actual:", msValue.GetValue())
}


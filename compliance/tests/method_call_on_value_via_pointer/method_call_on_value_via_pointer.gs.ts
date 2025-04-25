// Generated file based on method_call_on_value_via_pointer.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as goscript from "@go/builtin";

class MyStruct {
	public MyInt: number = 0;
	
	// GetValue returns the MyInt field (value receiver).
	public GetValue(): number {
		const m = this
		return m.MyInt
	}
	
	constructor(init?: Partial<MyStruct>) { if (init) Object.assign(this, init as any); }
	public clone(): MyStruct { return Object.assign(Object.create(MyStruct.prototype) as MyStruct, this); }
}

export async function main(): Promise<void> {
	// Create a struct value
	let msValue = new MyStruct({ MyInt: 100 })
	// Create a pointer to the struct value
	let msPointer = msValue
	
	// === Method Call on Value Receiver via Pointer ===
	// Call the value-receiver method using the pointer variable.
	// Go implicitly dereferences msPointer to call GetValue on the value.
	// Expected: 100
	console.log("Value via pointer call: Expected: 100, Actual:", msPointer.GetValue())
	
	// Modify the value through the original value variable
	msValue.MyInt = 200
	
	// The pointer still points to the modified value
	// Expected: 200
	console.log("Value via pointer call after modification: Expected: 200, Actual:", msPointer.GetValue())
}


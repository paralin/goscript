// Generated file based on function_call_result_assignment.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as goscript from "@go/builtin";

class MyStruct {
	public MyInt: number = 0;
	public MyString: string = "";
	//nolint:unused
	private myBool: boolean = false;
	
	constructor(init?: Partial<MyStruct>) { if (init) Object.assign(this, init as any); }
	public clone(): MyStruct { return Object.assign(Object.create(MyStruct.prototype) as MyStruct, this); }
}

// NewMyStruct creates a new MyStruct instance.
export function NewMyStruct(s: string): MyStruct {
	return new MyStruct({ MyString: s })
}

export async function main(): Promise<void> {
	// === Function Call Result Assignment (Value Copy) ===
	// Assigning the result of a function that returns a struct creates a copy.
	let structFromFunc = NewMyStruct("function result").clone()
	let structFromFuncCopy = structFromFunc.clone()
	structFromFuncCopy.MyString = "modified function result copy"
	// Expected: "function result"
	console.log("Original struct from function: Expected: function result, Actual: " + structFromFunc.MyString)
	// Expected: "modified function result copy"
	console.log("Modified struct from function copy: Expected: modified function result copy, Actual: " + structFromFuncCopy.MyString)
}


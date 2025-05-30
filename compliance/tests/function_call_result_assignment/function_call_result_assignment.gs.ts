// Generated file based on function_call_result_assignment.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as $ from "@goscript/builtin/index.js";

export class MyStruct extends $.GoStruct<{MyInt: number; MyString: string; myBool: boolean}> {

	constructor(init?: Partial<{MyInt?: number, MyString?: string, myBool?: boolean}>) {
		super({
			MyInt: { type: Number, default: 0 },
			MyString: { type: String, default: "" },
			myBool: { type: Boolean, default: false }
		}, init)
	}

	public clone(): this {
		return super.clone()
	}

	// Register this type with the runtime type system
	static __typeInfo = $.registerStructType(
	  'MyStruct',
	  new MyStruct(),
	  [],
	  MyStruct,
	  {"MyInt": { kind: $.TypeKind.Basic, name: "number" }, "MyString": { kind: $.TypeKind.Basic, name: "string" }, "myBool": { kind: $.TypeKind.Basic, name: "boolean" }}
	);
}

// NewMyStruct creates a new MyStruct instance.
export function NewMyStruct(s: string): MyStruct {
	return new MyStruct({MyString: s})
}

export async function main(): Promise<void> {
	// === Function Call Result Assignment (Value Copy) ===
	// Assigning the result of a function that returns a struct creates a copy.
	let structFromFunc = NewMyStruct("function result")
	let structFromFuncCopy = structFromFunc.clone()
	structFromFuncCopy.MyString = "modified function result copy"
	// Expected: "function result"
	console.log("Original struct from function: Expected: function result, Actual: " + structFromFunc.MyString)
	// Expected: "modified function result copy"
	console.log("Modified struct from function copy: Expected: modified function result copy, Actual: " + structFromFuncCopy.MyString)
}


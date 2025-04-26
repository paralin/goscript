// Generated file based on composite_literal_assignment.go
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

export async function main(): Promise<void> {
	// === Composite Literal Assignment (Value Copy) ===
	// Creating a struct directly using a composite literal.
	let structLiteral = new MyStruct({ MyString: "composite literal" })
	// Assigning it creates another independent copy.
	let structLiteralCopy = structLiteral.clone()
	structLiteralCopy.MyString = "modified composite literal copy"
	// Expected: "composite literal"
	console.log("Original struct literal: Expected: composite literal, Actual: " + structLiteral.MyString)
	// Expected: "modified composite literal copy"
	console.log("Modified struct literal copy: Expected: modified composite literal copy, Actual: " + structLiteralCopy.MyString)
}


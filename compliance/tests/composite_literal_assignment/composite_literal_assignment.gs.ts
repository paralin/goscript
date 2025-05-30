// Generated file based on composite_literal_assignment.go
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

export async function main(): Promise<void> {
	// === Composite Literal Assignment (Value Copy) ===
	// Creating a struct directly using a composite literal.
	let structLiteral = new MyStruct({MyString: "composite literal"})
	// Assigning it creates another independent copy.
	let structLiteralCopy = structLiteral.clone()
	structLiteralCopy.MyString = "modified composite literal copy"
	// Expected: "composite literal"
	console.log("Original struct literal: Expected: composite literal, Actual: " + structLiteral.MyString)
	// Expected: "modified composite literal copy"
	console.log("Modified struct literal copy: Expected: modified composite literal copy, Actual: " + structLiteralCopy.MyString)
}


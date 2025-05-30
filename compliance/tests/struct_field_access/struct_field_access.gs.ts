// Generated file based on struct_field_access.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as $ from "@goscript/builtin/index.js";

export class MyStruct extends $.GoStruct<{MyInt: number; MyString: string}> {

	constructor(init?: Partial<{MyInt?: number, MyString?: string}>) {
		super({
			MyInt: { type: Number, default: 0 },
			MyString: { type: String, default: "" }
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
	  {"MyInt": { kind: $.TypeKind.Basic, name: "number" }, "MyString": { kind: $.TypeKind.Basic, name: "string" }}
	);
}

export async function main(): Promise<void> {
	// === Struct Field Access ===
	let ms = new MyStruct({MyInt: 42, MyString: "foo"})
	console.log("MyInt: Expected: 42, Actual:", ms.MyInt)
	console.log("MyString: Expected: foo, Actual:", ms.MyString)
}


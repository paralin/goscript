// Generated file based on comments_struct.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as $ from "@goscript/builtin/index.js";

export class TestStruct extends $.GoStruct<{IntField: number; StringField: string}> {

	constructor(init?: Partial<{IntField?: number, StringField?: string}>) {
		super({
			IntField: { type: Number, default: 0 },
			StringField: { type: String, default: "" }
		}, init)
	}

	public clone(): this {
		return super.clone()
	}

	// Register this type with the runtime type system
	static __typeInfo = $.registerStructType(
	  'TestStruct',
	  new TestStruct(),
	  [],
	  TestStruct,
	  {"IntField": { kind: $.TypeKind.Basic, name: "number" }, "StringField": { kind: $.TypeKind.Basic, name: "string" }}
	);
}

export async function main(): Promise<void> {
	let s = new TestStruct({IntField: 42, StringField: "hello"})
	console.log("IntField:", s.IntField)
	console.log("StringField:", s.StringField)
}


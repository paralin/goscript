// Generated file based on private_field_access.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as $ from "@goscript/builtin/index.js";

export class MyStruct extends $.GoStruct<{publicField: string; privateField: number}> {

	constructor(init?: Partial<{privateField?: number, publicField?: string}>) {
		super({
			publicField: { type: String, default: "" },
			privateField: { type: Number, default: 0 }
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
	  {"publicField": { kind: $.TypeKind.Basic, name: "string" }, "privateField": { kind: $.TypeKind.Basic, name: "number" }}
	);
}

export function NewMyStruct(pub: string, priv: number): MyStruct {
	return new MyStruct({privateField: priv, publicField: pub})
}

export function accessPrivateField(s: MyStruct): void {
	// Accessing privateField directly from a function in the same package
	// This should trigger the generation of the _private field
	console.log("Accessing privateField:", s.privateField)
}

export async function main(): Promise<void> {
	let s = NewMyStruct("hello", 123)
	accessPrivateField(s)
}


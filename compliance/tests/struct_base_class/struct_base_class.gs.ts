// Generated file based on struct_base_class.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as $ from "@goscript/builtin/index.js";

export class Person extends $.GoStruct<{Name: string; Age: number}> {

	constructor(init?: Partial<{Age?: number, Name?: string}>) {
		super({
			Name: { type: String, default: "" },
			Age: { type: Number, default: 0 }
		}, init)
	}

	public clone(): this {
		return super.clone()
	}

	// Register this type with the runtime type system
	static __typeInfo = $.registerStructType(
	  'Person',
	  new Person(),
	  [],
	  Person,
	  {"Name": { kind: $.TypeKind.Basic, name: "string" }, "Age": { kind: $.TypeKind.Basic, name: "number" }}
	);
}

export async function main(): Promise<void> {
	let p1 = new Person({Age: 30, Name: "Alice"})
	console.log(p1.Name)
	console.log(p1.Age)

	let p2 = p1.clone()
	p2.Name = "Bob"
	p2.Age = 25

	console.log(p1.Name) // Should still be "Alice"
	console.log(p2.Name) // Should be "Bob"
}


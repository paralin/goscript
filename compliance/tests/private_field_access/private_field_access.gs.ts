// Generated file based on private_field_access.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as $ from "@goscript/builtin/builtin.js";

export class MyStruct {
	public get publicField(): string {
		return this._fields.publicField.value
	}
	public set publicField(value: string) {
		this._fields.publicField.value = value
	}

	public get privateField(): number {
		return this._fields.privateField.value
	}
	public set privateField(value: number) {
		this._fields.privateField.value = value
	}

	public _fields: {
		publicField: $.VarRef<string>;
		privateField: $.VarRef<number>;
	}

	constructor(init?: Partial<{privateField?: number, publicField?: string}>) {
		this._fields = {
			publicField: $.varRef(init?.publicField ?? ""),
			privateField: $.varRef(init?.privateField ?? 0)
		}
	}

	public clone(): MyStruct {
		const cloned = new MyStruct()
		cloned._fields = {
			publicField: $.varRef(this._fields.publicField.value),
			privateField: $.varRef(this._fields.privateField.value)
		}
		return cloned
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
	let s = NewMyStruct("hello", 123).clone()
	accessPrivateField(s)
}


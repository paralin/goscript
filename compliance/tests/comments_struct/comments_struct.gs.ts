// Generated file based on comments_struct.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as $ from "@goscript/builtin/index.js";

export class TestStruct {
	// IntField is a commented integer field.
	public get IntField(): number {
		return this._fields.IntField.value
	}
	public set IntField(value: number) {
		this._fields.IntField.value = value
	}

	// StringField is a commented string field.
	public get StringField(): string {
		return this._fields.StringField.value
	}
	public set StringField(value: string) {
		this._fields.StringField.value = value
	}

	public _fields: {
		IntField: $.VarRef<number>;
		StringField: $.VarRef<string>;
	}

	constructor(init?: Partial<{IntField?: number, StringField?: string}>) {
		this._fields = {
			IntField: $.varRef(init?.IntField ?? // DEBUG: Field IntField has type int (*types.Basic)
			// DEBUG: Using default zero value
			0),
			StringField: $.varRef(init?.StringField ?? // DEBUG: Field StringField has type string (*types.Basic)
			// DEBUG: Using default zero value
			"")
		}
	}

	public clone(): TestStruct {
		const cloned = new TestStruct()
		cloned._fields = {
			IntField: $.varRef(this._fields.IntField.value),
			StringField: $.varRef(this._fields.StringField.value)
		}
		return cloned
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


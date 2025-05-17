// Generated file based on comments_struct.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as $ from "@goscript/builtin";

class TestStruct {
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
		IntField: $.Box<number>;
		StringField: $.Box<string>;
	}

	constructor(init?: Partial<{IntField?: number, StringField?: string}>) {
		this._fields = {
			IntField: $.box(init?.IntField ?? 0),
			StringField: $.box(init?.StringField ?? "")
		}
	}

	public clone(): TestStruct {
		const cloned = new TestStruct()
		cloned._fields = {
			IntField: $.box(this._fields.IntField.value),
			StringField: $.box(this._fields.StringField.value)
		}
		return cloned
	}

	// Register this type with the runtime type system
	static __typeInfo = $.registerStructType(
	  'TestStruct',
	  new TestStruct(),
	  new Set([]),
	  TestStruct,
	  {IntField: "number", StringField: "string"}
	);
}

export function main(): void {
	let s = new TestStruct({IntField: 42, StringField: "hello"})
	console.log("IntField:", s.IntField)
	console.log("StringField:", s.StringField)
}


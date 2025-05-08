// Generated file based on private_field_access.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as $ from "@goscript/builtin";

class MyStruct {
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
		publicField: $.Box<string>;
		privateField: $.Box<number>;
	}

	constructor(init?: Partial<{privateField?: number, publicField?: string}>) {
		this._fields = {
			publicField: $.box(init?.publicField ?? ""),
			privateField: $.box(init?.privateField ?? 0)
		}
	}

	public clone(): MyStruct {
		const cloned = new MyStruct()
		cloned._fields = {
			publicField: $.box(this._fields.publicField.value),
			privateField: $.box(this._fields.privateField.value)
		}
		return cloned
	}

	// Register this type with the runtime type system
	static __typeInfo = $.registerType(
	  'MyStruct',
	  $.TypeKind.Struct,
	  new MyStruct(),
	  new Set([]),
	  MyStruct
	);
}

export function NewMyStruct(pub: string, priv: number): MyStruct {
	return new MyStruct({privateField: priv, publicField: pub})
}

function accessPrivateField(s: MyStruct): void {
	// Accessing privateField directly from a function in the same package
	// This should trigger the generation of the _private field
	console.log("Accessing privateField:", s.privateField)
}

export function main(): void {
	let s = (NewMyStruct!)("hello", 123).clone()
	(accessPrivateField!)(s)
}


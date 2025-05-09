// Generated file based on method_call_on_value_receiver.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as $ from "@goscript/builtin";

class MyStruct {
	public get MyInt(): number {
		return this._fields.MyInt.value
	}
	public set MyInt(value: number) {
		this._fields.MyInt.value = value
	}

	public get MyString(): string {
		return this._fields.MyString.value
	}
	public set MyString(value: string) {
		this._fields.MyString.value = value
	}

	public _fields: {
		MyInt: $.Box<number>;
		MyString: $.Box<string>;
	}

	constructor(init?: Partial<{MyInt?: number, MyString?: string}>) {
		this._fields = {
			MyInt: $.box(init?.MyInt ?? 0),
			MyString: $.box(init?.MyString ?? "")
		}
	}

	public clone(): MyStruct {
		const cloned = new MyStruct()
		cloned._fields = {
			MyInt: $.box(this._fields.MyInt.value),
			MyString: $.box(this._fields.MyString.value)
		}
		return cloned
	}

	// GetMyString returns the MyString field.
	public GetMyString(): string {
		const m = this
		return m.MyString
	}

	// Register this type with the runtime type system
	static __typeInfo = $.registerType(
	  'MyStruct',
	  $.TypeKind.Struct,
	  new MyStruct(),
	  new Set(['GetMyString']),
	  MyStruct
	);
}

export function main(): void {
	let ms = new MyStruct({MyInt: 1, MyString: "bar"})
	console.log("Method call on value: Expected: bar, Actual:", ms.GetMyString());
}


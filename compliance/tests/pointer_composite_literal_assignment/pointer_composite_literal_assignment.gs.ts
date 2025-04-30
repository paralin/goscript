// Generated file based on pointer_composite_literal_assignment.go
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

	// Register this type with the runtime type system
	static __typeInfo = $.registerType(
	  'MyStruct',
	  $.TypeKind.Struct,
	  new MyStruct(),
	  new Set([]),
	  MyStruct
	);
}

export function main(): void {
	// === Pointer Composite Literal Assignment ===
	// Creating a pointer to a struct directly using a composite literal with &
	let structPointer = new MyStruct({MyInt: 42, MyString: "composite literal pointer"})

	// Access fields through the pointer
	// Expected: 42
	console.log("MyInt via pointer: Expected: 42, Actual:", structPointer.MyInt)
	// Expected: "composite literal pointer"
	console.log("MyString via pointer: Expected: composite literal pointer, Actual: " + structPointer.MyString)

	// Modify through the pointer
	structPointer.MyInt = 99
	// Expected: 99
	console.log("MyInt after modification: Expected: 99, Actual:", structPointer.MyInt)
}


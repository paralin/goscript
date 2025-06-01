// Generated file based on pointer_assignment_no_copy.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as $ from "@goscript/builtin/index.js";

export class MyStruct {
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
		MyInt: $.VarRef<number>;
		MyString: $.VarRef<string>;
	}

	constructor(init?: Partial<{MyInt?: number, MyString?: string}>) {
		this._fields = {
			MyInt: $.varRef(init?.MyInt ?? // DEBUG: Field MyInt has type int (*types.Basic)
			// DEBUG: Using default zero value
			0),
			MyString: $.varRef(init?.MyString ?? // DEBUG: Field MyString has type string (*types.Basic)
			// DEBUG: Using default zero value
			"")
		}
	}

	public clone(): MyStruct {
		const cloned = new MyStruct()
		cloned._fields = {
			MyInt: $.varRef(this._fields.MyInt.value),
			MyString: $.varRef(this._fields.MyString.value)
		}
		return cloned
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
	let original = new MyStruct({MyInt: 10, MyString: "original"})

	// === Pointer Assignment (No Copy) ===
	// Assigning a pointer variable to another pointer variable.
	let pointerCopy = original

	// Modify the struct through the original pointer.
	original!.MyString = "modified original"

	// The change should be reflected when accessing through the copied pointer.
	// Expected: "modified original"
	console.log("Pointer copy value: Expected: modified original, Actual: " + pointerCopy!.MyString)

	// Modify the struct through the copied pointer.
	pointerCopy!.MyInt = 20

	// The change should be reflected when accessing through the original pointer.
	// Expected: 20
	console.log("Original value after pointer copy modification: Expected: 20, Actual:", original!.MyInt)
}


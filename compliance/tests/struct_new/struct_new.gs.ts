// Generated file based on struct_new.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as $ from "@goscript/builtin/builtin.js";

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

	public get myBool(): boolean {
		return this._fields.myBool.value
	}
	public set myBool(value: boolean) {
		this._fields.myBool.value = value
	}

	public _fields: {
		MyInt: $.VarRef<number>;
		MyString: $.VarRef<string>;
		myBool: $.VarRef<boolean>;
	}

	constructor(init?: Partial<{MyInt?: number, MyString?: string, myBool?: boolean}>) {
		this._fields = {
			MyInt: $.varRef(init?.MyInt ?? 0),
			MyString: $.varRef(init?.MyString ?? ""),
			myBool: $.varRef(init?.myBool ?? false)
		}
	}

	public clone(): MyStruct {
		const cloned = new MyStruct()
		cloned._fields = {
			MyInt: $.varRef(this._fields.MyInt.value),
			MyString: $.varRef(this._fields.MyString.value),
			myBool: $.varRef(this._fields.myBool.value)
		}
		return cloned
	}

	// Register this type with the runtime type system
	static __typeInfo = $.registerStructType(
	  'MyStruct',
	  new MyStruct(),
	  [],
	  MyStruct,
	  {"MyInt": { kind: $.TypeKind.Basic, name: "number" }, "MyString": { kind: $.TypeKind.Basic, name: "string" }, "myBool": { kind: $.TypeKind.Basic, name: "boolean" }}
	);
}

export async function main(): Promise<void> {
	// Test new(MyStruct)
	let ptr = new MyStruct()
	console.log("ptr.MyInt (default):", ptr!.MyInt) // Expected: 0
	console.log("ptr.MyString (default):", ptr!.MyString) // Expected: ""
	console.log("ptr.myBool (default):", ptr!.myBool) // Expected: false

	ptr!.MyInt = 42
	ptr!.MyString = "hello"
	ptr!.myBool = true

	console.log("ptr.MyInt (assigned):", ptr!.MyInt) // Expected: 42
	console.log("ptr.MyString (assigned):", ptr!.MyString) // Expected: "hello"
	console.log("ptr.myBool (assigned):", ptr!.myBool) // Expected: true

	// Test assignment to a dereferenced new struct
	let s: MyStruct = new MyStruct()!.clone()
	console.log("s.MyInt (default):", s.MyInt) // Expected: 0
	console.log("s.MyString (default):", s.MyString) // Expected: ""
	console.log("s.myBool (default):", s.myBool) // Expected: false

	s.MyInt = 100
	s.MyString = "world"
	s.myBool = false // though private, it's in the same package

	console.log("s.MyInt (assigned):", s.MyInt) // Expected: 100
	console.log("s.MyString (assigned):", s.MyString) // Expected: "world"
	console.log("s.myBool (assigned):", s.myBool) // Expected: false
}


// Generated file based on struct_field_access.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as goscript from "@go/builtin";

class MyStruct {
	public MyInt: number = 0;
	public MyString: string = "";
	
	constructor(init?: Partial<MyStruct>) { if (init) Object.assign(this, init as any); }
	public clone(): MyStruct { return Object.assign(Object.create(MyStruct.prototype) as MyStruct, this); }
}

export async function main(): Promise<void> {
	// === Struct Field Access ===
	let ms = new MyStruct({ MyInt: 42, MyString: "foo" })
	console.log("MyInt: Expected: 42, Actual:", ms.MyInt)
	console.log("MyString: Expected: foo, Actual:", ms.MyString)
}


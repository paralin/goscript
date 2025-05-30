// Generated file based on pointer_deref_multiassign.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as $ from "@goscript/builtin/index.js";

export class MyStruct extends $.GoStruct<{MyInt: number; MyString: string; myBool: boolean}> {

	constructor(init?: Partial<{MyInt?: number, MyString?: string, myBool?: boolean}>) {
		super({
			MyInt: { type: Number, default: 0 },
			MyString: { type: String, default: "" },
			myBool: { type: Boolean, default: false }
		}, init)
	}

	public clone(): this {
		return super.clone()
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
	let structPointer = new MyStruct({MyInt: 4, MyString: "hello world"})
	// === Pointer Dereference and Multi-Assignment ===
	// Dereference structPointer to get a copy of the struct.
	// Also demonstrates multi-variable assignment and the use of the blank identifier '_'.
	let [dereferencedStructCopy, , , unusedString] = [structPointer!, structPointer!.myBool, structPointer!.MyInt, "hello"] // testing _ set
	/* _ = */ unusedString // Explicitly ignore unusedString to satisfy linters
	/* _ = */ dereferencedStructCopy
}


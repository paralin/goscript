// Generated file based on struct_pointer_interface_fields.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as $ from "@goscript/builtin/builtin.js";

type MyInterface = null | {
	Method(): void
}

$.registerInterfaceType(
  'MyInterface',
  null, // Zero value for interface is null
  [{ name: "Method", args: [], returns: [] }]
);

class MyStruct {
	public get PointerField(): $.VarRef<number> | null {
		return this._fields.PointerField.value
	}
	public set PointerField(value: $.VarRef<number> | null) {
		this._fields.PointerField.value = value
	}

	public get interfaceField(): MyInterface {
		return this._fields.interfaceField.value
	}
	public set interfaceField(value: MyInterface) {
		this._fields.interfaceField.value = value
	}

	public _fields: {
		PointerField: $.VarRef<$.VarRef<number> | null>;
		interfaceField: $.VarRef<MyInterface>;
	}

	constructor(init?: Partial<{PointerField?: $.VarRef<number> | null, interfaceField?: MyInterface}>) {
		this._fields = {
			PointerField: $.varRef(init?.PointerField ?? null),
			interfaceField: $.varRef(init?.interfaceField ?? null)
		}
	}

	public clone(): MyStruct {
		const cloned = new MyStruct()
		cloned._fields = {
			PointerField: $.varRef(this._fields.PointerField.value),
			interfaceField: $.varRef(this._fields.interfaceField.value)
		}
		return cloned
	}

	// Register this type with the runtime type system
	static __typeInfo = $.registerStructType(
	  'MyStruct',
	  new MyStruct(),
	  [],
	  MyStruct,
	  {"PointerField": { kind: $.TypeKind.Pointer, elemType: { kind: $.TypeKind.Basic, name: "number" } }, "interfaceField": "MyInterface"}
	);
}

export async function main(): Promise<void> {
	let s = new MyStruct({})
	console.log(s.PointerField == null)
	console.log(s.interfaceField == null)

	let i = $.varRef(10)
	s.PointerField = i
	console.log(s.PointerField != null)
	console.log(s.PointerField!.value)
	i!.value = 15
	console.log(s.PointerField!.value)

	let mi: MyInterface = null
	s.interfaceField = mi
	console.log(s.interfaceField == null)
}


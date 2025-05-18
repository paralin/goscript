// Generated file based on struct_pointer_interface_fields.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as $ from "@goscript/builtin";

type MyInterface = null | {
	Method(): void
}

$.registerInterfaceType(
  'MyInterface',
  null, // Zero value for interface is null
  [{ name: "Method", args: [], returns: [] }]
);

class MyStruct {
	public get PointerField(): $.Box<number> | null {
		return this._fields.PointerField.value
	}
	public set PointerField(value: $.Box<number> | null) {
		this._fields.PointerField.value = value
	}

	public get interfaceField(): MyInterface {
		return this._fields.interfaceField.value
	}
	public set interfaceField(value: MyInterface) {
		this._fields.interfaceField.value = value
	}

	public _fields: {
		PointerField: $.Box<$.Box<number> | null>;
		interfaceField: $.Box<MyInterface>;
	}

	constructor(init?: Partial<{PointerField?: $.Box<number> | null, interfaceField?: MyInterface}>) {
		this._fields = {
			PointerField: $.box(init?.PointerField ?? null),
			interfaceField: $.box(init?.interfaceField ?? null)
		}
	}

	public clone(): MyStruct {
		const cloned = new MyStruct()
		cloned._fields = {
			PointerField: $.box(this._fields.PointerField.value),
			interfaceField: $.box(this._fields.interfaceField.value)
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

export function main(): void {
	let s = new MyStruct({})
	console.log(s.PointerField == null)
	console.log(s.interfaceField == null)

	let i: $.Box<number> = $.box(10)
	s.PointerField = i
	console.log(s.PointerField != null)
	console.log(s.PointerField!.value)
	i!.value = 15
	console.log(s.PointerField!.value)

	let mi: MyInterface = null
	s.interfaceField = mi
	console.log(s.interfaceField == null)
}


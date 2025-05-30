// Generated file based on struct_pointer_interface_fields.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as $ from "@goscript/builtin/index.js";

export type MyInterface = null | {
	Method(): void
}

$.registerInterfaceType(
  'MyInterface',
  null, // Zero value for interface is null
  [{ name: "Method", args: [], returns: [] }]
);

export class MyStruct extends $.GoStruct<{PointerField: $.VarRef<number> | null; interfaceField: MyInterface}> {

	constructor(init?: Partial<{PointerField?: $.VarRef<number> | null, interfaceField?: MyInterface}>) {
		super({
			PointerField: { type: Object, default: null },
			interfaceField: { type: Object, default: null }
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


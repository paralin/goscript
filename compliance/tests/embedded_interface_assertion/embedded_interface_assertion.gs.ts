// Generated file based on embedded_interface_assertion.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as $ from "@goscript/builtin/index.js";

export type Reader = null | {
	// Read reads data from the reader.
	Read(_p0: $.Bytes): [number, $.GoError]
}

$.registerInterfaceType(
  'Reader',
  null, // Zero value for interface is null
  [{ name: "Read", args: [{ name: "", type: { kind: $.TypeKind.Slice, elemType: { kind: $.TypeKind.Basic, name: "number" } } }], returns: [{ type: { kind: $.TypeKind.Basic, name: "number" } }, { type: { kind: $.TypeKind.Interface, name: 'GoError', methods: [{ name: 'Error', args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: 'string' } }] }] } }] }]
);

export type Closer = null | {
	Close(): $.GoError
}

$.registerInterfaceType(
  'Closer',
  null, // Zero value for interface is null
  [{ name: "Close", args: [], returns: [{ type: { kind: $.TypeKind.Interface, name: 'GoError', methods: [{ name: 'Error', args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: 'string' } }] }] } }] }]
);

export type ReadCloser = null | Reader & Closer

$.registerInterfaceType(
  'ReadCloser',
  null, // Zero value for interface is null
  []
);

export class MyStruct {
	public _fields: {
	}

	constructor(init?: Partial<{}>) {
		this._fields = {}
	}

	public clone(): MyStruct {
		const cloned = new MyStruct()
		cloned._fields = {
		}
		return cloned
	}

	public Read(p: $.Bytes): [number, $.GoError] {
		return [0, null]
	}

	public Close(): $.GoError {
		return null
	}

	// Register this type with the runtime type system
	static __typeInfo = $.registerStructType(
	  'MyStruct',
	  new MyStruct(),
	  [{ name: "Read", args: [{ name: "p", type: { kind: $.TypeKind.Slice, elemType: { kind: $.TypeKind.Basic, name: "number" } } }], returns: [{ type: { kind: $.TypeKind.Basic, name: "number" } }, { type: { kind: $.TypeKind.Interface, name: 'GoError', methods: [{ name: 'Error', args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: 'string' } }] }] } }] }, { name: "Close", args: [], returns: [{ type: { kind: $.TypeKind.Interface, name: 'GoError', methods: [{ name: 'Error', args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: 'string' } }] }] } }] }],
	  MyStruct,
	  {}
	);
}

export async function main(): Promise<void> {
	let rwc: ReadCloser = null
	let s = new MyStruct({})
	rwc = s.clone()

	let { ok: ok } = $.typeAssert<ReadCloser>(rwc, 'ReadCloser')
	if (ok) {
		console.log("Embedded interface assertion successful")
	}
	 else {
		console.log("Embedded interface assertion failed")
	}
}


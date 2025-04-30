// Generated file based on embedded_interface_assertion.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as goscript from "@goscript/builtin";

interface Reader {
	Read(_p0: number[]): [number, goscript.Error];
}

// Define interface type information
const Reader__typeInfo: goscript.InterfaceTypeInfo = {
  kind: goscript.GoTypeKind.Interface,
  name: 'Reader',
  zero: null,
  methods: [{ name: 'Read', params: [{ type: { kind: goscript.GoTypeKind.Slice, name: '[]byte', zero: [], elem: goscript.BYTE_TYPE }, isVariadic: false }], results: [{ type: goscript.INT_TYPE }, { type: goscript.ERROR_TYPE }] }]
};

interface Closer {
	Close(): goscript.Error;
}

// Define interface type information
const Closer__typeInfo: goscript.InterfaceTypeInfo = {
  kind: goscript.GoTypeKind.Interface,
  name: 'Closer',
  zero: null,
  methods: [{ name: 'Close', params: [], results: [{ type: goscript.ERROR_TYPE }] }]
};

interface ReadCloser extends Reader, Closer {
}

// Define interface type information
const ReadCloser__typeInfo: goscript.InterfaceTypeInfo = {
  kind: goscript.GoTypeKind.Interface,
  name: 'ReadCloser',
  zero: null,
  methods: [{ name: 'Read', params: [{ type: { kind: goscript.GoTypeKind.Slice, name: '[]byte', zero: [], elem: goscript.BYTE_TYPE }, isVariadic: false }], results: [{ type: goscript.INT_TYPE }, { type: goscript.ERROR_TYPE }] }, { name: 'Close', params: [], results: [{ type: goscript.ERROR_TYPE }] }]
};

class MyStruct {

	public Read(p: number[]): [number, goscript.Error] {
		const m = this
		return [0, null]
	}

	public Close(): goscript.Error {
		const m = this
		return null
	}

	constructor(init?: Partial<MyStruct>) { if (init) Object.assign(this, init as any); }
	public clone(): MyStruct { return Object.assign(Object.create(MyStruct.prototype) as MyStruct, this); }

	// Type information for runtime type system
	static __typeInfo: goscript.StructTypeInfo = {
	  kind: goscript.GoTypeKind.Struct,
	  name: 'MyStruct',
	  zero: new MyStruct(),
	  fields: [], // Fields will be added in a future update
	  methods: [{ name: 'Read', params: [{ type: { kind: goscript.GoTypeKind.Slice, name: '[]byte', zero: [], elem: goscript.BYTE_TYPE }, isVariadic: false }], results: [{ type: goscript.INT_TYPE }, { type: goscript.ERROR_TYPE }] }, { name: 'Close', params: [], results: [{ type: goscript.ERROR_TYPE }] }],
	  ctor: MyStruct
	};

}

export async function main(): Promise<void> {
	let rwc: ReadCloser | null = null;
	let s = new MyStruct({})
	rwc = (goscript.isAssignable(s, ReadCloser__typeInfo) ? s : null)

	let rwcAny: any | null = rwc;
	let { ok: ok } = goscript.typeAssert<ReadCloser>(rwcAny, ReadCloser__typeInfo)
	if (ok) {
		console.log("Embedded interface assertion successful")
	} else {
		console.log("Embedded interface assertion failed")
	}
}


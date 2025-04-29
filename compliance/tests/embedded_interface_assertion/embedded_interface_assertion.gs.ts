// Generated file based on embedded_interface_assertion.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as goscript from "@goscript/builtin";

interface Reader {
	Read(_p0: number[]): [number, goscript.Error];
}

// Register this interface with the runtime type system
const Reader__typeInfo = goscript.registerType(
  'Reader',
  goscript.GoTypeKind.Interface,
  null,
  [{ name: 'Read', params: [{ type: goscript.getType('[]byte')!, isVariadic: false }], results: [{ type: goscript.getType('int')! }, { type: goscript.getType('error')! }] }],
  undefined
);

interface Closer {
	Close(): goscript.Error;
}

// Register this interface with the runtime type system
const Closer__typeInfo = goscript.registerType(
  'Closer',
  goscript.GoTypeKind.Interface,
  null,
  [{ name: 'Close', params: [], results: [{ type: goscript.getType('error')! }] }],
  undefined
);

interface ReadCloser extends Reader, Closer {
}

// Register this interface with the runtime type system
const ReadCloser__typeInfo = goscript.registerType(
  'ReadCloser',
  goscript.GoTypeKind.Interface,
  null,
  [{ name: 'Read', params: [{ type: goscript.getType('[]byte')!, isVariadic: false }], results: [{ type: goscript.getType('int')! }, { type: goscript.getType('error')! }] }, { name: 'Close', params: [], results: [{ type: goscript.getType('error')! }] }],
  undefined
);

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
  static __typeInfo = goscript.registerType(
    'MyStruct',
    goscript.GoTypeKind.Struct,
    new MyStruct(),
    [{ name: 'Read', params: [{ type: goscript.getType('[]byte')!, isVariadic: false }], results: [{ type: goscript.getType('int')! }, { type: goscript.getType('error')! }] }, { name: 'Close', params: [], results: [{ type: goscript.getType('error')! }] }],
    MyStruct
  );
}
// Register the pointer type *MyStruct with the runtime type system
const MyStruct__ptrTypeInfo = goscript.registerType(
  '*MyStruct',
  goscript.GoTypeKind.Pointer,
  null,
  [{ name: 'Read', params: [{ type: goscript.getType('[]byte')!, isVariadic: false }], results: [{ type: goscript.getType('int')! }, { type: goscript.getType('error')! }] }, { name: 'Close', params: [], results: [{ type: goscript.getType('error')! }] }],
  MyStruct.__typeInfo
);

export async function main(): Promise<void> {
	let rwc: ReadCloser | null = null;
	let s = new MyStruct({})
	rwc = s.clone()

	let rwcAny: any | null = rwc;
	let { ok: ok } = goscript.typeAssert<ReadCloser>(rwcAny, 'ReadCloser')
	if (ok) {
		console.log("Embedded interface assertion successful")
	} else {
		console.log("Embedded interface assertion failed")
	}
}


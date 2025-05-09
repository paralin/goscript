// Generated file based on embedded_interface_assertion.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as $ from "@goscript/builtin";

type Reader = null | {
	// Read reads data from the reader.
	Read(_p0: $.Slice<number>): [number, $.Error]
}

const Reader__typeInfo = $.registerType(
  'Reader',
  $.TypeKind.Interface,
  null, // Zero value for interface is null
  new Set(['Read']),
  undefined
);

type Closer = null | {
	Close(): $.Error
}

const Closer__typeInfo = $.registerType(
  'Closer',
  $.TypeKind.Interface,
  null, // Zero value for interface is null
  new Set(['Close']),
  undefined
);

type ReadCloser = null | Reader & Closer

const ReadCloser__typeInfo = $.registerType(
  'ReadCloser',
  $.TypeKind.Interface,
  null, // Zero value for interface is null
  new Set(['Close', 'Read']),
  undefined
);

class MyStruct {
	public _fields: {
	}

	constructor(init?: Partial<{}>) {
		this._fields = {
		}
	}

	public clone(): MyStruct {
		const cloned = new MyStruct()
		cloned._fields = {
		}
		return cloned
	}

	public Read(p: $.Slice<number>): [number, $.Error] {
		const m = this
		return [0, null]
	}

	public Close(): $.Error {
		const m = this
		return null
	}

	// Register this type with the runtime type system
	static __typeInfo = $.registerType(
	  'MyStruct',
	  $.TypeKind.Struct,
	  new MyStruct(),
	  new Set(['Read', 'Close']),
	  MyStruct
	);
}

export function main(): void {
	let rwc: ReadCloser = null
	let s = new MyStruct({})
	rwc = s.clone()

	let { ok: ok } = $.typeAssert<ReadCloser>(rwc, 'ReadCloser')
	if (ok) {
		console.log("Embedded interface assertion successful")
	} else {
		console.log("Embedded interface assertion failed")
	}
}


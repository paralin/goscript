// Generated file based on embedded_interface_assertion.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as goscript from "@go/builtin";

interface Reader {
	Read(_p0: number[]): [number, goscript.Error];
}

// Register this interface with the runtime type system
const Reader__typeInfo = goscript.registerType(
  'Reader',
  goscript.TypeKind.Interface,
  null,
  new Set(['Read']),
  undefined
);

interface Closer {
	Close(): goscript.Error;
}

// Register this interface with the runtime type system
const Closer__typeInfo = goscript.registerType(
  'Closer',
  goscript.TypeKind.Interface,
  null,
  new Set(['Close']),
  undefined
);

interface ReadCloser  extends Reader, Closer{
}

// Register this interface with the runtime type system
const ReadCloser__typeInfo = goscript.registerType(
  'ReadCloser',
  goscript.TypeKind.Interface,
  null,
  new Set(['Close', 'Read']),
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
	
	// Register this type with the runtime type system
	static __typeInfo = goscript.registerType(
	  'MyStruct',
	  goscript.TypeKind.Struct,
	  new MyStruct(),
	  new Set(['Read', 'Close']),
	  MyStruct
	);
}

export async function main(): Promise<void> {
	let rwc: ReadCloser | null = null;
	let s = new MyStruct({})
	rwc = s.clone()
	
	let { ok: ok } = goscript.typeAssert<ReadCloser>(rwc, 'ReadCloser')
	if (ok) {
		console.log("Embedded interface assertion successful")
	} else {
		console.log("Embedded interface assertion failed")
	}
}


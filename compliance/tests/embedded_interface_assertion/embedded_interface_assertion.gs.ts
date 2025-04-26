// Generated file based on embedded_interface_assertion.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as goscript from "@go/builtin";

interface Reader 
{
	Read(_p0: number[]): [number, error];
}

// Register this interface with the runtime type system
const Reader__typeInfo = goscript.registerType(
  'Reader',
  goscript.TypeKind.Interface,
  null,
  new Set(['Read']),
  undefined
);

interface Closer 
{
	Close(): error;
}

// Register this interface with the runtime type system
const Closer__typeInfo = goscript.registerType(
  'Closer',
  goscript.TypeKind.Interface,
  null,
  new Set(['Close']),
  undefined
);

interface ReadCloser 
{
	Reader; // Embedded interface - requires manual merging or mixin in TS
	Closer; // Embedded interface - requires manual merging or mixin in TS
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
	
	public Read(p: number[]): [number, error] {
		const m = this
		return [0, nil]
	}
	
	public Close(): error {
		const m = this
		return nil
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
	let rwc: ReadCloser;
	let s = new MyStruct({  })
	rwc = s.clone()
	
	const _tempVar1 = goscript.typeAssert<ReadCloser>(rwc, 'ReadCloser')
	let ok = _tempVar1.ok
	if (ok) {
		console.log("Embedded interface assertion successful")
	} else {
		console.log("Embedded interface assertion failed")
	}
}


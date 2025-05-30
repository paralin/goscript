// Generated file based on atomic_struct_field_init.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as $ from "@goscript/builtin/index.js";

import * as atomic from "@goscript/sync/atomic/index.js"

export class MyStruct extends $.GoStruct<{closed: atomic.Bool; count: atomic.Int32; flag: atomic.Uint32}> {

	constructor(init?: Partial<{closed?: atomic.Bool, count?: atomic.Int32, flag?: atomic.Uint32}>) {
		super({
			closed: { type: Object, default: new atomic.Bool() },
			count: { type: Object, default: new atomic.Int32() },
			flag: { type: Object, default: new atomic.Uint32() }
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
	  {"closed": "Bool", "count": "Int32", "flag": "Uint32"}
	);
}

export async function main(): Promise<void> {
	// Test struct initialization with atomic fields
	let s = new MyStruct({})

	// Test that the atomic fields work correctly
	s.closed.Store(true)
	s.count.Store(42)
	s.flag.Store(100)

	console.log("closed:", s.closed.Load())
	console.log("count:", s.count.Load())
	console.log("flag:", s.flag.Load())

	// Test struct initialization with init values
	let s2 = new MyStruct({closed: new atomic.Bool({}), count: new atomic.Int32({}), flag: new atomic.Uint32({})})

	s2.closed.Store(false)
	s2.count.Store(24)
	s2.flag.Store(50)

	console.log("s2 closed:", s2.closed.Load())
	console.log("s2 count:", s2.count.Load())
	console.log("s2 flag:", s2.flag.Load())

	console.log("atomic struct field test finished")
}


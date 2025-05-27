// Generated file based on atomic_struct_field_init.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as $ from "@goscript/builtin/builtin.js";

import * as atomic from "@goscript/sync/atomic/index.js"

export class MyStruct {
	public get closed(): atomic.Bool {
		return this._fields.closed.value
	}
	public set closed(value: atomic.Bool) {
		this._fields.closed.value = value
	}

	public get count(): atomic.Int32 {
		return this._fields.count.value
	}
	public set count(value: atomic.Int32) {
		this._fields.count.value = value
	}

	public get flag(): atomic.Uint32 {
		return this._fields.flag.value
	}
	public set flag(value: atomic.Uint32) {
		this._fields.flag.value = value
	}

	public _fields: {
		closed: $.VarRef<atomic.Bool>;
		count: $.VarRef<atomic.Int32>;
		flag: $.VarRef<atomic.Uint32>;
	}

	constructor(init?: Partial<{closed?: atomic.Bool, count?: atomic.Int32, flag?: atomic.Uint32}>) {
		this._fields = {
			closed: $.varRef(init?.closed?.clone() ?? new atomic.Bool()),
			count: $.varRef(init?.count?.clone() ?? new atomic.Int32()),
			flag: $.varRef(init?.flag?.clone() ?? new atomic.Uint32())
		}
	}

	public clone(): MyStruct {
		const cloned = new MyStruct()
		cloned._fields = {
			closed: $.varRef(this._fields.closed.value?.clone() ?? null),
			count: $.varRef(this._fields.count.value?.clone() ?? null),
			flag: $.varRef(this._fields.flag.value?.clone() ?? null)
		}
		return cloned
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


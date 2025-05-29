// Generated file based on package_import_sync_atomic.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as $ from "@goscript/builtin/index.js";

import * as atomic from "@goscript/sync/atomic/index.js"

export async function main(): Promise<void> {
	// Test atomic.Int32
	let i32: atomic.Int32 = new atomic.Int32()
	i32.Store(42)
	console.log("Int32 stored 42, value:", i32.Load())

	let old = i32.Swap(100)
	console.log("Int32 swapped to 100, old value:", old, "new value:", i32.Load())

	let newVal = i32.Add(5)
	console.log("Int32 added 5, new value:", newVal)

	if (i32.CompareAndSwap(105, 200)) {
		console.log("Int32 CompareAndSwap 105->200 succeeded, value:", i32.Load())
	}

	// Test atomic.Int64
	let i64: atomic.Int64 = new atomic.Int64()
	i64.Store(1000)
	console.log("Int64 stored 1000, value:", i64.Load())

	i64.Add(-100)
	console.log("Int64 after subtracting 100:", i64.Load())

	// Test atomic.Uint32
	let u32: atomic.Uint32 = new atomic.Uint32()
	u32.Store(50)
	console.log("Uint32 stored 50, value:", u32.Load())

	u32.Add(25)
	console.log("Uint32 after adding 25:", u32.Load())

	// Test atomic.Uint64
	let u64: atomic.Uint64 = new atomic.Uint64()
	u64.Store(2000)
	console.log("Uint64 stored 2000, value:", u64.Load())

	// Test atomic.Bool
	let b: atomic.Bool = new atomic.Bool()
	b.Store(true)
	console.log("Bool stored true, value:", b.Load())

	let old_bool = b.Swap(false)
	console.log("Bool swapped to false, old value:", old_bool, "new value:", b.Load())

	// Test atomic.Pointer
	let ptr: atomic.Pointer<string> = new atomic.Pointer<string>()
	let str1 = "hello"
	let str2 = "world"

	ptr.Store(str1)
	let loaded = ptr.Load()
	if (loaded != null) {
		console.log("Pointer loaded:", loaded!.value)
	}

	let old_ptr = ptr.Swap(str2)
	if (old_ptr != null) {
		console.log("Pointer swapped, old:", old_ptr!.value)
	}
	loaded = ptr.Load()
	if (loaded != null) {
		console.log("Pointer new value:", loaded!.value)
	}

	// Test atomic.Value
	let val: atomic.Value = new atomic.Value()
	val.Store("atomic value")
	{
		let loaded_val = val.Load()
		if (loaded_val != null) {
			{
				let { value: str, ok: ok } = $.typeAssert<string>(loaded_val, {kind: $.TypeKind.Basic, name: 'string'})
				if (ok) {
					console.log("Value loaded:", str)
				}
			}
		}
	}

	let old_val = val.Swap("new atomic value")
	if (old_val != null) {
		{
			let { value: str, ok: ok } = $.typeAssert<string>(old_val, {kind: $.TypeKind.Basic, name: 'string'})
			if (ok) {
				console.log("Value swapped, old:", str)
			}
		}
	}
	{
		let loaded_val = val.Load()
		if (loaded_val != null) {
			{
				let { value: str, ok: ok } = $.typeAssert<string>(loaded_val, {kind: $.TypeKind.Basic, name: 'string'})
				if (ok) {
					console.log("Value new:", str)
				}
			}
		}
	}

	console.log("atomic test finished")
}


package main

import "sync/atomic"

func main() {
	// Test atomic.Int32
	var i32 atomic.Int32
	i32.Store(42)
	println("Int32 stored 42, value:", i32.Load())

	old := i32.Swap(100)
	println("Int32 swapped to 100, old value:", old, "new value:", i32.Load())

	newVal := i32.Add(5)
	println("Int32 added 5, new value:", newVal)

	if i32.CompareAndSwap(105, 200) {
		println("Int32 CompareAndSwap 105->200 succeeded, value:", i32.Load())
	}

	// Test atomic.Int64
	var i64 atomic.Int64
	i64.Store(1000)
	println("Int64 stored 1000, value:", i64.Load())

	i64.Add(-100)
	println("Int64 after subtracting 100:", i64.Load())

	// Test atomic.Uint32
	var u32 atomic.Uint32
	u32.Store(50)
	println("Uint32 stored 50, value:", u32.Load())

	u32.Add(25)
	println("Uint32 after adding 25:", u32.Load())

	// Test atomic.Uint64
	var u64 atomic.Uint64
	u64.Store(2000)
	println("Uint64 stored 2000, value:", u64.Load())

	// Test atomic.Bool
	var b atomic.Bool
	b.Store(true)
	println("Bool stored true, value:", b.Load())

	old_bool := b.Swap(false)
	println("Bool swapped to false, old value:", old_bool, "new value:", b.Load())

	// Test atomic.Pointer
	var ptr atomic.Pointer[string]
	str1 := "hello"
	str2 := "world"

	ptr.Store(&str1)
	loaded := ptr.Load()
	if loaded != nil {
		println("Pointer loaded:", *loaded)
	}

	old_ptr := ptr.Swap(&str2)
	if old_ptr != nil {
		println("Pointer swapped, old:", *old_ptr)
	}
	loaded = ptr.Load()
	if loaded != nil {
		println("Pointer new value:", *loaded)
	}

	// Test atomic.Value
	var val atomic.Value
	val.Store("atomic value")
	if loaded_val := val.Load(); loaded_val != nil {
		if str, ok := loaded_val.(string); ok {
			println("Value loaded:", str)
		}
	}

	old_val := val.Swap("new atomic value")
	if old_val != nil {
		if str, ok := old_val.(string); ok {
			println("Value swapped, old:", str)
		}
	}
	if loaded_val := val.Load(); loaded_val != nil {
		if str, ok := loaded_val.(string); ok {
			println("Value new:", str)
		}
	}

	println("atomic test finished")
}

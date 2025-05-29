import * as $ from "@goscript/builtin/index.js";

import * as unsafe from "@goscript/unsafe/index.js"

// Type alias for uintptr (pointer-sized unsigned integer)
export type uintptr = number;
export type Pointer = any;

// SwapInt32 atomically stores new into *addr and returns the previous *addr value.
// Consider using the more ergonomic and less error-prone [Int32.Swap] instead.
//
//go:noescape
export function SwapInt32(addr: $.VarRef<number> | null, _new: number): number {
	if (!addr) return 0;
	let old = addr.value;
	addr.value = _new;
	return old;
}

// SwapUint32 atomically stores new into *addr and returns the previous *addr value.
// Consider using the more ergonomic and less error-prone [Uint32.Swap] instead.
//
//go:noescape
export function SwapUint32(addr: $.VarRef<number> | null, _new: number): number {
	if (!addr) return 0;
	let old = addr.value;
	addr.value = _new;
	return old;
}

// SwapUintptr atomically stores new into *addr and returns the previous *addr value.
// Consider using the more ergonomic and less error-prone [Uintptr.Swap] instead.
//
//go:noescape
export function SwapUintptr(addr: $.VarRef<uintptr> | null, _new: uintptr): uintptr {
	if (!addr) return 0;
	let old = addr.value;
	addr.value = _new;
	return old;
}

// SwapPointer atomically stores new into *addr and returns the previous *addr value.
// Consider using the more ergonomic and less error-prone [Pointer.Swap] instead.
export function SwapPointer(addr: $.VarRef<Pointer> | null, _new: Pointer): Pointer {
	if (!addr) return null;
	let old = addr.value;
	addr.value = _new;
	return old;
}

// CompareAndSwapInt32 executes the compare-and-swap operation for an int32 value.
// Consider using the more ergonomic and less error-prone [Int32.CompareAndSwap] instead.
//
//go:noescape
export function CompareAndSwapInt32(addr: $.VarRef<number> | null, old: number, _new: number): boolean {
	if (!addr) return false;
	if (addr.value === old) {
		addr.value = _new;
		return true;
	}
	return false;
}

// CompareAndSwapUint32 executes the compare-and-swap operation for a uint32 value.
// Consider using the more ergonomic and less error-prone [Uint32.CompareAndSwap] instead.
//
//go:noescape
export function CompareAndSwapUint32(addr: $.VarRef<number> | null, old: number, _new: number): boolean {
	if (!addr) return false;
	if (addr.value === old) {
		addr.value = _new;
		return true;
	}
	return false;
}

// CompareAndSwapUintptr executes the compare-and-swap operation for a uintptr value.
// Consider using the more ergonomic and less error-prone [Uintptr.CompareAndSwap] instead.
//
//go:noescape
export function CompareAndSwapUintptr(addr: $.VarRef<uintptr> | null, old: uintptr, _new: uintptr): boolean {
	if (!addr) return false;
	if (addr.value === old) {
		addr.value = _new;
		return true;
	}
	return false;
}

// CompareAndSwapPointer executes the compare-and-swap operation for a unsafe.Pointer value.
// Consider using the more ergonomic and less error-prone [Pointer.CompareAndSwap] instead.
export function CompareAndSwapPointer(addr: $.VarRef<Pointer> | null, old: Pointer, _new: Pointer): boolean {
	if (!addr) return false;
	if (addr.value === old) {
		addr.value = _new;
		return true;
	}
	return false;
}

// AddInt32 atomically adds delta to *addr and returns the new value.
// Consider using the more ergonomic and less error-prone [Int32.Add] instead.
//
//go:noescape
export function AddInt32(addr: $.VarRef<number> | null, delta: number): number {
	if (!addr) return 0;
	addr.value = (addr.value + delta) | 0; // Use bitwise OR to ensure 32-bit signed integer
	return addr.value;
}

// AddUint32 atomically adds delta to *addr and returns the new value.
// To subtract a signed positive constant value c from x, do AddUint32(&x, ^uint32(c-1)).
// In particular, to decrement x, do AddUint32(&x, ^uint32(0)).
// Consider using the more ergonomic and less error-prone [Uint32.Add] instead.
//
//go:noescape
export function AddUint32(addr: $.VarRef<number> | null, delta: number): number {
	if (!addr) return 0;
	addr.value = (addr.value + delta) >>> 0; // Use unsigned right shift to ensure 32-bit unsigned integer
	return addr.value;
}

// AddUintptr atomically adds delta to *addr and returns the new value.
// Consider using the more ergonomic and less error-prone [Uintptr.Add] instead.
//
//go:noescape
export function AddUintptr(addr: $.VarRef<uintptr> | null, delta: uintptr): uintptr {
	if (!addr) return 0;
	addr.value = (addr.value + delta) >>> 0; // Use unsigned right shift for uintptr
	return addr.value;
}

// AndInt32 atomically performs a bitwise AND operation on *addr using the bitmask provided as mask
// and returns the old value.
// Consider using the more ergonomic and less error-prone [Int32.And] instead.
//
//go:noescape
export function AndInt32(addr: $.VarRef<number> | null, mask: number): number {
	if (!addr) return 0;
	let old = addr.value;
	addr.value = (addr.value & mask) | 0; // Use bitwise OR to ensure 32-bit signed integer
	return old;
}

// AndUint32 atomically performs a bitwise AND operation on *addr using the bitmask provided as mask
// and returns the old value.
// Consider using the more ergonomic and less error-prone [Uint32.And] instead.
//
//go:noescape
export function AndUint32(addr: $.VarRef<number> | null, mask: number): number {
	if (!addr) return 0;
	let old = addr.value;
	addr.value = (addr.value & mask) >>> 0; // Use unsigned right shift to ensure 32-bit unsigned integer
	return old;
}

// AndUintptr atomically performs a bitwise AND operation on *addr using the bitmask provided as mask
// and returns the old value.
// Consider using the more ergonomic and less error-prone [Uintptr.And] instead.
//
//go:noescape
export function AndUintptr(addr: $.VarRef<uintptr> | null, mask: uintptr): uintptr {
	if (!addr) return 0;
	let old = addr.value;
	addr.value = (addr.value & mask) >>> 0; // Use unsigned right shift for uintptr
	return old;
}

// OrInt32 atomically performs a bitwise OR operation on *addr using the bitmask provided as mask
// and returns the old value.
// Consider using the more ergonomic and less error-prone [Int32.Or] instead.
//
//go:noescape
export function OrInt32(addr: $.VarRef<number> | null, mask: number): number {
	if (!addr) return 0;
	let old = addr.value;
	addr.value = (addr.value | mask) | 0; // Use bitwise OR to ensure 32-bit signed integer
	return old;
}

// OrUint32 atomically performs a bitwise OR operation on *addr using the bitmask provided as mask
// and returns the old value.
// Consider using the more ergonomic and less error-prone [Uint32.Or] instead.
//
//go:noescape
export function OrUint32(addr: $.VarRef<number> | null, mask: number): number {
	if (!addr) return 0;
	let old = addr.value;
	addr.value = (addr.value | mask) >>> 0; // Use unsigned right shift to ensure 32-bit unsigned integer
	return old;
}

// OrUintptr atomically performs a bitwise OR operation on *addr using the bitmask provided as mask
// and returns the old value.
// Consider using the more ergonomic and less error-prone [Uintptr.Or] instead.
//
//go:noescape
export function OrUintptr(addr: $.VarRef<uintptr> | null, mask: uintptr): uintptr {
	if (!addr) return 0;
	let old = addr.value;
	addr.value = (addr.value | mask) >>> 0; // Use unsigned right shift for uintptr
	return old;
}

// LoadInt32 atomically loads *addr.
// Consider using the more ergonomic and less error-prone [Int32.Load] instead.
//
//go:noescape
export function LoadInt32(addr: $.VarRef<number> | null): number {
	if (!addr) return 0;
	return addr.value;
}

// LoadUint32 atomically loads *addr.
// Consider using the more ergonomic and less error-prone [Uint32.Load] instead.
//
//go:noescape
export function LoadUint32(addr: $.VarRef<number> | null): number {
	if (!addr) return 0;
	return addr.value;
}

// LoadUintptr atomically loads *addr.
// Consider using the more ergonomic and less error-prone [Uintptr.Load] instead.
//
//go:noescape
export function LoadUintptr(addr: $.VarRef<uintptr> | null): uintptr {
	if (!addr) return 0;
	return addr.value;
}

// LoadPointer atomically loads *addr.
// Consider using the more ergonomic and less error-prone [Pointer.Load] instead.
export function LoadPointer(addr: $.VarRef<Pointer> | null): Pointer {
	if (!addr) return null;
	return addr.value;
}

// StoreInt32 atomically stores val into *addr.
// Consider using the more ergonomic and less error-prone [Int32.Store] instead.
//
//go:noescape
export function StoreInt32(addr: $.VarRef<number> | null, val: number): void {
	if (addr) {
		addr.value = val | 0; // Use bitwise OR to ensure 32-bit signed integer
	}
}

// StoreUint32 atomically stores val into *addr.
// Consider using the more ergonomic and less error-prone [Uint32.Store] instead.
//
//go:noescape
export function StoreUint32(addr: $.VarRef<number> | null, val: number): void {
	if (addr) {
		addr.value = val >>> 0; // Use unsigned right shift to ensure 32-bit unsigned integer
	}
}

// StoreUintptr atomically stores val into *addr.
// Consider using the more ergonomic and less error-prone [Uintptr.Store] instead.
//
//go:noescape
export function StoreUintptr(addr: $.VarRef<uintptr> | null, val: uintptr): void {
	if (addr) {
		addr.value = val >>> 0; // Use unsigned right shift for uintptr
	}
}

// StorePointer atomically stores val into *addr.
// Consider using the more ergonomic and less error-prone [Pointer.Store] instead.
export function StorePointer(addr: $.VarRef<Pointer> | null, val: Pointer): void {
	if (addr) {
		addr.value = val;
	}
}


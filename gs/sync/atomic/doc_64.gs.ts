import * as $ from "@goscript/builtin/builtin.js";

// SwapInt64 atomically stores new into *addr and returns the previous *addr value.
// Consider using the more ergonomic and less error-prone [Int64.Swap] instead
// (particularly if you target 32-bit platforms; see the bugs section).
//
//go:noescape
export function SwapInt64(addr: $.VarRef<number> | null, _new: number): number {
	if (!addr) return 0;
	let old = addr.value;
	addr.value = _new;
	return old;
}

// SwapUint64 atomically stores new into *addr and returns the previous *addr value.
// Consider using the more ergonomic and less error-prone [Uint64.Swap] instead
// (particularly if you target 32-bit platforms; see the bugs section).
//
//go:noescape
export function SwapUint64(addr: $.VarRef<number> | null, _new: number): number {
	if (!addr) return 0;
	let old = addr.value;
	addr.value = _new;
	return old;
}

// CompareAndSwapInt64 executes the compare-and-swap operation for an int64 value.
// Consider using the more ergonomic and less error-prone [Int64.CompareAndSwap] instead
// (particularly if you target 32-bit platforms; see the bugs section).
//
//go:noescape
export function CompareAndSwapInt64(addr: $.VarRef<number> | null, old: number, _new: number): boolean {
	if (!addr) return false;
	if (addr.value === old) {
		addr.value = _new;
		return true;
	}
	return false;
}

// CompareAndSwapUint64 executes the compare-and-swap operation for a uint64 value.
// Consider using the more ergonomic and less error-prone [Uint64.CompareAndSwap] instead
// (particularly if you target 32-bit platforms; see the bugs section).
//
//go:noescape
export function CompareAndSwapUint64(addr: $.VarRef<number> | null, old: number, _new: number): boolean {
	if (!addr) return false;
	if (addr.value === old) {
		addr.value = _new;
		return true;
	}
	return false;
}

// AddInt64 atomically adds delta to *addr and returns the new value.
// Consider using the more ergonomic and less error-prone [Int64.Add] instead
// (particularly if you target 32-bit platforms; see the bugs section).
//
//go:noescape
export function AddInt64(addr: $.VarRef<number> | null, delta: number): number {
	if (!addr) return 0;
	addr.value = addr.value + delta;
	return addr.value;
}

// AddUint64 atomically adds delta to *addr and returns the new value.
// To subtract a signed positive constant value c from x, do AddUint64(&x, ^uint64(c-1)).
// In particular, to decrement x, do AddUint64(&x, ^uint64(0)).
// Consider using the more ergonomic and less error-prone [Uint64.Add] instead
// (particularly if you target 32-bit platforms; see the bugs section).
//
//go:noescape
export function AddUint64(addr: $.VarRef<number> | null, delta: number): number {
	if (!addr) return 0;
	addr.value = addr.value + delta;
	return addr.value;
}

// AndInt64 atomically performs a bitwise AND operation on *addr using the bitmask provided as mask
// and returns the old value.
// Consider using the more ergonomic and less error-prone [Int64.And] instead.
//
//go:noescape
export function AndInt64(addr: $.VarRef<number> | null, mask: number): number {
	if (!addr) return 0;
	let old = addr.value;
	addr.value = addr.value & mask;
	return old;
}

// AndUint64 atomically performs a bitwise AND operation on *addr using the bitmask provided as mask
// and returns the old.
// Consider using the more ergonomic and less error-prone [Uint64.And] instead.
//
//go:noescape
export function AndUint64(addr: $.VarRef<number> | null, mask: number): number {
	if (!addr) return 0;
	let old = addr.value;
	addr.value = addr.value & mask;
	return old;
}

// OrInt64 atomically performs a bitwise OR operation on *addr using the bitmask provided as mask
// and returns the old value.
// Consider using the more ergonomic and less error-prone [Int64.Or] instead.
//
//go:noescape
export function OrInt64(addr: $.VarRef<number> | null, mask: number): number {
	if (!addr) return 0;
	let old = addr.value;
	addr.value = addr.value | mask;
	return old;
}

// OrUint64 atomically performs a bitwise OR operation on *addr using the bitmask provided as mask
// and returns the old value.
// Consider using the more ergonomic and less error-prone [Uint64.Or] instead.
//
//go:noescape
export function OrUint64(addr: $.VarRef<number> | null, mask: number): number {
	if (!addr) return 0;
	let old = addr.value;
	addr.value = addr.value | mask;
	return old;
}

// LoadInt64 atomically loads *addr.
// Consider using the more ergonomic and less error-prone [Int64.Load] instead
// (particularly if you target 32-bit platforms; see the bugs section).
//
//go:noescape
export function LoadInt64(addr: $.VarRef<number> | null): number {
	if (!addr) return 0;
	return addr.value;
}

// LoadUint64 atomically loads *addr.
// Consider using the more ergonomic and less error-prone [Uint64.Load] instead
// (particularly if you target 32-bit platforms; see the bugs section).
//
//go:noescape
export function LoadUint64(addr: $.VarRef<number> | null): number {
	if (!addr) return 0;
	return addr.value;
}

// StoreInt64 atomically stores val into *addr.
// Consider using the more ergonomic and less error-prone [Int64.Store] instead
// (particularly if you target 32-bit platforms; see the bugs section).
//
//go:noescape
export function StoreInt64(addr: $.VarRef<number> | null, val: number): void {
	if (addr) {
		addr.value = val;
	}
}

// StoreUint64 atomically stores val into *addr.
// Consider using the more ergonomic and less error-prone [Uint64.Store] instead
// (particularly if you target 32-bit platforms; see the bugs section).
//
//go:noescape
export function StoreUint64(addr: $.VarRef<number> | null, val: number): void {
	if (addr) {
		addr.value = val;
	}
}


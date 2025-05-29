import * as $ from "@goscript/builtin/index.js";
import { AddInt32, AddUint32, AddUintptr, AndInt32, AndUint32, AndUintptr, CompareAndSwapInt32, CompareAndSwapPointer, CompareAndSwapUint32, CompareAndSwapUintptr, LoadInt32, LoadPointer, LoadUint32, LoadUintptr, OrInt32, OrUint32, OrUintptr, StoreInt32, StorePointer, StoreUint32, StoreUintptr, SwapInt32, SwapPointer, SwapUint32, SwapUintptr, uintptr } from "./doc.gs.js";
import { AddInt64, AddUint64, AndInt64, AndUint64, CompareAndSwapInt64, CompareAndSwapUint64, LoadInt64, LoadUint64, OrInt64, OrUint64, StoreInt64, StoreUint64, SwapInt64, SwapUint64 } from "./doc_64.gs.js";

import * as unsafe from "@goscript/unsafe/index.js"

export class Bool {
	public get v(): number {
		return this._fields.v.value
	}
	public set v(value: number) {
		this._fields.v.value = value
	}

	public _fields: {
		v: $.VarRef<number>;
	}

	constructor(init?: Partial<{v?: number}>) {
		this._fields = {
			v: $.varRef(init?.v ?? 0)
		}
	}

	public clone(): Bool {
		const cloned = new Bool()
		cloned._fields = {
			v: $.varRef(this._fields.v.value)
		}
		return cloned
	}

	// Load atomically loads and returns the value stored in x.
	public Load(): boolean {
		const x = this
		return LoadUint32(x._fields.v) != 0
	}

	// Store atomically stores val into x.
	public Store(val: boolean): void {
		const x = this
		StoreUint32(x._fields.v, b32(val))
	}

	// Swap atomically stores new into x and returns the previous value.
	public Swap(_new: boolean): boolean {
		const x = this
		return SwapUint32(x._fields.v, b32(_new)) != 0
	}

	// CompareAndSwap executes the compare-and-swap operation for the boolean value x.
	public CompareAndSwap(old: boolean, _new: boolean): boolean {
		const x = this
		return CompareAndSwapUint32(x._fields.v, b32(old), b32(_new))
	}

	// Register this type with the runtime type system
	static __typeInfo = $.registerStructType(
	  'Bool',
	  new Bool(),
	  [{ name: "Load", args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: "boolean" } }] }, { name: "Store", args: [{ name: "val", type: { kind: $.TypeKind.Basic, name: "boolean" } }], returns: [] }, { name: "Swap", args: [{ name: "new", type: { kind: $.TypeKind.Basic, name: "boolean" } }], returns: [{ type: { kind: $.TypeKind.Basic, name: "boolean" } }] }, { name: "CompareAndSwap", args: [{ name: "old", type: { kind: $.TypeKind.Basic, name: "boolean" } }, { name: "new", type: { kind: $.TypeKind.Basic, name: "boolean" } }], returns: [{ type: { kind: $.TypeKind.Basic, name: "boolean" } }] }],
	  Bool,
	  {"v": { kind: $.TypeKind.Basic, name: "number" }}
	);
}

// b32 returns a uint32 0 or 1 representing b.
export function b32(b: boolean): number {
	if (b) {
		return 1
	}
	return 0
}


export class Pointer<T> {
	public get v(): $.VarRef<T> | null {
		return this._fields.v.value
	}
	public set v(value: $.VarRef<T> | null) {
		this._fields.v.value = value
	}

	public _fields: {
		v: $.VarRef<$.VarRef<T> | null>;
	}

	constructor(init?: Partial<{v?: $.VarRef<T> | null}>) {
		this._fields = {
			v: $.varRef(init?.v ?? null)
		}
	}

	public clone(): Pointer<T> {
		const cloned = new Pointer<T>()
		cloned._fields = {
			v: $.varRef(this._fields.v.value)
		}
		return cloned
	}

	// Load atomically loads and returns the value stored in x.
	public Load(): $.VarRef<T> | null {
		const x = this
		return LoadPointer(x._fields.v) as $.VarRef<T> | null
	}

	// Store atomically stores val into x.
	public Store(val: T): void {
		const x = this
		const varRef = $.varRef(val)
		StorePointer(x._fields.v, unsafe.Pointer(varRef))
	}

	// Swap atomically stores new into x and returns the previous value.
	public Swap(_new: T): $.VarRef<T> | null {
		const x = this
		const varRef = $.varRef(_new)
		return SwapPointer(x._fields.v, unsafe.Pointer(varRef)) as $.VarRef<T> | null
	}

	// CompareAndSwap executes the compare-and-swap operation for x.
	public CompareAndSwap(old: T, _new: T): boolean {
		const x = this
		const oldVarRef = $.varRef(old)
		const newVarRef = $.varRef(_new)
		return CompareAndSwapPointer(x._fields.v, unsafe.Pointer(oldVarRef), unsafe.Pointer(newVarRef))
	}

	// Register this type with the runtime type system
	static __typeInfo = $.registerStructType(
	  'Pointer',
	  new Pointer(),
	  [{ name: "Load", args: [], returns: [{ type: { kind: $.TypeKind.Pointer, elemType: { kind: $.TypeKind.Interface, methods: [] } } }] }, { name: "Store", args: [{ name: "val", type: { kind: $.TypeKind.Pointer, elemType: { kind: $.TypeKind.Interface, methods: [] } } }], returns: [] }, { name: "Swap", args: [{ name: "new", type: { kind: $.TypeKind.Pointer, elemType: { kind: $.TypeKind.Interface, methods: [] } } }], returns: [{ type: { kind: $.TypeKind.Pointer, elemType: { kind: $.TypeKind.Interface, methods: [] } } }] }, { name: "CompareAndSwap", args: [{ name: "old", type: { kind: $.TypeKind.Pointer, elemType: { kind: $.TypeKind.Interface, methods: [] } } }, { name: "new", type: { kind: $.TypeKind.Pointer, elemType: { kind: $.TypeKind.Interface, methods: [] } } }], returns: [{ type: { kind: $.TypeKind.Basic, name: "boolean" } }] }],
	  Pointer,
	  {"v": { kind: $.TypeKind.Basic, name: "Pointer" }}
	);
}

export class Int32 {
	public get v(): number {
		return this._fields.v.value
	}
	public set v(value: number) {
		this._fields.v.value = value
	}

	public _fields: {
		v: $.VarRef<number>;
	}

	constructor(init?: Partial<{v?: number}>) {
		this._fields = {
			v: $.varRef(init?.v ?? 0)
		}
	}

	public clone(): Int32 {
		const cloned = new Int32()
		cloned._fields = {
			v: $.varRef(this._fields.v.value)
		}
		return cloned
	}

	// Load atomically loads and returns the value stored in x.
	public Load(): number {
		const x = this
		return LoadInt32(x._fields.v)
	}

	// Store atomically stores val into x.
	public Store(val: number): void {
		const x = this
		StoreInt32(x._fields.v, val)
	}

	// Swap atomically stores new into x and returns the previous value.
	public Swap(_new: number): number {
		const x = this
		return SwapInt32(x._fields.v, _new)
	}

	// CompareAndSwap executes the compare-and-swap operation for x.
	public CompareAndSwap(old: number, _new: number): boolean {
		const x = this
		return CompareAndSwapInt32(x._fields.v, old, _new)
	}

	// Add atomically adds delta to x and returns the new value.
	public Add(delta: number): number {
		const x = this
		return AddInt32(x._fields.v, delta)
	}

	// And atomically performs a bitwise AND operation on x using the bitmask
	// provided as mask and returns the old value.
	public And(mask: number): number {
		const x = this
		return AndInt32(x._fields.v, mask)
	}

	// Or atomically performs a bitwise OR operation on x using the bitmask
	// provided as mask and returns the old value.
	public Or(mask: number): number {
		const x = this
		return OrInt32(x._fields.v, mask)
	}

	// Register this type with the runtime type system
	static __typeInfo = $.registerStructType(
	  'Int32',
	  new Int32(),
	  [{ name: "Load", args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: "number" } }] }, { name: "Store", args: [{ name: "val", type: { kind: $.TypeKind.Basic, name: "number" } }], returns: [] }, { name: "Swap", args: [{ name: "new", type: { kind: $.TypeKind.Basic, name: "number" } }], returns: [{ type: { kind: $.TypeKind.Basic, name: "number" } }] }, { name: "CompareAndSwap", args: [{ name: "old", type: { kind: $.TypeKind.Basic, name: "number" } }, { name: "new", type: { kind: $.TypeKind.Basic, name: "number" } }], returns: [{ type: { kind: $.TypeKind.Basic, name: "boolean" } }] }, { name: "Add", args: [{ name: "delta", type: { kind: $.TypeKind.Basic, name: "number" } }], returns: [{ type: { kind: $.TypeKind.Basic, name: "number" } }] }, { name: "And", args: [{ name: "mask", type: { kind: $.TypeKind.Basic, name: "number" } }], returns: [{ type: { kind: $.TypeKind.Basic, name: "number" } }] }, { name: "Or", args: [{ name: "mask", type: { kind: $.TypeKind.Basic, name: "number" } }], returns: [{ type: { kind: $.TypeKind.Basic, name: "number" } }] }],
	  Int32,
	  {"v": { kind: $.TypeKind.Basic, name: "number" }}
	);
}

export class Int64 {
	public get v(): number {
		return this._fields.v.value
	}
	public set v(value: number) {
		this._fields.v.value = value
	}

	public _fields: {
		v: $.VarRef<number>;
	}

	constructor(init?: Partial<{v?: number}>) {
		this._fields = {
			v: $.varRef(init?.v ?? 0)
		}
	}

	public clone(): Int64 {
		const cloned = new Int64()
		cloned._fields = {
			v: $.varRef(this._fields.v.value)
		}
		return cloned
	}

	// Load atomically loads and returns the value stored in x.
	public Load(): number {
		const x = this
		return LoadInt64(x._fields.v)
	}

	// Store atomically stores val into x.
	public Store(val: number): void {
		const x = this
		StoreInt64(x._fields.v, val)
	}

	// Swap atomically stores new into x and returns the previous value.
	public Swap(_new: number): number {
		const x = this
		return SwapInt64(x._fields.v, _new)
	}

	// CompareAndSwap executes the compare-and-swap operation for x.
	public CompareAndSwap(old: number, _new: number): boolean {
		const x = this
		return CompareAndSwapInt64(x._fields.v, old, _new)
	}

	// Add atomically adds delta to x and returns the new value.
	public Add(delta: number): number {
		const x = this
		return AddInt64(x._fields.v, delta)
	}

	// And atomically performs a bitwise AND operation on x using the bitmask
	// provided as mask and returns the old value.
	public And(mask: number): number {
		const x = this
		return AndInt64(x._fields.v, mask)
	}

	// Or atomically performs a bitwise OR operation on x using the bitmask
	// provided as mask and returns the old value.
	public Or(mask: number): number {
		const x = this
		return OrInt64(x._fields.v, mask)
	}

	// Register this type with the runtime type system
	static __typeInfo = $.registerStructType(
	  'Int64',
	  new Int64(),
	  [{ name: "Load", args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: "number" } }] }, { name: "Store", args: [{ name: "val", type: { kind: $.TypeKind.Basic, name: "number" } }], returns: [] }, { name: "Swap", args: [{ name: "new", type: { kind: $.TypeKind.Basic, name: "number" } }], returns: [{ type: { kind: $.TypeKind.Basic, name: "number" } }] }, { name: "CompareAndSwap", args: [{ name: "old", type: { kind: $.TypeKind.Basic, name: "number" } }, { name: "new", type: { kind: $.TypeKind.Basic, name: "number" } }], returns: [{ type: { kind: $.TypeKind.Basic, name: "boolean" } }] }, { name: "Add", args: [{ name: "delta", type: { kind: $.TypeKind.Basic, name: "number" } }], returns: [{ type: { kind: $.TypeKind.Basic, name: "number" } }] }, { name: "And", args: [{ name: "mask", type: { kind: $.TypeKind.Basic, name: "number" } }], returns: [{ type: { kind: $.TypeKind.Basic, name: "number" } }] }, { name: "Or", args: [{ name: "mask", type: { kind: $.TypeKind.Basic, name: "number" } }], returns: [{ type: { kind: $.TypeKind.Basic, name: "number" } }] }],
	  Int64,
	  {"v": { kind: $.TypeKind.Basic, name: "number" }}
	);
}

export class Uint32 {
	public get v(): number {
		return this._fields.v.value
	}
	public set v(value: number) {
		this._fields.v.value = value
	}

	public _fields: {
		v: $.VarRef<number>;
	}

	constructor(init?: Partial<{v?: number}>) {
		this._fields = {
			v: $.varRef(init?.v ?? 0)
		}
	}

	public clone(): Uint32 {
		const cloned = new Uint32()
		cloned._fields = {
			v: $.varRef(this._fields.v.value)
		}
		return cloned
	}

	// Load atomically loads and returns the value stored in x.
	public Load(): number {
		const x = this
		return LoadUint32(x._fields.v)
	}

	// Store atomically stores val into x.
	public Store(val: number): void {
		const x = this
		StoreUint32(x._fields.v, val)
	}

	// Swap atomically stores new into x and returns the previous value.
	public Swap(_new: number): number {
		const x = this
		return SwapUint32(x._fields.v, _new)
	}

	// CompareAndSwap executes the compare-and-swap operation for x.
	public CompareAndSwap(old: number, _new: number): boolean {
		const x = this
		return CompareAndSwapUint32(x._fields.v, old, _new)
	}

	// Add atomically adds delta to x and returns the new value.
	public Add(delta: number): number {
		const x = this
		return AddUint32(x._fields.v, delta)
	}

	// And atomically performs a bitwise AND operation on x using the bitmask
	// provided as mask and returns the old value.
	public And(mask: number): number {
		const x = this
		return AndUint32(x._fields.v, mask)
	}

	// Or atomically performs a bitwise OR operation on x using the bitmask
	// provided as mask and returns the old value.
	public Or(mask: number): number {
		const x = this
		return OrUint32(x._fields.v, mask)
	}

	// Register this type with the runtime type system
	static __typeInfo = $.registerStructType(
	  'Uint32',
	  new Uint32(),
	  [{ name: "Load", args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: "number" } }] }, { name: "Store", args: [{ name: "val", type: { kind: $.TypeKind.Basic, name: "number" } }], returns: [] }, { name: "Swap", args: [{ name: "new", type: { kind: $.TypeKind.Basic, name: "number" } }], returns: [{ type: { kind: $.TypeKind.Basic, name: "number" } }] }, { name: "CompareAndSwap", args: [{ name: "old", type: { kind: $.TypeKind.Basic, name: "number" } }, { name: "new", type: { kind: $.TypeKind.Basic, name: "number" } }], returns: [{ type: { kind: $.TypeKind.Basic, name: "boolean" } }] }, { name: "Add", args: [{ name: "delta", type: { kind: $.TypeKind.Basic, name: "number" } }], returns: [{ type: { kind: $.TypeKind.Basic, name: "number" } }] }, { name: "And", args: [{ name: "mask", type: { kind: $.TypeKind.Basic, name: "number" } }], returns: [{ type: { kind: $.TypeKind.Basic, name: "number" } }] }, { name: "Or", args: [{ name: "mask", type: { kind: $.TypeKind.Basic, name: "number" } }], returns: [{ type: { kind: $.TypeKind.Basic, name: "number" } }] }],
	  Uint32,
	  {"v": { kind: $.TypeKind.Basic, name: "number" }}
	);
}

export class Uint64 {
	public get v(): number {
		return this._fields.v.value
	}
	public set v(value: number) {
		this._fields.v.value = value
	}

	public _fields: {
		v: $.VarRef<number>;
	}

	constructor(init?: Partial<{v?: number}>) {
		this._fields = {
			v: $.varRef(init?.v ?? 0)
		}
	}

	public clone(): Uint64 {
		const cloned = new Uint64()
		cloned._fields = {
			v: $.varRef(this._fields.v.value)
		}
		return cloned
	}

	// Load atomically loads and returns the value stored in x.
	public Load(): number {
		const x = this
		return LoadUint64(x._fields.v)
	}

	// Store atomically stores val into x.
	public Store(val: number): void {
		const x = this
		StoreUint64(x._fields.v, val)
	}

	// Swap atomically stores new into x and returns the previous value.
	public Swap(_new: number): number {
		const x = this
		return SwapUint64(x._fields.v, _new)
	}

	// CompareAndSwap executes the compare-and-swap operation for x.
	public CompareAndSwap(old: number, _new: number): boolean {
		const x = this
		return CompareAndSwapUint64(x._fields.v, old, _new)
	}

	// Add atomically adds delta to x and returns the new value.
	public Add(delta: number): number {
		const x = this
		return AddUint64(x._fields.v, delta)
	}

	// And atomically performs a bitwise AND operation on x using the bitmask
	// provided as mask and returns the old value.
	public And(mask: number): number {
		const x = this
		return AndUint64(x._fields.v, mask)
	}

	// Or atomically performs a bitwise OR operation on x using the bitmask
	// provided as mask and returns the old value.
	public Or(mask: number): number {
		const x = this
		return OrUint64(x._fields.v, mask)
	}

	// Register this type with the runtime type system
	static __typeInfo = $.registerStructType(
	  'Uint64',
	  new Uint64(),
	  [{ name: "Load", args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: "number" } }] }, { name: "Store", args: [{ name: "val", type: { kind: $.TypeKind.Basic, name: "number" } }], returns: [] }, { name: "Swap", args: [{ name: "new", type: { kind: $.TypeKind.Basic, name: "number" } }], returns: [{ type: { kind: $.TypeKind.Basic, name: "number" } }] }, { name: "CompareAndSwap", args: [{ name: "old", type: { kind: $.TypeKind.Basic, name: "number" } }, { name: "new", type: { kind: $.TypeKind.Basic, name: "number" } }], returns: [{ type: { kind: $.TypeKind.Basic, name: "boolean" } }] }, { name: "Add", args: [{ name: "delta", type: { kind: $.TypeKind.Basic, name: "number" } }], returns: [{ type: { kind: $.TypeKind.Basic, name: "number" } }] }, { name: "And", args: [{ name: "mask", type: { kind: $.TypeKind.Basic, name: "number" } }], returns: [{ type: { kind: $.TypeKind.Basic, name: "number" } }] }, { name: "Or", args: [{ name: "mask", type: { kind: $.TypeKind.Basic, name: "number" } }], returns: [{ type: { kind: $.TypeKind.Basic, name: "number" } }] }],
	  Uint64,
	  {"v": { kind: $.TypeKind.Basic, name: "number" }}
	);
}

export class Uintptr {
	public get v(): uintptr {
		return this._fields.v.value
	}
	public set v(value: uintptr) {
		this._fields.v.value = value
	}

	public _fields: {
		v: $.VarRef<uintptr>;
	}

	constructor(init?: Partial<{v?: uintptr}>) {
		this._fields = {
			v: $.varRef(init?.v ?? 0)
		}
	}

	public clone(): Uintptr {
		const cloned = new Uintptr()
		cloned._fields = {
			v: $.varRef(this._fields.v.value)
		}
		return cloned
	}

	// Load atomically loads and returns the value stored in x.
	public Load(): uintptr {
		const x = this
		return LoadUintptr(x._fields.v)
	}

	// Store atomically stores val into x.
	public Store(val: uintptr): void {
		const x = this
		StoreUintptr(x._fields.v, val)
	}

	// Swap atomically stores new into x and returns the previous value.
	public Swap(_new: uintptr): uintptr {
		const x = this
		return SwapUintptr(x._fields.v, _new)
	}

	// CompareAndSwap executes the compare-and-swap operation for x.
	public CompareAndSwap(old: uintptr, _new: uintptr): boolean {
		const x = this
		return CompareAndSwapUintptr(x._fields.v, old, _new)
	}

	// Add atomically adds delta to x and returns the new value.
	public Add(delta: uintptr): uintptr {
		const x = this
		return AddUintptr(x._fields.v, delta)
	}

	// And atomically performs a bitwise AND operation on x using the bitmask
	// provided as mask and returns the old value.
	public And(mask: uintptr): uintptr {
		const x = this
		return AndUintptr(x._fields.v, mask)
	}

	// Or atomically performs a bitwise OR operation on x using the bitmask
	// provided as mask and returns the updated value after the OR operation.
	public Or(mask: uintptr): uintptr {
		const x = this
		return OrUintptr(x._fields.v, mask)
	}

	// Register this type with the runtime type system
	static __typeInfo = $.registerStructType(
	  'Uintptr',
	  new Uintptr(),
	  [{ name: "Load", args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: "uintptr" } }] }, { name: "Store", args: [{ name: "val", type: { kind: $.TypeKind.Basic, name: "uintptr" } }], returns: [] }, { name: "Swap", args: [{ name: "new", type: { kind: $.TypeKind.Basic, name: "uintptr" } }], returns: [{ type: { kind: $.TypeKind.Basic, name: "uintptr" } }] }, { name: "CompareAndSwap", args: [{ name: "old", type: { kind: $.TypeKind.Basic, name: "uintptr" } }, { name: "new", type: { kind: $.TypeKind.Basic, name: "uintptr" } }], returns: [{ type: { kind: $.TypeKind.Basic, name: "boolean" } }] }, { name: "Add", args: [{ name: "delta", type: { kind: $.TypeKind.Basic, name: "uintptr" } }], returns: [{ type: { kind: $.TypeKind.Basic, name: "uintptr" } }] }, { name: "And", args: [{ name: "mask", type: { kind: $.TypeKind.Basic, name: "uintptr" } }], returns: [{ type: { kind: $.TypeKind.Basic, name: "uintptr" } }] }, { name: "Or", args: [{ name: "mask", type: { kind: $.TypeKind.Basic, name: "uintptr" } }], returns: [{ type: { kind: $.TypeKind.Basic, name: "uintptr" } }] }],
	  Uintptr,
	  {"v": { kind: $.TypeKind.Basic, name: "uintptr" }}
	);
}

class noCopy {
	public _fields: {
	}

	constructor(init?: Partial<{}>) {
		this._fields = {}
	}

	public clone(): noCopy {
		const cloned = new noCopy()
		cloned._fields = {
		}
		return cloned
	}

	// Lock is a no-op used by -copylocks checker from `go vet`.
	public Lock(): void {
	}

	public Unlock(): void {
	}

	// Register this type with the runtime type system
	static __typeInfo = $.registerStructType(
	  'noCopy',
	  new noCopy(),
	  [{ name: "Lock", args: [], returns: [] }, { name: "Unlock", args: [], returns: [] }],
	  noCopy,
	  {}
	);
}

class align64 {
	public _fields: {
	}

	constructor(init?: Partial<{}>) {
		this._fields = {}
	}

	public clone(): align64 {
		const cloned = new align64()
		cloned._fields = {
		}
		return cloned
	}

	// Register this type with the runtime type system
	static __typeInfo = $.registerStructType(
	  'align64',
	  new align64(),
	  [],
	  align64,
	  {}
	);
}


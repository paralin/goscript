import * as $ from "@goscript/builtin/index.js";
import { CompareAndSwapPointer, LoadPointer, StorePointer, SwapPointer } from "./doc.gs.js";

import * as unsafe from "@goscript/unsafe/index.js"

// Pointer type for use in efaceWords
type Pointer = any;

// firstStoreInProgress is a placeholder value used during the first store operation
const firstStoreInProgress = Symbol('firstStoreInProgress');

export class Value {
	public get v(): null | any {
		return this._fields.v.value
	}
	public set v(value: null | any) {
		this._fields.v.value = value
	}

	public _fields: {
		v: $.VarRef<null | any>;
	}

	constructor(init?: Partial<{v?: null | any}>) {
		this._fields = {
			v: $.varRef(init?.v ?? null)
		}
	}

	public clone(): Value {
		const cloned = new Value()
		cloned._fields = {
			v: $.varRef(this._fields.v.value)
		}
		return cloned
	}

	// Load returns the value set by the most recent Store.
	// It returns nil if there has been no call to Store for this Value.
	public Load(): null | any {
		const v = this
		// For JavaScript, we can simplify this since we're single-threaded
		// Just return the stored value directly
		return v._fields.v.value
	}

	// Store sets the value of the [Value] v to val.
	// All calls to Store for a given Value must use values of the same concrete type.
	// Store of an inconsistent type panics, as does Store(nil).
	public Store(val: null | any): void {
		const v = this
		if (val == null) {
			$.panic("sync/atomic: store of nil value into Value")
		}
		// For JavaScript, store the value directly
		v._fields.v.value = val
	}

	// Swap stores new into Value and returns the previous value. It returns nil if
	// the Value is empty.
	//
	// All calls to Swap for a given Value must use values of the same concrete
	// type. Swap of an inconsistent type panics, as does Swap(nil).
	public Swap(_new: null | any): null | any {
		const v = this
		if (_new == null) {
			$.panic("sync/atomic: swap of nil value into Value")
		}
		// For JavaScript, swap the values directly
		const old = v._fields.v.value
		v._fields.v.value = _new
		return old
	}

	// CompareAndSwap executes the compare-and-swap operation for the [Value].
	//
	// All calls to CompareAndSwap for a given Value must use values of the same
	// concrete type. CompareAndSwap of an inconsistent type panics, as does
	// CompareAndSwap(old, nil).
	public CompareAndSwap(old: null | any, _new: null | any): boolean {
		const v = this
		if (_new == null) {
			$.panic("sync/atomic: compare and swap of nil value into Value")
		}
		// For JavaScript, compare and swap directly
		if (v._fields.v.value === old) {
			v._fields.v.value = _new
			return true
		}
		return false
	}

	// Register this type with the runtime type system
	static __typeInfo = $.registerStructType(
	  'Value',
	  new Value(),
	  [{ name: "Load", args: [], returns: [{ type: { kind: $.TypeKind.Interface, methods: [] } }] }, { name: "Store", args: [{ name: "val", type: { kind: $.TypeKind.Interface, methods: [] } }], returns: [] }, { name: "Swap", args: [{ name: "new", type: { kind: $.TypeKind.Interface, methods: [] } }], returns: [{ type: { kind: $.TypeKind.Interface, methods: [] } }] }, { name: "CompareAndSwap", args: [{ name: "old", type: { kind: $.TypeKind.Interface, methods: [] } }, { name: "new", type: { kind: $.TypeKind.Interface, methods: [] } }], returns: [{ type: { kind: $.TypeKind.Basic, name: "boolean" } }] }],
	  Value,
	  {"v": { kind: $.TypeKind.Interface, methods: [] }}
	);
}


class efaceWords {
	public get typ(): Pointer {
		return this._fields.typ.value
	}
	public set typ(value: Pointer) {
		this._fields.typ.value = value
	}

	public get data(): Pointer {
		return this._fields.data.value
	}
	public set data(value: Pointer) {
		this._fields.data.value = value
	}

	public _fields: {
		typ: $.VarRef<Pointer>;
		data: $.VarRef<Pointer>;
	}

	constructor(init?: Partial<{data?: Pointer, typ?: Pointer}>) {
		this._fields = {
			typ: $.varRef(init?.typ ?? null),
			data: $.varRef(init?.data ?? null)
		}
	}

	public clone(): efaceWords {
		const cloned = new efaceWords()
		cloned._fields = {
			typ: $.varRef(this._fields.typ.value),
			data: $.varRef(this._fields.data.value)
		}
		return cloned
	}

	// Register this type with the runtime type system
	static __typeInfo = $.registerStructType(
	  'efaceWords',
	  new efaceWords(),
	  [],
	  efaceWords,
	  {"data": { kind: $.TypeKind.Basic, name: "Pointer" }, "typ": { kind: $.TypeKind.Basic, name: "Pointer" }}
	);
}

// Runtime functions for pinning/unpinning (no-ops in JavaScript)
export function runtime_procPin(): number {
	return 0; // No-op in JavaScript
}

export function runtime_procUnpin(): void {
	// No-op in JavaScript
}


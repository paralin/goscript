import * as $ from "@goscript/builtin/builtin.js";
import { ValueOf, valueInterface } from "./value.gs.js";
import { Type, Value, Pointer, uintptr, BasicType, Invalid } from "./reflect.gs.js";
import * as bytealg from "@goscript/internal/bytealg/index.js"

import * as unsafe from "@goscript/unsafe/index.js"

class visit {
	public get a1(): Pointer {
		return this._fields.a1.value
	}
	public set a1(value: Pointer) {
		this._fields.a1.value = value
	}

	public get a2(): Pointer {
		return this._fields.a2.value
	}
	public set a2(value: Pointer) {
		this._fields.a2.value = value
	}

	public get typ(): Type {
		return this._fields.typ.value
	}
	public set typ(value: Type) {
		this._fields.typ.value = value
	}

	public _fields: {
		a1: $.VarRef<Pointer>;
		a2: $.VarRef<Pointer>;
		typ: $.VarRef<Type>;
	}

	constructor(init?: Partial<{a1?: Pointer, a2?: Pointer, typ?: Type}>) {
		this._fields = {
			a1: $.varRef(init?.a1 ?? 0),
			a2: $.varRef(init?.a2 ?? 0),
			typ: $.varRef(init?.typ ?? new BasicType(Invalid, "invalid"))
		}
	}

	public clone(): visit {
		const cloned = new visit()
		cloned._fields = {
			a1: $.varRef(this._fields.a1.value),
			a2: $.varRef(this._fields.a2.value),
			typ: $.varRef(this._fields.typ.value)
		}
		return cloned
	}

	// Register this type with the runtime type system
	static __typeInfo = $.registerStructType(
	  'visit',
	  new visit(),
	  [],
	  visit,
	  {"a1": { kind: $.TypeKind.Basic, name: "Pointer" }, "a2": { kind: $.TypeKind.Basic, name: "Pointer" }, "typ": "Type"}
	);
}

// Tests for deep equality using reflected types. The map argument tracks
// comparisons that have already been seen, which allows short circuiting on
// recursive types.
export function deepValueEqual(v1: Value, v2: Value, visited: Map<visit, boolean>): boolean {
	if (!v1.IsValid() || !v2.IsValid()) {
		return v1.IsValid() == v2.IsValid()
	}
	if (v1.Type() != v2.Type()) {
		return false
	}

	// We want to avoid putting more in the visited map than we need to.
	// For any possible reference cycle that might be encountered,
	// hard(v1, v2) needs to return true for at least one of the types in the cycle,
	// and it's safe and valid to get Value's internal pointer.

	// not-in-heap pointers can't be cyclic.
	// At least, all of our current uses of internal/runtime/sys.NotInHeap
	// have that property. The runtime ones aren't cyclic (and we don't use
	// DeepEqual on them anyway), and the cgo-generated ones are
	// all empty structs.

	// Nil pointers cannot be cyclic. Avoid putting them in the visited map.
	let hard = (v1: Value, v2: Value): boolean => {

		// not-in-heap pointers can't be cyclic.
		// At least, all of our current uses of internal/runtime/sys.NotInHeap
		// have that property. The runtime ones aren't cyclic (and we don't use
		// DeepEqual on them anyway), and the cgo-generated ones are
		// all empty structs.

		// Nil pointers cannot be cyclic. Avoid putting them in the visited map.
		switch (v1.Kind().valueOf()) {
			case 22:
				if (!v1.typ()!.Pointers()) {
					// not-in-heap pointers can't be cyclic.
					// At least, all of our current uses of internal/runtime/sys.NotInHeap
					// have that property. The runtime ones aren't cyclic (and we don't use
					// DeepEqual on them anyway), and the cgo-generated ones are
					// all empty structs.
					return false
				}
				// fallthrough // fallthrough statement skipped
				break
			case 21:
			case 23:
			case 20:
				return !v1.IsNil() && !v2.IsNil()
				break
		}
		return false
	}

	// For a Pointer or Map value, we need to check flagIndir,
	// which we do by calling the pointer method.
	// For Slice or Interface, flagIndir is always set,
	// and using v.ptr suffices.

	// Canonicalize order to reduce number of entries in visited.
	// Assumes non-moving garbage collector.

	// Short circuit if references are already seen.

	// Remember for later.
	if (hard!(v1, v2)) {
		// For a Pointer or Map value, we need to check flagIndir,
		// which we do by calling the pointer method.
		// For Slice or Interface, flagIndir is always set,
		// and using v.ptr suffices.
		let ptrval = (v: Value): Pointer => {
			switch (v.Kind().valueOf()) {
				case 22:
				case 21:
					return v.pointer()
					break
				default:
					return v.ptr
					break
			}
		}
		let addr1 = ptrval!(v1)
		let addr2 = ptrval!(v2)

		// Canonicalize order to reduce number of entries in visited.
		// Assumes non-moving garbage collector.
		if ((addr1 as uintptr) > (addr2 as uintptr)) {
			// Canonicalize order to reduce number of entries in visited.
			// Assumes non-moving garbage collector.
			[addr1, addr2] = [addr2, addr1]
		}

		// Short circuit if references are already seen.
		let typ = v1.Type()
		let v = new visit({})
		if ($.mapGet(visited, v, false)[0]) {
			return true
		}

		// Remember for later.
		$.mapSet(visited, v, true)
	}

	// Special case for []byte, which is common.

	// Can't do better than this:

	// Normal equality suffices
	switch (v1.Kind().valueOf()) {
		case 17:
			for (let i = 0; i < v1.Len(); i++) {
				if (!deepValueEqual(v1.Index(i), v2.Index(i), visited)) {
					return false
				}
			}
			return true
			break
		case 23:
			if (v1.IsNil() != v2.IsNil()) {
				return false
			}
			if (v1.Len() != v2.Len()) {
				return false
			}
			if (v1.UnsafePointer() == v2.UnsafePointer()) {
				return true
			}
			const elemType = v1.Type().Elem;
			if (elemType && elemType()?.Kind().valueOf() == 8) {
				return bytealg.Equal(v1.Bytes(), v2.Bytes())
			}
			for (let i = 0; i < v1.Len(); i++) {
				if (!deepValueEqual(v1.Index(i), v2.Index(i), visited)) {
					return false
				}
			}
			return true
			break
		case 20:
			if (v1.IsNil() || v2.IsNil()) {
				return v1.IsNil() == v2.IsNil()
			}
			return deepValueEqual(v1.Elem(), v2.Elem(), visited)
			break
		case 22:
			if (v1.UnsafePointer() == v2.UnsafePointer()) {
				return true
			}
			return deepValueEqual(v1.Elem(), v2.Elem(), visited)
			break
		case 25:
			for (let i = 0, n = v1.NumField(); i < n; i++) {
				if (!deepValueEqual(v1.Field(i), v2.Field(i), visited)) {
					return false
				}
			}
			return true
			break
		case 21:
			if (v1.IsNil() != v2.IsNil()) {
				return false
			}
			if (v1.Len() != v2.Len()) {
				return false
			}
			if (v1.UnsafePointer() == v2.UnsafePointer()) {
				return true
			}
			let iter = v1.MapRange()
			for (; iter!.Next(); ) {
				let val1 = iter!.Value().clone()
				let val2 = v2.MapIndex(iter!.Key()).clone()
				if (!val1.IsValid() || !val2.IsValid() || !deepValueEqual(val1, val2, visited)) {
					return false
				}
			}
			return true
			break
		case 19:
			if (v1.IsNil() && v2.IsNil()) {
				return true
			}
			return false
			break
		case 2:
		case 3:
		case 4:
		case 5:
		case 6:
			return v1.Int() == v2.Int()
			break
		case 7:
		case 8:
		case 9:
		case 10:
		case 11:
		case 12:
			return v1.Uint() == v2.Uint()
			break
		case 24:
			return v1.String() == v2.String()
			break
		case 1:
			return v1.Bool() == v2.Bool()
			break
		case 13:
		case 14:
			return v1.Float() == v2.Float()
			break
		case 15:
		case 16:
			return v1.Complex() == v2.Complex()
			break
		default:
			return valueInterface(v1, false) == valueInterface(v2, false)
			break
	}
}

// DeepEqual reports whether x and y are "deeply equal," defined as follows.
// Two values of identical type are deeply equal if one of the following cases applies.
// Values of distinct types are never deeply equal.
//
// Array values are deeply equal when their corresponding elements are deeply equal.
//
// Struct values are deeply equal if their corresponding fields,
// both exported and unexported, are deeply equal.
//
// Func values are deeply equal if both are nil; otherwise they are not deeply equal.
//
// Interface values are deeply equal if they hold deeply equal concrete values.
//
// Map values are deeply equal when all of the following are true:
// they are both nil or both non-nil, they have the same length,
// and either they are the same map object or their corresponding keys
// (matched using Go equality) map to deeply equal values.
//
// Pointer values are deeply equal if they are equal using Go's == operator
// or if they point to deeply equal values.
//
// Slice values are deeply equal when all of the following are true:
// they are both nil or both non-nil, they have the same length,
// and either they point to the same initial entry of the same underlying array
// (that is, &x[0] == &y[0]) or their corresponding elements (up to length) are deeply equal.
// Note that a non-nil empty slice and a nil slice (for example, []byte{} and []byte(nil))
// are not deeply equal.
//
// Other values - numbers, bools, strings, and channels - are deeply equal
// if they are equal using Go's == operator.
//
// In general DeepEqual is a recursive relaxation of Go's == operator.
// However, this idea is impossible to implement without some inconsistency.
// Specifically, it is possible for a value to be unequal to itself,
// either because it is of func type (uncomparable in general)
// or because it is a floating-point NaN value (not equal to itself in floating-point comparison),
// or because it is an array, struct, or interface containing
// such a value.
// On the other hand, pointer values are always equal to themselves,
// even if they point at or contain such problematic values,
// because they compare equal using Go's == operator, and that
// is a sufficient condition to be deeply equal, regardless of content.
// DeepEqual has been defined so that the same short-cut applies
// to slices and maps: if x and y are the same slice or the same map,
// they are deeply equal regardless of content.
//
// As DeepEqual traverses the data values it may find a cycle. The
// second and subsequent times that DeepEqual compares two pointer
// values that have been compared before, it treats the values as
// equal rather than examining the values to which they point.
// This ensures that DeepEqual terminates.
export function DeepEqual(x: null | any, y: null | any): boolean {
	if (x == null || y == null) {
		return x == y
	}
	let v1 = ValueOf(x).clone()
	let v2 = ValueOf(y).clone()
	if (v1.Type() != v2.Type()) {
		return false
	}
	return deepValueEqual(v1, v2, $.makeMap<visit, boolean>())
}


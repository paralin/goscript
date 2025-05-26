// Generated file based on generics.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as $ from "@goscript/builtin/builtin.js";

// Generic function with any constraint
export function printVal<T extends any>(val: T): void {
	console.log(val)
}

// Generic function with comparable constraint
export function equal<T extends $.Comparable>(a: T, b: T): boolean {
	return a == b
}

// Generic function with union constraint
export function getLength<S extends string | $.Bytes>(s: S): number {
	return $.len(s)
}

export class Pair<T extends any> {
	public get First(): T {
		return this._fields.First.value
	}
	public set First(value: T) {
		this._fields.First.value = value
	}

	public get Second(): T {
		return this._fields.Second.value
	}
	public set Second(value: T) {
		this._fields.Second.value = value
	}

	public _fields: {
		First: $.VarRef<T>;
		Second: $.VarRef<T>;
	}

	constructor(init?: Partial<{First?: T, Second?: T}>) {
		this._fields = {
			First: $.varRef(init?.First ?? null as any),
			Second: $.varRef(init?.Second ?? null as any)
		}
	}

	public clone(): Pair<T> {
		const cloned = new Pair<T>()
		cloned._fields = {
			First: $.varRef(this._fields.First.value),
			Second: $.varRef(this._fields.Second.value)
		}
		return cloned
	}

	public GetFirst(): T {
		const p = this
		return p.First
	}

	// Register this type with the runtime type system
	static __typeInfo = $.registerStructType(
	  'Pair',
	  new Pair(),
	  [{ name: "GetFirst", args: [], returns: [{ type: { kind: $.TypeKind.Interface, methods: [] } }] }],
	  Pair,
	  {"First": { kind: $.TypeKind.Interface, methods: [] }, "Second": { kind: $.TypeKind.Interface, methods: [] }}
	);
}

// Generic function returning a generic struct
export function makePair<T extends any>(a: T, b: T): Pair<T> {
	return new Pair<T>({First: a, Second: b})
}

// Generic slice operations
export function append2<T extends any>(slice: $.Slice<T>, elem: T): $.Slice<T> {
	return $.append(slice, elem)
}

export async function main(): Promise<void> {
	// Test basic generic function
	console.log("=== Basic Generic Function ===")
	printVal(42)
	printVal("hello")
	printVal(true)

	// Test comparable constraint
	console.log("=== Comparable Constraint ===")
	console.log(equal(1, 1))
	console.log(equal(1, 2))
	console.log(equal("hello", "hello"))
	console.log(equal("hello", "world"))

	// Test union constraint with string
	console.log("=== Union Constraint ===")
	let str = "hello"
	console.log(getLength(str))

	// Test union constraint with []byte
	let bytes = $.stringToBytes("world")
	console.log(getLength(bytes))

	// Test generic struct
	console.log("=== Generic Struct ===")
	let intPair = makePair(10, 20).clone()
	console.log(intPair.GetFirst())
	console.log(intPair.First)
	console.log(intPair.Second)

	let stringPair = makePair("foo", "bar").clone()
	console.log(stringPair.GetFirst())
	console.log(stringPair.First)
	console.log(stringPair.Second)

	// Test generic slice operations
	console.log("=== Generic Slice Operations ===")
	let nums = $.arrayToSlice<number>([1, 2, 3])
	nums = append2(nums, 4)
	for (let _i = 0; _i < $.len(nums); _i++) {
		const n = nums![_i]
		{
			console.log(n)
		}
	}

	let words = $.arrayToSlice<string>(["a", "b"])
	words = append2(words, "c")
	for (let _i = 0; _i < $.len(words); _i++) {
		const w = words![_i]
		{
			console.log(w)
		}
	}

	// Test type inference
	console.log("=== Type Inference ===")
	let result = makePair(100, 200).clone()
	console.log(result.First)
	console.log(result.Second)
}


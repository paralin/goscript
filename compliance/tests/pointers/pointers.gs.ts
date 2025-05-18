// Generated file based on pointers.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as $ from "@goscript/builtin";

class MyStruct {
	public get Val(): number {
		return this._fields.Val.value
	}
	public set Val(value: number) {
		this._fields.Val.value = value
	}

	public _fields: {
		Val: $.Box<number>;
	}

	constructor(init?: Partial<{Val?: number}>) {
		this._fields = {
			Val: $.box(init?.Val ?? 0)
		}
	}

	public clone(): MyStruct {
		const cloned = new MyStruct()
		cloned._fields = {
			Val: $.box(this._fields.Val.value)
		}
		return cloned
	}

	// Register this type with the runtime type system
	static __typeInfo = $.registerStructType(
	  'MyStruct',
	  new MyStruct(),
	  [],
	  MyStruct,
	  {"Val": { kind: $.TypeKind.Basic, name: "number" }}
	);
}

export function main(): void {
	let s1: $.Box<MyStruct> = $.box(new MyStruct({Val: 1}))
	let s2: $.Box<MyStruct> = $.box(new MyStruct({Val: 2}))

	let p1: $.Box<$.Box<MyStruct> | null> = $.box(s1)
	let p2: $.Box<$.Box<MyStruct> | null> = $.box(s1)
	let p3: $.Box<$.Box<MyStruct> | null> = $.box(s2)

	let p4 = s1
	/* _ = */ p4!.value

	let pp1: $.Box<$.Box<$.Box<MyStruct> | null> | null> = $.box(p1)
	let pp2 = p2
	let pp3 = p3

	let ppp1 = pp1

	console.log("--- Initial Values ---")
	console.log("s1.Val:", s1!.value.Val) // 1
	console.log("s2.Val:", s2!.value.Val) // 2
	console.log("p1==p2:", (p1!.value === p2!.value)) // true
	console.log("p1==p3:", (p1!.value === p3!.value)) // false

	// --- Pointer Comparisons ---
	console.log("\n--- Pointer Comparisons ---")
	console.log("pp1==pp2:", (pp1!.value === pp2)) // false
	console.log("pp1==pp3:", (pp1!.value === pp3)) // false
	console.log("*pp1==*pp2:", (pp1!.value!.value === pp2!.value)) // true
	console.log("*pp1==*pp3:", (pp1!.value!.value === pp3!.value)) // false
	console.log("(**pp1).Val == (**pp2).Val:", pp1!.value!.value!.Val == pp2!.value!.Val) // true
	console.log("(**pp1).Val == (**pp3).Val:", pp1!.value!.value!.Val == pp3!.value!.Val) // false

	// Triple pointer comparisons
	console.log("ppp1==ppp1:", (ppp1 === ppp1)) // true
	console.log("*ppp1==pp1:", (ppp1!.value === pp1!.value)) // true
	console.log("**ppp1==p1:", (ppp1!.value!.value === p1!.value)) // true
	console.log("(***ppp1).Val == s1.Val:", ppp1!.value!.value!.Val == s1!.value.Val) // true

	// --- Modifications through Pointers ---
	console.log("\n--- Modifications ---")
	p1!.value!.value = new MyStruct({Val: 10})
	console.log("After *p1 = {Val: 10}:")
	console.log("  s1.Val:", s1!.value.Val) // 10
	console.log("  (*p2).Val:", p2!.value!.value.Val) // 10
	console.log("  (**pp1).Val:", pp1!.value!.value!.Val) // 10
	console.log("  (***ppp1).Val:", ppp1!.value!.value!.Val) // 10
	console.log("  s2.Val:", s2!.value.Val) // 2 (unmodified)

	pp3!.value!.value = new MyStruct({Val: 20})
	console.log("After **pp3 = {Val: 20}:")
	console.log("  s2.Val:", s2!.value.Val) // 20
	console.log("  (*p3).Val:", p3!.value!.value.Val) // 20
	console.log("  s1.Val:", s1!.value.Val) // 10 (unmodified)

	// --- Nil Pointers ---
	console.log("\n--- Nil Pointers ---")
	let np: $.Box<$.Box<MyStruct> | null> = $.box(null)
	let npp: $.Box<$.Box<MyStruct> | null> | null = null
	let nppp: $.Box<$.Box<$.Box<MyStruct> | null> | null> | null = null

	console.log("np == nil:", np!.value == null) // true
	console.log("npp == nil:", npp == null) // true
	console.log("nppp == nil:", nppp == null) // true

	npp = np
	console.log("After npp = &np:")
	console.log("  npp == nil:", npp == null) // false
	console.log("  *npp == nil:", npp!.value == null) // true
}


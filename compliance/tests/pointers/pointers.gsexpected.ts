import * as goscript from "@goscript/builtin"

// Based on design/BOXES_POINTERS.md and compliance/tests/pointers/pointers.go
// This file represents the expected GoScript output for pointers.go.
// This is carefully hand-written file, do not edit!

class MyStruct {
	public Val: number

	constructor(init?: Partial<{Val?: number}>) {
		this.Val = init?.Val ?? 0
	}

	public clone(): MyStruct {
		return new MyStruct({
			Val: this.Val,
		})
	}

	// Register this type with the runtime type system
	static __typeInfo = goscript.registerType(
	  'MyStruct',
	  goscript.TypeKind.Struct,
	  new MyStruct(),
	  new Set([]),
	  MyStruct
	);
}

export function main(): void {
	// s1 := MyStruct{Val: 1} // p1 takes the address of s1, so s1 is boxed
	let s1: goscript.Box<MyStruct> = goscript.box(new MyStruct({}))
	// s2 := MyStruct{Val: 2} // p2 takes the address of s2, so s2 is boxed
	let s2: goscript.Box<MyStruct> = goscript.box(new MyStruct({}))

	// p1 := &s1 // *MyStruct, points to s1, pp1 takes the address of p1, so p1 is boxed
	let p1: goscript.Box<goscript.Box<MyStruct> | null> = goscript.box(s1)
	// p2 := &s1 // *MyStruct, points to s1, pp2 takes the address of p2, so p1 is boxed
	let p2: goscript.Box<goscript.Box<MyStruct> | null> = goscript.box(s1)
	// p3 := &s2 // *MyStruct, points to s2, pp3 takes the address of p3, so p1 is boxed
	let p3: goscript.Box<goscript.Box<MyStruct> | null>  = goscript.box(s2)

	// p4 := &s1 // *MyStruct, points to s1, nothing takes the address of p4, so p4 is not boxed
	let p4: goscript.Box<MyStruct> | null = s1
	let _ = p4; // @ts-ignore

	// pp1 := &p1 // **MyStruct, points to p1
	// note: type follows the form: goscript.Box<typeof p1 | null>
	let pp1: goscript.Box<goscript.Box<goscript.Box<MyStruct> | null> | null> = goscript.box(p1)
	// pp2 := &p2 // **MyStruct, points to p2
	let pp2: goscript.Box<goscript.Box<goscript.Box<MyStruct> | null> | null> = goscript.box(p2)
	// pp3 := &p3 // **MyStruct, points to p3
	let pp3: goscript.Box<goscript.Box<goscript.Box<MyStruct> | null> | null> = goscript.box(p3)

	// ppp1 := &pp1 // ***MyStruct, points to pp1, not boxed as nothing takes address of ppp1
	// note: type follows the form: typeof pp1 | null
	let ppp1: goscript.Box<goscript.Box<goscript.Box<MyStruct> | null> | null> | null = pp1

	// TODO: translate rest of the file
}
// Generated file based on function_type_assertion.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as $ from "@goscript/builtin/index.js";

export type Greeter = ((name: string) => string) | null;

export type Adder = ((a: number, b: number) => number) | null;

export function greet(name: string): string {
	return "Hello, " + name
}

export function add(a: number, b: number): number {
	return a + b
}

export function getGreeter(): null | any {
	return Object.assign(greet, { __goTypeName: 'Greeter' })
}

export function getAdder(): null | any {
	return Object.assign(add, { __goTypeName: 'Adder' })
}

export class FuncContainer {
	public get myFunc(): null | any {
		return this._fields.myFunc.value
	}
	public set myFunc(value: null | any) {
		this._fields.myFunc.value = value
	}

	public _fields: {
		myFunc: $.VarRef<null | any>;
	}

	constructor(init?: Partial<{myFunc?: null | any}>) {
		this._fields = {
			myFunc: $.varRef(init?.myFunc ?? null)
		}
	}

	public clone(): FuncContainer {
		const cloned = new FuncContainer()
		cloned._fields = {
			myFunc: $.varRef(this._fields.myFunc.value)
		}
		return cloned
	}

	// Register this type with the runtime type system
	static __typeInfo = $.registerStructType(
	  'FuncContainer',
	  new FuncContainer(),
	  [],
	  FuncContainer,
	  {"myFunc": { kind: $.TypeKind.Interface, methods: [] }}
	);
}

export async function main(): Promise<void> {
	// 1. Simple function type assertion
	let i: null | any = Object.assign(greet, { __goTypeName: 'Greeter' })
	let { value: fn, ok: ok } = $.typeAssert<Greeter | null>(i, {kind: $.TypeKind.Function, name: 'Greeter', params: [{ kind: $.TypeKind.Basic, name: "string" }], results: [{ kind: $.TypeKind.Basic, name: "string" }]})
	if (ok) {
		console.log(fn!("World"))
	} else {
		console.log("Simple assertion failed")
	}

	let j: null | any = Object.assign(add, { __goTypeName: 'Adder' })
	let addFn: Adder | null
	({ value: addFn, ok: ok } = $.typeAssert<Adder | null>(j, {kind: $.TypeKind.Function, name: 'Adder', params: [{ kind: $.TypeKind.Basic, name: "number" }, { kind: $.TypeKind.Basic, name: "number" }], results: [{ kind: $.TypeKind.Basic, name: "number" }]}))
	if (ok) {
		console.log(addFn!(5, 3))
	} else {
		console.log("Simple adder assertion failed")
	}

	// 2. Type assertion of a function returned from another function
	let returnedFn = getGreeter()
	let greetFn: Greeter | null
	({ value: greetFn, ok: ok } = $.typeAssert<Greeter | null>(returnedFn, {kind: $.TypeKind.Function, name: 'Greeter', params: [{ kind: $.TypeKind.Basic, name: "string" }], results: [{ kind: $.TypeKind.Basic, name: "string" }]}))
	if (ok) {
		console.log(greetFn!("Gopher"))
	} else {
		console.log("Returned function assertion failed")
	}

	let returnedAdder = getAdder()
	let addFnFromFunc: Adder | null
	({ value: addFnFromFunc, ok: ok } = $.typeAssert<Adder | null>(returnedAdder, {kind: $.TypeKind.Function, name: 'Adder', params: [{ kind: $.TypeKind.Basic, name: "number" }, { kind: $.TypeKind.Basic, name: "number" }], results: [{ kind: $.TypeKind.Basic, name: "number" }]}))
	if (ok) {
		console.log(addFnFromFunc!(10, 20))
	} else {
		console.log("Returned adder assertion failed")
	}

	// 3. Type assertion of a function in a struct field
	let container = new FuncContainer({myFunc: Object.assign(greet, { __goTypeName: 'Greeter' })})
	let structFn: Greeter | null
	({ value: structFn, ok: ok } = $.typeAssert<Greeter | null>(container.myFunc, {kind: $.TypeKind.Function, name: 'Greeter', params: [{ kind: $.TypeKind.Basic, name: "string" }], results: [{ kind: $.TypeKind.Basic, name: "string" }]}))
	if (ok) {
		console.log(structFn!("Struct"))
	} else {
		console.log("Struct function assertion failed")
	}

	let adderContainer = new FuncContainer({myFunc: Object.assign(add, { __goTypeName: 'Adder' })})
	let structAdderFn: Adder | null
	({ value: structAdderFn, ok: ok } = $.typeAssert<Adder | null>(adderContainer.myFunc, {kind: $.TypeKind.Function, name: 'Adder', params: [{ kind: $.TypeKind.Basic, name: "number" }, { kind: $.TypeKind.Basic, name: "number" }], results: [{ kind: $.TypeKind.Basic, name: "number" }]}))
	if (ok) {
		console.log(structAdderFn!(7, 8))
	} else {
		console.log("Struct adder assertion failed")
	}

	// 4. Type assertion of a function in a map
	let funcMap = $.makeMap<string, null | any>()
	$.mapSet(funcMap, "greeter", Object.assign(greet, { __goTypeName: 'Greeter' }))
	$.mapSet(funcMap, "adder", Object.assign(add, { __goTypeName: 'Adder' }))

	let mapFn: Greeter | null
	({ value: mapFn, ok: ok } = $.typeAssert<Greeter | null>($.mapGet(funcMap, "greeter", null)[0], {kind: $.TypeKind.Function, name: 'Greeter', params: [{ kind: $.TypeKind.Basic, name: "string" }], results: [{ kind: $.TypeKind.Basic, name: "string" }]}))
	if (ok) {
		console.log(mapFn!("Map"))
	} else {
		console.log("Map function assertion failed")
	}

	let mapAdderFn: Adder | null
	({ value: mapAdderFn, ok: ok } = $.typeAssert<Adder | null>($.mapGet(funcMap, "adder", null)[0], {kind: $.TypeKind.Function, name: 'Adder', params: [{ kind: $.TypeKind.Basic, name: "number" }, { kind: $.TypeKind.Basic, name: "number" }], results: [{ kind: $.TypeKind.Basic, name: "number" }]}))
	if (ok) {
		console.log(mapAdderFn!(1, 2))
	} else {
		console.log("Map adder assertion failed")
	}

	// 5. Type assertion of a function in a slice
	let funcSlice = $.makeSlice<null | any>(2)
	funcSlice![0] = Object.assign(greet, { __goTypeName: 'Greeter' })
	funcSlice![1] = Object.assign(add, { __goTypeName: 'Adder' })

	let sliceFn: Greeter | null
	({ value: sliceFn, ok: ok } = $.typeAssert<Greeter | null>(funcSlice![0], {kind: $.TypeKind.Function, name: 'Greeter', params: [{ kind: $.TypeKind.Basic, name: "string" }], results: [{ kind: $.TypeKind.Basic, name: "string" }]}))
	if (ok) {
		console.log(sliceFn!("Slice"))
	} else {
		console.log("Slice function assertion failed")
	}
	let sliceAdderFn: Adder | null
	({ value: sliceAdderFn, ok: ok } = $.typeAssert<Adder | null>(funcSlice![1], {kind: $.TypeKind.Function, name: 'Adder', params: [{ kind: $.TypeKind.Basic, name: "number" }, { kind: $.TypeKind.Basic, name: "number" }], results: [{ kind: $.TypeKind.Basic, name: "number" }]}))
	if (ok) {
		console.log(sliceAdderFn!(9, 9))
	} else {
		console.log("Slice adder assertion failed")
	}

	// 6. Type assertion with ok variable (successful and failing)
	let k: null | any = Object.assign(greet, { __goTypeName: 'Greeter' })
	let { ok: ok1 } = $.typeAssert<Greeter | null>(k, {kind: $.TypeKind.Function, name: 'Greeter', params: [{ kind: $.TypeKind.Basic, name: "string" }], results: [{ kind: $.TypeKind.Basic, name: "string" }]})
	console.log(ok1) // true

	let { ok: ok2 } = $.typeAssert<Adder | null>(k, {kind: $.TypeKind.Function, name: 'Adder', params: [{ kind: $.TypeKind.Basic, name: "number" }, { kind: $.TypeKind.Basic, name: "number" }], results: [{ kind: $.TypeKind.Basic, name: "number" }]})
	console.log(ok2) // false

	let l: null | any = "not a function"
	let { ok: ok3 } = $.typeAssert<Greeter | null>(l, {kind: $.TypeKind.Function, name: 'Greeter', params: [{ kind: $.TypeKind.Basic, name: "string" }], results: [{ kind: $.TypeKind.Basic, name: "string" }]})
	console.log(ok3) // false

	// 7. Type assertion that should panic (commented out for now to allow test to run)
	// defer func() {
	// 	if r := recover(); r != nil {
	// 		println("Panic caught as expected")
	// 	}
	// }()
	// var m interface{} = "definitely not a func"
	// _ = m.(Greeter) // This would panic
	// println("This line should not be reached if panic test is active")

	// Test with nil interface
	let nilInterface: null | any = null
	let { value: nilFn, ok: okNil } = $.typeAssert<Greeter | null>(nilInterface, {kind: $.TypeKind.Function, name: 'Greeter', params: [{ kind: $.TypeKind.Basic, name: "string" }], results: [{ kind: $.TypeKind.Basic, name: "string" }]})
	if (!okNil && nilFn == null) {
		console.log("Nil interface assertion correct")
	} else {
		console.log("Nil interface assertion failed")
	}

	// Test assertion to wrong function type
	let wrongFnInterface: null | any = Object.assign(greet, { __goTypeName: 'Greeter' })
	let { value: wrongFn, ok: okWrong } = $.typeAssert<Adder | null>(wrongFnInterface, {kind: $.TypeKind.Function, name: 'Adder', params: [{ kind: $.TypeKind.Basic, name: "number" }, { kind: $.TypeKind.Basic, name: "number" }], results: [{ kind: $.TypeKind.Basic, name: "number" }]})
	if (!okWrong && wrongFn == null) {
		console.log("Wrong function type assertion correct")
	} else {
		console.log("Wrong function type assertion failed")
	}
}


// Generated file based on function_type_assertion.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as $ from "@goscript/builtin";

type Greeter = ((name: string) => string) | null;

type Adder = ((a: number, b: number) => number) | null;

function greet(name: string): string {
	return "Hello, " + name
}

function add(a: number, b: number): number {
	return a + b
}

function getGreeter(): null | any {
	return (greet as Greeter)
}

function getAdder(): null | any {
	return (add as Adder)
}

class FuncContainer {
	public get myFunc(): null | any {
		return this._fields.myFunc.value
	}
	public set myFunc(value: null | any) {
		this._fields.myFunc.value = value
	}

	public _fields: {
		myFunc: $.Box<null | any>;
	}

	constructor(init?: Partial<{myFunc?: null | any}>) {
		this._fields = {
			myFunc: $.box(init?.myFunc ?? null)
		}
	}

	public clone(): FuncContainer {
		const cloned = new FuncContainer()
		cloned._fields = {
			myFunc: $.box(this._fields.myFunc.value)
		}
		return cloned
	}

	// Register this type with the runtime type system
	static __typeInfo = $.registerStructType(
	  'FuncContainer',
	  new FuncContainer(),
	  new Set([]),
	  FuncContainer
	);
}

export function main(): void {
	// 1. Simple function type assertion
	let i: null | any = (greet as Greeter)
	let { value: fn, ok: ok } = $.typeAssert<Greeter>(i, 'Greeter')
	if (ok) {
		console.log(fn!("World"))
	} else {
		console.log("Simple assertion failed")
	}

	let j: null | any = (add as Adder)
	let addFn: Adder
	;({ value: addFn, ok: ok } = $.typeAssert<Adder>(j, 'Adder')
	if (ok) {
		console.log(addFn!(5, 3))
	} else {
		console.log("Simple adder assertion failed")
	}

	// 2. Type assertion of a function returned from another function
	let returnedFn = getGreeter()
	let greetFn: Greeter
	;({ value: greetFn, ok: ok } = $.typeAssert<Greeter>(returnedFn, 'Greeter')
	if (ok) {
		console.log(greetFn!("Gopher"))
	} else {
		console.log("Returned function assertion failed")
	}

	let returnedAdder = getAdder()
	let addFnFromFunc: Adder
	;({ value: addFnFromFunc, ok: ok } = $.typeAssert<Adder>(returnedAdder, 'Adder')
	if (ok) {
		console.log(addFnFromFunc!(10, 20))
	} else {
		console.log("Returned adder assertion failed")
	}

	// 3. Type assertion of a function in a struct field
	let container = new FuncContainer({myFunc: (greet as Greeter)})
	let structFn: Greeter
	;({ value: structFn, ok: ok } = $.typeAssert<Greeter>(container.myFunc, 'Greeter')
	if (ok) {
		console.log(structFn!("Struct"))
	} else {
		console.log("Struct function assertion failed")
	}

	let adderContainer = new FuncContainer({myFunc: (add as Adder)})
	let structAdderFn: Adder
	;({ value: structAdderFn, ok: ok } = $.typeAssert<Adder>(adderContainer.myFunc, 'Adder')
	if (ok) {
		console.log(structAdderFn!(7, 8))
	} else {
		console.log("Struct adder assertion failed")
	}

	// 4. Type assertion of a function in a map
	let funcMap = $.makeMap<string, null | any>()
	$.mapSet(funcMap, "greeter", (greet as Greeter))
	$.mapSet(funcMap, "adder", (add as Adder))

	let mapFn: Greeter
	;({ value: mapFn, ok: ok } = $.typeAssert<Greeter>($.mapGet(funcMap, "greeter", null), 'Greeter')
	if (ok) {
		console.log(mapFn!("Map"))
	} else {
		console.log("Map function assertion failed")
	}

	let mapAdderFn: Adder
	;({ value: mapAdderFn, ok: ok } = $.typeAssert<Adder>($.mapGet(funcMap, "adder", null), 'Adder')
	if (ok) {
		console.log(mapAdderFn!(1, 2))
	} else {
		console.log("Map adder assertion failed")
	}

	// 5. Type assertion of a function in a slice
	let funcSlice = $.makeSlice<null | any>(2)
	funcSlice![0] = (greet as Greeter)
	funcSlice![1] = (add as Adder)

	let sliceFn: Greeter
	;({ value: sliceFn, ok: ok } = $.typeAssert<Greeter>(funcSlice![0], 'Greeter')
	if (ok) {
		console.log(sliceFn!("Slice"))
	} else {
		console.log("Slice function assertion failed")
	}
	let sliceAdderFn: Adder
	;({ value: sliceAdderFn, ok: ok } = $.typeAssert<Adder>(funcSlice![1], 'Adder')
	if (ok) {
		console.log(sliceAdderFn!(9, 9))
	} else {
		console.log("Slice adder assertion failed")
	}

	// 6. Type assertion with ok variable (successful and failing)
	let k: null | any = (greet as Greeter)
	let { ok: ok1 } = $.typeAssert<Greeter>(k, 'Greeter')
	console.log(ok1) // true

	let { ok: ok2 } = $.typeAssert<Adder>(k, 'Adder')
	console.log(ok2) // false

	let l: null | any = "not a function"
	let { ok: ok3 } = $.typeAssert<Greeter>(l, 'Greeter')
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
	let { value: nilFn, ok: okNil } = $.typeAssert<Greeter>(nilInterface, 'Greeter')
	if (!okNil && nilFn == null) {
		console.log("Nil interface assertion correct")
	} else {
		console.log("Nil interface assertion failed")
	}

	// Test assertion to wrong function type
	let wrongFnInterface: null | any = (greet as Greeter)
	let { value: wrongFn, ok: okWrong } = $.typeAssert<Adder>(wrongFnInterface, 'Adder')
	if (!okWrong && wrongFn == null) {
		console.log("Wrong function type assertion correct")
	} else {
		console.log("Wrong function type assertion failed")
	}
}


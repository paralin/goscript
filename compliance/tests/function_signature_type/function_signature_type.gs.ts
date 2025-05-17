// Generated file based on function_signature_type.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as $ from "@goscript/builtin";

type Func1 = ((a: number, b: string) => [boolean, $.GoError]) | null;

let fn1: Func1 = null

type Func2 = ((p0: number, p1: string) => boolean) | null;

let fn2: Func2 = null

type Func3 = (() => void) | null;

let fn3: Func3 = null

type Func4 = ((a: number, ...b: string[]) => void) | null;

let fn4: Func4 = null

class MyError {
	public get s(): string {
		return this._fields.s.value
	}
	public set s(value: string) {
		this._fields.s.value = value
	}

	public _fields: {
		s: $.Box<string>;
	}

	constructor(init?: Partial<{s?: string}>) {
		this._fields = {
			s: $.box(init?.s ?? "")
		}
	}

	public clone(): MyError {
		const cloned = new MyError()
		cloned._fields = {
			s: $.box(this._fields.s.value)
		}
		return cloned
	}

	public Error(): string {
		const e = this
		return e.s
	}

	// Register this type with the runtime type system
	static __typeInfo = $.registerStructType(
	  'MyError',
	  new MyError(),
	  new Set(["Error"]),
	  MyError,
	  {s: "string"}
	);
}

export function NewMyError(text: string): $.Box<MyError> | null {
	return new MyError({s: text})
}

export function main(): void {
	fn1 = (a: number, b: string): [boolean, $.GoError] => {
		console.log("fn1 called with:", a, b)
		if (a > 0) {
			return [true, null]
		}
		return [false, NewMyError("a was not positive")]
	}


	fn2 = (p0: number, p1: string): boolean => {
		console.log("fn2 called with:", p0, p1)
		return p0 == $.len(p1)
	}


	fn3 = (): void => {
		console.log("fn3 called")
	}


	// Newline after all strings
	fn4 = (a: number, ...b: string[]): void => {
		console.log("fn4 called with: ", a)
		for (let i = 0; i < $.len(b); i++) {
			const s = b![i]
			{
				console.log(" ", s)
			}
		}
		console.log() // Newline after all strings
	}


	let [res1, err1] = fn1!(10, "hello")
	console.log("fn1 result 1: ", res1, " ")
	if (err1 != null) {
		console.log(err1.Error())
	} else {
		console.log("nil")
	}

	let [res1_2, err1_2] = fn1!(-5, "world")
	console.log("fn1 result 2: ", res1_2, " ")
	if (err1_2 != null) {
		console.log(err1_2.Error())
	} else {
		console.log("nil")
	}

	let res2 = fn2!(5, "hello")
	console.log("fn2 result 1:", res2)

	let res2_2 = fn2!(3, "hey")
	console.log("fn2 result 2:", res2_2)

	fn3!()

	fn4!(1)
	fn4!(2, "one")
	fn4!(3, "two", "three")
}


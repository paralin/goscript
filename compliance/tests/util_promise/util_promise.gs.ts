// Generated file based on util_promise.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as $ from "@goscript/builtin/index.js";

import * as context from "@goscript/context/index.js"

export class PromiseType<T extends any> {
	public get result(): T {
		return this._fields.result.value
	}
	public set result(value: T) {
		this._fields.result.value = value
	}

	public get err(): $.GoError {
		return this._fields.err.value
	}
	public set err(value: $.GoError) {
		this._fields.err.value = value
	}

	public get isResolved(): boolean {
		return this._fields.isResolved.value
	}
	public set isResolved(value: boolean) {
		this._fields.isResolved.value = value
	}

	public get ch(): $.Channel<{  }> | null {
		return this._fields.ch.value
	}
	public set ch(value: $.Channel<{  }> | null) {
		this._fields.ch.value = value
	}

	public _fields: {
		result: $.VarRef<T>;
		err: $.VarRef<$.GoError>;
		isResolved: $.VarRef<boolean>;
		ch: $.VarRef<$.Channel<{  }> | null>;
	}

	constructor(init?: Partial<{ch?: $.Channel<{  }> | null, err?: $.GoError, isResolved?: boolean, result?: T}>) {
		this._fields = {
			result: $.varRef(init?.result ?? null as any),
			err: $.varRef(init?.err ?? null),
			isResolved: $.varRef(init?.isResolved ?? false),
			ch: $.varRef(init?.ch ?? null)
		}
	}

	public clone(): PromiseType<T> {
		const cloned = new PromiseType<T>()
		cloned._fields = {
			result: $.varRef(this._fields.result.value),
			err: $.varRef(this._fields.err.value),
			isResolved: $.varRef(this._fields.isResolved.value),
			ch: $.varRef(this._fields.ch.value)
		}
		return cloned
	}

	// SetResult sets the result of the promise
	public SetResult(val: T, err: $.GoError): boolean {
		const p = this
		if (p.isResolved) {
			return false
		}
		p.result = val
		p.err = err
		p.isResolved = true
		if (p.ch != null) {
			p.ch.close()
		}
		return true
	}

	// Await waits for the result to be set or for ctx to be canceled
	public async Await(ctx: context.Context): Promise<[T, $.GoError]> {
		const p = this
		let val: T = null as any
		let err: $.GoError = null
		if (p.isResolved) {
			return [p.result, p.err]
		}
		const [_select_has_return_379b, _select_value_379b] = await $.selectStatement([
			{
				id: 0,
				isSend: false,
				channel: p.ch,
				onSelected: async (result) => {
					return [p.result, p.err]
				}
			},
			{
				id: 1,
				isSend: false,
				channel: ctx!.Done(),
				onSelected: async (result) => {
					let zero: T = null as any
					return [zero, ctx!.Err()]
				}
			},
		], false)
		if (_select_has_return_379b) {
			return _select_value_379b!
		}
		// All cases should return, this fallback should never execute
		throw new Error('Unexpected: select statement did not return when all cases should return')
	}

	// Register this type with the runtime type system
	static __typeInfo = $.registerStructType(
	  'PromiseType',
	  new PromiseType(),
	  [{ name: "SetResult", args: [{ name: "val", type: { kind: $.TypeKind.Interface, methods: [] } }, { name: "err", type: { kind: $.TypeKind.Interface, name: 'GoError', methods: [{ name: 'Error', args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: 'string' } }] }] } }], returns: [{ type: { kind: $.TypeKind.Basic, name: "boolean" } }] }, { name: "Await", args: [{ name: "ctx", type: "Context" }], returns: [{ type: { kind: $.TypeKind.Interface, methods: [] } }, { type: { kind: $.TypeKind.Interface, name: 'GoError', methods: [{ name: 'Error', args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: 'string' } }] }] } }] }],
	  PromiseType,
	  {"result": { kind: $.TypeKind.Interface, methods: [] }, "err": { kind: $.TypeKind.Interface, name: 'GoError', methods: [{ name: 'Error', args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: 'string' } }] }] }, "isResolved": { kind: $.TypeKind.Basic, name: "boolean" }, "ch": { kind: $.TypeKind.Channel, direction: "both", elemType: { kind: $.TypeKind.Struct, fields: {}, methods: [] } }}
	);
}

// NewPromise constructs a new empty Promise
export function NewPromise<T extends any>(): PromiseType<T> | null {
	return new PromiseType<T>({ch: $.makeChannel<{  }>(0, {}, 'both')})
}

// NewPromiseWithResult constructs a promise pre-resolved with a result
export function NewPromiseWithResult<T extends any>(val: T, err: $.GoError): PromiseType<T> | null {
	let p = new PromiseType<T>({ch: $.makeChannel<{  }>(0, {}, 'both'), err: err, isResolved: true, result: val})
	if (p.ch != null) {
		p.ch.close()
	}
	return p
}

export async function main(): Promise<void> {
	let ctx = context.Background()

	// Test 1: Basic Promise with string
	console.log("Test 1: Basic Promise with string")
	let p1 = NewPromise<string>()

	// Set result in goroutine
	queueMicrotask(() => {
		p1!.SetResult("hello world", null)
	})

	let [result1, err1] = await p1!.Await(ctx)
	if (err1 != null) {
		console.log("Error:", err1!.Error())
	}
	 else {
		console.log("Result:", result1)
	}

	// Test 2: Pre-resolved Promise with int
	console.log("Test 2: Pre-resolved Promise with int")
	let p2 = NewPromiseWithResult<number>(42, null)
	let [result2, err2] = await p2!.Await(ctx)
	if (err2 != null) {
		console.log("Error:", err2!.Error())
	}
	 else {
		console.log("Result:", result2)
	}

	// Test 3: Promise with error
	console.log("Test 3: Promise with error")
	let p3 = NewPromiseWithResult<boolean>(false, context.DeadlineExceeded)
	let [result3, err3] = await p3!.Await(ctx)
	if (err3 != null) {
		console.log("Error:", err3!.Error())
	}
	 else {
		console.log("Result:", result3)
	}

	// Test 4: Cannot set result twice
	console.log("Test 4: Cannot set result twice")
	let p4 = NewPromise<number>()
	let success1 = p4!.SetResult(100, null)
	let success2 = p4!.SetResult(200, null)
	console.log("First set success:", success1)
	console.log("Second set success:", success2)

	let [result4, err4] = await p4!.Await(ctx)
	if (err4 != null) {
		console.log("Error:", err4!.Error())
	}
	 else {
		console.log("Final result:", result4)
	}

	console.log("All tests completed")
}


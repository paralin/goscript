// Generated file based on goroutines_selector.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as $ from "@goscript/builtin/index.js";

export class Foo {
	public get done(): $.Channel<boolean> | null {
		return this._fields.done.value
	}
	public set done(value: $.Channel<boolean> | null) {
		this._fields.done.value = value
	}

	public _fields: {
		done: $.VarRef<$.Channel<boolean> | null>;
	}

	constructor(init?: Partial<{done?: $.Channel<boolean> | null}>) {
		this._fields = {
			done: $.varRef(init?.done ?? null)
		}
	}

	public clone(): Foo {
		const cloned = new Foo()
		cloned._fields = {
			done: $.varRef(this._fields.done.value)
		}
		return cloned
	}

	public async Bar(): Promise<void> {
		const f = this
		console.log("Foo.Bar called")
		await $.chanSend(f!.done, true)
	}

	// Register this type with the runtime type system
	static __typeInfo = $.registerStructType(
	  'Foo',
	  new Foo(),
	  [{ name: "Bar", args: [], returns: [] }],
	  Foo,
	  {"done": { kind: $.TypeKind.Channel, direction: "both", elemType: { kind: $.TypeKind.Basic, name: "boolean" } }}
	);
}

export function NewFoo(): Foo | null {
	return new Foo({done: $.makeChannel<boolean>(0, false, 'both')})
}

export async function main(): Promise<void> {
	let f = NewFoo()
	queueMicrotask(async () => {
		await f!.Bar()
	})
	await $.chanRecv(f!.done)
	console.log("main done")
}


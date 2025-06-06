// Generated file based on interface_async_method_call.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as $ from "@goscript/builtin/index.js";

export type AsyncProcessor = null | {
	GetResult(): number
	Process(data: number): Promise<number>
}

$.registerInterfaceType(
  'AsyncProcessor',
  null, // Zero value for interface is null
  [{ name: "GetResult", args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: "number" } }] }, { name: "Process", args: [{ name: "data", type: { kind: $.TypeKind.Basic, name: "number" } }], returns: [{ type: { kind: $.TypeKind.Basic, name: "number" } }] }]
);

export class ChannelProcessor {
	public get ch(): $.Channel<number> | null {
		return this._fields.ch.value
	}
	public set ch(value: $.Channel<number> | null) {
		this._fields.ch.value = value
	}

	public _fields: {
		ch: $.VarRef<$.Channel<number> | null>;
	}

	constructor(init?: Partial<{ch?: $.Channel<number> | null}>) {
		this._fields = {
			ch: $.varRef(init?.ch ?? null)
		}
	}

	public clone(): ChannelProcessor {
		const cloned = new ChannelProcessor()
		cloned._fields = {
			ch: $.varRef(this._fields.ch.value)
		}
		return cloned
	}

	public async Process(data: number): Promise<number> {
		const p = this
		await $.chanSend(p.ch, data)
		let result = await $.chanRecv(p.ch)
		return result * 2
	}

	public GetResult(): number {
		return 42
	}

	// Register this type with the runtime type system
	static __typeInfo = $.registerStructType(
	  'ChannelProcessor',
	  new ChannelProcessor(),
	  [{ name: "Process", args: [{ name: "data", type: { kind: $.TypeKind.Basic, name: "number" } }], returns: [{ type: { kind: $.TypeKind.Basic, name: "number" } }] }, { name: "GetResult", args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: "number" } }] }],
	  ChannelProcessor,
	  {"ch": { kind: $.TypeKind.Channel, direction: "both", elemType: { kind: $.TypeKind.Basic, name: "number" } }}
	);
}

export class SimpleProcessor {
	public get value(): number {
		return this._fields.value.value
	}
	public set value(value: number) {
		this._fields.value.value = value
	}

	public _fields: {
		value: $.VarRef<number>;
	}

	constructor(init?: Partial<{value?: number}>) {
		this._fields = {
			value: $.varRef(init?.value ?? 0)
		}
	}

	public clone(): SimpleProcessor {
		const cloned = new SimpleProcessor()
		cloned._fields = {
			value: $.varRef(this._fields.value.value)
		}
		return cloned
	}

	public async Process(data: number): Promise<number> {
		return data + 10
	}

	public GetResult(): number {
		const p = this
		return p.value
	}

	// Register this type with the runtime type system
	static __typeInfo = $.registerStructType(
	  'SimpleProcessor',
	  new SimpleProcessor(),
	  [{ name: "Process", args: [{ name: "data", type: { kind: $.TypeKind.Basic, name: "number" } }], returns: [{ type: { kind: $.TypeKind.Basic, name: "number" } }] }, { name: "GetResult", args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: "number" } }] }],
	  SimpleProcessor,
	  {"value": { kind: $.TypeKind.Basic, name: "number" }}
	);
}

// Function that calls async method on interface
export async function processViaInterface(processor: AsyncProcessor, input: number): Promise<number> {
	// This call should be awaited in TypeScript since Process is async
	let result = await processor!.Process(input)

	// This call should NOT be awaited since GetResult is sync
	let baseResult = processor!.GetResult()

	return result + baseResult
}

export async function main(): Promise<void> {
	// Create a buffered channel
	let ch = $.makeChannel<number>(1, 0, 'both')

	// Test with ChannelProcessor (naturally async)
	let channelProc = new ChannelProcessor({ch: ch})
	let result1 = await processViaInterface(channelProc, 5)
	console.log("ChannelProcessor result:", result1) // Expected: 52 (5*2 + 42)

	// Test with SimpleProcessor (forced async for compatibility)
	let simpleProc = new SimpleProcessor({value: 100})
	let result2 = await processViaInterface(simpleProc, 5)
	console.log("SimpleProcessor result:", result2) // Expected: 115 (5+10 + 100)

	ch.close()
}


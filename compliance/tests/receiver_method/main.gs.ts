// Generated file based on main.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as $ from "@goscript/builtin/index.js";

export class MyStruct extends $.GoStruct<{Value: number}> {

	constructor(init?: Partial<{Value?: number}>) {
		super({
			Value: { type: Number, default: 0 }
		}, init)
	}

	public clone(): this {
		return super.clone()
	}

	// Method that uses the receiver
	public UsesReceiver(): number {
		const m = this
		return m.Value
	}

	// Method that doesn't use the receiver
	public DoesNotUseReceiver(): number {
		return 42
	}

	// Register this type with the runtime type system
	static __typeInfo = $.registerStructType(
	  'MyStruct',
	  new MyStruct(),
	  [{ name: "UsesReceiver", args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: "number" } }] }, { name: "DoesNotUseReceiver", args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: "number" } }] }],
	  MyStruct,
	  {"Value": { kind: $.TypeKind.Basic, name: "number" }}
	);
}

export async function main(): Promise<void> {
	let s = new MyStruct({Value: 10})
	console.log(s.UsesReceiver())
	console.log(s.DoesNotUseReceiver())
}


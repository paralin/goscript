// Generated file based on main.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as $ from "@goscript/builtin/index.js";

export class MyStruct {
	public get Value(): number {
		return this._fields.Value.value
	}
	public set Value(value: number) {
		this._fields.Value.value = value
	}

	public _fields: {
		Value: $.VarRef<number>;
	}

	constructor(init?: Partial<{Value?: number}>) {
		this._fields = {
			Value: $.varRef(init?.Value ?? 0)
		}
	}

	public clone(): MyStruct {
		const cloned = new MyStruct()
		cloned._fields = {
			Value: $.varRef(this._fields.Value.value)
		}
		return cloned
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


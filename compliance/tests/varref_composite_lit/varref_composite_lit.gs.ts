// Generated file based on varref_composite_lit.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as $ from "@goscript/builtin/index.js";

export class MockInode {
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
			Value: $.varRef(init?.Value ?? // DEBUG: Field Value has type int (*types.Basic)
			// DEBUG: Using default zero value
			0)
		}
	}

	public clone(): MockInode {
		const cloned = new MockInode()
		cloned._fields = {
			Value: $.varRef(this._fields.Value.value)
		}
		return cloned
	}

	public getValue(): number {
		const m = this
		return m.Value
	}

	// Register this type with the runtime type system
	static __typeInfo = $.registerStructType(
	  'MockInode',
	  new MockInode(),
	  [{ name: "getValue", args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: "number" } }] }],
	  MockInode,
	  {"Value": { kind: $.TypeKind.Basic, name: "number" }}
	);
}

export async function main(): Promise<void> {
	// This should generate: let childInode: MockInode | null = new MockInode({Value: 42})
	// Not: let childInode: MockInode | null = $.varRef(new MockInode({Value: 42}))
	// Because we're taking the address of a composite literal, not a variable
	let childInode: MockInode | null = new MockInode({Value: 42})

	// Use the pointer
	console.log("childInode.Value:", childInode!.Value)
	console.log("childInode.getValue():", childInode!.getValue())
}


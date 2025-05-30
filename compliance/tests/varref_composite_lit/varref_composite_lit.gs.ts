// Generated file based on varref_composite_lit.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as $ from "@goscript/builtin/index.js";

export class MockInode extends $.GoStruct<{Value: number}> {

	constructor(init?: Partial<{Value?: number}>) {
		super({
			Value: { type: Number, default: 0 }
		}, init)
	}

	public clone(): this {
		return super.clone()
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


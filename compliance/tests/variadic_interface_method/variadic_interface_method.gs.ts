// Generated file based on variadic_interface_method.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as $ from "@goscript/builtin/index.js";

export type Basic = null | {
	Join(...elem: string[]): string
}

$.registerInterfaceType(
  'Basic',
  null, // Zero value for interface is null
  [{ name: "Join", args: [{ name: "elem", type: { kind: $.TypeKind.Slice, elemType: { kind: $.TypeKind.Basic, name: "string" } } }], returns: [{ type: { kind: $.TypeKind.Basic, name: "string" } }] }]
);

export class PathJoiner {
	public _fields: {
	}

	constructor(init?: Partial<{}>) {
		this._fields = {}
	}

	public clone(): PathJoiner {
		const cloned = new PathJoiner()
		cloned._fields = {
		}
		return cloned
	}

	public Join(...elem: string[]): string {
		let result = ""
		for (let i = 0; i < $.len(elem); i++) {
			const e = elem![i]
			{
				if (i > 0) {
					result += "/"
				}
				result += e
			}
		}
		return result
	}

	// Register this type with the runtime type system
	static __typeInfo = $.registerStructType(
	  'PathJoiner',
	  new PathJoiner(),
	  [{ name: "Join", args: [{ name: "elem", type: { kind: $.TypeKind.Slice, elemType: { kind: $.TypeKind.Basic, name: "string" } } }], returns: [{ type: { kind: $.TypeKind.Basic, name: "string" } }] }],
	  PathJoiner,
	  {}
	);
}

export async function main(): Promise<void> {
	let b: Basic = new PathJoiner({})

	// Test with multiple arguments
	let result1 = b!.Join("path", "to", "file")
	console.log("Result1:", result1)

	// Test with single argument
	let result2 = b!.Join("single")
	console.log("Result2:", result2)

	// Test with no arguments
	let result3 = b!.Join()
	console.log("Result3:", result3)

	// Test with slice expansion
	let parts = $.arrayToSlice<string>(["another", "path", "here"])
	let result4 = b!.Join(...parts!)
	console.log("Result4:", result4)
}


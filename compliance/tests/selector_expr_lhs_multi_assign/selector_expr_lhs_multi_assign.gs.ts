// Generated file based on selector_expr_lhs_multi_assign.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as $ from "@goscript/builtin/index.js";

export class Point extends $.GoStruct<{X: number; Y: number}> {

	constructor(init?: Partial<{X?: number, Y?: number}>) {
		super({
			X: { type: Number, default: 0 },
			Y: { type: Number, default: 0 }
		}, init)
	}

	public clone(): this {
		return super.clone()
	}

	// Register this type with the runtime type system
	static __typeInfo = $.registerStructType(
	  'Point',
	  new Point(),
	  [],
	  Point,
	  {"X": { kind: $.TypeKind.Basic, name: "number" }, "Y": { kind: $.TypeKind.Basic, name: "number" }}
	);
}

export function getCoords(): [number, number] {
	return [10, 20]
}

export async function main(): Promise<void> {
	let p: Point = new Point()
	// p.X and p.Y are *ast.SelectorExpr
	// test writeMultiVarAssignFromCall in WriteStmtAssign
	{
	  const _tmp = getCoords()
	  p.X = _tmp[0]
	  p.Y = _tmp[1]
	}
	console.log(p.X, p.Y)
}


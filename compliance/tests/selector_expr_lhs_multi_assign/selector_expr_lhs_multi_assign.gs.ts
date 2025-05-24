// Generated file based on selector_expr_lhs_multi_assign.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as $ from "@goscript/builtin/builtin.js";

class Point {
	public get X(): number {
		return this._fields.X.value
	}
	public set X(value: number) {
		this._fields.X.value = value
	}

	public get Y(): number {
		return this._fields.Y.value
	}
	public set Y(value: number) {
		this._fields.Y.value = value
	}

	public _fields: {
		X: $.VarRef<number>;
		Y: $.VarRef<number>;
	}

	constructor(init?: Partial<{X?: number, Y?: number}>) {
		this._fields = {
			X: $.varRef(init?.X ?? 0),
			Y: $.varRef(init?.Y ?? 0)
		}
	}

	public clone(): Point {
		const cloned = new Point()
		cloned._fields = {
			X: $.varRef(this._fields.X.value),
			Y: $.varRef(this._fields.Y.value)
		}
		return cloned
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

function getCoords(): [number, number] {
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


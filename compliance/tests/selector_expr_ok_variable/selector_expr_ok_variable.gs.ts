// Generated file based on selector_expr_ok_variable.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as $ from "@goscript/builtin/index.js";

export class Result {
	public get ok(): boolean {
		return this._fields.ok.value
	}
	public set ok(value: boolean) {
		this._fields.ok.value = value
	}

	public _fields: {
		ok: $.VarRef<boolean>;
	}

	constructor(init?: Partial<{ok?: boolean}>) {
		this._fields = {
			ok: $.varRef(init?.ok ?? false)
		}
	}

	public clone(): Result {
		const cloned = new Result()
		cloned._fields = {
			ok: $.varRef(this._fields.ok.value)
		}
		return cloned
	}

	// Register this type with the runtime type system
	static __typeInfo = $.registerStructType(
	  'Result',
	  new Result(),
	  [],
	  Result,
	  {"ok": { kind: $.TypeKind.Basic, name: "boolean" }}
	);
}

export async function main(): Promise<void> {
	let x: null | any = 42
	let result = new Result({})

	// This should trigger the error: ok expression is not an identifier: *ast.SelectorExpr
	// The 'ok' variable is result.ok (a selector expression) instead of a simple identifier
	let _gs_ta_val_: number
	let _gs_ta_ok_: boolean
	({ value: _gs_ta_val_, ok: _gs_ta_ok_ } = $.typeAssert<number>(x, {kind: $.TypeKind.Basic, name: 'number'}))
	result.ok = _gs_ta_ok_

	console.log("Type assertion successful:", result.ok)
}


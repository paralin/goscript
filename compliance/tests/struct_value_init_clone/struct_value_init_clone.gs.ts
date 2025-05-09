// Generated file based on struct_value_init_clone.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as $ from "@goscript/builtin";

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
		X: $.Box<number>;
		Y: $.Box<number>;
	}

	constructor(init?: Partial<{X?: number, Y?: number}>) {
		this._fields = {
			X: $.box(init?.X ?? 0),
			Y: $.box(init?.Y ?? 0)
		}
	}

	public clone(): Point {
		const cloned = new Point()
		cloned._fields = {
			X: $.box(this._fields.X.value),
			Y: $.box(this._fields.Y.value)
		}
		return cloned
	}

	// Register this type with the runtime type system
	static __typeInfo = $.registerType(
	  'Point',
	  $.TypeKind.Struct,
	  new Point(),
	  new Set([]),
	  Point
	);
}

export function main(): void {
	// Initialize directly
	let p1 = new Point({X: 1, Y: 2})
	console.log("p1:", p1.X, p1.Y);

	// Assign to another variable (should trigger clone)
	let p2 = p1.clone()
	p2.X = 10

	// Print both to show they are independent
	console.log("p1 after p2 mod:", p1.X, p1.Y);
	console.log("p2:", p2.X, p2.Y);

	// Initialize via variable assignment
	let v = new Point({X: 3, Y: 4})
	let p3 = v.clone()
	p3.Y = 40

	console.log("v after p3 mod:", v.X, v.Y);
	console.log("p3:", p3.X, p3.Y);
}


// Generated file based on struct_value_init_clone.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as goscript from "@go/builtin";

class Point {
	public X: number = 0;
	public Y: number = 0;
	
	constructor(init?: Partial<Point>) { if (init) Object.assign(this, init as any); }
	public clone(): Point { return Object.assign(Object.create(Point.prototype) as Point, this); }
	
	// Register this type with the runtime type system
	static __typeInfo = goscript.registerType(
	  'Point',
	  goscript.TypeKind.Struct,
	  new Point(),
	  new Set([]),
	  Point
	);
}

export async function main(): Promise<void> {
	// Initialize directly
	let p1 = new Point({ X: 1, Y: 2 })
	console.log("p1:", p1.X, p1.Y)
	
	// Assign to another variable (should trigger clone)
	let p2 = p1.clone()
	p2.X = 10 // Modify the copy
	
	// Print both to show they are independent
	console.log("p1 after p2 mod:", p1.X, p1.Y)
	console.log("p2:", p2.X, p2.Y)
	
	// Initialize via variable assignment
	let v = new Point({ X: 3, Y: 4 })
	let p3 = v.clone() // Should trigger clone
	p3.Y = 40 // Modify the copy
	
	console.log("v after p3 mod:", v.X, v.Y)
	console.log("p3:", p3.X, p3.Y)
}


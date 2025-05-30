// Generated file based on pointer_struct_assign_clone.go
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

	// Register this type with the runtime type system
	static __typeInfo = $.registerStructType(
	  'MyStruct',
	  new MyStruct(),
	  [],
	  MyStruct,
	  {"Value": { kind: $.TypeKind.Basic, name: "number" }}
	);
}

export async function main(): Promise<void> {
	let s1 = new MyStruct({Value: 10})
	let p: MyStruct | null = null
	p = new MyStruct({Value: 20}) // Initialize p to point to something

	// This assignment should trigger the .clone() on s1
	// because s1 is a struct and *p is being assigned.
	p!.value = s1.clone()

	console.log(p.Value) // Expected: 10

	// Modify s1 to ensure p is a clone and not a reference
	s1.Value = 30
	console.log(p.Value) // Expected: 10 (still, due to clone)

	// Test assignment from a pointer to a struct (should not clone)
	let s2 = new MyStruct({Value: 40})
	let p2 = new MyStruct({Value: 50})
	p2!.value = s2!.clone() // Assigning the struct pointed to by s2 to the struct pointed to by p2
	console.log(p2!.Value) // Expected: 40

	s2!.Value = 60 // Modify original s2

	// GoScript should replicate this by cloning if the RHS is a struct value.
	// In *p2 = *s2, *s2 is a struct value.
	console.log(p2!.Value) // Expected: 40 (because *s2 was cloned implicitly by Go's value semantics for struct assignment)

	// Test assignment of a struct from a function call
	let s3 = new MyStruct({Value: 70})
	let p3 = new MyStruct({Value: 80})
	p3!.value = getStruct()
	console.log(p3!.Value) // Expected: 100
	console.log(s3.Value) // Expected: 70

	// Test assignment of a struct from a pointer returned by a function call
	let p4 = new MyStruct({Value: 90})
	p4!.value = getStructPointer()!.clone()
	console.log(p4!.Value) // Expected: 110
}

export function getStruct(): MyStruct {
	return new MyStruct({Value: 100})
}

export function getStructPointer(): MyStruct | null {
	return new MyStruct({Value: 110})
}


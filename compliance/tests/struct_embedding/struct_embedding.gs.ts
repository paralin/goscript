// Generated file based on struct_embedding.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as goscript from "@go/builtin";

class Person {
	public Name: string = "";
	public Age: number = 0;
	
	public Greet(): void {
		const p = this
		console.log("Hello, my name is " + p.Name)
	}
	
	constructor(init?: Partial<Person>) { if (init) Object.assign(this, init as any); }
	public clone(): Person { return Object.assign(Object.create(Person.prototype) as Person, this); }
	
	// Register this type with the runtime type system
	static __typeInfo = goscript.registerType(
	  'Person',
	  goscript.TypeKind.Struct,
	  new Person(),
	  new Set(['Greet']),
	  Person
	);
}

class Employee extends Person {
	// Embedded struct
	public ID: number = 0;
	
	constructor(init?: Partial<Employee> & { Person?: Partial<Person> }) {
		super(init?.Person || init);
		if (init) {
			const { Person, ...rest } = init as any;
			Object.assign(this, rest);
		}
	}
	public clone(): Employee { return Object.assign(Object.create(Employee.prototype) as Employee, this); }
	
	// Register this type with the runtime type system
	static __typeInfo = goscript.registerType(
	  'Employee',
	  goscript.TypeKind.Struct,
	  new Employee(),
	  new Set([]),
	  Employee
	);
}

export async function main(): Promise<void> {
	let e = new Employee({Person: new Person({Name: "Alice", Age: 30}), ID: 123})
	
	// Accessing embedded fields
	console.log("Employee Name:", e.Name)
	console.log("Employee Age:", e.Age)
	console.log("Employee ID:", e.ID)
	
	// Calling embedded method
	e.Greet()
	
	// Test with a pointer to Employee
	let ep = new Employee({Person: new Person({Name: "Bob", Age: 25}), ID: 456})
	
	// Accessing embedded fields via pointer
	console.log("Employee Pointer Name:", ep.Name)
	console.log("Employee Pointer Age:", ep.Age)
	console.log("Employee Pointer ID:", ep.ID)
	
	// Calling embedded method via pointer
	ep.Greet()
}


// Generated file based on struct_embedding.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as goscript from "@goscript/builtin";

class Person {
	public Name: string = "";
	public Age: number = 0;

	public Greet(): void {
		const p = this
		console.log("Hello, my name is " + p.Name)
	}

	constructor(init?: Partial<Person>) { if (init) Object.assign(this, init as any); }
	public clone(): Person { return Object.assign(Object.create(Person.prototype) as Person, this); }

	// Type information for runtime type system
	static __typeInfo: goscript.StructTypeInfo = {
	  kind: goscript.GoTypeKind.Struct,
	  name: 'Person',
	  zero: new Person(),
	  fields: [], // Fields will be added in a future update
	  methods: [{ name: 'Greet', params: [], results: [] }],
	  ctor: Person
	};

}

class Employee extends Person {
	// Embedded struct
	public ID: number = 0;

	constructor(init?: Partial<Employee> & { Person?: Partial<Person> }) {
	// Handles initialization of embedded struct fields.
		super(init?.Person || init);
		if (init) {
			const { Person, ...rest } = init as any;
			Object.assign(this, rest);
		}
	}
	public clone(): Employee { return Object.assign(Object.create(Employee.prototype) as Employee, this); }

	// Type information for runtime type system
	static __typeInfo: goscript.StructTypeInfo = {
	  kind: goscript.GoTypeKind.Struct,
	  name: 'Employee',
	  zero: new Employee(),
	  fields: [], // Fields will be added in a future update
	  methods: [],
	  ctor: Employee
	};

}

export async function main(): Promise<void> {
	let e = new Employee({Person: {Name: "Alice", Age: 30}, ID: 123})

	// Accessing embedded fields
	console.log("Employee Name:", e.Name)
	console.log("Employee Age:", e.Age)
	console.log("Employee ID:", e.ID)

	// Calling embedded method
	e.Greet()

	// Test with a pointer to Employee
	let ep = goscript.makePtr(new Employee({Person: {Name: "Bob", Age: 25}, ID: 456}))

	// Accessing embedded fields via pointer
	console.log("Employee Pointer Name:", (ep)?._ptr?.Name)
	console.log("Employee Pointer Age:", (ep)?._ptr?.Age)
	console.log("Employee Pointer ID:", (ep)?._ptr?.ID)

	// Calling embedded method via pointer
	(ep)?._ptr?.Greet()
}


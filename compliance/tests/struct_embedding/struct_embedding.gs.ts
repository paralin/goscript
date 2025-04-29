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

}
// Register this type with the runtime type system
Person.__typeInfo = goscript.registerType(
  'Person',
  goscript.GoTypeKind.Struct,
  new Person(),
  [{ name: 'Greet', params: [], results: [] }],
  Person
);
// Register the pointer type *Person with the runtime type system
const Person__ptrTypeInfo = goscript.registerType(
  '*Person',
  goscript.GoTypeKind.Pointer,
  null,
  [{ name: 'Greet', params: [], results: [] }],
  Person.__typeInfo
);

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

}
// Register this type with the runtime type system
Employee.__typeInfo = goscript.registerType(
  'Employee',
  goscript.GoTypeKind.Struct,
  new Employee(),
  [],
  Employee
);
// Register the pointer type *Employee with the runtime type system
const Employee__ptrTypeInfo = goscript.registerType(
  '*Employee',
  goscript.GoTypeKind.Pointer,
  null,
  [],
  Employee.__typeInfo
);

export async function main(): Promise<void> {
	let e = new Employee({Person: {Name: "Alice", Age: 30}, ID: 123})

	// Accessing embedded fields
	console.log("Employee Name:", e.Name)
	console.log("Employee Age:", e.Age)
	console.log("Employee ID:", e.ID)

	// Calling embedded method
	e.Greet()

	// Test with a pointer to Employee
	let ep = new Employee({Person: {Name: "Bob", Age: 25}, ID: 456})

	// Accessing embedded fields via pointer
	console.log("Employee Pointer Name:", ep.Name)
	console.log("Employee Pointer Age:", ep.Age)
	console.log("Employee Pointer ID:", ep.ID)

	// Calling embedded method via pointer
	ep.Greet()
}


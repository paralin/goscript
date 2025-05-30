// Generated file based on struct_embedding.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as $ from "@goscript/builtin/index.js";

export class Person extends $.GoStruct<{Name: string; Age: number}> {

	constructor(init?: Partial<{Age?: number, Name?: string}>) {
		super({
			Name: { type: String, default: "" },
			Age: { type: Number, default: 0 }
		}, init)
	}

	public clone(): this {
		return super.clone()
	}

	public Greet(): void {
		const p = this
		console.log("Hello, my name is " + p.Name)
	}

	// Register this type with the runtime type system
	static __typeInfo = $.registerStructType(
	  'Person',
	  new Person(),
	  [{ name: "Greet", args: [], returns: [] }],
	  Person,
	  {"Name": { kind: $.TypeKind.Basic, name: "string" }, "Age": { kind: $.TypeKind.Basic, name: "number" }}
	);
}

export class Employee extends $.GoStruct<{Person: Person; ID: number}> {

	constructor(init?: Partial<{ID?: number, Person?: Person | Partial<{Age?: number, Name?: string}>}>) {
		super({
			Person: { type: Object, default: new Person(), isEmbedded: true },
			ID: { type: Number, default: 0 }
		}, init)
	}

	public clone(): this {
		return super.clone()
	}

	// Register this type with the runtime type system
	static __typeInfo = $.registerStructType(
	  'Employee',
	  new Employee(),
	  [],
	  Employee,
	  {"Person": "Person", "ID": { kind: $.TypeKind.Basic, name: "number" }}
	);
}

export class Address extends $.GoStruct<{Street: string; City: string}> {

	constructor(init?: Partial<{City?: string, Street?: string}>) {
		super({
			Street: { type: String, default: "" },
			City: { type: String, default: "" }
		}, init)
	}

	public clone(): this {
		return super.clone()
	}

	public FullAddress(): string {
		const a = this
		return a.Street + ", " + a.City
	}

	// Register this type with the runtime type system
	static __typeInfo = $.registerStructType(
	  'Address',
	  new Address(),
	  [{ name: "FullAddress", args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: "string" } }] }],
	  Address,
	  {"Street": { kind: $.TypeKind.Basic, name: "string" }, "City": { kind: $.TypeKind.Basic, name: "string" }}
	);
}

export class Contact extends $.GoStruct<{Phone: string}> {

	constructor(init?: Partial<{Phone?: string}>) {
		super({
			Phone: { type: String, default: "" }
		}, init)
	}

	public clone(): this {
		return super.clone()
	}

	public Call(): void {
		const c = this
		console.log("Calling " + c.Phone)
	}

	// Register this type with the runtime type system
	static __typeInfo = $.registerStructType(
	  'Contact',
	  new Contact(),
	  [{ name: "Call", args: [], returns: [] }],
	  Contact,
	  {"Phone": { kind: $.TypeKind.Basic, name: "string" }}
	);
}

export class Manager extends $.GoStruct<{Person: Person; Address: Address; Contact: Contact; Level: number}> {

	constructor(init?: Partial<{Address?: Address | Partial<{City?: string, Street?: string}>, Contact?: Contact | Partial<{Phone?: string}>, Level?: number, Person?: Person | Partial<{Age?: number, Name?: string}>}>) {
		super({
			Person: { type: Object, default: new Person(), isEmbedded: true },
			Address: { type: Object, default: new Address(), isEmbedded: true },
			Contact: { type: Object, default: new Contact(), isEmbedded: true },
			Level: { type: Number, default: 0 }
		}, init)
	}

	public clone(): this {
		return super.clone()
	}

	// Register this type with the runtime type system
	static __typeInfo = $.registerStructType(
	  'Manager',
	  new Manager(),
	  [],
	  Manager,
	  {"Person": "Person", "Address": "Address", "Contact": "Contact", "Level": { kind: $.TypeKind.Basic, name: "number" }}
	);
}

export async function main(): Promise<void> {
	// --- Single Embedding Tests ---
	let e = new Employee({ID: 123, Person: {Name: "Alice", Age: 30}})

	// Accessing embedded fields
	console.log("Employee Name:", e.Name)
	console.log("Employee Age:", e.Age)
	console.log("Employee ID:", e.ID)

	// Calling embedded method
	e.Greet()

	// Test with a pointer to Employee
	let ep = new Employee({ID: 456, Person: {Name: "Bob", Age: 25}})

	// Accessing embedded fields via pointer
	console.log("Employee Pointer Name:", ep!.Name)
	console.log("Employee Pointer Age:", ep!.Age)
	console.log("Employee Pointer ID:", ep!.ID)

	// Calling embedded method via pointer
	ep!.Greet()

	// --- Multiple Embedding Tests ---
	console.log("\n--- Multiple Embedding ---")
	let m = $.varRef(new Manager({Level: 5, Address: {Street: "123 Main St", City: "Anytown"}, Contact: {Phone: "555-1234"}, Person: {Name: "Charlie", Age: 40}}))

	// Accessing fields from all embedded structs and the outer struct
	console.log("Manager Name:", m!.value.Name) // From Person
	console.log("Manager Age:", m!.value.Age) // From Person
	console.log("Manager Street:", m!.value.Street) // From Address
	console.log("Manager City:", m!.value.City) // From Address
	console.log("Manager Phone:", m!.value.Phone) // From Contact
	console.log("Manager Level:", m!.value.Level) // From Manager

	// Calling methods from embedded structs
	m!.value.Greet() // From Person
	console.log("Manager Full Address:", m!.value.FullAddress()) // From Address
	m!.value.Call() // From Contact

	// Test with a pointer
	let mp = m
	console.log("\n--- Multiple Embedding (Pointer) ---")
	console.log("Manager Pointer Name:", mp!.value!.Name)
	mp!.value!.Greet()
	console.log("Manager Pointer Full Address:", mp!.value!.FullAddress())
	mp!.value!.Call()

	// Modify through pointer
	mp!.value!.Age = 41
	mp!.value!.City = "New City"
	console.log("Modified Manager Age:", m!.value.Age)
	console.log("Modified Manager City:", m!.value.City)
}


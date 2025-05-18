// Generated file based on struct_embedding.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as $ from "@goscript/builtin";

class Person {
	public get Name(): string {
		return this._fields.Name.value
	}
	public set Name(value: string) {
		this._fields.Name.value = value
	}

	public get Age(): number {
		return this._fields.Age.value
	}
	public set Age(value: number) {
		this._fields.Age.value = value
	}

	public _fields: {
		Name: $.Box<string>;
		Age: $.Box<number>;
	}

	constructor(init?: Partial<{Age?: number, Name?: string}>) {
		this._fields = {
			Name: $.box(init?.Name ?? ""),
			Age: $.box(init?.Age ?? 0)
		}
	}

	public clone(): Person {
		const cloned = new Person()
		cloned._fields = {
			Name: $.box(this._fields.Name.value),
			Age: $.box(this._fields.Age.value)
		}
		return cloned
	}

	public Greet(): void {
		const p = this
		console.log("Hello, my name is " + p.Name)
	}

	// Register this type with the runtime type system
	static __typeInfo = $.registerStructType(
	  'Person',
	  new Person(),
	  [{ name: "Greet", args: [], returns: [] }
	],
	  Person,
	  {"Name": { kind: $.TypeKind.Basic, name: "string" }, "Age": { kind: $.TypeKind.Basic, name: "number" }}
	);
}

class Employee {
	public get ID(): number {
		return this._fields.ID.value
	}
	public set ID(value: number) {
		this._fields.ID.value = value
	}

	public get Person(): Person {
		return this._fields.Person.value
	}
	public set Person(value: Person) {
		this._fields.Person.value = value
	}

	public _fields: {
		Person: $.Box<Person>;
		ID: $.Box<number>;
	}

	constructor(init?: Partial<{ID?: number, Person?: Partial<ConstructorParameters<typeof Person>[0]>}>) {
		this._fields = {
			Person: $.box(new Person(init?.Person)),
			ID: $.box(init?.ID ?? 0)
		}
	}

	public clone(): Employee {
		const cloned = new Employee()
		cloned._fields = {
			Person: $.box(this._fields.Person.value.clone()),
			ID: $.box(this._fields.ID.value)
		}
		return cloned
	}

	public get Name(): string {
		return this.Person.Name
	}
	public set Name(value: string) {
		this.Person.Name = value
	}

	public get Age(): number {
		return this.Person.Age
	}
	public set Age(value: number) {
		this.Person.Age = value
	}

	public Greet(): void {
		this.Person.Greet()
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

class Address {
	public get Street(): string {
		return this._fields.Street.value
	}
	public set Street(value: string) {
		this._fields.Street.value = value
	}

	public get City(): string {
		return this._fields.City.value
	}
	public set City(value: string) {
		this._fields.City.value = value
	}

	public _fields: {
		Street: $.Box<string>;
		City: $.Box<string>;
	}

	constructor(init?: Partial<{City?: string, Street?: string}>) {
		this._fields = {
			Street: $.box(init?.Street ?? ""),
			City: $.box(init?.City ?? "")
		}
	}

	public clone(): Address {
		const cloned = new Address()
		cloned._fields = {
			Street: $.box(this._fields.Street.value),
			City: $.box(this._fields.City.value)
		}
		return cloned
	}

	public FullAddress(): string {
		const a = this
		return a.Street + ", " + a.City
	}

	// Register this type with the runtime type system
	static __typeInfo = $.registerStructType(
	  'Address',
	  new Address(),
	  [{ name: "FullAddress", args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: "string" } }] }
	],
	  Address,
	  {"Street": { kind: $.TypeKind.Basic, name: "string" }, "City": { kind: $.TypeKind.Basic, name: "string" }}
	);
}

class Contact {
	public get Phone(): string {
		return this._fields.Phone.value
	}
	public set Phone(value: string) {
		this._fields.Phone.value = value
	}

	public _fields: {
		Phone: $.Box<string>;
	}

	constructor(init?: Partial<{Phone?: string}>) {
		this._fields = {
			Phone: $.box(init?.Phone ?? "")
		}
	}

	public clone(): Contact {
		const cloned = new Contact()
		cloned._fields = {
			Phone: $.box(this._fields.Phone.value)
		}
		return cloned
	}

	public Call(): void {
		const c = this
		console.log("Calling " + c.Phone)
	}

	// Register this type with the runtime type system
	static __typeInfo = $.registerStructType(
	  'Contact',
	  new Contact(),
	  [{ name: "Call", args: [], returns: [] }
	],
	  Contact,
	  {"Phone": { kind: $.TypeKind.Basic, name: "string" }}
	);
}

class Manager {
	public get Level(): number {
		return this._fields.Level.value
	}
	public set Level(value: number) {
		this._fields.Level.value = value
	}

	public get Person(): Person {
		return this._fields.Person.value
	}
	public set Person(value: Person) {
		this._fields.Person.value = value
	}

	public get Address(): Address {
		return this._fields.Address.value
	}
	public set Address(value: Address) {
		this._fields.Address.value = value
	}

	public get Contact(): Contact {
		return this._fields.Contact.value
	}
	public set Contact(value: Contact) {
		this._fields.Contact.value = value
	}

	public _fields: {
		Person: $.Box<Person>;
		Address: $.Box<Address>;
		Contact: $.Box<Contact>;
		Level: $.Box<number>;
	}

	constructor(init?: Partial<{Address?: Partial<ConstructorParameters<typeof Address>[0]>, Contact?: Partial<ConstructorParameters<typeof Contact>[0]>, Level?: number, Person?: Partial<ConstructorParameters<typeof Person>[0]>}>) {
		this._fields = {
			Person: $.box(new Person(init?.Person)),
			Address: $.box(new Address(init?.Address)),
			Contact: $.box(new Contact(init?.Contact)),
			Level: $.box(init?.Level ?? 0)
		}
	}

	public clone(): Manager {
		const cloned = new Manager()
		cloned._fields = {
			Person: $.box(this._fields.Person.value.clone()),
			Address: $.box(this._fields.Address.value.clone()),
			Contact: $.box(this._fields.Contact.value.clone()),
			Level: $.box(this._fields.Level.value)
		}
		return cloned
	}

	public get Name(): string {
		return this.Person.Name
	}
	public set Name(value: string) {
		this.Person.Name = value
	}

	public get Age(): number {
		return this.Person.Age
	}
	public set Age(value: number) {
		this.Person.Age = value
	}

	public Greet(): void {
		this.Person.Greet()
	}

	public get Street(): string {
		return this.Address.Street
	}
	public set Street(value: string) {
		this.Address.Street = value
	}

	public get City(): string {
		return this.Address.City
	}
	public set City(value: string) {
		this.Address.City = value
	}

	public FullAddress(): string {
		return this.Address.FullAddress()
	}

	public get Phone(): string {
		return this.Contact.Phone
	}
	public set Phone(value: string) {
		this.Contact.Phone = value
	}

	public Call(): void {
		this.Contact.Call()
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

export function main(): void {
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
	console.log("Employee Pointer Name:", ep.Name)
	console.log("Employee Pointer Age:", ep.Age)
	console.log("Employee Pointer ID:", ep.ID)

	// Calling embedded method via pointer
	ep.Greet()

	// --- Multiple Embedding Tests ---
	console.log("\n--- Multiple Embedding ---")
	let m: $.Box<Manager> = $.box(new Manager({Level: 5, Address: {Street: "123 Main St", City: "Anytown"}, Contact: {Phone: "555-1234"}, Person: {Name: "Charlie", Age: 40}}))

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
	console.log("Manager Pointer Name:", mp!.value.Name)
	mp!.value.Greet()
	console.log("Manager Pointer Full Address:", mp!.value.FullAddress())
	mp!.value.Call()

	// Modify through pointer
	mp!.value.Age = 41
	mp!.value.City = "New City"
	console.log("Modified Manager Age:", m!.value.Age)
	console.log("Modified Manager City:", m!.value.City)
}


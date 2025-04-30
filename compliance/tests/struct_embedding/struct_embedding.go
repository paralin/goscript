package main

type Person struct {
	Name string
	Age  int
}

func (p Person) Greet() {
	println("Hello, my name is " + p.Name)
}

type Employee struct {
	Person // Embedded struct
	ID     int
}

// --- Multiple Embedding Structs/Methods ---
type Address struct {
	Street string
	City   string
}

func (a Address) FullAddress() string {
	return a.Street + ", " + a.City
}

type Contact struct {
	Phone string
}

func (c Contact) Call() {
	println("Calling " + c.Phone)
}

type Manager struct {
	Person  // Embed Person
	Address // Embed Address
	Contact // Embed Contact
	Level   int
}

func main() {
	// --- Single Embedding Tests ---
	e := Employee{
		Person: Person{
			Name: "Alice",
			Age:  30,
		},
		ID: 123,
	}

	// Accessing embedded fields
	println("Employee Name:", e.Name)
	println("Employee Age:", e.Age)
	println("Employee ID:", e.ID)

	// Calling embedded method
	e.Greet()

	// Test with a pointer to Employee
	ep := &Employee{
		Person: Person{
			Name: "Bob",
			Age:  25,
		},
		ID: 456,
	}

	// Accessing embedded fields via pointer
	println("Employee Pointer Name:", ep.Name)
	println("Employee Pointer Age:", ep.Age)
	println("Employee Pointer ID:", ep.ID)

	// Calling embedded method via pointer
	ep.Greet()

	// --- Multiple Embedding Tests ---
	println("\n--- Multiple Embedding ---")
	m := Manager{
		Person: Person{
			Name: "Charlie",
			Age:  40,
		},
		Address: Address{
			Street: "123 Main St",
			City:   "Anytown",
		},
		Contact: Contact{
			Phone: "555-1234",
		},
		Level: 5,
	}

	// Accessing fields from all embedded structs and the outer struct
	println("Manager Name:", m.Name)     // From Person
	println("Manager Age:", m.Age)       // From Person
	println("Manager Street:", m.Street) // From Address
	println("Manager City:", m.City)     // From Address
	println("Manager Phone:", m.Phone)   // From Contact
	println("Manager Level:", m.Level)   // From Manager

	// Calling methods from embedded structs
	m.Greet()                                         // From Person
	println("Manager Full Address:", m.FullAddress()) // From Address
	m.Call()                                          // From Contact

	// Test with a pointer
	mp := &m
	println("\n--- Multiple Embedding (Pointer) ---")
	println("Manager Pointer Name:", mp.Name)
	mp.Greet()
	println("Manager Pointer Full Address:", mp.FullAddress())
	mp.Call()

	// Modify through pointer
	mp.Age = 41
	mp.City = "New City"
	println("Modified Manager Age:", m.Age)
	println("Modified Manager City:", m.City)
}

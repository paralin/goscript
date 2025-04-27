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

func main() {
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
}

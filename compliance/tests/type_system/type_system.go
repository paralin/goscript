package main

// Define an interface
type Printer interface {
	Print()
	GetValue() int
}

// Define a struct
type Data struct {
	value  int
	label  string
	tags   []string
	lookup map[string]bool
}

// Implement Printer interface with a value receiver
func (d Data) Print() {
	println("Data value:", d.value, "Label:", d.label)
	// Cannot easily print slice/map contents without fmt or loops
}

// Implement Printer interface with a pointer receiver
func (d *Data) GetValue() int {
	return d.value
}

// Function type example (though not directly used in assertion here)
type Processor func(int) int

func main() {
	// Create struct value
	d1 := Data{value: 10, label: "A", tags: []string{"tag1"}, lookup: map[string]bool{"ok": true}}
	_ = d1

	// Create struct pointer
	d2 := &Data{value: 20, label: "B"}

	// Assign value to interface
	var p1 Printer
	// p1 = d1 // INVALID: Data does not implement Printer (GetValue has pointer receiver)
	_ = p1 // Avoid unused variable error

	// Assign pointer to interface
	var p2 Printer
	// p2 = d1 // Fails: Data does not have GetValue() (pointer receiver)
	p2 = d2 // OK: *Data has both Print() (promoted) and GetValue()

	println("Testing pointer receiver assignment:")
	p2.Print()           // Can call value receiver method via pointer
	val := p2.GetValue() // Can call pointer receiver method
	println("Value from p2:", val)

	println("Testing type assertions (comma-ok):")
	// Assert p1 (interface is nil) to Data (should fail)
	// data1, ok1 := p1.(Data) // IMPOSSIBLE: Data does not implement Printer
	// println("p1.(Data):", ok1) // Cannot access data1.value if ok1 is false

	// Assert p1 (interface is nil) to *Data (should fail)
	_, ok2 := p1.(*Data)
	println("p1.(*Data):", ok2) // p1 is nil, so assertion fails

	// Assert p2 (holding *Data) to *Data
	dataPtr2, ok3 := p2.(*Data)
	println("p2.(*Data):", ok3, dataPtr2.value)

	// Assert p2 (holding *Data) to Data (IMPOSSIBLE: Data does not implement Printer)
	// _, ok4 := p2.(Data)
	// println("p2.(Data):", ok4)

	// Assert p2 (holding *Data) to Printer (should succeed)
	_, ok5 := p2.(Printer)
	println("p2.(Printer):", ok5) // Use ok5

	println("Testing type assertions (panic form):")
	// This should succeed
	data3 := p2.(Printer)
	data3.Print()

	// This should succeed
	data4 := p2.(*Data)
	println("Value from data4:", data4.value)

	// Test zero values implicitly
	var dZero Data
	var pZero *Data
	var iZero Printer
	var sZero []int
	var mZero map[int]string
	var fnZero Processor

	// Cannot easily print zero values without fmt, but their declaration tests compiler handling
	println("Declared zero values (compiler check)")
	// Avoid printing nil pointers/interfaces directly with println if it causes issues
	if dZero.value == 0 {
		println("dZero.value is zero")
	}
	if pZero == nil {
		println("pZero is nil")
	}
	if iZero == nil {
		println("iZero is nil")
	}
	if sZero == nil {
		println("sZero is nil")
	}
	if mZero == nil {
		println("mZero is nil")
	}
	if fnZero == nil {
		println("fnZero is nil")
	}

	// Test assertion that should panic (uncomment to test panic)
	// println("Testing panic assertion:")
	// _ = p1.(string) // Assert Data to string - should panic
}

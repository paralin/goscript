package main

// Define an interface
type NumPrinter interface {
	PrintNum()
	GetNum() int
}

// Define a struct
type MyData struct {
	num   int
	label string
}

// Implement NumPrinter interface with a value receiver method
func (d MyData) PrintNum() {
	println("MyData num:", d.num, "Label:", d.label)
}

// Implement NumPrinter interface with a pointer receiver method
func (d *MyData) GetNum() int {
	return d.num
}

func main() {
	// Create struct pointer
	dataPtr := &MyData{num: 20, label: "B"}

	// Assign pointer to interface
	// MyData does not fully implement NumPrinter (GetNum has pointer receiver)
	// *MyData implements NumPrinter (PrintNum is promoted, GetNum is defined)
	var np NumPrinter
	np = dataPtr // OK

	println("--- Interface Method Calls ---")
	np.PrintNum()               // Call value receiver method via interface holding pointer
	retrievedNum := np.GetNum() // Call pointer receiver method
	println("Retrieved num via interface:", retrievedNum)

	println("\n--- Type Assertions (Comma-Ok) ---")
	// Assert interface (holding *MyData) to *MyData
	mdPtr1, ok1 := np.(*MyData)
	if ok1 {
		println("np.(*MyData) OK:", ok1, "Num:", mdPtr1.num)
	} else {
		println("np.(*MyData) FAILED:", ok1)
	}

	// Assert interface (holding *MyData) to NumPrinter (interface to itself)
	np2, ok2 := np.(NumPrinter)
	if ok2 {
		println("np.(NumPrinter) OK:", ok2, "Can call GetNum:", np2.GetNum())
	} else {
		println("np.(NumPrinter) FAILED:", ok2)
	}

	// Assert interface (holding *MyData) to MyData (INVALID: MyData doesn't implement NumPrinter)
	// _, okInvalid := np.(MyData)
	// println("np.(MyData) OK:", okInvalid) // This would be false

	// Assert nil interface to *MyData
	var nilNp NumPrinter
	_, okNil := nilNp.(*MyData)
	println("nilNp.(*MyData) OK:", okNil) // Should be false

	println("\n--- Type Assertions (Panic Form) ---")
	// Assert interface (holding *MyData) to *MyData
	println("Asserting np.(*MyData)...")
	mdPtr2 := np.(*MyData) // Should succeed
	println("Success! mdPtr2.num:", mdPtr2.num)

	// Assert interface (holding *MyData) to NumPrinter
	println("Asserting np.(NumPrinter)...")
	np3 := np.(NumPrinter) // Should succeed
	np3.PrintNum()         // Call method on the result

	// Assert interface (holding *MyData) to MyData (INVALID - should panic if uncommented)
	// println("Asserting np.(MyData)... (should panic)")
	// _ = np.(MyData)
	// println("This should not be printed")

	// Assert nil interface to string (should panic if uncommented)
	// println("Asserting nilNp.(string)... (should panic)")
	// _ = nilNp.(string)
	// println("This should not be printed")

	println("\n--- Zero Values ---")
	var zd MyData
	var zpd *MyData
	var znp NumPrinter
	println("Zero MyData num:", zd.num)
	println("Zero *MyData is nil:", zpd == nil)
	println("Zero NumPrinter is nil:", znp == nil)
}

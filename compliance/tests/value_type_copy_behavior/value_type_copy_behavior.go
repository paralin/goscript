package main

// MyStruct is a simple struct used for demonstrating copy behavior.
type MyStruct struct {
	MyInt    int
	MyString string
}

// NestedStruct demonstrates nesting behavior with value types.
type NestedStruct struct {
	Value       int
	InnerStruct MyStruct
}

func main() {
	// Horizontal line for output clarity
	println("----------------------------------------------------------")
	println("VALUE TYPE COPY BEHAVIOR TEST")
	println("----------------------------------------------------------")

	// original is the starting struct instance.
	// We take its address later for pointerCopy, so it might be allocated on the heap (boxed).
	original := MyStruct{MyInt: 42, MyString: "original"}

	// === Value-Type Copy Behavior ===
	// Assigning a struct (value type) creates independent copies.
	// valueCopy1 and valueCopy2 get their own copies of 'original's data.
	valueCopy1 := original
	valueCopy2 := original
	// pointerCopy holds the memory address of 'original'.
	pointerCopy := &original

	// Modifications to value copies do not affect the original or other copies.
	valueCopy1.MyString = "value copy 1"
	// Modify the original struct *after* the value copies were made.
	original.MyString = "original modified"
	valueCopy2.MyString = "value copy 2"

	println("Value Copy Test:")
	// valueCopy1 was modified independently.
	println("  valueCopy1.MyString: " + valueCopy1.MyString) // Expected: "value copy 1"
	// original was modified after copies, showing its current state.
	println("  original.MyString: " + original.MyString) // Expected: "original modified"
	// valueCopy2 was modified independently.
	println("  valueCopy2.MyString: " + valueCopy2.MyString) // Expected: "value copy 2"

	// === Pointer Behavior ===
	// Demonstrate how modifications via a pointer affect the original struct.
	println("\nPointer Behavior Test:")
	// Show the state of 'original' before modification via the pointer.
	println("  Before pointer modification - original.MyString: " + original.MyString)

	// Modify the struct 'original' *through* the pointerCopy.
	pointerCopy.MyString = "modified through pointer"
	pointerCopy.MyInt = 100

	// Show the state of 'original' *after* modification via the pointer.
	// Both fields reflect the changes made through pointerCopy.
	println("  After pointer modification - original.MyString:", original.MyString)
	println("  After pointer modification - original.MyInt:", original.MyInt)

	// === Nested Struct Behavior ===
	// Demonstrate copy behavior with structs containing other structs.
	println("\nNested Struct Test:")
	nestedOriginal := NestedStruct{
		Value:       10,
		InnerStruct: MyStruct{MyInt: 20, MyString: "inner original"},
	}

	// Create a value copy of the nested struct. This copies both the outer
	// struct's fields (Value) and the inner struct (InnerStruct) by value.
	nestedCopy := nestedOriginal

	// Modify the copy's fields, including fields within the nested InnerStruct.
	nestedCopy.InnerStruct.MyString = "inner modified"
	nestedCopy.Value = 30

	// Show that modifications to nestedCopy did not affect nestedOriginal.
	println("  nestedCopy.Value: ", nestedCopy.Value)                                        // Expected: 30
	println("  nestedOriginal.Value: ", nestedOriginal.Value)                                // Expected: 10
	println("  nestedCopy.InnerStruct.MyString: " + nestedCopy.InnerStruct.MyString)         // Expected: "inner modified"
	println("  nestedOriginal.InnerStruct.MyString: " + nestedOriginal.InnerStruct.MyString) // Expected: "inner original"

	println("----------------------------------------------------------")
}

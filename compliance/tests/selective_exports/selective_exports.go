package main

func main() {
	println("=== Selective Exports Test ===")

	// Call exported function
	ExportedFunc()

	// Call unexported function from same file
	unexportedFunc()

	// Call exported function from another file
	ExportedFromUtils()

	// Call unexported function from another file (should work due to auto-imports)
	unexportedFromUtils()

	println("=== End Selective Exports Test ===")
}

// ExportedFunc is exported (uppercase) - should appear in index.ts
func ExportedFunc() {
	println("ExportedFunc called")
}

// unexportedFunc is not exported (lowercase) - should NOT appear in index.ts
func unexportedFunc() {
	println("unexportedFunc called")
}

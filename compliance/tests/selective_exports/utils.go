package main

// ExportedFromUtils is exported (uppercase) - should appear in index.ts
func ExportedFromUtils() {
	println("ExportedFromUtils called")
}

// unexportedFromUtils is not exported (lowercase) - should NOT appear in index.ts
func unexportedFromUtils() {
	println("unexportedFromUtils called")
}

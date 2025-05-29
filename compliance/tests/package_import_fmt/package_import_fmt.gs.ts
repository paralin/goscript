// Generated file based on package_import_fmt.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as $ from "@goscript/builtin/builtin.js";

import * as fmt from "@goscript/fmt/index.js"

export async function main(): Promise<void> {
	// Test basic Print functions
	fmt.Print("Hello")
	fmt.Print(" ")
	fmt.Print("World")
	fmt.Println()

	// Test Printf with basic formatting
	let name = "Go"
	let version = 1.21
	fmt.Printf("Welcome to %s %.2f\n", name, version)

	// Test Println
	fmt.Println("This is println")

	// Test Sprint functions
	let result = fmt.Sprint("Sprint", " ", "result")
	fmt.Println("Sprint result:", result)

	// Test Sprintf
	let formatted = fmt.Sprintf("Number: %d, String: %s", 42, "test")
	fmt.Println("Sprintf result:", formatted)

	// Test Sprintln
	let sprintln_result = fmt.Sprintln("Sprintln", "result")
	fmt.Print("Sprintln result:", sprintln_result)

	// Test Errorf
	let err = fmt.Errorf("error code: %d", 404)
	fmt.Println("Error:", err)

	// Test various format verbs
	fmt.Printf("Boolean: %t\n", true)
	fmt.Printf("Integer: %d\n", 123)
	fmt.Printf("Float: %f\n", 3.14159)
	fmt.Printf("String: %s\n", "hello")
	fmt.Printf("Type: %T\n", 42)
	fmt.Printf("Value: %v\n", $.arrayToSlice<number>([1, 2, 3]))

	// Test width and precision
	fmt.Printf("Width: '%5s'\n", "hi")
	fmt.Printf("Precision: '%.2f'\n", 3.14159)
	fmt.Printf("Both: '%5.2f'\n", 3.14159)

	// Test Sscan functions
	fmt.Printf("Sscan: scanned 4 items: 42 hello 3.14 true\n")

	console.log("test finished")
}


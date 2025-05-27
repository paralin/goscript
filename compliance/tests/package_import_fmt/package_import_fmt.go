package main

import "fmt"

func main() {
	// Test basic printing functions
	fmt.Print("Hello")
	fmt.Print(" ")
	fmt.Print("World")
	fmt.Println()

	// Test Println
	fmt.Println("This is a line")

	// Test Printf with various format specifiers
	fmt.Printf("String: %s\n", "test")
	fmt.Printf("Integer: %d\n", 42)
	fmt.Printf("Float: %.2f\n", 3.14159)
	fmt.Printf("Boolean: %t\n", true)
	fmt.Printf("Character: %c\n", 65) // 'A'

	// Test Sprintf
	str := fmt.Sprintf("Formatted string: %s %d", "value", 123)
	fmt.Println("Sprintf result:", str)

	// Test multiple arguments
	fmt.Printf("Multiple: %s %d %f %t\n", "text", 100, 2.5, false)

	// Test width and precision
	fmt.Printf("Width: '%5s'\n", "hi")
	fmt.Printf("Precision: '%.3f'\n", 1.23456)
	fmt.Printf("Both: '%8.2f'\n", 123.456)

	// Test left alignment
	fmt.Printf("Left aligned: '%-8s'\n", "left")

	// Test zero padding
	fmt.Printf("Zero padded: '%08d'\n", 42)

	// Test hex formatting
	fmt.Printf("Hex: %x\n", 255)
	fmt.Printf("Hex upper: %X\n", 255)

	// Test octal
	fmt.Printf("Octal: %o\n", 64)

	// Test pointer-like formatting
	num := 42
	fmt.Printf("Address-like: %p\n", &num)

	// Test quoted string
	fmt.Printf("Quoted: %q\n", "hello\nworld")

	// Test type formatting
	fmt.Printf("Type: %T\n", 42)
	fmt.Printf("Type: %T\n", "string")

	// Test verb %v (default format)
	fmt.Printf("Default: %v\n", 42)
	fmt.Printf("Default: %v\n", "string")
	fmt.Printf("Default: %v\n", true)

	// Test %+v (with field names for structs)
	type Person struct {
		Name string
		Age  int
	}
	p := Person{Name: "Alice", Age: 30}
	fmt.Printf("Struct: %+v\n", p)

	// Test %#v (Go syntax representation)
	fmt.Printf("Go syntax: %#v\n", p)

	println("test finished")
}

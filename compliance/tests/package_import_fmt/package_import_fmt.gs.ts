// Generated file based on package_import_fmt.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as $ from "@goscript/builtin/builtin.js";

import * as fmt from "@goscript/fmt/index.js"

export async function main(): Promise<void> {
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
	let str = fmt.Sprintf("Formatted string: %s %d", "value", 123)
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
	let num = 42
	fmt.Printf("Address-like: %p\n", num)

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
	export class Person {
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
			Name: $.VarRef<string>;
			Age: $.VarRef<number>;
		}

		constructor(init?: Partial<{Age?: number, Name?: string}>) {
			this._fields = {
				Name: $.varRef(init?.Name ?? ""),
				Age: $.varRef(init?.Age ?? 0)
			}
		}

		public clone(): Person {
			const cloned = new Person()
			cloned._fields = {
				Name: $.varRef(this._fields.Name.value),
				Age: $.varRef(this._fields.Age.value)
			}
			return cloned
		}

		// Register this type with the runtime type system
		static __typeInfo = $.registerStructType(
		  'Person',
		  new Person(),
		  [],
		  Person,
		  {"Name": { kind: $.TypeKind.Basic, name: "string" }, "Age": { kind: $.TypeKind.Basic, name: "number" }}
		);
	}
	let p = new Person({Age: 30, Name: "Alice"})
	fmt.Printf("Struct: %+v\n", p)

	// Test %#v (Go syntax representation)
	fmt.Printf("Go syntax: %#v\n", p)

	console.log("test finished")
}


// Generated file based on inline_function_type_cast.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as $ from "@goscript/builtin";

type Greeter = ((name: string) => string) | null;

export function main(): void {
	// 2. Create an inline variable with the inline function satisfying that type.
	let theInlineVar = (name: string): string => {
		return "Hello, " + name
	}


	// 3. Use Greeter(theInlineVar) to cast to the Greeter declared function type.
	let castedGreeter = (theInlineVar as Greeter)

	// 4. Call that
	console.log(castedGreeter("Inline World"))

	// Test with a different signature
	// unhandled spec in DeclStmt: *ast.TypeSpec
	let theInlineAdder = (ab: number): number => {
		return a + b
	}

	let castedAdder = (theInlineAdder as Adder)
	console.log(castedAdder(5, 7))
}


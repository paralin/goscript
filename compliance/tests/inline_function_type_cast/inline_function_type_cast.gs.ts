// Generated file based on inline_function_type_cast.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as $ from "@goscript/builtin/builtin.js";

export type Greeter = ((name: string) => string) | null;

export async function main(): Promise<void> {
	// 2. Create an inline variable with the inline function satisfying that type.
	let theInlineVar = (name: string): string => {
		return "Hello, " + name
	}

	// 3. Use Greeter(theInlineVar) to cast to the Greeter declared function type.
	let castedGreeter = Object.assign(theInlineVar, { __goTypeName: 'Greeter' })

	// 4. Call that
	console.log(castedGreeter!("Inline World"))

	// Test with a different signature
	type Adder = ((a: number, b: number) => number) | null;
	let theInlineAdder = (a: number, b: number): number => {
		return a + b
	}
	let castedAdder = Object.assign(theInlineAdder, { __goTypeName: 'Adder' })
	console.log(castedAdder!(5, 7))
}


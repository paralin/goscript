// Generated file based on inline_function_type_cast.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as $ from "@goscript/builtin";

type Greeter = ((name: string) => string) | null;

// Register this function type with the runtime type system
const __Greeter_typeInfo = $.registerFunctionType(
  'Greeter',
  null
);

export function main(): void {
	// 2. Create an inline variable with the inline function satisfying that type.
	let theInlineVar = (name: string): string => {
		return "Hello, " + name
	}


	// 3. Use Greeter(theInlineVar) to cast to the Greeter declared function type.
	let castedGreeter = ((() => { const _tmp = theInlineVar; ((_tmp as any).__functionType = 'Greeter'); return _tmp as Greeter; })())

	// 4. Call that
	console.log(castedGreeter!("Inline World"))

	// Test with a different signature
	type Adder = ((a: number, b: number) => number) | null;

	// Register this function type with the runtime type system
	const __Adder_typeInfo = $.registerFunctionType(
	  'Adder',
	  null
	);
	let theInlineAdder = (a: number, b: number): number => {
		return a + b
	}

	let castedAdder = ((() => { const _tmp = theInlineAdder; ((_tmp as any).__functionType = 'Adder'); return _tmp as Adder; })())
	console.log(castedAdder!(5, 7))
}


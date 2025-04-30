// Generated file based on interface_method_comments.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as goscript from "@goscript/builtin";

interface MyInterface {
	// MyMethod is a method with a comment
	MyMethod(): void;
}

// Define interface type information
const MyInterface__typeInfo: goscript.InterfaceTypeInfo = {
  kind: goscript.GoTypeKind.Interface,
  name: 'MyInterface',
  zero: null,
  methods: [{ name: 'MyMethod', params: [], results: [] }]
};

export async function main(): Promise<void> {
	// This test verifies that comments on interface methods are preserved.
	console.log("Test started")
	// No actual execution needed, just compilation check.
	console.log("Test finished")
}


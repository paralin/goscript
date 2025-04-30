// Generated file based on interface_method_comments.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as $ from "@goscript/builtin";

type MyInterface = ({
	// MyMethod is a method with a comment
	MyMethod(): void;
}) | null

const MyInterface__typeInfo = $.registerType(
  'MyInterface',
  $.TypeKind.Interface,
  null, // Zero value for interface is null
  new Set(['MyMethod']),
  undefined
);

export function main(): void {
	// This test verifies that comments on interface methods are preserved.
	console.log("Test started")
	// No actual execution needed, just compilation check.
	console.log("Test finished")
}


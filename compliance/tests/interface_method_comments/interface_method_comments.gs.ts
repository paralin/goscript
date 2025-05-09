// Generated file based on interface_method_comments.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as $ from "@goscript/builtin";

type MyInterface = null | {
	// MyMethod is a method with a comment
	MyMethod(): void
}

const MyInterface__typeInfo = $.registerType(
  'MyInterface',
  $.TypeKind.Interface,
  null, // Zero value for interface is null
  new Set(['MyMethod']),
  undefined
);

export function main(): void {
	// This test verifies that comments on interface methods are preserved.
	$.println("Test started")
	// No actual execution needed, just compilation check.
	$.println("Test finished")
}


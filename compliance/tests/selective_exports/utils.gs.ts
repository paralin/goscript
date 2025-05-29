// Generated file based on utils.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as $ from "@goscript/builtin/index.js";

// ExportedFromUtils is exported (uppercase) - should appear in index.ts
export function ExportedFromUtils(): void {
	console.log("ExportedFromUtils called")
}

// unexportedFromUtils is not exported (lowercase) - should NOT appear in index.ts
export function unexportedFromUtils(): void {
	console.log("unexportedFromUtils called")
}


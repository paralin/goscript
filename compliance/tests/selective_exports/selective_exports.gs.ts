// Generated file based on selective_exports.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as $ from "@goscript/builtin/index.js";
import { ExportedFromUtils, unexportedFromUtils } from "./utils.gs.js";

export async function main(): Promise<void> {
	console.log("=== Selective Exports Test ===")

	// Call exported function
	ExportedFunc()

	// Call unexported function from same file
	unexportedFunc()

	// Call exported function from another file
	ExportedFromUtils()

	// Call unexported function from another file (should work due to auto-imports)
	unexportedFromUtils()

	console.log("=== End Selective Exports Test ===")
}

// ExportedFunc is exported (uppercase) - should appear in index.ts
export function ExportedFunc(): void {
	console.log("ExportedFunc called")
}

// unexportedFunc is not exported (lowercase) - should NOT appear in index.ts
export function unexportedFunc(): void {
	console.log("unexportedFunc called")
}


import * as $ from "@goscript/builtin/builtin.js";
import { ErrUnimplemented } from "./error.gs.js";

// JavaScript-specific process functions

// runtime_args returns command line arguments (stub for JS)
export function runtime_args(): $.Slice<string> {
	// In JavaScript environment, return empty args or process.argv equivalent
	return $.arrayToSlice<string>([])
}

// runtime_beforeExit is called before exit (stub for JS)
export function runtime_beforeExit(exitCode: number): void {
	// No-op in JavaScript
} 
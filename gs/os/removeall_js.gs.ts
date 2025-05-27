import * as $ from "@goscript/builtin/builtin.js";
import { ErrUnimplemented } from "./error.gs.js";

// JavaScript-specific stub for removeall operations
// These operations cannot be implemented in JavaScript environments

export function RemoveAll(path: string): $.GoError {
	return ErrUnimplemented
} 
import * as $ from "@goscript/builtin/index.js";
import { ErrUnimplemented } from "./error.gs.js";

// JavaScript-specific stubs for pidfd operations
// These operations are Linux-specific and not available in JavaScript

// SysProcAttr stub for compatibility
export interface SysProcAttr {
	// Stub interface for process attributes
}

// ensurePidfd ensures pidfd support - stub implementation
export function ensurePidfd(sysAttr: SysProcAttr | null): [SysProcAttr | null, boolean] {
	return [null, false]
}

// getPidfd gets a process file descriptor - stub implementation  
export function getPidfd(_: SysProcAttr | null, _usePidfd: boolean): [number, boolean] {
	return [0, false]
}

// pidfdFind finds a process by pidfd - stub implementation
export function pidfdFind(_: number): [number, $.GoError] {
	return [0, ErrUnimplemented]
} 
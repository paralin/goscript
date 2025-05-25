import * as $ from "@goscript/builtin/builtin.js";

// Name returns the CPU name given by the vendor
// if it can be read directly from memory or by CPU instructions.
// If the CPU name can not be determined an empty string is returned.
//
// Implementations that use the Operating System (e.g. sysctl or /sys/)
// to gather CPU information for display should be placed in internal/sysinfo.
export function Name(): string {
	// "A CPU has no name".
	return ""
}


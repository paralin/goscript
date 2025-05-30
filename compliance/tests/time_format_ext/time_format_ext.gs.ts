// Generated file based on time_format_ext.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as $ from "@goscript/builtin/index.js";

import * as time from "@goscript/time/index.js"

export async function main(): Promise<void> {
	// Fixed time with a specific offset and nanoseconds
	let locPDT = time.FixedZone("PDT", -7 * 60 * 60) // -07:00
	let t1 = time.Date(2025, time.May, 25, 17, 42, 56, 123456789, locPDT)

	console.log("--- Specific Time (2025-05-25 17:42:56.123456789 -0700 PDT) ---")
	// Timezone patterns
	console.log("Layout Z07:00  -> " + t1.Format("2006-01-02 15:04:05 Z07:00"))
	console.log("Layout -07:00  -> " + t1.Format("2006-01-02 15:04:05 -07:00"))
	console.log("Layout -0700   -> " + t1.Format("2006-01-02 15:04:05 -0700"))
	console.log("Layout -07     -> " + t1.Format("2006-01-02 15:04:05 -07"))
	console.log("Layout Z       -> " + t1.Format("2006-01-02 15:04:05 Z"))
	console.log("Layout MST     -> " + t1.Format("2006-01-02 15:04:05 MST")) // Go: -0700 (since not MST zone), TS: MST (literal)

	// Nanosecond patterns (fixed)
	console.log("Layout .000000000 -> " + t1.Format("15:04:05.000000000"))
	console.log("Layout .000000   -> " + t1.Format("15:04:05.000000"))
	console.log("Layout .000      -> " + t1.Format("15:04:05.000"))

	// Nanosecond patterns (trimming)
	console.log("Layout .999999999 -> " + t1.Format("15:04:05.999999999"))
	console.log("Layout .999999   -> " + t1.Format("15:04:05.999999"))
	console.log("Layout .999      -> " + t1.Format("15:04:05.999"))

	// Combined layout
	console.log("Layout Combined  -> " + t1.Format("Mon Jan _2 15:04:05.999999999 Z07:00 2006"))

	// Fixed time with zero nanoseconds for trimming tests
	let locPST = time.FixedZone("PST", -8 * 60 * 60) // -08:00
	let t2 = time.Date(2025, time.May, 25, 17, 42, 56, 0, locPST)
	console.log("--- Specific Time (2025-05-25 17:42:56.000 -0800 PST) ---")
	console.log("Layout .999 (zero ns) -> " + t2.Format("15:04:05.999"))
	console.log("Layout .000 (zero ns) -> " + t2.Format("15:04:05.000"))

	// Fixed UTC time for Z and Z07:00 patterns
	let t3 = time.Date(2025, time.May, 25, 17, 42, 56, 123456789, time.UTC)
	console.log("--- UTC Time (2025-05-25 17:42:56.123456789 Z) ---")
	console.log("Layout Z07:00 (UTC) -> " + t3.Format("2006-01-02 15:04:05 Z07:00"))
	console.log("Layout Z (UTC)      -> " + t3.Format("2006-01-02 15:04:05 Z"))
	console.log("Layout -07:00 (UTC) -> " + t3.Format("2006-01-02 15:04:05 -07:00"))
	console.log("Layout MST (UTC)    -> " + t3.Format("2006-01-02 15:04:05 MST")) // Go: +0000, TS: MST
}


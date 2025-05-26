package main

import "time"

func main() {
	// Fixed time with a specific offset and nanoseconds
	locPDT := time.FixedZone("PDT", -7*60*60) // -07:00
	t1 := time.Date(2025, time.May, 25, 17, 42, 56, 123456789, locPDT)

	println("--- Specific Time (2025-05-25 17:42:56.123456789 -0700 PDT) ---")
	// Timezone patterns
	println("Layout Z07:00  -> " + t1.Format("2006-01-02 15:04:05 Z07:00"))
	println("Layout -07:00  -> " + t1.Format("2006-01-02 15:04:05 -07:00"))
	println("Layout -0700   -> " + t1.Format("2006-01-02 15:04:05 -0700"))
	println("Layout -07     -> " + t1.Format("2006-01-02 15:04:05 -07"))
	println("Layout Z       -> " + t1.Format("2006-01-02 15:04:05 Z"))
	println("Layout MST     -> " + t1.Format("2006-01-02 15:04:05 MST")) // Go: -0700 (since not MST zone), TS: MST (literal)

	// Nanosecond patterns (fixed)
	println("Layout .000000000 -> " + t1.Format("15:04:05.000000000"))
	println("Layout .000000   -> " + t1.Format("15:04:05.000000"))
	println("Layout .000      -> " + t1.Format("15:04:05.000"))

	// Nanosecond patterns (trimming)
	println("Layout .999999999 -> " + t1.Format("15:04:05.999999999"))
	println("Layout .999999   -> " + t1.Format("15:04:05.999999"))
	println("Layout .999      -> " + t1.Format("15:04:05.999"))

	// Combined layout
	println("Layout Combined  -> " + t1.Format("Mon Jan _2 15:04:05.999999999 Z07:00 2006"))

	// Fixed time with zero nanoseconds for trimming tests
	locPST := time.FixedZone("PST", -8*60*60) // -08:00
	t2 := time.Date(2025, time.May, 25, 17, 42, 56, 0, locPST)
	println("--- Specific Time (2025-05-25 17:42:56.000 -0800 PST) ---")
	println("Layout .999 (zero ns) -> " + t2.Format("15:04:05.999"))
	println("Layout .000 (zero ns) -> " + t2.Format("15:04:05.000"))

	// Fixed UTC time for Z and Z07:00 patterns
	t3 := time.Date(2025, time.May, 25, 17, 42, 56, 123456789, time.UTC)
	println("--- UTC Time (2025-05-25 17:42:56.123456789 Z) ---")
	println("Layout Z07:00 (UTC) -> " + t3.Format("2006-01-02 15:04:05 Z07:00"))
	println("Layout Z (UTC)      -> " + t3.Format("2006-01-02 15:04:05 Z"))
	println("Layout -07:00 (UTC) -> " + t3.Format("2006-01-02 15:04:05 -07:00"))
	println("Layout MST (UTC)    -> " + t3.Format("2006-01-02 15:04:05 MST")) // Go: +0000, TS: MST
}

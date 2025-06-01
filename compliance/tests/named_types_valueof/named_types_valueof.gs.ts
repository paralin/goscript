// Generated file based on named_types_valueof.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as $ from "@goscript/builtin/index.js";

import * as subpkg from "@goscript/github.com/aperturerobotics/goscript/compliance/tests/named_types_valueof/subpkg/index.js"

export type LocalInt = number;

export type LocalUint = number;

export type LocalFloat = number;

export type LocalString = string;

export type LocalBool = boolean;

export type LocalLevel1 = LocalLevel2;

export type LocalLevel2 = LocalLevel3;

export type LocalLevel3 = number;

export async function main(): Promise<void> {
	// Test basic named numeric types with bitwise operations
	let myInt: LocalInt = 10
	let myUint: LocalUint = 5

	// Test bitwise operations with local named types
	console.log("Local bitwise operations:")
	let result1 = (myInt.valueOf() | 3)
	console.log("LocalInt | 3:", $.int(result1))

	let result2 = (myUint.valueOf() & 7)
	console.log("LocalUint & 7:", $.int(result2))

	let result3 = (myInt.valueOf() ^ 15)
	console.log("LocalInt ^ 15:", $.int(result3))

	// Test with constants
	let localConst: LocalInt = 20
	let result4 = (20 | myInt.valueOf())
	console.log("localConst | myInt:", $.int(result4))

	// Test multi-level indirection
	let level: LocalLevel1 = 100
	let result5 = (level.valueOf() | 7)
	console.log("LocalLevel1 | 7:", $.int(result5))

	// Test cross-package named types
	console.log("\nCross-package operations:")

	// Test imported constants
	console.log("subpkg.IntValue:", $.int(subpkg.IntValue))
	console.log("subpkg.UintValue:", $.int(subpkg.UintValue))
	console.log("subpkg.FloatValue:", (subpkg.FloatValue as number))
	console.log("subpkg.StringValue:", subpkg.StringValue)
	console.log("subpkg.BoolValue:", (subpkg.BoolValue as boolean))

	// Test bitwise operations with imported types
	let result6 = (subpkg.UintValue | 0x20)
	console.log("subpkg.UintValue | 0x20:", $.int(result6))

	let result7 = (subpkg.LevelValue & 0xFFF)
	console.log("subpkg.LevelValue & 0xFFF:", $.int(result7))

	// Test function calls that return named types
	let combined = subpkg.GetCombinedFlags()
	console.log("subpkg.GetCombinedFlags():", $.int(combined))

	// Test multi-level indirection directly
	let directLevel = (subpkg.LevelValue | 0x0F)
	console.log("subpkg.LevelValue | 0x0F:", $.int(directLevel))

	// Test mixed operations between local and imported types
	let mixedResult = ((subpkg.UintValue as LocalUint) | myUint.valueOf())
	console.log("Mixed operation result:", $.int(mixedResult))

	// Test various bitwise operators
	console.log("\nTesting all bitwise operators:")
	let base = (42 as LocalInt)

	console.log("base:", $.int(base))
	console.log("base | 8:", $.int((base.valueOf() | 8)))
	console.log("base & 15:", $.int((base.valueOf() & 15)))
	console.log("base ^ 31:", $.int((base.valueOf() ^ 31)))
	console.log("base << 2:", $.int((base.valueOf() << 2)))
	console.log("base >> 1:", $.int((base.valueOf() >> 1)))
	console.log("base &^ 7:", $.int((base.valueOf() & ~ 7))) // AND NOT

	// Test with different underlying types
	console.log("\nDifferent underlying types:")

	let f: LocalFloat = 2.5
	let s: LocalString = "test"
	let b: LocalBool = true

	console.log("LocalFloat:", (f as number))
	console.log("LocalString:", s)
	console.log("LocalBool:", (b as boolean))

	// Test arithmetic operations that might need valueOf
	let f2 = f * 2.0
	console.log("LocalFloat * 2.0:", (f2 as number))

	console.log("test finished")
}


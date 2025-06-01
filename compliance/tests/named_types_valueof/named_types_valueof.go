package main

import (
	"github.com/aperturerobotics/goscript/compliance/tests/named_types_valueof/subpkg"
)

// Local named types for testing
type LocalInt int32
type LocalUint uint16
type LocalFloat float32
type LocalString string
type LocalBool bool

// Multi-level local types
type LocalLevel1 LocalLevel2
type LocalLevel2 LocalLevel3
type LocalLevel3 int

func main() {
	// Test basic named numeric types with bitwise operations
	var myInt LocalInt = 10
	var myUint LocalUint = 5

	// Test bitwise operations with local named types
	println("Local bitwise operations:")
	result1 := myInt | 3
	println("LocalInt | 3:", int(result1))

	result2 := myUint & 7
	println("LocalUint & 7:", int(result2))

	result3 := myInt ^ 15
	println("LocalInt ^ 15:", int(result3))

	// Test with constants
	const localConst LocalInt = 20
	result4 := localConst | myInt
	println("localConst | myInt:", int(result4))

	// Test multi-level indirection
	var level LocalLevel1 = 100
	result5 := level | 7
	println("LocalLevel1 | 7:", int(result5))

	// Test cross-package named types
	println("\nCross-package operations:")

	// Test imported constants
	println("subpkg.IntValue:", int(subpkg.IntValue))
	println("subpkg.UintValue:", int(subpkg.UintValue))
	println("subpkg.FloatValue:", float64(subpkg.FloatValue))
	println("subpkg.StringValue:", string(subpkg.StringValue))
	println("subpkg.BoolValue:", bool(subpkg.BoolValue))

	// Test bitwise operations with imported types
	result6 := subpkg.UintValue | 0x20
	println("subpkg.UintValue | 0x20:", int(result6))

	result7 := subpkg.LevelValue & 0xFFF
	println("subpkg.LevelValue & 0xFFF:", int(result7))

	// Test function calls that return named types
	combined := subpkg.GetCombinedFlags()
	println("subpkg.GetCombinedFlags():", int(combined))

	// Test multi-level indirection directly
	directLevel := subpkg.LevelValue | 0x0F
	println("subpkg.LevelValue | 0x0F:", int(directLevel))

	// Test mixed operations between local and imported types
	mixedResult := LocalUint(subpkg.UintValue) | myUint
	println("Mixed operation result:", int(mixedResult))

	// Test various bitwise operators
	println("\nTesting all bitwise operators:")
	base := LocalInt(42)

	println("base:", int(base))
	println("base | 8:", int(base|8))
	println("base & 15:", int(base&15))
	println("base ^ 31:", int(base^31))
	println("base << 2:", int(base<<2))
	println("base >> 1:", int(base>>1))
	println("base &^ 7:", int(base&^7)) // AND NOT

	// Test with different underlying types
	println("\nDifferent underlying types:")

	var f LocalFloat = 2.5
	var s LocalString = "test"
	var b LocalBool = true

	println("LocalFloat:", float32(f))
	println("LocalString:", string(s))
	println("LocalBool:", bool(b))

	// Test arithmetic operations that might need valueOf
	f2 := f * 2.0
	println("LocalFloat * 2.0:", float32(f2))

	println("test finished")
}

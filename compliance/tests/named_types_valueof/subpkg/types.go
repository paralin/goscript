package subpkg

// Named types with different basic underlying types

// Numeric types
type (
	MyInt   int
	MyUint  uint32
	MyFloat float64
)

// String and bool types
type (
	MyString string
	MyBool   bool
)

// Multiple levels of indirection
type (
	Level1 Level2
	Level2 Level3
	Level3 uint64
)

// Constants for testing
const (
	IntValue    MyInt    = 42
	UintValue   MyUint   = 0xFF
	FloatValue  MyFloat  = 3.14
	StringValue MyString = "hello"
	BoolValue   MyBool   = true
	LevelValue  Level1   = 0x1000
)

// Helper function that uses bitwise operations
func GetCombinedFlags() MyUint {
	return UintValue | 0x10
}

// Function that tests multi-level indirection
func GetLevelValue() Level1 {
	return LevelValue | 0x0F
}

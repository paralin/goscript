package main

// Test named type that should generate a wrapper class
type MyFileMode int

// Add a method to trigger wrapper class generation
func (m MyFileMode) String() string {
	return "mode"
}

// Test struct using the named type
type FileStatus struct {
	mode MyFileMode
	size int64
}

func main() {
	// Test using the named type directly
	var mode MyFileMode = 0o644
	println("Mode value:", int(mode))
	println("Mode string:", mode.String())

	// Test using in struct
	status := FileStatus{
		mode: MyFileMode(0o755),
		size: 1024,
	}

	println("Status mode:", int(status.mode))
	println("Status size:", status.size)

	// Test type assertion and conversion
	var genericMode MyFileMode = MyFileMode(0o777)
	println("Generic mode:", int(genericMode))
}

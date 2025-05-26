package main

type FileMode int

// String returns a string representation of the FileMode
func (fm FileMode) String() string {
	if fm == 0 {
		return "none"
	}
	return "some"
}

// IsZero checks if the FileMode is zero
func (fm FileMode) IsZero() bool {
	return fm == 0
}

// Add adds a value to the FileMode
func (fm FileMode) Add(val int) FileMode {
	return FileMode(int(fm) + val)
}

type CustomString string

// Length returns the length of the custom string
func (cs CustomString) Length() int {
	return len(string(cs))
}

// Upper converts to uppercase
func (cs CustomString) Upper() string {
	s := string(cs)
	result := ""
	for _, r := range s {
		if r >= 'a' && r <= 'z' {
			result += string(r - 32)
		} else {
			result += string(r)
		}
	}
	return result
}

func main() {
	// Test FileMode type with receiver methods
	var fm FileMode = 0
	println("FileMode(0).String():", fm.String())
	println("FileMode(0).IsZero():", fm.IsZero())

	// Test method calls on type conversion
	println("FileMode(5).String():", FileMode(5).String())
	println("FileMode(5).IsZero():", FileMode(5).IsZero())

	// Test method chaining
	result := FileMode(3).Add(2)
	println("FileMode(3).Add(2):", int(result))
	println("FileMode(3).Add(2).String():", result.String())

	// Test CustomString type
	var cs CustomString = "hello"
	println("CustomString(\"hello\").Length():", cs.Length())
	println("CustomString(\"hello\").Upper():", cs.Upper())

	// Test method calls on type conversion
	println("CustomString(\"world\").Length():", CustomString("world").Length())
	println("CustomString(\"world\").Upper():", CustomString("world").Upper())
}

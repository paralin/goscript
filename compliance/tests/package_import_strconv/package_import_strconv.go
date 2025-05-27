package main

import "strconv"

func main() {
	// Test Atoi
	i, err := strconv.Atoi("42")
	if err == nil {
		println("Atoi result:", i)
	}

	// Test Itoa
	s := strconv.Itoa(123)
	println("Itoa result:", s)

	// Test ParseInt
	i64, err := strconv.ParseInt("456", 10, 64)
	if err == nil {
		println("ParseInt result:", i64)
	}

	// Test FormatInt
	formatted := strconv.FormatInt(789, 10)
	println("FormatInt result:", formatted)

	// Test ParseFloat
	f, err := strconv.ParseFloat("3.14", 64)
	if err == nil {
		println("ParseFloat result:", f)
	}

	// Test FormatFloat
	floatStr := strconv.FormatFloat(2.718, 'f', 3, 64)
	println("FormatFloat result:", floatStr)

	// Test ParseBool
	b, err := strconv.ParseBool("true")
	if err == nil {
		println("ParseBool result:", b)
	}

	// Test FormatBool
	boolStr := strconv.FormatBool(false)
	println("FormatBool result:", boolStr)

	// Test Quote
	quoted := strconv.Quote("hello world")
	println("Quote result:", quoted)

	// Test Unquote
	unquoted, err := strconv.Unquote(`"hello world"`)
	if err == nil {
		println("Unquote result:", unquoted)
	}

	// Test error cases
	_, err = strconv.Atoi("invalid")
	if err != nil {
		println("Atoi error handled")
	}

	_, err = strconv.ParseFloat("invalid", 64)
	if err != nil {
		println("ParseFloat error handled")
	}

	println("test finished")
}

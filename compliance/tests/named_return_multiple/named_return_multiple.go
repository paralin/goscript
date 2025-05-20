package main

// Test function with multiple named return values
func processValues(input int) (num int, text string, ok bool) {
	num = input * 2
	if input > 5 {
		text = "greater than five"
		ok = true
	} else {
		text = "five or less"
		// ok remains false (its zero value)
	}
	return // Naked return
}

func main() {
	n1, t1, o1 := processValues(10)
	println(n1) // Expected: 20
	println(t1) // Expected: greater than five
	println(o1) // Expected: true

	n2, t2, o2 := processValues(3)
	println(n2) // Expected: 6
	println(t2) // Expected: five or less
	println(o2) // Expected: false

	// Test with an anonymous function and potentially unassigned named returns
	n3, t3, o3 := func(val int) (resInt int, resStr string, resBool bool) {
		if val == 1 {
			resInt = 100
			// resStr and resBool are not assigned, should be zero values
		} else if val == 2 {
			resInt = 200
			resStr = "set string"
			// resBool is not assigned, should be zero value
		} else {
			// all are unassigned, should be zero values
		}
		return
	}(1)

	println(n3) // Expected: 100
	println(t3) // Expected: "" (empty string)
	println(o3) // Expected: false

	n4, t4, o4 := func(val int) (resInt int, resStr string, resBool bool) {
		if val == 1 {
			resInt = 100
		} else if val == 2 {
			resInt = 200
			resStr = "set string for val 2"
			// resBool is not assigned
		} else {
			// all are unassigned
		}
		return
	}(2)

	println(n4) // Expected: 200
	println(t4) // Expected: "set string for val 2"
	println(o4) // Expected: false

	n5, t5, o5 := func(val int) (resInt int, resStr string, resBool bool) {
		if val == 1 {
			resInt = 100
		} else if val == 2 {
			resInt = 200
			resStr = "set string for val 2"
		} else {
			// all are unassigned here, so will take zero values
		}
		return
	}(3)

	println(n5) // Expected: 0
	println(t5) // Expected: ""
	println(o5) // Expected: false
}

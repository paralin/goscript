package main

func main() {
	boolMap := make(map[bool]string)
	
	boolMap[true] = "True value"
	boolMap[false] = "False value"
	
	println("Map size:", len(boolMap))
	
	println("Value for true:", boolMap[true])
	println("Value for false:", boolMap[false])
	
	var i interface{}
	i = boolMap
	
	m, ok := i.(map[bool]string)
	if ok {
		println("Correct type assertion passed:", m[true])
	} else {
		println("FAIL: Correct type assertion failed")
	}
	
	_, ok2 := i.(map[string]string)
	if ok2 {
		println("FAIL: Incorrect key type assertion unexpectedly passed")
	} else {
		println("Incorrect key type assertion correctly failed")
	}
	
	_, ok3 := i.(map[bool]int)
	if ok3 {
		println("FAIL: Incorrect value type assertion unexpectedly passed")
	} else {
		println("Incorrect value type assertion correctly failed")
	}
}

package main

func main() {
	largeMap := make(map[string]int)
	
	largeMap["item1"] = 1
	largeMap["item2"] = 2
	largeMap["item3"] = 3
	largeMap["item4"] = 4
	largeMap["item5"] = 5
	largeMap["item6"] = 6
	largeMap["item7"] = 7
	largeMap["item8"] = 8
	
	println("Large map size:", len(largeMap))
	
	var i interface{}
	i = largeMap
	
	m, ok := i.(map[string]int)
	if ok {
		println("Large map type assertion passed")
		println("item7 value:", m["item7"])
	} else {
		println("FAIL: Large map type assertion failed")
	}
	
	_, ok2 := i.(map[string]string)
	if ok2 {
		println("FAIL: Incorrect value type assertion unexpectedly passed")
	} else {
		println("Incorrect value type assertion correctly failed")
	}
}

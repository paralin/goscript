package main

func main() {
	nestedMap := make(map[string]map[string]int)
	
	nestedMap["user1"] = make(map[string]int)
	nestedMap["user2"] = make(map[string]int)
	
	nestedMap["user1"]["score"] = 95
	nestedMap["user1"]["age"] = 30
	nestedMap["user2"]["score"] = 85
	nestedMap["user2"]["age"] = 25
	
	println("User1 score:", nestedMap["user1"]["score"])
	println("User2 age:", nestedMap["user2"]["age"])
	
	var i interface{}
	i = nestedMap
	
	m, ok := i.(map[string]map[string]int)
	if ok {
		println("Nested map type assertion passed:", m["user1"]["score"])
	} else {
		println("FAIL: Nested map type assertion failed")
	}
	
	_, ok2 := i.(map[string]map[int]int)
	if ok2 {
		println("FAIL: Incorrect inner key type assertion unexpectedly passed")
	} else {
		println("Incorrect inner key type assertion correctly failed")
	}
	
	_, ok3 := i.(map[string]map[string]string)
	if ok3 {
		println("FAIL: Incorrect inner value type assertion unexpectedly passed")
	} else {
		println("Incorrect inner value type assertion correctly failed")
	}
}

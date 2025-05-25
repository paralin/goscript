package main

func main() {
	// Test type assertion assignment with indexed LHS using regular assignment
	var slice []interface{} = []interface{}{"hello", 42, true}
	var results [2]interface{}
	var ok bool
	results[0], ok = slice[1].(int)
	if ok {
		println("slice[1] as int:", results[0].(int))
	}

	// Test type assertion assignment with map indexed LHS using regular assignment
	var m map[string]interface{} = make(map[string]interface{})
	m["key2"] = 123
	var mapResults map[string]interface{} = make(map[string]interface{})
	var ok2 bool
	mapResults["result"], ok2 = m["key2"].(int)
	if ok2 {
		println("m[key2] as int:", mapResults["result"].(int))
	}
}

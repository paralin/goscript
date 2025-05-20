package main

func main() {
	var w interface{} = "test"
	println("value is", w.(string))
}

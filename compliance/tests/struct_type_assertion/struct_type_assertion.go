package main

func main() {
	var i interface{}
	i = struct{ Name string }{"Alice"}

	s, ok := i.(struct{ Name string })
	if ok {
		println("Name:", s.Name)
	} else {
		println("Type assertion failed")
	}

	j, ok2 := i.(struct{ Age int })
	if ok2 {
		println("Age:", j.Age)
	} else {
		println("Second type assertion failed as expected")
	}
}

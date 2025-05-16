package main

func main() {
	var i any = struct {
		Name   string
		Number int
	}{"Alice", 8005553424}

	s, ok := i.(struct {
		Name   string
		Number int
	})
	if ok {
		println("Name:", s.Name, "Number:", s.Number)
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

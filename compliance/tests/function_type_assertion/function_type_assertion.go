package main

type (
	Greeter func(name string) string
	Adder   func(a, b int) int
)

func greet(name string) string {
	return "Hello, " + name
}

func add(a, b int) int {
	return a + b
}

func getGreeter() interface{} {
	return Greeter(greet)
}

func getAdder() interface{} {
	return Adder(add)
}

type FuncContainer struct {
	myFunc interface{}
}

func main() {
	// 1. Simple function type assertion
	var i interface{} = Greeter(greet)
	fn, ok := i.(Greeter)
	if ok {
		println(fn("World"))
	} else {
		println("Simple assertion failed")
	}

	var j interface{} = Adder(add)
	addFn, ok := j.(Adder)
	if ok {
		println(addFn(5, 3))
	} else {
		println("Simple adder assertion failed")
	}

	// 2. Type assertion of a function returned from another function
	returnedFn := getGreeter()
	greetFn, ok := returnedFn.(Greeter)
	if ok {
		println(greetFn("Gopher"))
	} else {
		println("Returned function assertion failed")
	}

	returnedAdder := getAdder()
	addFnFromFunc, ok := returnedAdder.(Adder)
	if ok {
		println(addFnFromFunc(10, 20))
	} else {
		println("Returned adder assertion failed")
	}

	// 3. Type assertion of a function in a struct field
	container := FuncContainer{myFunc: Greeter(greet)}
	structFn, ok := container.myFunc.(Greeter)
	if ok {
		println(structFn("Struct"))
	} else {
		println("Struct function assertion failed")
	}

	adderContainer := FuncContainer{myFunc: Adder(add)}
	structAdderFn, ok := adderContainer.myFunc.(Adder)
	if ok {
		println(structAdderFn(7, 8))
	} else {
		println("Struct adder assertion failed")
	}

	// 4. Type assertion of a function in a map
	funcMap := make(map[string]interface{})
	funcMap["greeter"] = Greeter(greet)
	funcMap["adder"] = Adder(add)

	mapFn, ok := funcMap["greeter"].(Greeter)
	if ok {
		println(mapFn("Map"))
	} else {
		println("Map function assertion failed")
	}

	mapAdderFn, ok := funcMap["adder"].(Adder)
	if ok {
		println(mapAdderFn(1, 2))
	} else {
		println("Map adder assertion failed")
	}

	// 5. Type assertion of a function in a slice
	funcSlice := make([]interface{}, 2)
	funcSlice[0] = Greeter(greet)
	funcSlice[1] = Adder(add)

	sliceFn, ok := funcSlice[0].(Greeter)
	if ok {
		println(sliceFn("Slice"))
	} else {
		println("Slice function assertion failed")
	}
	sliceAdderFn, ok := funcSlice[1].(Adder)
	if ok {
		println(sliceAdderFn(9, 9))
	} else {
		println("Slice adder assertion failed")
	}

	// 6. Type assertion with ok variable (successful and failing)
	var k interface{} = Greeter(greet)
	_, ok1 := k.(Greeter)
	println(ok1) // true

	_, ok2 := k.(Adder)
	println(ok2) // false

	var l interface{} = "not a function"
	_, ok3 := l.(Greeter)
	println(ok3) // false

	// 7. Type assertion that should panic (commented out for now to allow test to run)
	// defer func() {
	// 	if r := recover(); r != nil {
	// 		println("Panic caught as expected")
	// 	}
	// }()
	// var m interface{} = "definitely not a func"
	// _ = m.(Greeter) // This would panic
	// println("This line should not be reached if panic test is active")

	// Test with nil interface
	var nilInterface interface{}
	nilFn, okNil := nilInterface.(Greeter)
	if !okNil && nilFn == nil {
		println("Nil interface assertion correct")
	} else {
		println("Nil interface assertion failed")
	}

	// Test assertion to wrong function type
	var wrongFnInterface interface{} = Greeter(greet)
	wrongFn, okWrong := wrongFnInterface.(Adder)
	if !okWrong && wrongFn == nil {
		println("Wrong function type assertion correct")
	} else {
		println("Wrong function type assertion failed")
	}
}

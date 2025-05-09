package main

// Test case 1: Named parameters, multiple return values
type Func1 func(a int, b string) (bool, error)

var fn1 Func1

// Test case 2: Unnamed parameters, single return value
type Func2 func(int, string) bool

var fn2 Func2

// Test case 3: No parameters, no return value
type Func3 func()

var fn3 Func3

// Test case 4: Variadic parameter
// Note: The current implementation of WriteSignatureType might not fully support
// variadic parameters in the way Go handles them (e.g. as a slice).
// This will test its current translation.
type Func4 func(a int, b ...string)

var fn4 Func4

// Custom error type
type MyError struct {
	s string
}

func NewMyError(text string) error {
	return &MyError{s: text}
}

func (e *MyError) Error() string {
	return e.s
}

func main() {
	fn1 = func(a int, b string) (bool, error) {
		println("fn1 called with:", a, b)
		if a > 0 {
			return true, nil
		}
		return false, NewMyError("a was not positive")
	}

	fn2 = func(p0 int, p1 string) bool {
		println("fn2 called with:", p0, p1)
		return p0 == len(p1)
	}

	fn3 = func() {
		println("fn3 called")
	}

	fn4 = func(a int, b ...string) {
		println("fn4 called with: ", a)
		for _, s := range b {
			println(" ", s)
		}
		println() // Newline after all strings
	}

	res1, err1 := fn1(10, "hello")
	println("fn1 result 1: ", res1, " ")
	if err1 != nil {
		println(err1.Error())
	} else {
		println("nil")
	}

	res1_2, err1_2 := fn1(-5, "world")
	println("fn1 result 2: ", res1_2, " ")
	if err1_2 != nil {
		println(err1_2.Error())
	} else {
		println("nil")
	}

	res2 := fn2(5, "hello")
	println("fn2 result 1:", res2)

	res2_2 := fn2(3, "hey")
	println("fn2 result 2:", res2_2)

	fn3()

	fn4(1)
	fn4(2, "one")
	fn4(3, "two", "three")
}

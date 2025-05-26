package main

type Counter struct {
	value int
}

func (c *Counter) Increment() {
	c.value++
}

func (c *Counter) GetValue() int {
	return c.value
}

func (c Counter) IncrementValue() {
	c.value++
}

func (c Counter) GetValueByValue() int {
	return c.value
}

func callFunction(fn func()) {
	fn()
}

func callFunctionWithReturn(fn func() int) int {
	return fn()
}

func main() {
	// Test with pointer receiver methods
	counter := &Counter{value: 0}

	println("Initial value:", counter.GetValue())

	// Test method binding when passed as parameter
	callFunction(counter.Increment)
	println("After calling Increment via parameter:", counter.GetValue())

	// Test method binding when assigned to variable
	incrementFunc := counter.Increment
	incrementFunc()
	println("After calling Increment via variable:", counter.GetValue())

	// Test method with return value
	getValueFunc := counter.GetValue
	value := getValueFunc()
	println("Value from assigned method:", value)

	// Test with return value via parameter
	value2 := callFunctionWithReturn(counter.GetValue)
	println("Value from method via parameter:", value2)

	// Test with value receiver methods
	counter2 := Counter{value: 10}

	println("Initial value2:", counter2.GetValueByValue())

	// This should NOT modify the original counter2 since it's a value receiver
	callFunction(counter2.IncrementValue)
	println("After calling IncrementValue via parameter (should be unchanged):", counter2.GetValueByValue())

	// This should also NOT modify the original counter2
	incrementValueFunc := counter2.IncrementValue
	incrementValueFunc()
	println("After calling IncrementValue via variable (should be unchanged):", counter2.GetValueByValue())

	// Test method with return value on value receiver
	getValueByValueFunc := counter2.GetValueByValue
	value3 := getValueByValueFunc()
	println("Value from assigned value method:", value3)
}

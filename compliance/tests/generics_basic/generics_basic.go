package main

func printVal[T any](val T) {
	println(val)
}

func main() {
	printVal(10)
	printVal("hello")
	printVal(true)
}

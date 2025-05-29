package main

func firstFunc() (string, int) {
	return "", 42
}

func secondFunc(x int) int {
	if x != 0 {
		println("Got value:", x)
		return 0
	}
	return 99
}

func main() {
	_, x := firstFunc()
	// This is the problematic pattern: x is shadowed but also used in the call
	if x := secondFunc(x); x != 0 {
		println("Function returned value")
		return
	}
	println("Completed successfully")
}

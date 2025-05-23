package main

func main() {
	var x interface{} = func() {
		println("goroutine executed")
	}
	go x.(func())()
	println("main finished")
}

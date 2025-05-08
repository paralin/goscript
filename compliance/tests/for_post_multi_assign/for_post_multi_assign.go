package main

func main() {
	for i, j := 0, 5; i < j; i, j = i+1, j-1 {
		println(i, j)
	}
	println("done")
}

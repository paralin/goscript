package main

func main() {
	arr := [3]int{1, 2, 3}
	arrPtr := &arr

	for i, v := range arrPtr {
		println("index:", i, "value:", v)
	}
}

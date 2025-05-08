package main

func main() {
	for i, j := 0, 1; i < 2; i++ {
		println(i, j)
		j += 10 // Modify j to see a clearer change in output
	}
}

package main

func main() {
	i := 0
	for {
		println("Looping forever...")
		i++
		if i >= 3 {
			break
		}
	}
	println("Loop finished")
}

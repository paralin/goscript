package main

func main() {
	greet := func(name string) string {
		return "Hello, " + name
	}

	message := greet("world")
	println(message)
}

package main

import (
	"fmt"
)

func main() {
	fmt.Printf("Hello %s!\n", "world")
	
	fmt.Println("Testing fmt override")
	
	s := fmt.Sprintf("Value: %d", 42)
	println(s)
}

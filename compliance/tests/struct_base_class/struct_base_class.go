package main

type Person struct {
    Name string
    Age  int
}

func main() {
    p1 := Person{Name: "Alice", Age: 30}
    println(p1.Name)
    println(p1.Age)
    
    p2 := p1
    p2.Name = "Bob"
    p2.Age = 25
    
    println(p1.Name) // Should still be "Alice"
    println(p2.Name) // Should be "Bob"
}

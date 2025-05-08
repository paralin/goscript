package main

func main() {
	m := make(map[string]int)
	m["one"] = 1
	println("Assigning m[\"one\"] to _, _ (key exists)")
	_, _ = m["one"]
	println("Assigning m[\"two\"] to _, _ (key does not exist)")
	_, _ = m["two"]
	println("done")
}

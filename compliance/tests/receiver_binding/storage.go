package main

type storage struct {
	bytes []byte
	name  string
}

func main() {
	s := &storage{
		bytes: make([]byte, 5),
		name:  "test",
	}

	println("Name:", s.Name())
	println("Length:", s.Len())
	println("Empty:", s.IsEmpty())

	s.Truncate()
	println("Length after truncate:", s.Len())

	s.SetName("new_name")
	println("New name:", s.Name())
}

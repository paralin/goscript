package main

type Foo struct {
	done chan bool
}

func NewFoo() *Foo {
	return &Foo{done: make(chan bool)}
}

func (f *Foo) Bar() {
	println("Foo.Bar called")
	f.done <- true
}

func main() {
	f := NewFoo()
	go f.Bar()
	<-f.done // Wait for the goroutine to complete
	println("main done")
}

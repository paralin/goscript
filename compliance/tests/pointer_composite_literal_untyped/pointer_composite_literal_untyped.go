package main

func main() {
	// This should trigger "unhandled composite literal type: *types.Pointer"
	// because the composite literal {} has no explicit type, but its type gets inferred as a pointer
	var ptr *struct{ x int }
	ptr = &struct{ x int }{42}
	println("Pointer value x:", ptr.x)

	// Now try to use an untyped composite literal that resolves to a pointer
	// This is the case that should trigger the error
	data := []*struct{ x int }{{42}, {43}}

	println("First element x:", data[0].x)
	println("Second element x:", data[1].x)
}

package main

type Result struct {
	ok bool
}

func main() {
	var x interface{} = 42
	result := Result{}

	// This should trigger the error: ok expression is not an identifier: *ast.SelectorExpr
	// The 'ok' variable is result.ok (a selector expression) instead of a simple identifier
	_, result.ok = x.(int)

	println("Type assertion successful:", result.ok)
}

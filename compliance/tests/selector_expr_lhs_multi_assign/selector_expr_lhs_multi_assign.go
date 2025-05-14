package main

type Point struct {
	X int
	Y int
}

func getCoords() (int, int) {
	return 10, 20
}

func main() {
	var p Point
	// This assignment should trigger the error because p.X and p.Y are *ast.SelectorExpr,
	// and the current implementation of writeMultiVarAssignFromCall in WriteStmtAssign
	// expects *ast.Ident for destructuring.
	p.X, p.Y = getCoords()
	println(p.X, p.Y)
}

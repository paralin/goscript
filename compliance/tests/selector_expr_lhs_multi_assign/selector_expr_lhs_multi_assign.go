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
	// p.X and p.Y are *ast.SelectorExpr
	// test writeMultiVarAssignFromCall in WriteStmtAssign
	p.X, p.Y = getCoords()
	println(p.X, p.Y)
}

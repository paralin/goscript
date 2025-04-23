package main

func main() {
	// === Boolean Logic ===
	a := true
	b := false
	and := a && b
	or := a || b
	notA := !a
	println("AND: Expected: false, Actual:", and)
	println("OR: Expected: true, Actual:", or)
	println("NOT: Expected: false, Actual:", notA)
}

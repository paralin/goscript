package main

func main() {
	// Test octal literals that cause TypeScript compilation errors
	perm1 := 0o777
	perm2 := 0o666
	perm3 := 0o644
	perm4 := 0o755

	println("perm1:", perm1)
	println("perm2:", perm2)
	println("perm3:", perm3)
	println("perm4:", perm4)

	println("test finished")
}

package main

func main() {
	// Test labeled statements with different statement types

	// Label with a for loop and continue
label1:
	for i := 0; i < 3; i++ {
		if i == 1 {
			continue label1
		}
		println("continue test i:", i)
	}

	// Label with a variable declaration (this was causing the TypeScript error)
	var x int = 42
	println("x:", x)

	// Label with a block statement and goto
	goto label2
	println("this should be skipped")

label2:
	{
		var y int = 100
		println("y:", y)
	}

	// Label with a for loop and break
label3:
	for i := 0; i < 5; i++ {
		if i == 3 {
			break label3
		}
		println("i:", i)
	}

	// Nested labels
outer:
	for i := 0; i < 3; i++ {
	inner:
		for j := 0; j < 3; j++ {
			if i == 1 && j == 1 {
				break outer
			}
			if j == 1 {
				continue inner
			}
			println("nested:", i, j)
		}
	}

	println("test finished")
}

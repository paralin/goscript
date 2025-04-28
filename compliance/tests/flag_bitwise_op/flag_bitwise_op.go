package main

func main() {
	const (
		O_WRONLY int = 0x1
		O_CREATE int = 0x40
		O_APPEND int = 0x400
		O_TRUNC  int = 0x200
	)
	flag := O_WRONLY | O_CREATE | O_APPEND
	if flag&O_APPEND != 0 {
		println("O_APPEND is set: Expected: O_APPEND is set, Actual: O_APPEND is set")
	} else {
		println("O_APPEND is not set: Expected: (no output)")
	}
	if flag&O_TRUNC != 0 {
		println("O_TRUNC is set: Expected: (no output)")
	} else {
		println("O_TRUNC is not set: Expected: O_TRUNC is not set, Actual: O_TRUNC is not set")
	}

	flag = O_WRONLY | O_CREATE
	if flag&O_APPEND != 0 {
		println("O_APPEND is set: Expected: (no output)")
	} else {
		println("O_APPEND is not set: Expected: O_APPEND is not set, Actual: O_APPEND is not set")
	}
}

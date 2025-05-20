package main

import "time"

func main() {
	now := time.Now()
	setTime := time.Date(2025, time.May, 15, 1, 10, 42, 0, time.UTC)
	if now.Sub(setTime) < time.Hour*24 {
		println("expected we are > 24 hrs past may 15, incorrect")
	}

	println("preset time", setTime.String())
}

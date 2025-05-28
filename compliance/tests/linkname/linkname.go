//go:build linkname

package main

import (
	"time"
	_ "unsafe"
)

//go:linkname timeNow time.Now
func timeNow() time.Time {
	return time.Date(2000, 1, 1, 0, 0, 0, 0, time.UTC)
}

func main() {
	now := time.Now()
	println("overridden time now", now.String())
}

package main

import "time"

func main() {
	now := time.Now()
	setTime := time.Date(2025, time.May, 15, 1, 10, 42, 0, time.UTC)
	if now.Sub(setTime) < time.Hour*24 {
		println("expected we are > 24 hrs past may 15, incorrect")
	}

	println("preset time", setTime.String())
	println("unix", setTime.Unix())
	println("unix micro", setTime.UnixMicro())
	println("unix nano", setTime.UnixNano())
	println("unix milli", setTime.UnixMilli())

	// day, month, etc.
	println("day", setTime.Day())
	println("month", setTime.Month())
	println("year", setTime.Year())
	println("hour", setTime.Hour())
	println("minute", setTime.Minute())
	println("second", setTime.Second())
	println("nanosecond", setTime.Nanosecond())

	// other functions on setTime
	println("weekday", setTime.Weekday().String())
	println("location", setTime.Location().String())
}

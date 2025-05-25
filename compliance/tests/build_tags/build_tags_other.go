//go:build !js && !darwin && !windows

package main

func testJSWasm() {
	println("Non-Windows Non-Darwin Non-Js specific code compiled - WRONG! This should not be compiled when GOOS=js")
}

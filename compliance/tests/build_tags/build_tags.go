package main

func main() {
	println("=== Build Tags Test ===")

	// Test that platform-specific files are handled correctly
	// This should only compile files with js/wasm build tags
	// and exclude files with other platform tags

	testJSWasm()
	testGeneric()

	println("=== End Build Tags Test ===")
}

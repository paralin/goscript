package main

import "os"

func main() {
	// Test Getwd - works with mock data
	if wd, err := os.Getwd(); err == nil {
		println("Current working directory:", wd)
	} else {
		println("Error getting working directory:", err.Error())
	}

	// Test Environment variables - these work
	os.Setenv("TEST_VAR", "test_value")
	println("Set environment variable TEST_VAR")

	if val := os.Getenv("TEST_VAR"); val != "" {
		println("Got environment variable TEST_VAR:", val)
	}

	os.Unsetenv("TEST_VAR")
	if val := os.Getenv("TEST_VAR"); val == "" {
		println("Environment variable TEST_VAR unset successfully")
	}

	// Test Hostname - works with mock data
	if hostname, err := os.Hostname(); err == nil {
		println("Hostname:", hostname)
	} else {
		println("Error getting hostname:", err.Error())
	}
}

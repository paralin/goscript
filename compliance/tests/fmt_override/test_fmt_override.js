// Custom test runner for fmt_override test
// This file directly uses the handwritten fmt package

// Import the fmt package functions
import * as fmt from '../../../gs/fmt/fmt.gs.js';

// Run the test
fmt.Printf("Hello %s!\n", "world");
fmt.Println("Testing fmt override");
const s = fmt.Sprintf("Value: %d", 42);
console.log(s);

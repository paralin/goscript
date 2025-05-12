// Import the fmt package override directly
const fmt = require('../../../gs/fmt/fmt.gs.js');

// Run the test
fmt.Printf("Hello %s!\n", "world");
fmt.Println("Testing fmt override");
const s = fmt.Sprintf("Value: %d", 42);
console.log(s);

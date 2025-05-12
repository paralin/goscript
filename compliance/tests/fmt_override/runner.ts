/**
 * Custom runner for fmt_override test
 */
import { goscript } from "./goscript";

// Implement the test functionality
export function main(): void {
  goscript.fmt.Printf("Hello %s!\n", "world");
  goscript.fmt.Println("Testing fmt override");
}

// Run the test
main();

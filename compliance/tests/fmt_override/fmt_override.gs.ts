// Custom implementation for fmt_override test
// This file directly uses the handwritten fmt package

import * as $ from "@goscript/builtin";
import * as fmt from "@goscript/fmt";

export function main(): void {
    fmt.Printf("Hello %s!\n", "world");
    fmt.Println("Testing fmt override");
    
    const s = fmt.Sprintf("Value: %d", 42);
    $.println(s);
}

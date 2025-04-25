# Map Support Implementation

## Current Issue
We're trying to implement map support in GoScript. The test compilation failed with:
```
failed to write core assignment: unhandled make call
```

This indicates that maps are not yet supported in the compiler. The specific operations we need to implement are:

1. Map creation with `make(map[K]V])`
2. Map literal syntax `map[K]V{key1: val1, key2: val2}`
3. Map operations: 
   - Assignment `m[key] = value`
   - Access `m[key]`
   - Deletion `delete(m, key)`
   - Length `len(m)`
   - Existence check `val, ok := m[key]`
4. Map iteration with `for range`

## Analysis of Generated TypeScript
Maps in Go should be translated to Maps in TypeScript. Here's what the correct TypeScript output for our test should look like:

```typescript
// For map creation with make
let scores = new Map<string, number>();

// For map literal syntax
let colors = new Map<string, string>([
  ["red", "#ff0000"],
  ["green", "#00ff00"], 
  ["blue", "#0000ff"]
]);

// For map operations
// Assignment: scores.set("Alice", 90)
// Access: scores.get("Alice")
// Existence check: scores.has("David")
// Length: scores.size
// Deletion: scores.delete("Charlie")

// For map iteration
for (const [name, score] of scores.entries()) {
  console.log("  - Name:", name, "Score:", score);
}
```

## Files to Modify

I need to examine the compiler code to determine where to add map support.
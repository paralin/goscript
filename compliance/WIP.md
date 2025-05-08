# Map Type Assertion Compliance

## Task
Implement proper type assertion for map types.

## Problem
The `map_type_assertion` test case fails because the generated TypeScript code for type assertions on maps uses `'unknown'` as the type string identifier.

Go source:
```go
package main

func main() {
	var i interface{}
	i = map[string]int{"age": 30}

	m, ok := i.(map[string]int)
	if ok {
		println("Age:", m["age"])
	} else {
		println("Type assertion failed")
	}
    // ... other assertions
}
```

Generated TypeScript (`compliance/tests/map_type_assertion/map_type_assertion.gs.ts`):
```typescript
// ...
export function main(): void {
	let i: any/* unhandled interface type: interface{} */ = null
	i = new Map([["age", 30]])

	let { value: m, ok: ok } = $.typeAssert<{ [key: string]: number }>(i, 'unknown') // Problematic line
	if (ok) {
		console.log("Age:", m.get("age") ?? 0)
	} else {
		console.log("Type assertion failed")
	}
    // ...
}
```
The `$.typeAssert` function in `builtin/builtin.ts` needs a proper type string to perform the runtime check, but it's receiving `'unknown'`.

## Expected Output
The first type assertion `m, ok := i.(map[string]int)` should succeed.

Go output:
```
Age: 30
Second type assertion (map[string]string) failed as expected
Third type assertion (map[int]int) failed as expected
```

Current TS output:
```
Type assertion failed
Second type assertion (map[string]string) failed as expected
Third type assertion (map[int]int) failed as expected
```

## Plan
1.  Investigate how type identifiers are generated for `ast.TypeAssertExpr` in `compiler/writer.go` (likely in `WriteTypeAssertExpr` or a related function that handles `ast.MapType`).
2.  The `writeType` function or similar needs to be modified to generate a unique and recognizable string representation for map types (e.g., `"map[string]int"` or a structured representation that `builtin.ts` can parse).
3.  This string representation should be passed as the second argument to `$.typeAssert`.
4.  Update `builtin/builtin.ts` if necessary to handle this new map type string representation in the `typeAssert` function. Specifically, the `isOfType` helper within `typeAssert` will need to correctly validate map keys and values.

## Compiler Code to Review/Modify
- `compiler/writer.go`: Specifically the function that handles `ast.TypeAssertExpr` and the generation of the type string for `ast.MapType`. This might involve `writeTypeOrNil`, `writeType`, or a more specific function for map types.
- `builtin/builtin.ts`: The `typeAssert` and `isOfType` functions to correctly interpret the new map type string and perform the runtime check.
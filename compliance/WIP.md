# Variable Shadowing and Scope Issue Analysis

## Problem Description

The Go to TypeScript compiler is generating unnecessary block scopes and causing variable shadowing issues for if statements with initialization.

The compliance test `variable_shadowing_scope` is failing because the generated TypeScript code is not correct.

The input is located in `compliance/tests/variable_shadowing_scope/variable_shadowing_scope.go`

### Input Go Code:
```go
package main

func firstFunc() (string, int) {
	return "", 42
}

func secondFunc(x int) int {
	if x != 0 {
		println("Got value:", x)
		return 0
	}
	return 99
}

func main() {
	_, x := firstFunc()
	// This is the problematic pattern: x is shadowed but also used in the call
	if x := secondFunc(x); x != 0 {
		println("Function returned value")
		return
	}
	println("Completed successfully")
}
```

### Current Generated TypeScript:

The output is located in `compliance/tests/variable_shadowing_scope/variable_shadowing_scope.gs.ts`

The compliance test can be run with `go test -timeout 30s -run ^TestCompliance/variable_shadowing_scope$ ./compiler`

```typescript
export async function main(): Promise<void> {
	let [, x] = firstFunc()
	{
		let x = secondFunc(x)  // ERROR: x refers to inner x before assignment!
		if (x != 0) {
			console.log("Function returned value")
			return 
		}
	}
	console.log("Completed successfully")
}
```

### The Issue

The problem is that `x` is declared in the outer scope, but then redeclared in the inner block scope, and the `secondFunc(x)` call tries to use the `x` from the outer scope, but TypeScript sees it as using the inner `x` before it's assigned.

This produces the TypeScript errors:
- `Block-scoped variable 'x' used before its declaration`
- `Variable 'x' is used before being assigned`

### Expected TypeScript:

```typescript
export async function main(): Promise<void> {
	let [, x] = firstFunc()
	let _temp_x = x // Store outer x in temporary variable
	{
		let x = secondFunc(_temp_x)  // Use temporary variable instead
		if (x != 0) {
			console.log("Function returned value")
			return 
		}
	}
	console.log("Completed successfully")
}
```

## Analysis Required

The solution is to add analysis to the compiler in `compiler/analysis.go` to detect this case and generate a temporary variable for the outer scope.

The key pattern to detect is:
1. Variable is declared in outer scope
2. Variable is re-assigned/shadowed in inner scope (if statement with initialization)
3. Variable from outer scope is used in the initialization of the inner scope variable

When this pattern is detected, the compiler should:
1. Generate a temporary variable in the outer scope to hold the original value
2. Use the temporary variable in the inner scope initialization
3. Keep the inner scope variable declaration as-is
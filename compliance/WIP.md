# Analysis: LHS count != RHS count Error in Interface Iterator

## Problem Description

The compiler fails with the error:
```
failed to compile package maps: failed to write declarations: failed to write function body: failed to write block statement: failed to write statement in block: failed to write range statement: failed to write interface iterator body: failed to write statement in block: failed to write if statement: failed to write assignment statement: invalid assignment statement: LHS count (2) != RHS count (1)
```

## Root Cause Analysis

The error occurs in the following call chain:
1. `WriteStmtRange` - handling a range statement over `maps.All(m)` 
2. Interface iterator path is taken (line ~480 in `stmt-range.go`)
3. `WriteStmtBlock` is called to write the iterator body
4. `WriteStmt` processes statements in the block
5. `WriteStmtIf` processes an if statement
6. `WriteStmtAssign` processes an assignment statement
7. Error occurs at line 465 in `stmt-assign.go`: `LHS count (2) != RHS count (1)`

## Specific Issue

The problem is in `compiler/stmt-assign.go` at line 465:
```go
if len(exp.Lhs) != len(exp.Rhs) {
    return fmt.Errorf("invalid assignment statement: LHS count (%d) != RHS count (%d)", len(exp.Lhs), len(exp.Rhs))
}
```

This check is too strict and doesn't account for valid Go assignment patterns where:
1. Multiple variables can be assigned from a single function call that returns multiple values
2. The RHS is a single expression that evaluates to multiple values

## Test Case

The test case `package_import_maps.go` contains:
```go
for k, v := range maps.All(m) {
    x, y := getValue()  // This triggers the error: 2 LHS, 1 RHS (function call)
    // ...
}
```

The assignment `x, y := getValue()` is valid Go code where:
- LHS has 2 variables: `x, y`
- RHS has 1 expression: `getValue()` (which returns 2 values)

## Solution Implemented

I modified the strict count check in `compiler/stmt-assign.go` to allow multi-variable assignments from single expressions that can produce multiple values:

```go
// Ensure LHS and RHS have the same length for valid Go code in these cases
if len(exp.Lhs) != len(exp.Rhs) {
    // Special case: allow multiple LHS with single RHS if RHS can produce multiple values
    // This handles cases like: x, y := getValue() where getValue() returns multiple values
    // or other expressions that can produce multiple values
    if len(exp.Rhs) == 1 {
        // Allow single RHS expressions that can produce multiple values:
        // - Function calls that return multiple values
        // - Type assertions with comma-ok
        // - Map lookups with comma-ok  
        // - Channel receives with comma-ok
        // The Go type checker should have already verified this is valid
        rhsExpr := exp.Rhs[0]
        switch rhsExpr.(type) {
        case *ast.CallExpr, *ast.TypeAssertExpr, *ast.IndexExpr, *ast.UnaryExpr:
            // These expression types can potentially produce multiple values
            // Let the general assignment logic handle them
        default:
            return fmt.Errorf("invalid assignment statement: LHS count (%d) != RHS count (%d)", len(exp.Lhs), len(exp.Rhs))
        }
    } else {
        return fmt.Errorf("invalid assignment statement: LHS count (%d) != RHS count (%d)", len(exp.Lhs), len(exp.Rhs))
    }
}
```

## Result

✅ **COMPLETELY FIXED**: The original LHS count != RHS count error has been resolved. The compiler now successfully compiles:

1. **User code** with multi-variable assignments from single function calls
2. **Standard library packages** (like `maps`) that contain similar assignment patterns

The test case now compiles successfully and generates the correct TypeScript:
```typescript
let [x, y] = getValue()
```

The compilation phase completes successfully for both the test code and the `maps` package. Any remaining errors are related to TypeScript syntax generation or type checking, which are separate issues from the original assignment compilation error.

## Impact

This fix resolves the compilation failure that was preventing the use of:
- Multi-variable assignments from function calls
- Iterator patterns that use such assignments
- Standard library packages like `maps` that contain these patterns

The fix is conservative and only allows single RHS expressions that can legitimately produce multiple values, maintaining type safety while enabling valid Go code patterns to compile successfully. 

# Package Import Maps Compliance Test - Type Fixes

## Current Status: ✅ COMPILES, 🔄 3 TYPESCRIPT TYPE ERRORS

The package_import_maps compliance test now **compiles successfully** and runs with correct output! However, there are 3 remaining TypeScript type checking errors that need to be fixed.

## Issues Analysis

### 1. **maps.gs.ts:53** - `return null` should return type `M` (generic map type)

**Problem**: 
```typescript
export function Clone<M extends Map<K, V>, K extends $.Comparable, V extends any>(m: M): M {
	if (m == null) {
		return null  // ❌ Type 'null' is not assignable to type 'M'
	}
	return $.mustTypeAssert<M>(clone(m), 'M')
}
```

**Root Cause**: The Go code `return nil` for a generic map type `M` should return `null as M` in TypeScript to satisfy the generic type constraint.

**Go Source**:
```go
func Clone[M ~map[K]V, K comparable, V any](m M) M {
	if m == nil {
		return nil  // This is valid in Go for any map type M
	}
	return clone(m).(M)
}
```

**Solution**: Update the compiler to generate `null as M` instead of `null` for generic type returns.

### 2. **package_import_maps.gs.ts:43** - `v` is of type `unknown`

**Problem**:
```typescript
maps.All(m)((k, v) => {  // v is inferred as unknown
    let result = k + x + String.fromCharCode(v + y)  // ❌ 'v' is of type 'unknown'
})
```

**Root Cause**: The iterator type inference is not properly propagating the map value type to the callback parameter.

**Go Source**:
```go
for k, v := range maps.All(m) {  // v should be int (from map[string]int)
    result := k + x + string(rune(v+y))
}
```

**Solution**: Fix the iterator type generation to properly infer callback parameter types from the map types.

### 3. **package_import_maps.gs.ts:53** - Cannot invoke possibly null function

**Problem**:
```typescript
export function simpleIterator(m: Map<string, number>): ((p0: ((p0: string, p1: number) => boolean) | null) => void) | null {
    // returns function | null
}

simpleIterator(m)((k, v) => { ... })  // ❌ Cannot invoke possibly null function
```

**Root Cause**: The function return type includes `| null` when it shouldn't, because the Go function always returns a valid function.

**Go Source**:
```go
func simpleIterator(m map[string]int) func(func(string, int) bool) {
    return func(yield func(string, int) bool) { ... }  // Always returns valid function
}
```

**Solution**: Fix the function type generation to not include `| null` when the function always returns a value.

## Implementation Plan

### Fix 1: Generic Type Null Returns
**File**: `compiler/type.go` or `compiler/stmt-return.go`
- Detect when returning `nil`/`null` for a generic type parameter
- Generate `null as T` instead of just `null`

### Fix 2: Iterator Type Inference  
**File**: `compiler/expr.go` or `compiler/stmt-range.go`
- Fix iterator callback type generation
- Ensure map value types are properly inferred in iterator callbacks

### Fix 3: Function Nullability
**File**: `compiler/type.go` - function type generation
- Don't add `| null` to function return types when the Go function always returns a value
- Only add null when the function can actually return nil

## Expected TypeScript After Fixes

### Fix 1:
```typescript
export function Clone<M extends Map<K, V>, K extends $.Comparable, V extends any>(m: M): M {
	if (m == null) {
		return null as M  // ✅ Fixed
	}
	return $.mustTypeAssert<M>(clone(m), 'M')
}
```

### Fix 2:
```typescript
maps.All(m)((k: string, v: number) => {  // ✅ v properly typed as number
    let result = k + x + String.fromCharCode(v + y)
})
```

### Fix 3:
```typescript
export function simpleIterator(m: Map<string, number>): (p0: ((p0: string, p1: number) => boolean) | null) => void {
    // ✅ No | null on the outer function
}

simpleIterator(m)((k, v) => { ... })  // ✅ Can invoke safely
```
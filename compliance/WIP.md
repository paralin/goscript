# IndexExpr Destructuring Assignment Issue

## Problem ✅ FIXED
The compiler fails to handle `*ast.IndexExpr` (array/slice index expressions) on the left-hand side of destructuring assignments. This results in the error:
```
failed to write assignment statement: unhandled LHS expression in destructuring: *ast.IndexExpr
```

## Test Case
Created `compliance/tests/index_expr_destructuring/index_expr_destructuring.go` which tests:
```go
// This should trigger the error
intArray[0], stringSlice[1] = returnIntAndString()

// More complex case
matrix[i][j], intArray[1] = returnTwoInts()
```

## Root Cause Analysis
In `compiler/stmt-assign.go`, the `writeMultiVarAssignFromCall` function handles destructuring assignments from function calls. It has two code paths:

1. **Simple destructuring** (line ~210): Uses TypeScript array destructuring `[a, b] = fn()`
2. **Complex destructuring** (line ~155): Uses temporary variables when dealing with selector expressions or star expressions

The issue is that `*ast.IndexExpr` is not handled in either path:

### Location 1: hasSelectors check (line ~145)
```go
for _, lhsExpr := range lhs {
    if _, ok := lhsExpr.(*ast.SelectorExpr); ok {
        hasSelectors = true
        break
    }
    if _, ok := lhsExpr.(*ast.StarExpr); ok {
        hasSelectors = true
        break
    }
    // MISSING: IndexExpr check
}
```

### Location 2: Complex destructuring block (line ~175)
```go
} else if starExpr, ok := lhsExpr.(*ast.StarExpr); ok {
    // Handle pointer dereference
} else {
    return errors.Errorf("unhandled LHS expression in assignment: %T", lhsExpr)
    // MISSING: IndexExpr handling
}
```

### Location 3: Simple destructuring block (line ~225)
```go
} else if starExpr, ok := lhsExpr.(*ast.StarExpr); ok {
    // Handle pointer dereference in destructuring
} else {
    return errors.Errorf("unhandled LHS expression in destructuring: %T", lhsExpr)
    // MISSING: IndexExpr handling
}
```

## Solution Implemented ✅
Added support for `*ast.IndexExpr` in all three locations:

1. **hasSelectors check**: Added IndexExpr to trigger the temporary variable approach (since array/slice assignments can't be done in TypeScript destructuring)

2. **Complex destructuring block**: Added IndexExpr handling that writes the index expression directly using `WriteValueExpr`

3. **Simple destructuring block**: Added IndexExpr handling (for completeness)

### Changes Made
In `compiler/stmt-assign.go`:

1. **Line ~150**: Added IndexExpr check to hasSelectors:
```go
if _, ok := lhsExpr.(*ast.IndexExpr); ok {
    hasSelectors = true
    break
}
```

2. **Line ~185**: Added IndexExpr handling in complex destructuring:
```go
} else if indexExpr, ok := lhsExpr.(*ast.IndexExpr); ok {
    // Handle index expressions (e.g., arr[i], slice[j]) by using WriteValueExpr
    if err := c.WriteValueExpr(indexExpr); err != nil {
        return fmt.Errorf("failed to write index expression in LHS: %w", err)
    }
```

3. **Line ~245**: Added IndexExpr handling in simple destructuring:
```go
} else if indexExpr, ok := lhsExpr.(*ast.IndexExpr); ok {
    // Handle index expressions (e.g., arr[i], slice[j]) by using WriteValueExpr
    if err := c.WriteValueExpr(indexExpr); err != nil {
        return fmt.Errorf("failed to write index expression in destructuring: %w", err)
    }
```

## Actual TypeScript Output ✅
For the test case:
```go
intArray[0], stringSlice[1] = returnIntAndString()
```

Now correctly generates:
```typescript
{
  const _tmp = returnIntAndString()
  intArray![0] = _tmp[0]
  stringSlice![1] = _tmp[1]
}
```

And for the complex case:
```go
matrix[i][j], intArray[1] = returnTwoInts()
```

Generates:
```typescript
{
  const _tmp = returnTwoInts()
  matrix![i]![j] = _tmp[0]
  intArray![1] = _tmp[1]
}
```

## Test Results ✅
- `TestCompliance/index_expr_destructuring`: **PASS**
- `TestCompliance/star_expr_destructuring`: **PASS** (no regression)
- `TestCompliance/multiple_return_values`: **PASS** (no regression)

The fix is working correctly and doesn't break any existing functionality. 
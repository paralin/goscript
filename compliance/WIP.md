# Named Function Type Call Non-Null Assertion Issue - RESOLVED ✅

## Issue Description
The reported issue was specifically with **named function types** from external packages (like `filepath.WalkFunc`) not generating non-null assertions (`!`) when called in **variable shadowing scenarios**. The example given was:

```go
func walk(fs billy.Filesystem, path string, info os.FileInfo, walkFn filepath.WalkFunc) error {
    if err := walkFn(filename, fileInfo, err); err != nil && err != filepath.SkipDir {
        return err
    }
}
```

This should generate `walkFn!(filename, fileInfo, err)` but was generating `walkFn(filename, fileInfo, err)` (missing the `!` operator) in variable shadowing scenarios.

The user provided this specific problematic TypeScript output:

```typescript
export function walk(fs: billy.Filesystem, path: string, info: os.FileInfo, walkFn: filepath.WalkFunc | null): $.GoError {
    let err = walkFn(filename, fileInfo, _temp_err)  // ❌ Missing ! operator
    if (err != null && err != filepath.SkipDir) {
        return err
    }
}
```

## Root Cause Analysis

After creating multiple compliance tests and examining the compiler code, I discovered that:

1. **Non-shadowing scenarios worked correctly**: Function calls outside of variable shadowing scenarios correctly generated the `!` operator.

2. **Variable shadowing scenarios were broken**: The issue only occurred when variable shadowing was involved and the compiler generated temporary variables like `_temp_err`.

3. **The bug was in `writeShadowedRHSExpression`**: In `compiler/stmt.go`, the `writeShadowedRHSExpression` function handled `*ast.CallExpr` manually but bypassed the `addNonNullAssertion` logic from the main `WriteCallExpr` function.

## The Fix

The issue was in `compiler/stmt.go` lines 1050-1062 in the `writeShadowedRHSExpression` function:

```go
case *ast.CallExpr:
    // Handle function calls - replace identifiers in arguments with temp variables
    if err := c.writeShadowedRHSExpression(e.Fun, shadowingInfo); err != nil {
        return err
    }
    c.tsw.WriteLiterally("(")
    // ... argument handling ...
    c.tsw.WriteLiterally(")")
    return nil
```

**Fixed version:**
```go
case *ast.CallExpr:
    // Handle function calls - replace identifiers in arguments with temp variables
    if err := c.writeShadowedRHSExpression(e.Fun, shadowingInfo); err != nil {
        return err
    }
    
    // Add non-null assertion for function calls (same logic as WriteCallExpr)
    c.addNonNullAssertion(e.Fun)
    
    c.tsw.WriteLiterally("(")
    // ... argument handling ...
    c.tsw.WriteLiterally(")")
    return nil
```

## Test Cases Created

### 1. `nullable_function_param_call` ✅
- Tested explicitly nullable function parameters
- **Result**: Always worked correctly

### 2. `named_function_type_call` ✅
- Tested named function types without variable shadowing
- **Result**: Always worked correctly

### 3. `filepath_walkfunc_call` ✅  
- Tested exact `filepath.WalkFunc` scenario without variable shadowing
- **Result**: Always worked correctly

### 4. `function_call_variable_shadowing` ✅
- **Reproduced the exact issue**: Variable shadowing scenarios with missing `!` operators
- **Verified the fix**: All scenarios now work correctly

## Before and After

### Before the Fix (❌ Missing `!` operators):
```typescript
export function walkWithShadowing(fs: Filesystem, path: string, info: os.FileInfo, walkFn: filepath.WalkFunc | null): $.GoError {
    const _temp_err = err
    {
        let err = walkFn(path, fileInfo, _temp_err)  // ❌ Missing !
        if (err != null && err != filepath.SkipDir) {
            return err
        }
    }
}

export function testShadowing1(walkFn: filepath.WalkFunc | null): $.GoError {
    const _temp_err = err
    {
        let err = walkFn("test1", null, _temp_err)  // ❌ Missing !
        if (err != null) {
            return err
        }
    }
}
```

### After the Fix (✅ With `!` operators):
```typescript
export function walkWithShadowing(fs: Filesystem, path: string, info: os.FileInfo, walkFn: filepath.WalkFunc | null): $.GoError {
    const _temp_err = err
    {
        let err = walkFn!(path, fileInfo, _temp_err)  // ✅ Fixed: ! operator present
        if (err != null && err != filepath.SkipDir) {
            return err
        }
    }
}

export function testShadowing1(walkFn: filepath.WalkFunc | null): $.GoError {
    const _temp_err = err
    {
        let err = walkFn!("test1", null, _temp_err)  // ✅ Fixed: ! operator present
        if (err != null) {
            return err
        }
    }
}
```

## Compliance Test Status
✅ **ALL TESTS PASS** - All four compliance tests now pass and generate correct TypeScript with proper non-null assertions.

## Summary
- **Issue**: Missing `!` operators in variable shadowing scenarios for function parameter calls
- **Root Cause**: `writeShadowedRHSExpression` bypassed the `addNonNullAssertion` logic
- **Fix**: Added `c.addNonNullAssertion(e.Fun)` to the `*ast.CallExpr` case in `writeShadowedRHSExpression`
- **Result**: ✅ **RESOLVED** - All function calls now correctly generate `!` operators regardless of variable shadowing 
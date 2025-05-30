# Type Assertion Duplicate Vars Issue Analysis

## Problem Summary
The `type_assertion_duplicate_vars` compliance test is failing because type assertions are incorrectly returning `true` for both assertions when only one should succeed.

## Test Details
In the test:
```go
var iface Interface = ConcreteA{}

// Multiple type assertions that should generate unique variable names
_, c.hasA = iface.(ConcreteA)
_, c.hasB = iface.(ConcreteB)
```

Expected output:
```
hasA: true
hasB: false
```

Actual output:
```
hasA: true
hasB: true
```

## Generated TypeScript Analysis
The generated TypeScript correctly creates unique temporary variables:
```typescript
let _gs_ta_val_418_: ConcreteA
let _gs_ta_ok_418_: boolean
({ value: _gs_ta_val_418_, ok: _gs_ta_ok_418_ } = $.typeAssert<ConcreteA>(iface, 'ConcreteA'))
c.hasA = _gs_ta_ok_418_

let _gs_ta_val_449_: ConcreteB  
let _gs_ta_ok_449_: boolean
({ value: _gs_ta_val_449_, ok: _gs_ta_ok_449_ } = $.typeAssert<ConcreteB>(iface, 'ConcreteB'))
c.hasB = _gs_ta_ok_449_
```

The variable naming is correct and unique based on AST position. The issue is NOT with duplicate variables.

## Root Cause Identified
The issue is in the `$.typeAssert` function in `gs/builtin/type.ts`. Specifically in the `matchesStructType` function around lines 465-467:

```typescript
// For structs, use instanceof with the constructor
if (info.ctor && value instanceof info.ctor) {
  return true
}
```

The problem appears to be that the type checking logic is not working correctly for struct type assertions. Either:

1. The `info.ctor` is not being set correctly for the type info
2. The `instanceof` check is passing when it shouldn't 
3. There's a fallback case that's always returning true

## Investigation Needed
1. Check how type information is being passed to `$.typeAssert` calls
2. Verify the constructor registration for `ConcreteA` and `ConcreteB`
3. Look at whether there's a fallback that incorrectly returns `ok: true`

## Next Steps
1. Check the type registration code in the generated TypeScript
2. Examine the actual runtime behavior of the `$.typeAssert` function
3. Debug why `ConcreteA` instance is matching `ConcreteB` type 

# Variadic Interface Method Issue Analysis

## Problem Description

When an interface declares a method with variadic parameters, the Go-to-TypeScript compiler incorrectly generates the TypeScript interface signature.

**Go Source:**
```go
type Basic interface {
    Join(elem ...string) string
}
```

**Current TypeScript Output:**
```typescript
export type Basic = null | {
    Join(elem: $.Slice<string>): string
}
```

**Expected TypeScript Output:**
```typescript
export type Basic = null | {
    Join(...elem: string[]): string
}
```

## Root Cause Analysis

The issue is in the interface method parameter handling in `compiler/type.go`. When processing interface methods in the `writeInterfaceStructure` function (around lines 570-580), the code correctly handles regular parameters but does not properly detect and handle variadic parameters.

Looking at the code in `writeInterfaceStructure`:

1. It iterates through interface methods using `iface.ExplicitMethod(i)`
2. For each method, it gets the signature using `method.Type().(*types.Signature)`
3. It processes parameters using `sig.Params()` but doesn't check if the signature is variadic
4. It doesn't use the variadic-aware parameter writing logic that exists in `field.go`

## Comparison with Working Implementation

The struct method implementation correctly generates `public Join(...elem: string[]): string` because it uses the `WriteFieldList` function in `field.go` which has proper variadic handling (lines 31-81).

However, the interface method generation in `type.go` bypasses this logic and manually processes parameters without checking for variadic signatures.

## Solution Plan

1. **Modify `writeInterfaceStructure` in `compiler/type.go`**: 
   - Check if the method signature is variadic using `sig.Variadic()`
   - For variadic methods, handle the last parameter specially by:
     - Adding the `...` prefix to the parameter name
     - Converting the slice type to element type with `[]` suffix
     - Using `GoTypeContextVariadicParam` context to avoid the `null |` prefix

2. **Test the fix**:
   - Run the `variadic_interface_method` compliance test
   - Verify the generated TypeScript interface matches the expected output
   - Ensure the implementation and interface signatures are compatible

## Expected Changes

After the fix, the interface should generate:
```typescript
export type Basic = null | {
    Join(...elem: string[]): string
}
```

This will make the interface signature compatible with the implementation signature, resolving the TypeScript compilation errors.

## Implementation Details

### Changes Made

**File: `compiler/type.go`**
- Modified the `writeInterfaceStructure` function (lines ~568-579)
- Added variadic parameter detection using `sig.Variadic()`
- Split parameter processing into two phases:
  1. Regular parameters (all params for non-variadic, all but last for variadic)
  2. Variadic parameter handling (if present)
- For variadic parameters:
  - Added `...` prefix to parameter name
  - Used `GoTypeContextVariadicParam` context to avoid `null |` prefix
  - Extracted element type from slice type and added `[]` suffix

### Test Results

✅ **Created compliance test**: `compliance/tests/variadic_interface_method/`
✅ **Test passes**: `go test -timeout 30s -run ^TestCompliance/variadic_interface_method$ ./compiler`
✅ **Generated correct TypeScript**:
```typescript
export type Basic = null | {
    Join(...elem: string[]): string
}
```
✅ **Interface and implementation signatures match**
✅ **No regressions**: Other interface and method tests still pass

### Before and After

**Before (incorrect):**
```typescript
export type Basic = null | {
    Join(elem: $.Slice<string>): string  // ❌ Wrong signature
}

export class PathJoiner {
    public Join(...elem: string[]): string { /* ... */ }  // ✅ Correct implementation
}
```

**After (correct):**
```typescript
export type Basic = null | {
    Join(...elem: string[]): string  // ✅ Now matches implementation
}

export class PathJoiner {
    public Join(...elem: string[]): string { /* ... */ }  // ✅ Correct implementation
}
```

## Status: ✅ COMPLETED

The variadic interface method issue has been successfully resolved. The Go-to-TypeScript compiler now correctly generates TypeScript interface signatures for methods with variadic parameters, ensuring compatibility between interface declarations and their implementations. 
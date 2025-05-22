# Function Signature Type Compliance Test Analysis

## Issue Description

The `function_signature_type` compliance test is failing due to incorrect return type generation for functions that return pointers to structs.

## Current Problem

In the generated TypeScript file `function_signature_type.gs.ts`, line 54:

```typescript
export function NewMyError(text: string): $.Box<MyError> | null {
	return new MyError({s: text})
}
```

**TypeScript Errors:**
1. `error TS2741: Property 'value' is missing in type 'MyError' but required in type 'Box<MyError>'`
2. `error TS2322: Type 'Box<MyError> | null' is not assignable to type 'GoError'`

## Root Cause Analysis

According to `BOXES_POINTERS.md`:
- We only use `$.Box` when the address of a variable is taken
- Function return values cannot be directly addressed in Go
- Pointers to structs should be represented as `ClassName | null`, not `$.Box<ClassName> | null`

The Go function signature is:
```go
func NewMyError(text string) *MyError {
	return &MyError{s: text}
}
```

The correct TypeScript should be:
```typescript
export function NewMyError(text: string): MyError | null {
	return new MyError({s: text})
}
```

## Required Changes

The issue is in the compiler's function signature generation, specifically when handling return types that are pointers to structs.

**Files to investigate:**
- `compiler/type.go` - `WritePointerType` function (line 163)
- `compiler/type.go` - `WriteFuncType` function (line 249)
- `compiler/type.go` - `WriteSignatureType` function (line 292)

**Root Cause:**
The `WritePointerType` function always generates `$.Box<T> | null` for all pointer types, but this is incorrect for function return types. In function signatures, pointer types should be handled differently:

- For function return types: `*StructType` should generate `StructType | null`
- For variable types: `*StructType` should generate `$.Box<StructType> | null` only if the variable needs boxing

**Specific Changes Needed:**

1. **In `WritePointerType`**: Add a context parameter to distinguish between function return types and variable types
2. **In `WriteFuncType` and `WriteSignatureType`**: Use a special function return type writer instead of `WriteGoType`
3. **Create new function**: `WriteGoTypeForFunctionReturn` that handles pointer types correctly for function signatures

**Expected behavior:**
- `*StructType` return types should generate `StructType | null`
- `*primitive` return types should still generate `$.Box<primitive> | null` for consistency
- Variables and parameters still use the existing boxing logic

## Implementation Plan

1. Create `WriteGoTypeForFunctionReturn` that handles pointer-to-struct types without boxing
2. Update `WriteFuncType` to use this new function for return types
3. Update `WriteSignatureType` to use this new function for return types
4. Test the fix with the compliance test
# OS FileInfo Interface Type Expansion Issue

## Problem Description

When transpiling Go functions that use `os.FileInfo` as a parameter type, the compiler incorrectly expands the interface to its full type definition instead of preserving the qualified interface name.

## Current Behavior

**Go Input:**
```go
func walkFunction(path string, info os.FileInfo, walkFn filepath.WalkFunc) error {
    // function body
}
```

**Current TypeScript Output:**
```typescript
export function walkFunction(path: string, info: null | {
    IsDir(): boolean
    ModTime(): Time
    Mode(): FileMode
    Name(): string
    Size(): number
    Sys(): null | any
}, walkFn: filepath.WalkFunc): $.GoError {
    // function body
}
```

**Expected TypeScript Output:**
```typescript
export function walkFunction(path: string, info: os.FileInfo, walkFn: filepath.WalkFunc): $.GoError {
    // function body
}
```

## Root Cause Analysis

The issue is in the `WriteGoType` function in `compiler/type.go`, specifically in how it handles `*types.Interface` types.

### Current Logic Flow:
1. `WriteGoType` receives a `*types.Interface` type for `os.FileInfo`
2. The switch statement matches `*types.Interface` case (line ~62)
3. It calls `WriteInterfaceType(t, nil)` which always expands the interface
4. `WriteInterfaceType` calls `writeInterfaceStructure` to generate the full interface definition

### Missing Logic:
The compiler fails to check if the interface is a **named interface from an imported package** before expanding it. It should:

1. First check if the interface type is a `*types.Named` type pointing to an interface
2. If yes, use `WriteNamedType` to write the qualified name (e.g., `os.FileInfo`)
3. If no, then proceed with interface expansion

## Analysis of Type System

In Go's type system:
- `os.FileInfo` is a **named interface type** (`*types.Named` with underlying `*types.Interface`)
- When we get the type information for `os.FileInfo`, we get the underlying `*types.Interface` directly
- We lose the information that this was originally a named type from the `os` package

The issue is that `WriteGoType` pattern matches on the underlying type (`*types.Interface`) rather than checking if we have a named type first.

## Solution

We need to modify the `WriteGoType` function to handle named interface types before falling back to interface expansion.

### Option 1: Check for Named Types First
Modify `WriteGoType` to check if the type is a `*types.Named` type pointing to an interface before the current `*types.Interface` case.

### Option 2: Enhanced Interface Handling
Enhance the `*types.Interface` case in `WriteGoType` to detect when the interface comes from a named type and preserve the qualified name.

The most robust solution is **Option 1** because it correctly handles the type hierarchy where named types should take precedence over their underlying types.

## Files to Modify

1. `compiler/type.go` - Modify the `WriteGoType` function
2. `compliance/tests/os_fileinfo_interface/` - Test case (already created)

## Implementation Plan

1. Modify the switch statement in `WriteGoType` to handle named types before interface types
2. Ensure the `WriteNamedType` function correctly handles named interface types from imported packages
3. Run the compliance test to verify the fix
4. Test with other named interface types to ensure no regressions 
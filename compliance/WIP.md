# PathError Constructor Issue

## Problem Description

When translating Go code that creates a pointer to a struct using composite literal syntax, the TypeScript generator is not properly calling the constructor with the `new` keyword for certain types.

## Example Issue

**Go Source:**
```go
err := &os.PathError{
    Op:   "readlink", 
    Path: "/some/path",
    Err:  fmt.Errorf("not a symlink"),
}
```

**Current Generated TypeScript:**
```typescript
let err = {Err: fmt.Errorf("not a symlink"), Op: "readlink", Path: "/some/path"}
```

**Expected Generated TypeScript:**
```typescript
let err = new os.PathError({Err: fmt.Errorf("not a symlink"), Op: "readlink", Path: "/some/path"})
```

## Root Cause Analysis

The issue was in the `WriteCompositeLit` function in `compiler/composite-lit.go`. The function had logic to handle:
- Named types (`*types.Named`) - generates constructor calls
- Pointers to named types - generates constructor calls  
- Anonymous structs (`*types.Struct`) - generates plain object literals

However, it was missing support for type aliases (`*types.Alias`). In newer Go versions, `os.PathError` is defined as a type alias, not a named type.

## Debug Findings

Through debug output, I discovered that:
- The code detected `&os.PathError{...}` as a composite literal correctly
- However, `os.PathError` had type `*types.Alias`, not `*types.Named`
- The existing code only handled `*types.Named` and `*types.Pointer` to named types

## Solution Implemented

Added support for type aliases in `WriteCompositeLit` function around line 225 in `compiler/composite-lit.go`:

```go
} else if aliasType, ok := litType.(*types.Alias); ok {
    // Handle type aliases (like os.PathError)
    if underlyingStruct, ok := aliasType.Underlying().(*types.Struct); ok {
        structType = underlyingStruct
        isStructLiteral = true

        // Check if this is a protobuf type
        if handled, err := c.writeProtobufCompositeLit(exp, litType); handled {
            if err != nil {
                return err
            }
        } else {
            // Type alias for struct, use constructor
            c.tsw.WriteLiterally("new ")
            c.WriteTypeExpr(exp.Type)
        }
    }
```

## Verification

The fix successfully generates the correct TypeScript code:

```typescript
let err = new os.PathError({Err: fmt.Errorf("not a symlink"), Op: "readlink", Path: "/some/path"})
```

## Test Case

Created compliance test: `compliance/tests/path_error_constructor/path_error_constructor.go`

This test creates a `&os.PathError{...}` and verifies that the generated TypeScript properly instantiates the object with the `new` keyword. 
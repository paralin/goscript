# Inline Interface Type Assertion Analysis

## Issue Summary
The inline interface type assertion compliance test is failing. Three specific assertions that should succeed are failing:

1. `Greet assertion failed` (should be: `Greet assertion successful: Hello from Greeter`)
2. `Inline String assertion failed` (should be: `Inline String assertion successful: MyStringer implementation`)  
3. `k.(interface{ String() string }) failed` (should be: `k.(interface{ String() string }) successful: MyStringer implementation`)

## Expected vs Actual Behavior

### Expected (Go behavior):
- `i.(interface{ Greet() string })` where `i` holds `Greeter{}` should succeed because `Greeter` has a `Greet() string` method
- `j.(interface{ String() string })` where `j` holds `MyStringer{}` should succeed because `MyStringer` has a `String() string` method  
- `k.(interface{ String() string })` where `k` is a `Stringer` holding `MyStringer{}` should succeed

### Actual (TypeScript behavior):
All three assertions are failing, indicating the `$.typeAssert` runtime helper is not correctly recognizing that the concrete types implement the inline interfaces.

## Analysis of Generated TypeScript

Looking at the generated TypeScript in `inline_interface_type_assertion.gs.ts`:

1. **Issue with inline interface type assertions**: The `$.typeAssert` calls are using `'unknown'` as the type name parameter:
   ```typescript
   let { value: g, ok: ok } = $.typeAssert<null | {
       Greet(): string
   }>(i, 'unknown')
   ```

2. **The runtime helper needs proper type information**: The `$.typeAssert` function needs to know how to check if a value implements an inline interface. Currently it's getting `'unknown'` instead of proper type information.

## Root Cause Analysis

The issue is in the `writeTypeDescription` function in `compiler/expr-type.go`. This function is responsible for generating the second parameter to `$.typeAssert()` calls, which provides runtime type information.

### Current Problem
The `writeTypeDescription` function has cases for:
- `*ast.Ident` (named types)
- `*ast.SelectorExpr` (qualified types like `pkg.Type`)
- `*ast.ArrayType`, `*ast.StructType`, `*ast.MapType`, `*ast.StarExpr`, `*ast.FuncType`, `*ast.ChanType`

But it's **missing a case for `*ast.InterfaceType`** (inline interfaces).

When `writeTypeDescription` encounters an `*ast.InterfaceType`, it falls through to the default case and returns nothing, causing the `$.typeAssert` call to get `'unknown'` instead of proper type information.

## Specific Code Changes Required

### File: `compiler/expr-type.go`

The `writeTypeDescription` function (starting around line 28) needs a new case for `*ast.InterfaceType`:

```go
case *ast.InterfaceType:
    // Handle inline interface types like interface{ Method() string }
    // We need to generate a type descriptor that the runtime can use
    // to check if a value implements this interface
    c.tsw.WriteLiterally("{")
    c.tsw.WriteLiterally("kind: $.TypeKind.Interface, ")
    c.tsw.WriteLiterally("methods: [")
    
    // Add method signatures for each method in the interface
    if t.Methods != nil && t.Methods.List != nil {
        for i, method := range t.Methods.List {
            if i > 0 {
                c.tsw.WriteLiterally(", ")
            }
            // Generate method signature info for runtime checking
            // This needs to include method name, parameters, and return types
        }
    }
    
    c.tsw.WriteLiterally("]")
    c.tsw.WriteLiterally("}")
```

### Implementation Details

The runtime needs to be able to:
1. Check if a value has all the required methods
2. Verify method signatures match (name, parameter types, return types)

For this to work, the type descriptor needs to include:
1. `kind: $.TypeKind.Interface`
2. `methods: [...]` array with method signature information

Each method descriptor should include:
- `name`: method name
- `args`: parameter types
- `returns`: return types

This follows the same pattern used elsewhere in the codebase for interface type registration.

## Next Steps

Need to examine the compiler code in `compiler/*.go` to find:
1. Where type assertions are handled (`WriteTypeAssertExpr` mentioned in DESIGN.md)
2. Where inline interface types are processed
3. How to generate proper type registration for inline interfaces
4. How to pass the correct type identifier to `$.typeAssert`
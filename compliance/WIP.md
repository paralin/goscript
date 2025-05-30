# Rune Constant Reference Issue Analysis

## Problem Description

When we declare a const in package A:

```go
const Separator = '/'
```

Then import it in package B:

```go
const separator = a.Separator
```

This generates TypeScript code that evaluates the constant at compile time:

```typescript
let separator: number = 47

// Later usage:
console.log("separator used in function:", useInFunction(47))
```

instead of the expected:

```typescript
let separator: number = subpkg.Separator

// Later usage:
console.log("separator used in function:", useInFunction(separator))
```

The issue is that the const variable is being evaluated to its literal value instead of referencing the variable name.

## Root Cause Analysis

The issue is in `compiler/compiler.go` in the `WriteIdent` function (lines 746-751):

```go
// Check if this identifier refers to a constant
if obj != nil {
    if constObj, isConst := obj.(*types.Const); isConst {
        // Only evaluate constants from the current package being compiled
        // Don't evaluate constants from imported packages (they should use their exported names)
        // Special case: predeclared constants like iota have a nil package, so we should evaluate them
        if constObj.Pkg() == c.pkg.Types || constObj.Pkg() == nil {
            // Write the constant's evaluated value instead of the identifier name
            c.writeConstantValue(constObj)
            return
        }
    }
}
```

The condition `constObj.Pkg() == c.pkg.Types` causes constants from the current package to always be evaluated to their literal values. This means:

1. Constants from imported packages are correctly referenced by name (e.g., `subpkg.Separator`)
2. Constants defined in the current package are evaluated to literals (e.g., `47` instead of `separator`)

## Desired Behavior

Local constants that are assigned from imported constants should maintain their variable reference rather than being evaluated to literals. This allows for:

1. Better code readability
2. Proper variable references in function calls
3. Consistent behavior between imported and locally-declared constants

## Test Case

Created `compliance/tests/rune_const_reference/` with:

- `rune_const_reference.go`: Main test that imports constants and uses them in function calls
- `subpkg/subpkg.go`: Package with exported rune constants

Current generated TypeScript shows the problem:

```typescript
// In main:
console.log("separator used in function:", useInFunction(47))
console.log("newline used in function:", useInFunction(10))
```

Expected TypeScript:

```typescript
// In main:
console.log("separator used in function:", useInFunction(separator))
console.log("newline used in function:", useInFunction(newline))
```

## Proposed Solution

Modify the constant evaluation logic in `WriteIdent` to distinguish between:

1. **Direct constant usage**: Where the original constant identifier is used directly
2. **Local constant assignment**: Where a local constant is assigned from an imported constant

For case 2, we should reference the local variable name instead of evaluating the value.

The fix would involve checking if the constant is:
- Defined in the current package AND
- Assigned from an imported constant

In such cases, use the variable name instead of evaluating the constant value.

## Implementation Plan

1. Update the constant evaluation logic in `WriteIdent` function
2. Add additional analysis to detect when local constants reference imported constants
3. Maintain backward compatibility for direct constant usage
4. Test with the new compliance test case 
# Work In Progress / Known Issues

This document tracks known issues and work-in-progress items for the GoScript compiler.

## Named Return Values in Anonymous Functions (Function Literals)

**Issue:** The `named_return_multiple` compliance test fails due to incorrect handling of named return values within anonymous functions (function literals). The transpiled TypeScript code for these functions does not correctly declare and initialize the named return variables, leading to runtime errors and TypeScript type checking failures.

**Root Cause:**
In Go, named return values are implicitly declared and initialized to their zero values at the beginning of a function. A bare `return` statement then implicitly returns the current values of these named variables. The `WriteFuncLitValue` method in `compiler/lit.go` correctly infers the TypeScript tuple type for named returns but *fails to explicitly declare and initialize these named return variables* within the body of the generated TypeScript arrow function.

This omission results in:
*   `TypeError: (intermediate value)(intermediate value) is not iterable`: Occurs when the calling code attempts to destructure the `undefined` result of the anonymous function, expecting an iterable tuple.
*   `error TS2304: Cannot find name 'resInt'`: TypeScript's type checker reports that the named return variables are not defined within the function's scope.

**Plan for Fix:**
Modify the `WriteFuncLitValue` method in `compiler/lit.go` to explicitly declare and initialize the named return variables to their zero values at the beginning of the function literal's body. This will ensure that when a bare `return` is encountered, the variables exist and hold their correct values, allowing the function to return a properly formed tuple. The implementation will mirror the existing logic for named return variable initialization found in `WriteFuncDeclAsFunction` in `compiler/decl.go`.

## Unnecessary Braces and Comment Duplication/Misplacement

**Issue:** The generated TypeScript code for functions, particularly those without named return values, includes unnecessary nested curly braces. Additionally, comments are often duplicated, misplaced, and accompanied by excessive newlines, impacting code readability.

**Root Cause:**
1.  **Unnecessary Braces:** The `WriteFuncDeclAsFunction` (in `compiler/decl.go`) and `WriteFuncLitValue` (in `compiler/lit.go`) methods both explicitly add outer curly braces (`{}`) around the function body. Simultaneously, the `WriteStmtBlock` method (in `compiler/stmt.go`), which is called to write the actual function body, also adds its own set of braces. This results in redundant nested blocks (e.g., `function main() { { ... } }`).
2.  **Comment Duplication/Misplacement:** The logic within `WriteStmtBlock` for filtering and writing comments, particularly the distinction between leading and inline comments, is imprecise. This leads to comments being written multiple times or in incorrect positions relative to the code. The `writeBlank` helper or direct `WriteLine("")` calls might also contribute to excessive newlines.

**Plan for Fix:**
1.  **Refactor Brace Handling:**
    *   In `compiler/decl.go` (`WriteFuncDeclAsFunction`) and `compiler/lit.go` (`WriteFuncLitValue`), remove the explicit outer curly braces. Instead, these functions should conditionally wrap the function body in a *new* block only if named return variables need to be declared and scoped. Otherwise, they should directly call `WriteStmt` on the original `ast.BlockStmt` (the function body), allowing `WriteStmtBlock` to be the sole source of the function's main block braces.
2.  **Improve Comment Handling:**
    *   In `compiler/stmt.go` (`WriteStmtBlock`), refine the logic for processing `ast.CommentGroup`s. Ensure that comments are correctly identified as leading or inline and are written only once. This may involve:
        *   Adjusting the `isInlineComment` heuristic to be more robust.
        *   Carefully managing the `lastLine` tracking to prevent redundant blank lines.
        *   Potentially centralizing comment writing to avoid conflicts between `WriteStmtBlock` and individual statement writers.
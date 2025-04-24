# Compiler Work in Progress

**Task:** Add handling for `*ast.ParenExpr` in `compiler/compile_expr.go`.

**Plan:**
1. In `compiler/compile_expr.go`, locate the `WriteValueExpr` function.
2. Add a new case to the `switch` statement for `*ast.ParenExpr`.
3. Inside the `*ast.ParenExpr` case, call `c.WriteValueExpr(exp.X)` to compile the expression within the parentheses.

**Relevant File:** `compiler/compile_expr.go`
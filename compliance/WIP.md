# Work in Progress: Method Call on Pointer Receiver Fix

**Issue:**
In Go, a method with a pointer receiver `func (m *MyStruct) GetMyString() string` operates on the underlying `MyStruct` value. The generated TypeScript code currently translates this such that `this` inside the method is treated as `goscript.GoPtr<MyStruct>`, leading to incorrect access like `this.ref!.MyString`. The correct behavior should be to treat `this` as the value type `MyStruct` and access fields/methods directly (`this.MyString`).

**Analysis:**
The problem lies in how the compiler handles member access (field or method) when the base expression is the receiver (`this`) within a method with a pointer receiver. The current logic in `compiler/compile_expr.go`, specifically in `WriteSelectorExprValue`, seems to apply the `GoPtr` dereferencing (`.ref!`) too broadly.

When compiling a selector expression `exp.X.Sel`, where `exp.X` is the receiver identifier (`m` in the example `func (m *MyStruct) GetMyString()`), the compiler needs to determine the type of `exp.X` in the context of the method's receiver type. If the method has a pointer receiver (`*MyStruct`), the receiver variable `m` in Go refers to the pointer value. However, in the generated TypeScript, the `this` context within the class method should correspond to the *value* type (`MyStruct`), not the pointer wrapper (`GoPtr<MyStruct>`).

The logic in `WriteSelectorExprValue` needs to be updated to recognize when the base expression `exp.X` is the `this` receiver within a pointer receiver method and generate direct access (`this.Sel`) instead of the `GoPtr` access pattern (`exp.X.ref!.Sel`).

**Plan:**

1.  Modify `compiler/compile_expr.go`, specifically the `WriteSelectorExprValue` function.
2.  Inside `WriteSelectorExprValue`, add a check to see if the expression `exp.X` is the receiver identifier of the current method being compiled.
3.  If it is the receiver identifier and the method has a pointer receiver, generate direct access to the selector (`this.Sel`).
4.  Otherwise, keep the existing logic for handling field/method access on potentially `GoPtr` values.

**Specific Code Changes (Plan):**

I will need to identify the exact lines in `compiler/compile_expr.go` within `WriteSelectorExprValue` where the `.ref!` access is generated and add the conditional logic there. Based on the `search_files` output, lines around 150-151 and 409-410 are likely candidates.

I will need to access information about the current function being compiled (specifically, if it's a method and if it has a pointer receiver) within `WriteSelectorExprValue`. This information might need to be passed down through the compiler's context or retrieved from the `ast.FuncDecl` which should be available during the compilation of the method body.

Let's look closer at `compiler/compile_spec.go` and `WriteFuncDeclAsMethod` (line 527) to see how the method body is compiled and if the `ast.FuncDecl` is accessible when compiling the body statements in `compiler/compile_expr.go`.

In `compiler/compile_spec.go`, `WriteFuncDeclAsMethod` iterates through the statements in `decl.Body.List` and calls `c.WriteStmt(stmt)`. `WriteStmt` in `compiler/compile_stmt.go` then calls other `Write*` functions, including `WriteValueExpr` and `WriteSelectorExprValue` in `compiler/compile_expr.go`. It seems the `ast.FuncDecl` is not directly available in `WriteSelectorExprValue`.

A better approach might be to modify `WriteFuncDeclAsMethod` to set a flag or pass context indicating that the current compilation is within a pointer receiver method. This context can then be checked in `WriteSelectorExprValue`.

Let's refine the plan:

1.  Add a field to the `GoToTSCompiler` struct (or a new context struct passed around) to indicate if the compiler is currently inside a pointer receiver method.
2.  In `compiler/compile_spec.go`, within `WriteFuncDeclAsMethod`, set this flag/context before compiling the method body if the method has a pointer receiver. Reset it after the body is compiled.
3.  In `compiler/compile_expr.go`, within `WriteSelectorExprValue`, check this flag/context. If the flag is set and the base expression `exp.X` is the receiver identifier of the current method, generate direct access (`this.Sel`).
4.  Otherwise, proceed with the existing logic for handling potential `GoPtr` values.

I will need to read the `compiler/compiler.go` file to see the definition of the `GoToTSCompiler` struct and determine the best way to add this context.
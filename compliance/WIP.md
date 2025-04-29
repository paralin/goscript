# Pointer semantics & type‐assertion rework (type_system test)

The current “`*T` = `T | null`” hack leaks into every signature and confuses the
runtime; it also prevents us from tracking identity and later supporting `&` /
`*`.  We move to a first-class pointer representation that integrates cleanly
with the v2 type-system objects.

─────────────────────────────────────────────────────────────────────────────
## 1. Representation

```ts
export class GoPtr<T> {
  constructor(public ref: T | null) {}
}
export type Ptr<T> = GoPtr<T> | null        // nil pointer = null
```

• keeps `null` as canonical zero value
• preserves identity (two pointers → same `GoPtr` object)
• future: allows WriteBarrier, interior pointers, etc.

─────────────────────────────────────────────────────────────────────────────
## 2. Runtime changes (builtin/builtin.ts)

1.  add `GoPtr` + helper `newPtr<T>(v:T|null): Ptr<T>`. (IMPLEMENTED)
2.  extend `GoTypeKind` with `Pointer` (already declared – ensure branch exists). (IMPLEMENTED)
3.  update `PointerTypeInfo` (already in file) – no shape change. (IMPLEMENTED)
4.  extend `registerType` case `Pointer`:
    * store `.elem`
    * canonical key = `*${elemKey}`. (IMPLEMENTED)
5.  `allMethodsOf`:
    ```ts
    case GoTypeKind.Pointer:
        return allMethodsOf((type as PointerTypeInfo).elem);
    ```
    (IMPLEMENTED)
6.  `implementsInterface` / `isAssignable` already call `allMethodsOf` so value
    methods promoted to pointer will work automatically. (ASSUMED IMPLEMENTED)
7.  keep zero value of any pointer: `null`. (IMPLEMENTED)
8.  Update `typeAssert` logic to handle assertions to pointer types (`target.kind === GoTypeKind.Pointer`), checking the underlying value's assignability to the target element type and wrapping concrete values in `GoPtr` if necessary. (IMPLEMENTED)
9.  Update `typeofGo` to recognize `GoPtr` instances (with a simplification for determining the element type). (IMPLEMENTED)
10. Register a placeholder `*interface{}` type for `typeofGo`'s fallback. (IMPLEMENTED)

─────────────────────────────────────────────────────────────────────────────
## 3. Compiler changes

### 3.1 Type emission
* `WriteStarExprType` → emit `goscript.Ptr<…>` instead of `T | null`. (TODO)

### 3.2 Zero values
* `WriteZeroValueForType`
  * `*gtypes.Pointer`  → `null` (TODO)
  * `*ast.StarExpr`    → `null` (TODO)

### 3.3 Type assertions
* generic arg already uses `WriteTypeExpr` → now outputs `goscript.Ptr<X>`
  for pointer assertions. (TODO)
* keep existing “`.value`” suffix when the *assertion itself* is used as a
  value (single-result form). No change needed for comma-ok form. (ASSUMED CORRECT)

### 3.4 Other Compiler Fixes (Completed)
*   Modified `WriteFieldList` in `compiler/compile_field.go` to generate `_pI` names for unnamed function parameters.
*   Modified `WriteFuncType` in `compiler/compile_expr.go` to use `=>` for return type in function *type expressions* (like type aliases) and `:` for function *declarations*. Added `useArrowForReturnType` flag and updated call sites.
*   Modified `getTypeNameString` in `compiler/compile_expr.go` to correctly generate names for pointer types (`*MyType`), slice types (`[]MyType`), map types (`map[K]V`), and `interface{}`.
*   Modified `compiler/compile_spec.go` to register pointer types (`*T`) alongside struct types (`T`) using `goscript.registerType`.
*   Fixed fallthrough bug in `WriteTypeSpec` struct case in `compiler/compile_spec.go`.
*   Updated pointer type registration in `compiler/compile_spec.go` to reference the base struct's type info via `ClassName.__typeInfo`.

─────────────────────────────────────────────────────────────────────────────
## 4. Generated type-info

`WriteTypeSpec` already registers:

```ts
const Data__typeInfo = goscript.registerType('Data', …)
const Data__ptrTypeInfo = goscript.registerType('*Data', …, Data.__typeInfo)
```

third arg remains `null` (zero value).

─────────────────────────────────────────────────────────────────────────────
## 5. Compliance expectations

| Go code                              | Expected result (TS)
|--------------------------------------|------------------------------------------
| `p2 = d2`                            | ok – ptr implements `Printer`
| `dataPtr2, ok := p2.(*Data)`         | `ok == true`, `dataPtr2` identical ptr
| `_, ok2 := p1.(*Data)` (`p1==nil`)   | `ok2 == false`, returned ptr == `null`

─────────────────────────────────────────────────────────────────────────────
## 6. Current Blocking Issue

The latest test run failed with a `ReferenceError: Data__typeInfo is not defined` in the generated TypeScript.

**Problem:** The generated code for registering the pointer type (`Data__ptrTypeInfo`) is attempting to reference the base struct's type info (`Data.__typeInfo`) before the `Data` class declaration (and thus its static members) is fully processed and the `Data.__typeInfo` static member is accessible by name outside the class.

**Impact:** This compiler generation issue prevents the runtime type assertion logic from being correctly tested for pointer types.

**Next Step:** Resolve the `ReferenceError` by ensuring the base struct's static type information is accessible when the corresponding pointer type is registered. This might require adjusting the order of generated code or how the static member is referenced. This compiler issue must be fixed before further debugging of the runtime `typeAssert` function for pointer types.

─────────────────────────────────────────────────────────────────────────────
## 7. Roll-out order (Revised)

1.  Resolve the `ReferenceError` related to accessing `__typeInfo` during pointer type registration (Current Blocking Issue).
2.  Complete remaining compiler changes (§3.1, §3.2, §3.3 generic arg).
3.  Run compliance tests (`type_system`, `hello_world`) and debug runtime `typeAssert` if necessary based on test output.
4.  Address other identified issues (Map type, Zero Value Init/Access, Output Function).
5.  TODOs after this:
    *   address-of `&` generation
    *   explicit deref `*p` write-time rewrite
    *   pointer arithmetic (never)
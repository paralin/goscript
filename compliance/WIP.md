# Working on: pointer_composite_literal_untyped

## CRITICAL UNDERSTANDING: What Boxes Are For

**BOXES ARE NOT FOR POINTERS!** This is a fundamental misconception that caused my errors.

### Correct Understanding (from BOXES_POINTERS.md):

- **Boxes represent VARIABLES that have their address taken with `&variable`**
- **Pointers are NOT inherently boxed** - they just point to either boxed or unboxed values
- **The Box represents the variable's identity/location, not the pointer itself**

## My Errors

1. **❌ I incorrectly thought untyped composite literals with pointer types need boxing**
2. **❌ I tried to fix the RHS by adding `$.varRef()` calls**
3. **❌ I thought the issue was LHS not writing `.value`**

The real issue:
- Array elements are correctly NOT boxed (they're anonymous literals)
- But my `WriteCompositeLit` fix incorrectly added `$.varRef()` calls

## MAJOR OVERHAUL: Renaming "Box" to "VarRef" ✅ COMPLETED

To eliminate confusion about what "boxes" are for, we're renaming the concept throughout:

### Plan: ✅ COMPLETED
1. **✅ Update BOXES_POINTERS.md** - Replace all "Box" terminology with "VarRef" 
2. **✅ Rename BOXES_POINTERS.md to VAR_REFS.md** - Better reflects the actual purpose
3. **✅ Refactor the codebase** - Update all compiler files:
   - `Box<T>` → `VarRef<T>`
   - `box()` → `varRef()`
   - `NeedsBoxed` → `NeedsVarRef`
   - `NeedsBoxedAccess` → `NeedsVarRefAccess`
   - Update comments and documentation
   - Update builtin.ts exports

### Rationale:
- **VarRef** clearly indicates "variable reference" 
- Eliminates confusion that boxes are for pointers
- Makes it clear these represent addressable variable locations
- Aligns terminology with the actual semantic purpose

### Files Updated:
- ✅ `design/BOXES_POINTERS.md` → `design/VAR_REFS.md`
- ✅ `gs/builtin/box.ts` → `gs/builtin/varRef.ts`
- ✅ `gs/builtin/builtin.ts` - Updated export
- ✅ `compiler/analysis.go` - Renamed all functions and updated logic
- ✅ `compiler/assignment.go` - Updated all references
- ✅ `compiler/expr.go` - Updated references
- ✅ `compiler/expr-star.go` - Updated references and logic
- ✅ `compiler/expr-type.go` - Updated comments
- ✅ `compiler/expr-selector.go` - Updated references
- ✅ `compiler/spec-struct.go` - Updated references
- ✅ `compiler/spec-value.go` - Updated references
- ✅ `compiler/stmt-assign.go` - Updated comments
- ✅ `compiler/type.go` - Updated references
- ✅ `compiler/spec.go` - Updated references
- ✅ `compiler/compiler.go` - Updated references

### Next Steps After Overhaul:
1. **Fix pointer_composite_literal_untyped** - Remove incorrect `$.varRef()` calls from `WriteCompositeLit`
2. **Verify array element handling** - Ensure anonymous literals aren't incorrectly getting varRef'd
3. **Test the existing pointer/addressing logic** - Make sure the rename didn't break anything
4. **Update test files** - Rename boxing test directories to varRef and update test content

## Current Issue: TypeScript Type Errors

The compliance test is failing with TypeScript type checking errors:

```
pointer_composite_literal_untyped.gs.ts(10,9): error TS2353: Object literal may only specify known properties, and 'x' does not exist in type 'VarRef<{ x?: number | undefined; }>'.
```

### Problem Analysis

Looking at the generated TypeScript:

```typescript
let ptr: $.VarRef<{ x?: number }> | null = null  // ❌ Wrong: should be { x?: number } | null
ptr = {x: 42}  // ❌ Error: trying to assign plain object to VarRef type
```

```typescript  
let data = $.arrayToSlice<{ x?: number } | null>([{x: 42}, {x: 43}])  // ✅ Fixed!
```

### Progress Made

✅ **Fixed array type annotations**: Successfully updated array element type annotations to use `GoTypeContextArrayElement` which avoids wrapping pointer-to-struct types in VarRef for composite literals.

❌ **Still broken: Variable type annotations**: The variable `ptr` is incorrectly being given a VarRef type when it should be a plain pointer type.

### Root Cause

The variable `ptr` is being marked by the analysis as `NeedsVarRef` when it shouldn't be. In the Go code:

```go
var ptr *struct{ x int }
ptr = &struct{ x int }{42}
```

The variable `ptr` is just a regular pointer variable - its address is never taken, so it should NOT be wrapped in VarRef.

### Issue Location

The problem is in the analysis phase where variables are being incorrectly marked as needing VarRef. This happens before type generation, in the analysis that determines `NeedsVarRef(obj)`.

### Next Steps

1. ✅ **Fixed**: Array type annotations using GoTypeContextArrayElement  
2. **TODO**: Debug why `ptr` variable is being marked as needing VarRef
3. **TODO**: Fix the variable declaration type annotations

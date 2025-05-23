# Work in Progress: Generics Implementation

## Current Task: Generic Interfaces

### Analysis
Looking at the existing generics tests:
- `generics_basic/`: Simple generic function with `any` constraint ✅
- `generics/`: Comprehensive test with various constraints and generic structs ✅  
- `generics_leading_int/`: Union constraint with `[]byte | string` ✅

### Missing Feature: Generic Interfaces
The design document mentions generic interfaces but there doesn't seem to be a compliance test for them yet. This is an important feature for goscript.

### Test Plan
Creating `compliance/tests/generics_interface/` with:
1. Generic interface definition with type parameters
2. Struct implementing the generic interface
3. Functions that work with the generic interface
4. Type assertions with generic interfaces

### Implementation Status
- [x] Create test directory and Go source
- [x] Run initial test to see current compilation behavior  
- [x] Identify what needs to be implemented in the compiler
- [ ] Implement necessary changes
- [ ] Verify test passes

### Current Issues Found

The test compiles and runs the Go code correctly but fails TypeScript type checking with these errors:

```
generics_interface.gs.ts(7,9): error TS2304: Cannot find name 'T'.
generics_interface.gs.ts(8,11): error TS2304: Cannot find name 'T'.
generics_interface.gs.ts(19,15): error TS2304: Cannot find name 'T'.
generics_interface.gs.ts(20,13): error TS2304: Cannot find name 'T'.
generics_interface.gs.ts(143,41): error TS2315: Type 'Container' is not generic.
generics_interface.gs.ts(149,48): error TS2315: Type 'Comparable' is not generic.
```

### Root Cause Analysis

Looking at the generated TypeScript:

1. **Generic interfaces lose their type parameters**: 
   ```typescript
   // Generated (WRONG):
   type Container = null | {
       Get(): T  // T is undefined!
       Set(_p0: T): void
       Size(): number
   }
   
   // Should be:
   type Container<T> = null | {
       Get(): T
       Set(_p0: T): void
       Size(): number
   }
   ```

2. **Function signatures try to use non-generic interfaces as generic**:
   ```typescript
   // Generated (WRONG):
   function useContainer<T extends any>(c: Container<T>, val: T): T
   
   // Should work if Container was properly generic:
   function useContainer<T extends any>(c: Container<T>, val: T): T
   ```

### Solution Found

In `compiler/spec.go`, the `WriteInterfaceTypeSpec` function is missing type parameter handling. 

Comparing with `WriteStructTypeSpec` in `compiler/spec-struct.go` line 30:
```go
// Write type parameters if present (for generics)
if a.TypeParams != nil {
    c.WriteTypeParameters(a.TypeParams)
}
```

The `WriteInterfaceTypeSpec` function needs the same pattern added after writing the interface name.

### Fix Required

In `compiler/spec.go` around line 172, after:
```go
if err := c.WriteValueExpr(a.Name); err != nil {
    return err
}
```

Add:
```go
// Write type parameters if present (for generics)
if a.TypeParams != nil {
    c.WriteTypeParameters(a.TypeParams)
}
```

### Test Command
```bash
go test -timeout 30s -run ^TestCompliance/generics_interface$ ./compiler
``` 
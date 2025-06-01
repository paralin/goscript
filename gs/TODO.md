# TODO: Wrapper Type Refactor for gs/ Directory

## Overview
The compiler has been refactored to generate wrapper types as type aliases instead of classes, with methods as standalone functions. This requires corresponding updates to the gs/ directory to remove the old class-based implementations and valueOf type parameters.

## Required Changes

### 1. Remove Wrapper Type Classes
All wrapper type classes in gs/ need to be converted to type aliases with standalone functions:

**Current pattern (to be removed):**
```typescript
export class FileMode {
  constructor(private _value: number) {}
  
  valueOf(): number {
    return this._value;
  }
  
  String(): string {
    return fileModeString(this._value);
  }
  
  IsDir(): boolean {
    return (this._value & ModeDir) !== 0;
  }
}
```

**New pattern (to implement):**
```typescript
export type FileMode = number;

export function FileMode_String(receiver: FileMode): string {
  return fileModeString(receiver);
}

export function FileMode_IsDir(receiver: FileMode): boolean {
  return (receiver & ModeDir) !== 0;
}
```

### 2. Files that need wrapper type refactoring:
- `gs/os/types_js.gs.ts` - FileMode and other os types
- `gs/time/time.ts` - Duration and other time types
- `gs/syscall/` - Various syscall wrapper types
- Any other files that implement wrapper types as classes

### 3. Remove valueOf Type Parameters
The `@builtin` package needs to be updated to remove valueOf type parameters from builtin functions.

**Current pattern (to be removed):**
```typescript
function int<T extends { valueOf(): number }>(value: T): number {
  return value.valueOf();
}
```

**New pattern (to implement):**
```typescript
function int(value: number): number {
  return value;
}
```

### 4. Update Method Call Sites
Any existing method call sites in gs/ files need to be updated:

**Current pattern (to be updated):**
```typescript
mode.String()  // method call on wrapper class
```

**New pattern:**
```typescript
FileMode_String(mode)  // function call with receiver
```

### 5. Remove .valueOf() Calls
The compiler still generates `.valueOf()` calls for wrapper types. These need to be eliminated:

**Current generated pattern (to be fixed):**
```typescript
return receiver.valueOf() & 0o111;
```

**Target pattern:**
```typescript
return receiver & 0o111;
```

## Implementation Notes

### Analysis Changes Completed
- ✅ Modified analysis to detect wrapper types ahead of time
- ✅ Added receiver mapping for wrapper function identifiers
- ✅ Removed shadowingContext dependency

### Compiler Changes Completed
- ✅ Updated `WriteNamedTypeWithMethods()` to generate type aliases
- ✅ Updated method call handling to use function calls
- ✅ Updated type conversion logic for wrapper types
- ✅ Removed constructor generation for wrapper types

### Remaining Compiler Issues
- ❌ Stop generating `.valueOf()` calls for wrapper types in:
  - `compiler/expr.go` - `needsValueOfForBitwiseOp()` function
  - `compiler/expr-call-type-conversion.go` - various conversion functions
  - Need to update logic to not add `.valueOf()` for wrapper types since they're now primitive types

### Testing
Use the `wrapper_type_args` compliance test to verify changes:
```bash
go test -timeout 30s -run ^TestCompliance/wrapper_type_args$ ./compiler
```

## Migration Strategy
1. First complete the compiler changes to stop generating `.valueOf()` calls
2. Update each gs/ package incrementally 
3. Test each package after refactoring
4. Update builtin functions to remove valueOf type parameters
5. Run full test suite to ensure compatibility

## Benefits After Completion
- Cleaner generated TypeScript code
- Better performance (no wrapper class overhead)
- More idiomatic TypeScript types
- Simplified runtime type system
- Easier debugging and maintenance 
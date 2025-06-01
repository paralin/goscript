# Wrapper Types Refactor Design

## Overview

GoScript currently generates wrapper types (like `FileMode`, `Duration`, etc.) as TypeScript classes with methods. This design proposes refactoring them to type aliases with standalone functions, resulting in cleaner generated code and better performance.

## Current Implementation

### Wrapper Type Classes (Current)
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

// Usage
const mode = new FileMode(0o755);
console.log(mode.String());
console.log(mode.IsDir());
```

### Generated Code Issues
- Creates unnecessary class overhead
- Requires `valueOf()` calls for primitive operations
- Less idiomatic TypeScript
- Harder to debug and understand

## New Implementation

### Type Aliases with Functions (Target)
```typescript
export type FileMode = number;

export function FileMode_String(receiver: FileMode): string {
  return fileModeString(receiver);
}

export function FileMode_IsDir(receiver: FileMode): boolean {
  return (receiver & ModeDir) !== 0;
}

// Usage
const mode: FileMode = 0o755;
console.log(FileMode_String(mode));
console.log(FileMode_IsDir(mode));
```

## Benefits

1. **Performance**: No class instantiation overhead
2. **Memory**: Primitive values instead of wrapper objects
3. **Readability**: More transparent and debuggable code
4. **TypeScript Idioms**: Uses native type system features
5. **Compatibility**: Better interop with JavaScript ecosystem

## Implementation Plan

### Phase 1: Compiler Changes

#### 1.1 Remove valueOf() Generation
**Files to modify:**
- `compiler/expr.go` - `needsValueOfForBitwiseOp()` function
- `compiler/expr-call-type-conversion.go` - type conversion functions

**Changes:**
- Detect wrapper types and avoid `.valueOf()` calls
- Use direct primitive access for arithmetic operations
- Update bitwise operation handling

#### 1.2 Update Type Generation
**File:** `compiler/compiler.go` - `WriteNamedTypeWithMethods()`

**Changes:**
- Generate type aliases instead of classes
- Convert methods to standalone functions with receiver parameters
- Update method call sites to use function calls

#### 1.3 Function Call Translation
**Changes:**
- `mode.String()` → `FileMode_String(mode)`
- `duration.Nanoseconds()` → `Duration_Nanoseconds(duration)`
- Update receiver parameter handling

### Phase 2: Runtime Updates

#### 2.1 Remove Builtin valueOf Parameters
**File:** `gs/builtin/`

**Current:**
```typescript
function int<T extends { valueOf(): number }>(value: T): number {
  return value.valueOf();
}
```

**Target:**
```typescript
function int(value: number): number {
  return value;
}
```

#### 2.2 Update gs/ Package Implementations
**Files to refactor:**
- `gs/os/types_js.gs.ts` - FileMode and related types
- `gs/time/time.ts` - Duration and Time types  
- `gs/syscall/` - Various syscall wrapper types

### Phase 3: Method Call Migration

#### 3.1 Update Call Sites
**Pattern:**
```typescript
// Before
mode.String()
duration.Nanoseconds() 

// After  
FileMode_String(mode)
Duration_Nanoseconds(duration)
```

#### 3.2 Remove valueOf() Usage
**Pattern:**
```typescript
// Before
return receiver.valueOf() & 0o111;

// After
return receiver & 0o111;
```

## Compiler Analysis Changes

### Wrapper Type Detection
The compiler needs to:
1. Identify wrapper types during analysis phase
2. Map method receivers to standalone functions
3. Track wrapper type usage for proper code generation

### Method Resolution
```go
// Analysis tracks wrapper methods
type WrapperMethod struct {
    TypeName   string  // "FileMode"
    MethodName string  // "String"
    FuncName   string  // "FileMode_String"
}
```

## Testing Strategy

### Compliance Tests
Primary test: `wrapper_type_args`
```bash
go test -timeout 30s -run ^TestCompliance/wrapper_type_args$ ./compiler
```

### Test Cases
1. **Literal Arguments**: `TestFileMode(0o644)` → `TestFileMode(0o644 as FileMode)`
2. **Method Calls**: `mode.String()` → `FileMode_String(mode)`
3. **Interface Usage**: Type compatibility in interface implementations
4. **Arithmetic Operations**: Bitwise operations without valueOf()

### Validation
- All existing tests should pass
- Generated TypeScript should compile without errors
- Runtime behavior should remain identical

## Migration Timeline

### Immediate (Phase 1)
- [ ] Update compiler to stop generating valueOf() calls
- [ ] Modify type generation logic
- [ ] Update method call translation

### Short-term (Phase 2)  
- [ ] Refactor gs/os/ wrapper types
- [ ] Update gs/time/ wrapper types
- [ ] Remove builtin valueOf constraints

### Medium-term (Phase 3)
- [ ] Complete gs/ directory migration
- [ ] Update all method call sites
- [ ] Remove legacy wrapper class support

## Backwards Compatibility

### Breaking Changes
- Generated TypeScript structure changes
- Method call syntax changes
- Builtin function signatures change

### Mitigation
- Complete refactor in single release
- Update all gs/ packages simultaneously
- Maintain runtime behavior compatibility

## Success Metrics

1. **Performance**: Reduced bundle size and faster execution
2. **Code Quality**: More readable generated TypeScript
3. **Test Coverage**: All compliance tests pass
4. **TypeScript Compilation**: Clean compilation with no type errors

## Risk Assessment

### Technical Risks
- **Method Resolution**: Ensuring correct function mapping
- **Type Safety**: Maintaining type compatibility
- **Runtime Behavior**: Preserving semantic equivalence

### Mitigation Strategies
- Comprehensive test coverage
- Incremental rollout with validation
- Rollback plan for critical issues

## Conclusion

This refactor aligns GoScript's type system with TypeScript idioms while improving performance and maintainability. The phased approach ensures safe migration with minimal disruption to existing code. 
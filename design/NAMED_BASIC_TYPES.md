# Named Basic Types Design

## Overview

GoScript needs to distinguish between two different categories of Go named types when generating TypeScript code:

1. **Named Basic Types**: Go types with basic underlying types (number, string, boolean, etc.)
2. **Struct Types**: Go struct types

These require fundamentally different TypeScript representations.

## Current Implementation vs Target

### Named Basic Types

**Go Code:**
```go
type FileMode uint32

func (m FileMode) String() string {
    return fileModeString(uint32(m))
}

func (m FileMode) IsDir() bool {
    return m&ModeDir != 0
}
```

**Target TypeScript:**
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

### Struct Types

**Go Code:**
```go
type MyStruct struct {
    Field1 string
    Field2 int
}

func (s *MyStruct) DoSomething() {
    // implementation
}
```

**Target TypeScript:**
```typescript
export class MyStruct {
    Field1: string = "";
    Field2: number = 0;

    constructor(init?: Partial<MyStruct>) {
        if (init) {
            Object.assign(this, init);
        }
    }

    public DoSomething(): void {
        // implementation
    }
}

// Usage
const s = new MyStruct({ Field1: "hello", Field2: 42 });
s.DoSomething();
```

## Key Differences

### Named Basic Types
- **TypeScript Representation**: Type alias (`type T = number`)
- **Method Calls**: Standalone functions (`TypeName_MethodName(receiver, args)`)
- **Storage**: Primitive values, no object wrapper
- **Performance**: Zero overhead, direct primitive operations
- **Memory**: Minimal memory footprint

### Struct Types  
- **TypeScript Representation**: Class (`class T { ... }`)
- **Method Calls**: Instance methods (`instance.methodName(args)`)
- **Storage**: Object instances with properties
- **Performance**: Object method dispatch
- **Memory**: Object overhead with properties

## Implementation Requirements

### Compiler Analysis

The compiler needs to distinguish between these two cases during type analysis:

```go
// In analysis.go
func (a *Analysis) IsNamedBasicType(t types.Type) bool {
    namedType, ok := t.(*types.Named)
    if !ok {
        return false
    }
    
    // Check if underlying type is basic (not struct)
    underlying := namedType.Underlying()
    _, isBasic := underlying.(*types.Basic)
    return isBasic && namedType.NumMethods() > 0
}

func (a *Analysis) IsStructType(t types.Type) bool {
    namedType, ok := t.(*types.Named)
    if !ok {
        return false
    }
    
    underlying := namedType.Underlying()
    _, isStruct := underlying.(*types.Struct)
    return isStruct
}
```

### Code Generation

#### For Named Basic Types
1. Generate type alias: `export type TypeName = UnderlyingType`
2. Generate standalone functions: `export function TypeName_MethodName(receiver: TypeName, ...args): ReturnType`
3. Transform method calls: `obj.Method()` → `TypeName_Method(obj)`

#### For Struct Types
1. Generate class: `export class TypeName { ... }`
2. Generate instance methods: `public methodName(...args): ReturnType`
3. Keep method calls as-is: `obj.methodName()`

### Method Call Translation

The expression compiler needs to handle these differently:

```go
// In expr-call.go
func (c *GoToTSCompiler) writeMethodCall(exp *ast.CallExpr, selectorExpr *ast.SelectorExpr) error {
    receiverType := c.pkg.TypesInfo.TypeOf(selectorExpr.X)
    
    if c.analysis.IsNamedBasicType(receiverType) {
        return c.writeNamedBasicTypeMethodCall(exp, selectorExpr)
    }
    
    // Default to instance method call for structs and other types
    return c.writeInstanceMethodCall(exp, selectorExpr)
}
```

## Standard Library Considerations

### Sync Package Types
Types like `sync.WaitGroup`, `sync.Mutex` are **struct types** and should generate classes:

```typescript
// Current correct implementation in gs/sync/
export class WaitGroup {
    private _counter: number = 0;
    // ...
    
    public Add(delta: number): void { /* ... */ }
    public Done(): void { /* ... */ }
    public async Wait(): Promise<void> { /* ... */ }
}

// Usage: wg.Add(1) - instance method call
```

### OS Package Types  
Types like `os.FileMode` are **named basic types** and should generate type aliases:

```typescript
// Target implementation
export type FileMode = number;

export function FileMode_String(receiver: FileMode): string { /* ... */ }
export function FileMode_IsDir(receiver: FileMode): boolean { /* ... */ }

// Usage: FileMode_String(mode) - standalone function call
```

## Current Issues

### Problem: Incorrect Wrapper Type Detection
The current `IsWrapperType` function incorrectly treats all types with methods as wrapper types, including:
- `sync.WaitGroup` (should be class)
- `sync.Mutex` (should be class) 
- Other struct types that should remain as classes

### Problem: Method Call Generation
The compiler currently generates:
```typescript
sync.WaitGroup_Add(wg, numWorkers)  // ❌ Wrong - should be wg.Add(numWorkers)
```

Instead of:
```typescript
wg.Add(numWorkers)  // ✅ Correct - instance method call
```

## Solution Steps

### 1. Rename Terminology
- `WrapperTypes` → `NamedBasicTypes`
- `IsWrapperType()` → `IsNamedBasicType()`
- Update all references throughout codebase

### 2. Fix Type Detection Logic
```go
func (a *Analysis) IsNamedBasicType(t types.Type) bool {
    namedType, ok := t.(*types.Named)
    if !ok {
        return false
    }
    
    // Exclude standard library struct types that should be classes
    if pkg := namedType.Obj().Pkg(); pkg != nil {
        pkgPath := pkg.Path()
        typeName := namedType.Obj().Name()
        
        // Standard library struct types - these are classes, not basic types
        if pkgPath == "sync" {
            return false  // All sync types are structs/classes
        }
        if pkgPath == "context" {
            return false  // Context types are interfaces/structs
        }
    }
    
    // Only basic underlying types with methods are named basic types
    underlying := namedType.Underlying()
    _, isBasic := underlying.(*types.Basic)
    return isBasic && namedType.NumMethods() > 0
}
```

### 3. Update Method Call Generation
Fix the expression compiler to:
- Use instance method calls for struct types
- Use standalone function calls only for named basic types

### 4. Test Coverage
Ensure the `package_import_csync` test passes:
```go
wg.Add(numWorkers)  // Should generate: wg.Add(numWorkers)
wg.Done()          // Should generate: wg.Done()  
wg.Wait()          // Should generate: await wg.Wait()
```

## Benefits

### For Named Basic Types
- **Zero overhead**: Direct primitive operations
- **Type safety**: Strong typing with no runtime cost
- **Interop**: Better JavaScript ecosystem compatibility

### For Struct Types  
- **Natural syntax**: Familiar object-oriented method calls
- **Encapsulation**: Methods belong to instances
- **IDE support**: Better autocomplete and refactoring

## Migration Impact

This change fixes the current incorrect behavior where struct types were being treated as basic types, causing:
- Missing function exports (like `sync.WaitGroup_Add`)
- Runtime errors in generated TypeScript
- Poor developer experience

The fix ensures each type category uses its appropriate TypeScript representation. 
# GoScript Async Interface Compatibility Design

## Overview

GoScript addresses a fundamental impedance mismatch between Go's synchronous-appearing concurrency model and TypeScript's explicit async/await model. This document describes how GoScript determines when TypeScript interfaces should have async methods based on actual implementation requirements.

## Problem Statement

### The Core Challenge

**Go's model**: All operations appear synchronous to the programmer - goroutines block transparently when encountering channel operations or async system calls.

**TypeScript's model**: Async operations must explicitly return Promises and use await syntax.

This creates an interface compatibility problem:

```go
// Go interface - appears synchronous
type Locker interface {
    Lock()   // may block goroutine waiting for mutex
    Unlock() // immediate operation
}
```

Without proper analysis, this generates inconsistent TypeScript:

```typescript
// PROBLEMATIC: Methods have different async requirements
export interface Locker {
  Lock(): Promise<void>    // async because sync.Mutex.Lock() uses Promises
  Unlock(): void          // sync because it's immediate
}

// Implementations become incompatible:
class FastLocker implements Locker {
  Lock(): void { /* immediate */ }     // ❌ Type error - doesn't return Promise
  Unlock(): void { /* immediate */ }   // ✅ OK
}
```

### Requirements

1. **Type Safety**: All implementations must be compatible with generated interfaces
2. **Correctness**: Interface method signatures must reflect actual async needs
3. **Granularity**: Per-method analysis (not all-or-nothing per interface)
4. **Cross-Package**: Support for external package implementations

## Solution Architecture

### Core Principle

**"Interface method async status is determined by analyzing all known implementations"**

If ANY implementation of an interface method requires async behavior (due to channel operations, async calls, etc.), then:
1. The interface method becomes async (returns Promise)
2. All implementations are forced to be async-compatible

### Implementation Analysis Flow

```
1. Control Flow Analysis
   ├── Detect async operations (channels, async calls)
   ├── Mark functions as async/sync based on body analysis
   └── Store results in Analysis.FunctionData

2. Interface Implementation Tracking  
   ├── Find all interface declarations
   ├── Locate struct types implementing each interface
   ├── Map interface methods to struct implementations
   └── Store in Analysis.InterfaceImplementations

3. Interface Method Resolution
   ├── For each interface method, check all implementations
   ├── If ANY implementation is async → interface method is async
   ├── Cache results in Analysis.InterfaceMethodAsyncStatus
   └── Force sync implementations to be async-compatible

4. Code Generation
   ├── Generate interfaces with resolved async status
   ├── Generate struct methods with consistency checking
   └── Ensure implementation compatibility
```

## Implementation Details

### Data Structures

```go
type Analysis struct {
    // Track which struct types implement which interface methods
    InterfaceImplementations map[InterfaceMethodKey][]ImplementationInfo
    
    // Cache resolved async status for interface methods  
    InterfaceMethodAsyncStatus map[InterfaceMethodKey]bool
    
    // Existing function async analysis
    FunctionData map[types.Object]*FunctionInfo
    
    // Cross-package support
    AllPackages map[string]*packages.Package
}

type InterfaceMethodKey struct {
    InterfaceType string // String representation of interface type
    MethodName    string // Method name (e.g., "Lock")
}

type ImplementationInfo struct {
    StructType    *types.Named // The implementing struct type
    Method        *types.Func  // The method object
    IsAsyncByFlow bool         // Whether this implementation requires async
}
```

### Analysis Process

#### Phase 1: Control Flow Analysis

```go
func (v *analysisVisitor) containsAsyncOperations(node ast.Node) bool {
    // Detect:
    // - Channel operations: ch <- value, <-ch
    // - Calls to known async functions
    // - Method calls on async types (sync.Mutex.Lock, etc.)
    // - Context-based operations
}
```

#### Phase 2: Implementation Discovery

```go
func (v *interfaceImplementationVisitor) Visit(node ast.Node) ast.Visitor {
    switch n := node.(type) {
    case *ast.GenDecl:
        // Find interface declarations
        for _, spec := range n.Specs {
            if typeSpec, ok := spec.(*ast.TypeSpec); ok {
                if interfaceType, ok := typeSpec.Type.(*ast.InterfaceType); ok {
                    v.findInterfaceImplementations(typeSpec, interfaceType)
                }
            }
        }
    }
}
```

Implementation discovery includes:
- **Type assertions**: `obj.(SomeInterface)` 
- **Interface assignments**: `var locker Locker = &myStruct{}`
- **Cross-package analysis**: Scanning all loaded packages

#### Phase 3: Async Status Resolution

```go
func (a *Analysis) IsInterfaceMethodAsync(interfaceType *types.Interface, methodName string) bool {
    key := InterfaceMethodKey{
        InterfaceType: interfaceType.String(),
        MethodName:    methodName,
    }
    
    // Check cache first
    if result, exists := a.InterfaceMethodAsyncStatus[key]; exists {
        return result
    }
    
    // Find all implementations
    implementations := a.InterfaceImplementations[key]
    
    // If ANY implementation is async, interface method is async
    for _, impl := range implementations {
        if impl.IsAsyncByFlow {
            a.InterfaceMethodAsyncStatus[key] = true
            return true
        }
    }
    
    a.InterfaceMethodAsyncStatus[key] = false
    return false
}
```

### Code Generation Integration

#### Interface Generation

```go
func (c *GoToTSCompiler) writeInterfaceStructure(iface *types.Interface, astNode *ast.InterfaceType) {
    for i := 0; i < iface.NumExplicitMethods(); i++ {
        method := iface.ExplicitMethod(i)
        
        // Use analysis to determine if method should be async
        isAsync := c.analysis.IsInterfaceMethodAsync(iface, method.Name())
        
        if isAsync {
            // Generate: methodName(): Promise<ReturnType>
        } else {
            // Generate: methodName(): ReturnType  
        }
    }
}
```

#### Struct Method Generation

```go
func (c *GoToTSCompiler) writeMethodSignature(decl *ast.FuncDecl) {
    // Check if this method must be async due to interface constraints
    mustBeAsync := c.analysis.MustBeAsyncDueToInterface(structType, methodName)
    
    // Determine final async status
    isAsync := c.analysis.IsAsyncFunc(funcObj) || mustBeAsync
    
    // Generate appropriate signature
}
```

## Examples

### Example 1: Consistent Async Interface

```go
// Input Go code
type Locker interface {
    Lock()
    Unlock()
}

type SyncMutex struct{}
func (m *SyncMutex) Lock()   { /* immediate */ }
func (m *SyncMutex) Unlock() { /* immediate */ }

type AsyncMutex struct{}
func (m *AsyncMutex) Lock()   { /* channel operation - detected as async */ }
func (m *AsyncMutex) Unlock() { /* immediate */ }
```

```typescript
// Generated TypeScript - consistent interface
export interface Locker {
  Lock(): Promise<void>    // ✅ ASYNC - because AsyncMutex.Lock() needs it
  Unlock(): void          // ✅ SYNC - all implementations are sync
}

class SyncMutex implements Locker {
  async Lock(): Promise<void> { /* forced async for compatibility */ }
  Unlock(): void { /* immediate */ }
}

class AsyncMutex implements Locker {
  async Lock(): Promise<void> { /* naturally async */ }
  Unlock(): void { /* immediate */ }
}
```

### Example 2: Cross-Package Implementation

```go
// Package A: interface definition
package a
type Writer interface {
    Write(data []byte) error
}

// Package B: sync implementation  
package b
type FileWriter struct{}
func (w *FileWriter) Write(data []byte) error { /* immediate */ }

// Package C: async implementation
package c  
type NetworkWriter struct{}
func (w *NetworkWriter) Write(data []byte) error { /* channel ops */ }
```

GoScript analyzes ALL packages and determines:
- `NetworkWriter.Write()` requires async (channel operations)
- Therefore `Writer.Write()` interface method becomes async
- `FileWriter.Write()` forced to be async-compatible

## Benefits

### Type Safety
- **Guaranteed compatibility**: All implementations match interface signatures
- **Compile-time checking**: TypeScript compiler catches mismatches
- **No runtime surprises**: Async requirements explicit in types

### Correctness
- **Reflects reality**: Interface signatures match actual implementation needs
- **Granular control**: Per-method analysis avoids unnecessary async
- **Cross-package aware**: Handles external implementations correctly

### Developer Experience
- **Predictable**: Interface async status determined by implementation analysis
- **Flexible**: Supports mixing sync and async methods in same interface
- **Transparent**: Developers see explicit async requirements in generated types

## Implementation Status

### Completed Features ✅
- **Control flow analysis** for detecting async operations
- **Interface implementation tracking** across packages
- **Async status resolution** with caching
- **Code generation integration** for consistent interfaces
- **Cross-package analysis** support
- **Type assertion and assignment tracking**

### Architecture Benefits
- **Leverages existing infrastructure**: Uses current control flow analysis
- **Incremental implementation**: Added without major architectural changes
- **Maintainable**: Clean separation between analysis and code generation
- **Extensible**: Easy to add new async operation detection patterns

## Future Considerations

### Potential Enhancements
- **Performance optimization**: Cache analysis results across compilations
- **External metadata**: Support for annotating third-party packages
- **Async propagation**: Detect transitive async requirements
- **Override mechanisms**: Allow manual async/sync specifications

### Edge Cases Handled
- **Empty interfaces**: Default to sync
- **External implementations**: Conservative async detection
- **Generic interfaces**: Type-specific analysis
- **Method overloading**: Per-signature analysis

This design ensures that GoScript generates type-safe, consistent TypeScript interfaces that accurately reflect the async requirements of their Go counterparts, solving the fundamental impedance mismatch between the two language models. 
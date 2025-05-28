# GoScript Package Override System

## Overview

GoScript provides a package override system that allows hand-written TypeScript implementations to replace Go standard library packages. This system is used for packages like `sync`, `unicode`, `time`, `errors`, etc., where native TypeScript implementations can provide better performance or more appropriate semantics than transpiled Go code.

## Directory Structure

Override packages are located in the `gs/` directory with the following structure:

```
gs/
├── {package}/
│   ├── {package}.ts      # Main TypeScript implementation
│   ├── {package}.go      # Metadata file with function information
│   └── index.ts          # Export file
```

### Example: sync package
```
gs/sync/
├── sync.ts               # TypeScript implementation of sync primitives
├── sync.go               # Metadata defining which functions are async
└── index.ts              # Exports from ./sync.js
```

## Metadata System

### Purpose
The metadata system allows defining which functions/methods are asynchronous and other compiler-relevant information without modifying the main compiler logic.

### Metadata File Format

Each override package includes a `.go` file that defines metadata using the `compiler.FunctionInfo` struct:

```go
package sync

import "github.com/aperturerobotics/goscript/compiler"

// Metadata for sync package functions
// This defines which functions/methods are async for the compiler analysis

// Mutex methods
var MutexLockInfo = compiler.FunctionInfo{IsAsync: true}
var MutexUnlockInfo = compiler.FunctionInfo{IsAsync: false}
var MutexTryLockInfo = compiler.FunctionInfo{IsAsync: false}

// WaitGroup methods  
var WaitGroupAddInfo = compiler.FunctionInfo{IsAsync: false}
var WaitGroupDoneInfo = compiler.FunctionInfo{IsAsync: false}
var WaitGroupWaitInfo = compiler.FunctionInfo{IsAsync: true}
```

### Naming Convention

Metadata variables follow the pattern: `{Type}{Method}Info`

Examples:
- `MutexLockInfo` - for `Mutex.Lock()` method
- `WaitGroupWaitInfo` - for `WaitGroup.Wait()` method
- `MapLoadInfo` - for `Map.Load()` method
- `OnceFuncInfo` - for `OnceFunc()` function

### FunctionInfo Structure

```go
type FunctionInfo struct {
    IsAsync      bool     // Whether the function is asynchronous
    NamedReturns []string // Named return parameters (if any)
}
```

Currently, only `IsAsync` is used to determine if a function should be called with `await`.

## Compiler Integration

### Analysis Phase

The override system integrates with the compiler's analysis phase (`compiler/analysis.go`):

1. **LoadPackageMetadata()**: Loads metadata from gs packages during analysis
2. **IsMethodAsync()**: Checks if a method call should be async based on metadata
3. **Function Coloring**: Propagates async status through the call chain

### Metadata Loading Process

```go
func (a *Analysis) LoadPackageMetadata() {
    // List of gs packages that have metadata
    metadataPackages := []string{
        "github.com/aperturerobotics/goscript/gs/sync",
        "github.com/aperturerobotics/goscript/gs/unicode",
    }

    for _, pkgPath := range metadataPackages {
        // Load package and extract metadata variables
        // Store in PackageMetadata map with keys like "sync.MutexLock"
    }
}
```

### Method Call Detection

When the compiler encounters a method call like `mu.Lock()`, it:

1. Determines the receiver type and package
2. Constructs a metadata key: `{package}.{Type}{Method}`
3. Looks up the metadata to determine if it's async
4. Generates appropriate `await` if needed

Example:
```go
mu.Lock()  // Generates: await mu.Lock()
mu.Unlock() // Generates: mu.Unlock() (no await)
```

## TypeScript Implementation Guidelines

### Class Structure

Override packages should follow Go's API closely while using idiomatic TypeScript:

```typescript
export class Mutex implements Locker {
  private _locked: boolean = false
  private _waitQueue: Array<() => void> = []

  constructor(init?: Partial<{}>) {
    // Mutex has no public fields to initialize
  }

  // Async method (marked in metadata)
  public async Lock(): Promise<void> {
    // Implementation using Promises for blocking behavior
  }

  // Sync method (marked in metadata)
  public Unlock(): void {
    // Synchronous implementation
  }

  // Required for Go value semantics
  public clone(): Mutex {
    return new Mutex()
  }
}
```

### Key Requirements

1. **Constructor**: Accept optional `init` parameter for field initialization
2. **Clone Method**: Implement `clone()` for value semantics
3. **Async Methods**: Use `Promise<T>` return types for async methods
4. **Go API Compatibility**: Match Go's method signatures and behavior

### Async Implementation Patterns

For blocking operations, use Promises with queues:

```typescript
public async Lock(): Promise<void> {
  if (!this._locked) {
    this._locked = true
    return
  }

  // Block using Promise
  return new Promise<void>((resolve) => {
    this._waitQueue.push(resolve)
  })
}

public Unlock(): void {
  this._locked = false
  
  // Wake up next waiter
  if (this._waitQueue.length > 0) {
    const next = this._waitQueue.shift()!
    this._locked = true
    queueMicrotask(() => next())
  }
}
```

## Import Resolution

### Compiler Behavior

When the compiler encounters an import of an overridden package:

1. **Skip Compilation**: The compiler skips transpiling the Go package
2. **Import Mapping**: TypeScript imports resolve to `@goscript/{package}`
3. **Runtime Resolution**: The runtime maps to the actual `gs/{package}/` files

### Generated Import Statements

```typescript
// Go code:
import "sync"

// Generated TypeScript:
import * as sync from "@goscript/sync"
```

### Package Export Structure

Each override package must have an `index.ts` file:

```typescript
// gs/sync/index.ts
export * from "./sync.js"
```

This allows the import system to resolve `@goscript/sync` to the TypeScript implementation.

## Adding New Override Packages

### Step 1: Create Package Directory

```bash
mkdir gs/{package}
```

### Step 2: Implement TypeScript

Create `gs/{package}/{package}.ts` with the TypeScript implementation following the guidelines above.

### Step 3: Create Metadata File

Create `gs/{package}/{package}.go`:

```go
package {package}

import "github.com/aperturerobotics/goscript/compiler"

// Define metadata for each function/method
var SomeFunctionInfo = compiler.FunctionInfo{IsAsync: false}
var SomeAsyncMethodInfo = compiler.FunctionInfo{IsAsync: true}
```

### Step 4: Create Export File

Create `gs/{package}/index.ts`:

```typescript
export * from "./{package}.js"
```

### Step 5: Update Metadata Loading

Add the package path to `LoadPackageMetadata()` in `compiler/analysis.go`:

```go
metadataPackages := []string{
    "github.com/aperturerobotics/goscript/gs/sync",
    "github.com/aperturerobotics/goscript/gs/unicode",
    "github.com/aperturerobotics/goscript/gs/{package}", // Add new package
}
```

## Testing Override Packages

### Compliance Tests

Create compliance tests in `compliance/tests/package_import_{package}/`:

```
compliance/tests/package_import_{package}/
├── package_import_{package}.go    # Go test code
├── expected.log                   # Expected output
├── index.ts                       # Empty file
└── tsconfig.json                  # TypeScript config
```

### Test Structure

```go
package main

import "{package}"

func main() {
    // Test package functionality
    // Use only println() for output
    // Avoid importing other packages
    
    println("test finished")
}
```

### Running Tests

```bash
go test -timeout 30s -run ^TestCompliance/package_import_{package}$ ./compiler
```

## Current Override Packages

| Package | Status | Description |
|---------|--------|-------------|
| `sync` | ✅ Implemented | Synchronization primitives (Mutex, WaitGroup, etc.) |
| `unicode` | ✅ Implemented | Unicode character classification and conversion |
| `time` | ✅ Implemented | Time and duration handling |
| `errors` | ✅ Implemented | Error creation and handling |
| `context` | ✅ Implemented | Context for cancellation and timeouts |
| `slices` | ✅ Implemented | Slice utility functions |

## Benefits of Override System

1. **Performance**: Native TypeScript implementations can be more efficient
2. **Semantics**: Better alignment with JavaScript/TypeScript idioms
3. **Async Support**: Proper async/await integration for blocking operations
4. **Maintainability**: Cleaner, more readable generated code
5. **Extensibility**: Easy to add new packages without modifying core compiler
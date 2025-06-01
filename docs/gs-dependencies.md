# GS Package Dependencies

This document explains how to specify dependencies and metadata for handwritten packages in the `gs/` directory.

## Overview

The compiler now supports automatic dependency resolution and async method metadata for handwritten packages stored in the `gs/` directory. When a handwritten package is copied during compilation, the compiler will automatically copy its dependencies as well.

## Specifying Dependencies and Metadata

To specify dependencies and metadata for a gs package, create a `meta.json` file in the package directory:

```json
{
  "dependencies": [
    "iter",
    "sync", 
    "context"
  ],
  "asyncMethods": {
    "Mutex.Lock": true,
    "WaitGroup.Wait": true,
    "SomeMethod": false
  }
}
```

## Example

For the `gs/bytes` package that depends on several other packages, create a `gs/bytes/meta.json` file:

```json
{
  "dependencies": [
    "errors",
    "io",
    "iter", 
    "unicode",
    "unicode/utf8",
    "unsafe"
  ]
}
```

For the `gs/sync` package that has async methods, create a `gs/sync/meta.json` file:

```json
{
  "dependencies": [
    "unsafe"
  ],
  "asyncMethods": {
    "Mutex.Lock": true,
    "RWMutex.Lock": true,
    "RWMutex.RLock": true,
    "WaitGroup.Wait": true,
    "Once.Do": true,
    "Cond.Wait": true,
    "Map.Delete": true,
    "Map.Load": true,
    "Map.LoadAndDelete": true,
    "Map.LoadOrStore": true,
    "Map.Range": true,
    "Map.Store": true
  }
}
```

## How It Works

1. When the compiler encounters a handwritten package in the `gs/` directory, it reads the `meta.json` file in that directory (if it exists).

2. If found, it extracts the list of dependency package paths from the "dependencies" array and async method information from the "asyncMethods" object.

3. Before copying the current package, it recursively processes all dependencies, ensuring they are copied first.

4. The compiler tracks which packages have been processed to avoid infinite loops and duplicate copying.

5. Dependencies are copied in dependency order, so if package A depends on B, and B depends on C, they will be copied in the order: C, B, A.

6. Async method information is used during code generation to determine which method calls should be marked as async in the generated TypeScript.

## Features

- **Recursive Resolution**: Dependencies can have their own dependencies, which are resolved automatically.
- **Cycle Detection**: The compiler tracks processed packages to avoid infinite loops.
- **Duplicate Prevention**: Each package is only copied once, even if it's a dependency of multiple packages.
- **Async Method Support**: Specify which methods should be compiled as async functions.
- **Optional Metadata**: Both dependencies and asyncMethods are optional - packages without a meta.json file work fine.

## Metadata File Requirements

- Must be named `meta.json` in the package directory
- Must be valid JSON
- All fields are optional:
  - `dependencies`: Array of strings specifying dependency package paths
  - `asyncMethods`: Object mapping method names to boolean values indicating if they're async
- Dependency paths should be relative to the `gs/` directory (e.g., "iter" for `gs/iter`)
- Method names should be in the format "TypeName.MethodName" (e.g., "Mutex.Lock")

## Compilation Behavior

When `DisableEmitBuiltin` is false (default), the compiler will:

1. Copy the `gs/builtin` package
2. For each package being compiled:
   - If it has a handwritten equivalent in `gs/`, copy it and all its dependencies
   - Otherwise, compile it normally from source

The compilation result will include both compiled and copied packages in the appropriate lists. 
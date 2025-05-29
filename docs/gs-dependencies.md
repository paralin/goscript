# GS Package Dependencies

This document explains how to specify dependencies for handwritten packages in the `gs/` directory.

## Overview

The compiler now supports automatic dependency resolution for handwritten packages stored in the `gs/` directory. When a handwritten package is copied during compilation, the compiler will automatically copy its dependencies as well.

## Specifying Dependencies

To specify dependencies for a gs package, create a `.go` file in the package directory that contains a `GsDependencies` variable:

```go
package packagename

// GsDependencies lists the import paths that this gs/ package requires
// These dependencies will be automatically copied when this package is included
var GsDependencies = []string{
	"iter",
	"sync",
	"context",
}
```

## Example

For the `gs/bytes` package that depends on `gs/iter`, create a `gs/bytes/metadata.go` file:

```go
package bytes

// GsDependencies lists the import paths that this gs/ package requires
// These dependencies will be automatically copied when this package is included
var GsDependencies = []string{
	"iter",
}
```

## How It Works

1. When the compiler encounters a handwritten package in the `gs/` directory, it reads all `.go` files in that directory looking for a `GsDependencies` variable.

2. If found, it extracts the list of dependency package paths from the string slice.

3. Before copying the current package, it recursively processes all dependencies, ensuring they are copied first.

4. The compiler tracks which packages have been processed to avoid infinite loops and duplicate copying.

5. Dependencies are copied in dependency order, so if package A depends on B, and B depends on C, they will be copied in the order: C, B, A.

## Features

- **Recursive Resolution**: Dependencies can have their own dependencies, which are resolved automatically.
- **Cycle Detection**: The compiler tracks processed packages to avoid infinite loops.
- **Duplicate Prevention**: Each package is only copied once, even if it's a dependency of multiple packages.
- **Flexible Location**: The metadata can be in any `.go` file in the package directory, not just a specific file name.

## Metadata File Requirements

- Must be a valid Go file in the package directory
- Must declare the same package name as the directory
- Must contain a `var GsDependencies = []string{...}` declaration
- Dependency paths should be relative to the `gs/` directory (e.g., "iter" for `gs/iter`)

## Compilation Behavior

When `DisableEmitBuiltin` is false (default), the compiler will:

1. Copy the `gs/builtin` package
2. For each package being compiled:
   - If it has a handwritten equivalent in `gs/`, copy it and all its dependencies
   - Otherwise, compile it normally from source

The compilation result will include both compiled and copied packages in the appropriate lists. 
# Type Missing Imports Issue

## Problem Description
When Go types are referenced across different files in the same package, the generated TypeScript code does not properly import these types, causing TypeScript compilation errors.

## Test Case: `type_separate_files`
- `memory.go` defines: `type file struct { name string; data []byte }`  
- `storage.go` references: `type storage struct { files map[string]*file; children map[string]map[string]*file }`
- `type_separate_files.go` uses both types

## Issue Observed
1. `memory.gs.ts` generates the `file` class but doesn't export it (because it's unexported in Go)
2. `storage.gs.ts` references `file` type but doesn't import it from `memory.gs.ts`  
3. TypeScript compilation fails: `Cannot find name 'file'`

## Expected TypeScript Output
- `memory.gs.ts` should export the `file` class (even though unexported in Go)
- `storage.gs.ts` should import `{ file }` from `"./memory.gs.ts"`

## Analysis Completed

### Current Function Import System
The compiler already has a system for cross-file function imports:
- `PackageAnalysis.FunctionDefs` tracks which functions are defined in each file
- `PackageAnalysis.FunctionCalls` tracks which functions each file calls from other files
- `compiler.go` lines 602-622 generate import statements for functions

### Root Cause
1. **Export Issue**: In `spec-struct.go` line 23, structs are only exported if `a.Name.IsExported()` is true. For unexported types like `file`, this is false.
2. **Import Issue**: There's no equivalent to `FunctionCalls` for tracking type dependencies across files.

### Solution Approach
1. **Always export types within same package**: Modify struct generation to export all types (even unexported ones) when generating TypeScript for same-package consumption
2. **Add type dependency tracking**: Add `TypeDefs` and `TypeCalls` to `PackageAnalysis` similar to function tracking
3. **Generate type imports**: Add import generation for types similar to function imports

## Implementation Plan
1. Add `TypeDefs` and `TypeCalls` fields to `PackageAnalysis` struct
2. Implement type dependency analysis in `AnalyzePackage` function
3. Modify struct generation to always export types within same package
4. Add type import generation in compiler.go
5. Test with `type_separate_files` test case 
# GoScript Compiler Analysis & Refactoring Plan

## Overview
This document analyzes the Go-to-TypeScript compiler codebase and outlines a major refactoring plan to centralize, deduplicate, and minimize the code while maintaining exact output compatibility (as validated by compliance tests).

## Current File Structure Analysis

### Core Architecture Files
- **compiler.go** (630 lines): Main entry point with `Compiler`, `PackageCompiler`, `FileCompiler`, and `GoToTSCompiler` structs
- **analysis.go** (824 lines): Analysis infrastructure for tracking variable usage, async functions, boxing requirements
- **code-writer.go** (116 lines): TypeScript code output utilities

### Statement Handling (Dispersed)
- **stmt.go** (786 lines): Central dispatcher and core statement handlers
- **stmt-assign.go** (440 lines): Assignment statement handling
- **stmt-for.go** (179 lines): For loop handling  
- **stmt-range.go** (236 lines): Range loop handling
- **stmt-select.go** (212 lines): Select statement handling
- **stmt-type-switch.go** (148 lines): Type switch handling

### Expression Handling (Dispersed)
- **expr.go** (478 lines): Core expression handlers
- **expr-call.go** (453 lines): Function call expressions
- **expr-selector.go** (126 lines): Selector expressions (obj.field)
- **expr-type.go** (310 lines): Type expressions
- **expr-value.go** (87 lines): Value expression dispatcher
- **expr-star.go** (91 lines): Pointer dereference expressions

### Type System (Dispersed)
- **type.go** (541 lines): Main type translation logic
- **type-assert.go** (210 lines): Type assertion handling
- **type-info.go** (142 lines): Runtime type information generation

### Specification Handling (Dispersed)
- **spec.go** (273 lines): Spec dispatcher and utilities
- **spec-struct.go** (481 lines): Struct type specifications
- **spec-value.go** (227 lines): Value specifications

### Supporting Files
- **assignment.go** (413 lines): Assignment logic
- **composite-lit.go** (553 lines): Composite literal handling
- **decl.go** (255 lines): Declaration handling
- **field.go** (170 lines): Field handling
- **lit.go** (132 lines): Literal value handling
- **primitive.go** (143 lines): Primitive type mappings

## Code Duplication & Issues Identified

### 1. Fragmented Write* Functions
- **72 Write* functions** scattered across 20+ files
- Similar patterns repeated for different AST node types
- Common functionality like error handling, type checking, and output formatting duplicated

### 2. Redundant Type Handling
- Type conversion logic duplicated between `WriteGoType`, `WriteGoTypeForFunctionReturn`, and individual type writers
- Zero value generation scattered across multiple files
- Boxing/unboxing logic duplicated in multiple places

### 3. Common Pattern Duplication
- Error wrapping: `fmt.Errorf("failed to write X: %w", err)` appears 50+ times
- Type assertions and nil checks repeated everywhere
- AST traversal patterns duplicated across handlers

### 4. Analysis Infrastructure Overhead
- Multiple maps tracking similar information in `Analysis` struct
- Complex visitor pattern with state tracking that could be simplified
- Boxing analysis logic spread across multiple functions

### 5. Code Generation Utilities Scattered
- TypeScript output formatting logic duplicated
- Import handling spread across multiple files
- Comment preservation logic duplicated

## Refactoring Plan

### Phase 1: Eliminate Real Code Duplication

#### 1.1 Streamline `analysis.go` 
Consolidate related analysis maps that track similar data:
```go
// Consolidate in analysis.go - combine related tracking
type Analysis struct {
    // Keep existing VariableUsage map
    VariableUsage map[types.Object]*VariableUsageInfo
    
    // Consolidate function-related tracking into one map
    FunctionData map[types.Object]*FunctionInfo
    
    // Consolidate node-related tracking into one map  
    NodeData map[ast.Node]*NodeInfo
    
    // Keep specialized maps that serve different purposes
    Imports map[string]*fileImport
    Cmap    ast.CommentMap
}

type FunctionInfo struct {
    IsAsync      bool
    NamedReturns []string
}

type NodeInfo struct {
    NeedsDefer     bool
    InAsyncContext bool
    IsBareReturn   bool
}
```

#### 1.2 Consolidate Duplicate Type Logic in `type.go`
Extract genuinely duplicated type handling logic:
```go
// Unify WriteGoType and WriteGoTypeForFunctionReturn shared logic
func (c *GoToTSCompiler) writeTypeDispatch(typ types.Type, isForFunctionReturn bool) {
    // Extract the common switch logic used in both functions
}

// Consolidate zero value generation scattered across files
func (c *GoToTSCompiler) WriteZeroValueForType(typ any) {
    // Move scattered zero value logic here from composite-lit.go and others
}
```

### Phase 2: Targeted File Consolidation

#### 2.1 Merge `assignment.go` into `stmt-assign.go` 
- `assignment.go` (413 lines) has overlapping logic with `stmt-assign.go` (440 lines)
- Consolidate `writeAssignmentCore` and related helper functions
- Eliminate duplicate assignment pattern handling

#### 2.2 Merge `type-assert.go` into `expr.go`
- `type-assert.go` (210 lines) contains expression-handling logic
- Move `writeTypeAssert` function and helpers to expression handling
- Consolidate type assertion logic with other expressions

#### 2.3 Merge `expr-value.go` into `expr.go`
- `expr-value.go` (87 lines) is just a dispatcher for other expression handlers
- Move `WriteValueExpr` dispatcher logic directly into `expr.go`
- Eliminate the extra indirection layer

### Phase 3: Consolidate Only Clear Duplicates

#### 3.1 Merge `field.go` into `type.go`
- `field.go` (170 lines) and `type.go` (541 lines) both handle type-related field logic
- Move `WriteFieldList` and `WriteField` functions to `type.go`
- Keep total size reasonable (~700 lines)

#### 3.2 Merge `type-info.go` into `type.go` 
- `type-info.go` (142 lines) generates type metadata that belongs with type handling
- Move `writeTypeInfoObject` and related functions to `type.go`
- Consolidate type registration and metadata generation

#### 3.3 Files to Eliminate
After targeted consolidation, eliminate only these redundant files:
- `assignment.go` → merged into `stmt-assign.go`
- `type-assert.go` → merged into `expr.go`
- `expr-value.go` → merged into `expr.go`
- `field.go` → merged into `type.go`
- `type-info.go` → merged into `type.go`

### Phase 4: Final Structure

#### 4.1 Resulting File Structure (25 files → 20 files)
Keep these files with focused responsibilities:
- `compiler.go` - Main compiler orchestration
- `analysis.go` - Streamlined analysis infrastructure  
- `stmt.go` - Core statement dispatcher
- `stmt-assign.go` - Assignment handling (includes assignment.go logic)
- `stmt-for.go` - For loop handling
- `stmt-range.go` - Range loop handling  
- `stmt-select.go` - Select statement handling
- `stmt-type-switch.go` - Type switch handling
- `expr.go` - Expression dispatcher + type assertions + value expressions
- `expr-call.go` - Function call expressions
- `expr-selector.go` - Selector expressions
- `expr-type.go` - Type expressions
- `expr-star.go` - Pointer expressions
- `type.go` - Type system + field handling + type info
- `spec.go` - Spec dispatcher
- `spec-struct.go` - Struct specifications
- `spec-value.go` - Value specifications
- `decl.go` - Declaration handling
- `composite-lit.go` - Composite literals
- `lit.go` - Basic literals
- `code-writer.go` - Output utilities
- `primitive.go` - Type mappings
- `config.go` - Configuration
- `output.go` - Output handling

#### 4.2 Benefits Achieved
- **Eliminate 5 redundant files** with genuine duplication
- **Consolidate related analysis tracking** to reduce memory overhead
- **Remove dispatcher layers** where they add no value
- **Keep file sizes reasonable** (largest ~700 lines)
- **Maintain logical separation** for easier navigation

## Expected Benefits

### 1. Code Reduction
- **Eliminate 5 redundant files** that contain genuine duplication
- **Reduce duplicate logic** by 20-30% through targeted consolidation  
- **Streamline analysis tracking** to reduce memory overhead
- **Keep file sizes manageable** (largest ~700 lines)

### 2. Maintainability Improvements
- **Single source of truth** for each type of operation
- **Consistent error handling** patterns with shared utilities
- **Simplified testing** with consolidated, focused components
- **Easier debugging** with related logic co-located
- **Reduced cognitive load** when working on specific functionality

### 3. Performance Benefits
- **Reduced memory allocation** from eliminating duplicate structures
- **Faster compilation** with streamlined code paths and fewer function calls
- **Better CPU cache utilization** with related code co-located
- **Reduced import overhead** with fewer files

### 4. Developer Experience  
- **Easier navigation** - related functionality in same files
- **Faster feature development** with reusable helper functions
- **Consistent patterns** across all Write* functions
- **Better IDE support** with simplified file structure
- **Reduced build times** with fewer files to compile

## Validation Strategy

### 1. Compliance Test Coverage
- **All existing compliance tests** must continue to pass without modification
- **Byte-for-byte output comparison** to ensure identical TypeScript generation
- **Performance benchmarks** to ensure no compilation time regression
- **Memory usage profiling** to validate reduced allocation

### 2. Incremental Refactoring Approach
- **File-by-file consolidation** with validation at each step
- **Git branch strategy** with rollback capability at each merge
- **Automated testing** after each consolidation phase
- **Output diff validation** before each merge to main

### 3. Test-Driven Validation
- **Existing unit tests** must continue to pass
- **Integration tests** run after each consolidation
- **Regression tests** for known edge cases and bug fixes
- **Performance tests** to ensure no slowdown

## Implementation Timeline

### Week 1: Analysis Consolidation
- Consolidate related tracking maps in `analysis.go`
- Combine function and node data structures
- **Validation**: Run compliance tests, verify identical output

### Week 2: Core File Merges
- Merge `assignment.go` into `stmt-assign.go`
- Merge `type-assert.go` into `expr.go`
- Merge `expr-value.go` into `expr.go`
- **Validation**: Full compliance test suite

### Week 3: Type System Consolidation  
- Merge `field.go` into `type.go`
- Merge `type-info.go` into `type.go`
- Extract shared type handling logic
- **Validation**: Type and expression focused compliance tests

### Week 4: Final Cleanup
- Remove eliminated files and update imports
- Clean up any remaining import references
- **Final Validation**: Complete compliance test suite, performance benchmarks

This refactoring will significantly improve code maintainability and reduce complexity while preserving exact functionality and output compatibility with existing compliance tests. 
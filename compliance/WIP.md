# Wrapper Type Args Compliance Test Analysis

## Problem Analysis

The `wrapper_type_args` compliance test is failing due to improper handling of wrapper types in function calls and operations. The core issues are:

### 1. Type Constructor Calls
- **Problem**: `TestFileMode(0o644)` should become `TestFileMode(new os.FileMode(0o644))` but currently generates `TestFileMode(0o644)` 
- **Root Cause**: The compiler is not automatically wrapping literal arguments when calling functions that expect wrapper types

### 2. Method Calls on Primitive Values  
- **Problem**: `mode.String()` fails with "mode.String is not a function" when `mode` is a plain number
- **Root Cause**: The argument was passed as a literal number instead of a wrapper class instance

### 3. Bitwise Operations with Wrapper Types
- **Problem**: `(new os.FileMode(0o755) | 0o022)` should become `(os.FileMode(0o755).valueOf() | 0o022)`
- **Root Cause**: The left operand needs `.valueOf()` to extract the underlying numeric value

## Implementation Status

### ✅ Phase 1: Enhanced Analysis (analysis.go)
- [x] Added WrapperTypes map to Analysis struct
- [x] Implemented IsWrapperType method with logic for imported types
- [x] Fixed logic to exclude struct types from being wrapper types
- [x] Test passes: MyMode detected as wrapper (true), MyDir detected as non-wrapper (false)

### ✅ Phase 2: Updated isWrapperType (expr.go)  
- [x] Updated isWrapperType to use analysis data
- [x] Now supports both local and imported wrapper types

### 🔄 Phase 3: Function Call Auto-Wrapping (expr-call.go) - IN PROGRESS
- [x] Added auto-wrapping logic to writeCallArguments
- [x] Added getImportAlias method for import resolution
- ❌ **ISSUE: Auto-wrapping not working in generated code**

### ❌ Phase 4: Enhanced Binary Operations - NOT STARTED

## Current Debugging Status

The auto-wrapping logic was implemented but is not working. Generated TypeScript still shows:
```typescript
TestFileMode(0o644) // Should be: TestFileMode(new os.FileMode(0o644))
```

**Potential Issues to Investigate:**
1. **os.FileMode not detected as wrapper type**: The IsWrapperType logic might not be catching os.FileMode
2. **Function signature analysis failing**: writeCallArguments might not be getting the correct function signature
3. **Import alias resolution issues**: getImportAlias might not be finding "os" correctly
4. **Type comparison issues**: The logic checking if argType != paramType might be flawed

## Next Debugging Steps
1. Add debug logging to writeCallArguments to see why auto-wrapping isn't triggering
2. Test if os.FileMode is being detected as wrapper type in the compliance test context
3. Verify function signature extraction is working
4. Check import alias resolution

## Test Cases Verification

Analysis test shows:
- ✅ MyMode wrapper detection: true (correct)  
- ✅ MyDir wrapper detection: false (correct)
- ✅ WrapperTypes map initialized with 2 types tracked

But the compliance test still fails, indicating the auto-wrapping logic needs investigation.

## Solution Requirements

### 1. Enhanced Wrapper Type Detection
We need to detect wrapper types in multiple ways:
- **Analysis-time detection**: Pre-analyze types and store wrapper type information
- **Cross-package support**: Detect wrapper types from imported packages  
- **Heuristic detection**: Identify wrapper patterns (named types with valueOf-like behavior)

### 2. Automatic Type Coercion in Function Calls
When calling a function that expects a wrapper type:
- **Detect parameter types**: Analyze function signatures to identify wrapper type parameters
- **Auto-wrap literals**: Convert `func(0o644)` to `func(new Type(0o644))`
- **Preserve existing instances**: Don't double-wrap already-wrapped values

### 3. Enhanced Binary Operation Handling
For operations involving wrapper types:
- **Auto-valueOf for wrapper operands**: Add `.valueOf()` when wrapper types are used in numeric operations
- **Preserve non-wrapper operands**: Don't add `.valueOf()` to plain numbers/literals

## Implementation Plan

### Phase 1: Enhance Analysis (analysis.go)
1. **Add wrapper type detection to Analysis struct**:
   ```go
   // WrapperTypes tracks types that should be implemented as wrapper classes
   WrapperTypes map[types.Type]bool
   ```

2. **Pre-analyze types during AnalyzeFile**:
   - Detect named types with methods
   - Store wrapper type information for imported types
   - Use heuristics for common wrapper patterns

### Phase 2: Update isWrapperType (expr.go)
1. **Use pre-computed analysis data**:
   ```go
   func (c *GoToTSCompiler) isWrapperType(t types.Type) bool {
       return c.analysis.IsWrapperType(t)
   }
   ```

2. **Add analysis method**:
   ```go
   func (a *Analysis) IsWrapperType(t types.Type) bool {
       // Check pre-computed wrapper types
   }
   ```

### Phase 3: Function Call Auto-Wrapping (expr-call.go)
1. **Analyze function parameters in writeCallArguments**
2. **Auto-wrap literal arguments when target parameter is wrapper type**
3. **Preserve existing wrapper instances**

### Phase 4: Enhanced Binary Operations (expr.go)
1. **Improve needsValueOfForBitwiseOp to use analysis data**
2. **Ensure proper valueOf handling for all wrapper types**

## Test Cases Needed

Add to `analysis_test.go`:
```go
func TestWrapperTypeDetection(t *testing.T) {
    tests := []struct {
        name string
        code string
        expected map[string]bool // type name -> isWrapper
    }{
        {
            name: "local_wrapper_type",
            code: `package main
                type MyMode int
                func (m MyMode) String() string { return "" }`,
            expected: map[string]bool{
                "MyMode": true,
            },
        },
        {
            name: "imported_wrapper_type", 
            code: `package main
                import "os"
                func test(m os.FileMode) {}`,
            expected: map[string]bool{
                "os.FileMode": true,
            },
        },
    }
}
```

## Next Steps
1. Implement enhanced wrapper type detection in analysis phase
2. Update isWrapperType to use analysis data  
3. Add auto-wrapping in function calls
4. Test and iterate until compliance test passes 
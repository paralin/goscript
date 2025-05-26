# WIP: Implementing //go:linkname directive support

## Current Issues

The linkname compliance test is failing due to multiple issues:

### 1. TypeScript Compilation Errors

#### Issue 1: Invalid label syntax
- **Location**: `compliance/tests/linkname/run/output/@goscript/os/getwd.gs.ts:190:10`
- **Error**: "Cannot use a declaration in a single-statement context"
- **Root Cause**: The compiler generates `Found: let pd: ...` which is invalid TypeScript syntax. Labels cannot be used with variable declarations.
- **Fix**: Modify `WriteStmtLabeled` in `compiler/stmt.go` to handle this case properly.

#### Issue 2: Reserved word 'new' used as variable name
- **Location**: Multiple files in `@goscript/sync/atomic/`
- **Error**: "Variable declaration not allowed at this location" and "Expression expected"
- **Root Cause**: The compiler generates `let new: number = 0` where `new` is a TypeScript reserved word.
- **Fix**: Ensure `sanitizeIdentifier` is called when generating variable names in function bodies.

### 2. Missing //go:linkname directive support

The `//go:linkname` directive is not currently processed by the compiler. This directive should:
1. Parse the comment `//go:linkname localname [linkname]`
2. Create an import alias for the target package/function
3. Generate appropriate TypeScript import statements

## Implementation Plan

### Phase 1: Fix existing TypeScript compilation issues

1. **Fix label syntax issue**:
   - Modify `WriteStmtLabeled` in `compiler/stmt.go` to generate valid TypeScript
   - For variable declarations, move the label to a separate line or use a different approach

2. **Fix reserved word issue**:
   - Ensure `sanitizeIdentifier` is called for all variable names in function bodies
   - Check where variable names are generated without sanitization

### Phase 2: Implement //go:linkname directive support

1. **Parse linkname directives**:
   - Extend comment processing in `WriteDoc` or create a new function
   - Extract linkname information from function comments

2. **Generate imports**:
   - Create import statements for linked packages
   - Generate appropriate aliases

3. **Update function declarations**:
   - Modify function declarations that have linkname directives
   - Ensure proper TypeScript function signatures

## Files to Modify

1. `compiler/stmt.go` - Fix `WriteStmtLabeled` function
2. `compiler/compiler.go` - Ensure `sanitizeIdentifier` is used consistently
3. `compiler/decl.go` - Add linkname directive processing to `WriteFuncDeclAsFunction`
4. `compiler/analysis.go` - Add linkname analysis if needed

## Test Strategy

1. Run the linkname compliance test: `go test -timeout 30s -run ^TestCompliance/linkname$ ./compiler`
2. Verify TypeScript compilation succeeds
3. Verify runtime behavior matches Go output
4. Test with different linkname scenarios 
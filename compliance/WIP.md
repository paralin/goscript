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

# Goto Implementation Analysis

## Problem
The `labeled_statement` compliance test is failing because the compiler doesn't implement `goto` statements. Currently, when a `goto` statement is encountered, the compiler generates a comment `// unhandled branch statement token: goto` instead of implementing the jump functionality.

## Test Analysis
The test file `compliance/tests/labeled_statement/labeled_statement.go` contains:
```go
goto label2
println("this should be skipped")

label2:
{
    var y int = 100
    println("y:", y)
}
```

Expected output: The `println("this should be skipped")` should NOT be executed.
Actual output: The line is being executed, showing goto is not working.

## Current Implementation Issues
1. In `compiler/stmt.go`, `WriteStmtBranch()` function handles `break` and `continue` but not `goto`
2. The `goto` case falls through to the default case which just writes a comment
3. TypeScript doesn't have native `goto` support, so we need a state machine approach

## Solution Strategy
Since TypeScript doesn't have `goto`, we need to implement a re-entrant control flow mechanism using:

1. **State Machine Approach**: Convert the function into a state machine where each label becomes a state
2. **Loop-based Control**: Wrap the function body in a loop that continues until completion
3. **State Variable**: Use a state variable to track which label to jump to
4. **Label Mapping**: Map each label to a unique state identifier

## Implementation Plan

### Phase 1: Function-level Analysis
- Scan the entire function to identify all labels and goto statements
- Build a mapping of labels to state IDs
- Determine if the function needs goto transformation

### Phase 2: Code Generation Changes
- Modify function generation to wrap body in state machine when goto is present
- Transform labeled statements to switch cases
- Transform goto statements to state changes
- Handle break/continue with labels properly in the new structure

### Phase 3: State Machine Structure
```typescript
export async function main(): Promise<void> {
    let __gotoState = 0; // 0 = start, -1 = end
    
    __gotoLoop: while (__gotoState >= 0) {
        switch (__gotoState) {
            case 0: // main flow
                // ... code before first label/goto ...
                if (someCondition) {
                    __gotoState = 1; // goto label2
                    continue __gotoLoop;
                }
                // this should be skipped
                __gotoState = 1; // fall through to label2
                continue __gotoLoop;
                
            case 1: // label2
                {
                    let y: number = 100;
                    console.log("y:", y);
                }
                __gotoState = -1; // end
                break;
        }
    }
}
```

## Files to Modify
1. `compiler/stmt.go` - Add goto handling to `WriteStmtBranch`
2. `compiler/stmt.go` - Modify `WriteStmtLabeled` to work with state machine
3. `compiler/func.go` - Modify function generation to detect and handle goto
4. Add new analysis phase to detect goto usage in functions

## Implementation Steps
1. Add goto detection during function analysis
2. Implement state machine wrapper generation
3. Modify label statement generation for state machine
4. Implement goto statement as state change
5. Test with the labeled_statement compliance test 
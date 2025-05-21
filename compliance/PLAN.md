# Plan for Named Return Multiple Compliance Test

## Objective
Improve the Go to TypeScript transpiler's handling of comments, specifically for named return values, to match the desired output in `compliance/tests/named_return_multiple/named_return_multiple.gs.ts`.

## Proposed Changes

1.  **Refine Contextual Comment Placement for Named Returns:**
    *   Investigate how comments are currently associated with `ast.FuncLit` (function literals) and `ast.BlockStmt` (block statements) in the `GoToTSCompiler`. Relevant functions might include `(c *GoToTSCompiler) WriteFuncLitValue(exp *ast.FuncLit) error` in [`compiler/lit.go`](compiler/lit.go) and `(c *GoToTSCompiler) WriteStmtBlock(exp *ast.BlockStmt, suppressNewline bool) error` in [`compiler/stmt.go`](compiler/stmt.go).
    *   The `analysis.go` package, particularly `AnalyzeFile` and the `analysisVisitor`, might need to be reviewed to understand how `ast.CommentMap` is used and if additional analysis is needed to link comments more precisely to variable assignments or control flow paths.
    *   Adjust the code generation logic within `GoToTSCompiler` methods (e.g., `WriteStmtIf`, `WriteStmtBlock`, and potentially others that handle control flow) to ensure comments related to named return variables are emitted within the specific conditional branches or blocks where those variables might remain unassigned (i.e., take their zero value). This involves:
        *   **Moving comments**: Comments indicating that a named return variable retains its zero value should be moved from a general scope (e.g., before an `if-else` structure or at the beginning of a function block) to the specific block (`if`, `else if`, `else`) where that variable is confirmed to remain unassigned.
        *   **Removing redundant comments**: Comments that were previously placed at a higher scope or before variable declarations are removed if their information is now more accurately conveyed by comments placed within conditional blocks. For example, a comment before a function literal declaration about unassigned variables is removed if the logic within the function now correctly places comments in the specific paths where variables are unassigned.
        *   **Precise placement within blocks**: Within a conditional block, the comment should appear after any assignments that *do* occur for other named return variables in that same block, effectively highlighting which variables *remain* unassigned in that specific execution path.
        *   Ensuring that comments are not duplicated or incorrectly placed when moved.

## Code Snippets (BEFORE / AFTER)

Here are examples of the desired changes in `compliance/tests/named_return_multiple/named_return_multiple.gs.ts`:

**Snippet 1: `processValues` function**

```typescript
<<<<<<< BEFORE
		num = input * 2

		// ok remains false (its zero value)
		if (input > 5) {
			text = "greater than five"
			ok = true
		} else {

			// ok remains false (its zero value)
			text = "five or less"
			// ok remains false (its zero value)
		}
		return [num, text, ok]
=======
		num = input * 2
		if (input > 5) {
			text = "greater than five"
			ok = true
		} else {
			text = "five or less"
			// ok remains false (its zero value)
		}
		return [num, text, ok]
>>>>>>> AFTER
```

**Snippet 2: First anonymous function (for `n3, t3, o3`)**

```typescript
<<<<<<< BEFORE
	// Test with an anonymous function and potentially unassigned named returns

	// resStr and resBool are not assigned, should be zero values

	// resBool is not assigned, should be zero value

	// all are unassigned, should be zero values
	let [n3, t3, o3] = ((val: number): [number, string, boolean] => {
		let resInt: number = 0
		let resStr: string = ""
		let resBool: boolean = false
		{

			// resStr and resBool are not assigned, should be zero values

			// resBool is not assigned, should be zero value
			if (val == 1) {
				resInt = 100

			} else if (val == 2) {
				resInt = 200
				resStr = "set string"

			} else {

			}
			// all are unassigned, should be zero values

			return [resInt, resStr, resBool]
		}
	}
	)(1)
=======
	// Test with an anonymous function and potentially unassigned named returns
	let [n3, t3, o3] = ((val: number): [number, string, boolean] => {
		let resInt: number = 0
		let resStr: string = ""
		let resBool: boolean = false
		{
			if (val == 1) {
				resInt = 100
				// resStr and resBool are not assigned, should be zero values
			} else if (val == 2) {
				resInt = 200
				resStr = "set string"
				// resBool is not assigned, should be zero value
			} else {
				// all are unassigned, should be zero values
			}
			return [resInt, resStr, resBool]
		}
	}
	)(1)
>>>>>>> AFTER
```

**Snippet 3: Second anonymous function (for `n4, t4, o4`)**

```typescript
<<<<<<< BEFORE
	// resBool is not assigned

	// all are unassigned
	let [n4, t4, o4] = ((val: number): [number, string, boolean] => {
		let resInt: number = 0
		let resStr: string = ""
		let resBool: boolean = false
		{

			// resBool is not assigned
			if (val == 1) {
				resInt = 100
			} else if (val == 2) {
				resInt = 200
				resStr = "set string for val 2"

			} else {

			}
			// all are unassigned

			return [resInt, resStr, resBool]
		}
	}
	)(2)
=======
	let [n4, t4, o4] = ((val: number): [number, string, boolean] => {
		let resInt: number = 0
		let resStr: string = ""
		let resBool: boolean = false
		{
			if (val == 1) {
				resInt = 100
			} else if (val == 2) {
				resInt = 200
				resStr = "set string for val 2"
				// resBool is not assigned
			} else {
				// all are unassigned
			}
			return [resInt, resStr, resBool]
		}
	})(2)
>>>>>>> AFTER
```

**Snippet 4: Third anonymous function (for `n5, t5, o5`)**

```typescript
<<<<<<< BEFORE
	// all are unassigned here, so will take zero values
	let [n5, t5, o5] = ((val: number): [number, string, boolean] => {
		let resInt: number = 0
		let resStr: string = ""
		let resBool: boolean = false
		{
			if (val == 1) {
				resInt = 100
			} else if (val == 2) {
				resInt = 200
				resStr = "set string for val 2"
			} else {

			}
			// all are unassigned here, so will take zero values

			return [resInt, resStr, resBool]
		}
	}
	)(3)
=======
	let [n5, t5, o5] = ((val: number): [number, string, boolean] => {
		let resInt: number = 0
		let resStr: string = ""
		let resBool: boolean = false
		{
			if (val == 1) {
				resInt = 100
			} else if (val == 2) {
				resInt = 200
				resStr = "set string for val 2"
			} else {
				// all are unassigned here, so will take zero values
			}
			return [resInt, resStr, resBool]
		}
	})(3)
>>>>>>> AFTER
```

## Implementation Steps

1.  **Step 1: Analyze Current Comment Handling**
    *   Examine `compiler/lit.go` (`WriteFuncLitValue`) and `compiler/stmt.go` (`WriteStmtBlock`, `WriteStmtIf`) to understand how comments are currently processed and emitted within function bodies and control flow statements.
    *   Review `compiler/compiler.go` and `compiler/analysis.go` to see how `ast.CommentMap` is used and if any existing analysis can be leveraged or extended.

2.  **Step 2: Refine Comment Placement Logic**
    *   Based on the analysis, identify the specific points in the AST traversal and code generation where the named return variable comments are currently being misplaced.
    *   Implement changes to ensure these comments are moved to their correct contextual locations within `if`/`else` blocks or other relevant statements. This might involve:
        *   Modifying the `GoToTSCompiler` to pass more context about named return variables and their assignment status to the comment writing functions.
        *   Adjusting the logic that determines where a comment group should be written relative to an AST node.

## Verification
After implementing the changes, re-run the compliance tests, specifically focusing on `named_return_multiple.gs.ts`, to ensure the generated output matches the desired "Goal" state.
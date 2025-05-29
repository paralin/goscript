# Variable Shadowing and Scope Issue Analysis

## Problem Description

The Go to TypeScript compiler is generating unnecessary block scopes and causing variable shadowing issues for if statements with initialization.

The compliance test `variable_shadowing_scope` is failing because the generated TypeScript code is not correct.

The input is located in compliance/tests/variable_shadowing_scope/variable_shadowing_scope.go

### Input Go Code:
```go
	fileInfo, err := fs.Lstat(filename)
	if err := walkFn(filename, fileInfo, err); err != nil && err != filepath.SkipDir {
		println("Walk function returned error")
		return
	}
```

### Current Generated TypeScript:

The output is located in compliance/tests/variable_shadowing_scope/variable_shadowing_scope.gs.ts

The compliance test can be run with `go test -timeout 10m -run ^TestCompliance/variable_shadowing_scope$ github.com/aperturerobotics/goscript/compiler` 

```typescript
	let [fileInfo, err] = fs.Lstat(filename)
	{
		let err = walkFn(filename, fileInfo, err)
		if (err != null && err != filepath.SkipDir) {
			console.log("Walk function returned error")
			return 
		}
	}
```

The issue is that err is shadowed in the block scope of the if statement but also used in the call to walkFn.

The solution is to add analysis to the compiler in compiler/analysis.go to detect this case and generate a temporary variable for the outer scope.

### Expected TypeScript:

```typescript
	let [fileInfo, err] = fs.Lstat(filename)
    let _temp_err = err // err is re-assigned in a child scope
	{
		let err = walkFn(filename, fileInfo, _temp_err)
		if (err != null && err != filepath.SkipDir) {
			console.log("Walk function returned error")
			return 
		}
	}
```

The key difference is that the temporary variable is created in the outer scope and then assigned to the inner scope. We only do this if the variable is re-assigned in a child scope, and also used in the child scope.
# Interface Async Method Call Issue

## Problem Description

When calling an async method on an interface variable, the generated TypeScript code is not adding the `await` keyword, causing:

1. **Runtime Error**: The function returns `[object Promise]42` instead of `52` because promises are not being awaited
2. **TypeScript Error**: `Operator '+' cannot be applied to types 'Promise<number>' and 'number'`

## Test Case Analysis

The new compliance test `interface_async_method_call` demonstrates this issue:

```go
// Interface with async method (due to ChannelProcessor implementation)
type AsyncProcessor interface {
	Process(data int) int  // This becomes async due to channel operations in implementation
	GetResult() int        // This stays sync
}

func processViaInterface(processor AsyncProcessor, input int) int {
	result := processor.Process(input)      // ❌ Missing await in TS
	baseResult := processor.GetResult()     // ✅ Correctly sync in TS  
	return result + baseResult
}
```

### Generated TypeScript (Current - WRONG)
```typescript
export function processViaInterface(processor: AsyncProcessor, input: number): number {
	let result = processor!.Process(input)     // ❌ Missing await - returns Promise<number>
	let baseResult = processor!.GetResult()    // ✅ Correctly sync - returns number
	return result + baseResult                 // ❌ Promise<number> + number = error
}
```

### Expected TypeScript (Correct)
```typescript
export function processViaInterface(processor: AsyncProcessor, input: number): number {
	let result = await processor!.Process(input)  // ✅ Should await - returns number
	let baseResult = processor!.GetResult()       // ✅ Correctly sync - returns number  
	return result + baseResult                    // ✅ number + number = number
}
```

## Root Cause Analysis

The issue is in the compiler's method call handling. The compiler needs to:

1. **Detect interface method calls**: When we have `interfaceVar.Method()`
2. **Check interface method async status**: Look up if this specific interface method is async
3. **Add await if needed**: If the interface method is async, add `await` to the call

The current code likely handles struct method calls correctly (since those work in other tests), but interface method calls are missing the async status lookup.

## Investigation Needed

Need to examine these compiler files:
- Method call generation logic
- Interface method async status resolution  
- How struct method calls differ from interface method calls in code generation

## Expected Fix Areas

1. **Method Call Detection**: Identify when a method call is on an interface vs struct ✅
2. **Async Status Lookup**: Check if the interface method is marked as async ✅  
3. **Await Injection**: Add `await` prefix when calling async interface methods ✅
4. **Function Signature**: Update containing function to be async if it wasn't already ❌

## Progress Update

✅ **Fixed**: Added interface method async detection in `expr-call-async.go`
- Added check for `targetType.Underlying().(*types.Interface)`
- Use `c.analysis.IsInterfaceMethodAsync()` for interface method calls
- Successfully adds `await` to `processor!.Process(input)` call

❌ **Still Needed**: Function async propagation
- The `processViaInterface` function needs to be marked as `async` because it contains `await`
- Currently generated as `export function processViaInterface(...)` 
- Should be `export async function processViaInterface(...): Promise<number>`

## Current Issues Found

✅ **Fixed**: Added interface method async detection in both:
- `expr-call-async.go`: Added await injection for interface method calls  
- `analysis.go`: Added interface method async detection in control flow analysis

❌ **Still Broken**: Multiple related issues:

1. **Interface generation**: `AsyncProcessor.Process()` shows `number` not `Promise<number>`
2. **Struct method generation**: `SimpleProcessor.Process()` not marked as `async` 
3. **Await injection**: Still not adding `await` to interface calls
4. **Function async**: `processViaInterface` not marked as `async`

## Root Cause Analysis

The analysis is not correctly determining that the interface method should be async. Looking at the generated TypeScript:

- Interface: `Process(data: number): number` (WRONG - should be Promise<number>)
- ChannelProcessor: `async Process(...): Promise<number>` (CORRECT)  
- SimpleProcessor: `Process(...): number` (WRONG - should be async Promise<number>)

This suggests the interface implementation tracking is not working correctly. 
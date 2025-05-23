# Generics Implementation Progress

## Current Task: generics_leading_int compliance test

### Current Test Output

**Expected (from Go):**
```
123 abc456 false
456 def123 false  
0 abc false
0  true
123  false
```

**Actual (from TS):**
```
0  true
0  true
0 abc false
0  true
0  true
```

### Issues Found in Generated TypeScript

Looking at the generated TypeScript file, I can see several issues:

#### 1. Type Issues
1. **Variable initialization**: `let rem: bytes = null as bytes` - TypeScript can't convert `null` to a union type
2. **Function call conversion**: `leadingInt($.stringToBytes("123abc456"))` should be `leadingInt("123abc456")` or handle the union properly
3. **Numeric constants**: Character literals like `'0'` and `'9'` are being converted to numbers `48` and `57` correctly
4. **Type assertion**: `leadingInt<string>("123")` syntax is correct

#### 2. Logic Issues  
1. **Overflow calculation**: `(1 << 63) / 10` and `(1 << 63)` - JavaScript numbers can't represent 64-bit integers properly
2. **Character arithmetic**: `(c as number) - 48` should work but may have casting issues
3. **Return type conversion**: The function returns bytes which need proper conversion for output

#### 3. Runtime Issues
The main problem seems to be that the overflow calculations are not working correctly because JavaScript numbers don't handle 64-bit integer arithmetic properly.

### Root Cause Analysis

1. **Integer overflow logic**: The test uses `1<<63` which in JavaScript becomes `Infinity` or gets truncated
2. **Type union handling**: The compiler generates correct union types but the initialization and handling is problematic
3. **String to bytes conversion**: The test calls `leadingInt($.stringToBytes("123abc456"))` when it should call `leadingInt("123abc456")`

### Implementation Strategy

#### Phase 1: Fix Integer Arithmetic
1. Change the overflow checks to use safe JavaScript number limits
2. Replace `1<<63` with `Number.MAX_SAFE_INTEGER` or appropriate values

#### Phase 2: Fix Type Handling  
1. Fix variable initialization for union types
2. Ensure proper conversion between string and []byte representations

#### Phase 3: Fix Function Call Generation
1. Don't convert string literals to bytes when calling generic functions with union constraints
2. Ensure the compiler correctly maps the Go calls to TypeScript calls

### Expected Correct TypeScript Output

The generated TypeScript should look something like:

```typescript
function leadingInt<bytes extends Uint8Array | string>(s: bytes): [number, bytes, boolean] {
	let x: number = 0
	let rem: bytes = null as any // or proper initialization
	let err: boolean = false
	// ... rest of function with corrected overflow logic
}

export function main(): void {
	let [x1, rem1, err1] = leadingInt("123abc456") // Don't convert to bytes
	console.log(x1, typeof rem1 === 'string' ? rem1 : $.bytesToString(rem1), err1)
	// ... rest with similar fixes
}
```

### Current Plan

1. First, examine how the compiler generates function calls for generic functions
2. Fix the overflow calculation constants to use JavaScript-safe values
3. Fix the type initialization issues  
4. Fix the output conversion for union types
5. Test iteratively until the compliance test passes
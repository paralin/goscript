# Coverage Analysis for GoScript

## Overview
This document analyzes the code coverage for the GoScript repository, focusing on the map-type-assert branch and type assertion functionality.

## Current Coverage State
- Compiler package: 77.1% of statements covered (improved from 76.7%)
- Most frequently used functions have good coverage
- Added comprehensive tests for map type assertions

## Type Assertion Coverage

### Map Type Assertions
The `typeAssert` function in builtin.ts handles map type assertions as follows:

1. Checks if the value is an object (not null)
2. For Map objects, uses `Array.from(value.entries())`
3. For regular objects, uses `Object.entries(value)`
4. Samples up to 5 entries to validate key and element types
5. Validates keys using `validateMapKey` function
6. Validates elements using `matchesType` function

**Implemented Improvements:**
- Extended the `validateMapKey` function to handle boolean keys
- Added tests for boolean map keys (`map_boolean_keys` test)
- Added tests for maps with more than 5 entries (`map_large` test)
- Added tests for nested maps (`map_nested` test)
- Removed debug console.log statements from `matchesType` function

### Struct Type Assertions
Struct type assertions have good coverage with existing tests, checking:
- Fields matching exactly
- Struct type validation

### Interface Type Assertions
Interface type assertions are well tested, including:
- Method presence validation
- Interface-to-interface assertions

## Test Coverage Details

### map_boolean_keys
Tests map type assertions with boolean keys:
- Creates a map with boolean keys and string values
- Performs correct type assertions (map[bool]string)
- Tests incorrect key type assertions (map[string]string)
- Tests incorrect value type assertions (map[bool]int)

### map_large
Tests maps with more than 5 entries to verify sampling logic:
- Creates a map with 8 string-to-int entries
- Verifies type assertion works correctly with large maps
- Tests incorrect value type assertions

### map_nested
Tests nested maps (maps as values in other maps):
- Creates a map of maps (map[string]map[string]int)
- Verifies nested map type assertions
- Tests incorrect inner key and value type assertions

## Future Improvements
- Add support for more key types (e.g., complex numbers, structs)
- Improve TypeScript type checking for nested maps
- Add more edge cases for map type assertions

# Type Assertion System Design

This document outlines the design decisions made in the type assertion system for GoScript, particularly focusing on the unification of `TypeInfo` and `TypeDescription` interfaces and the handling of ad-hoc type assertions.

## Overview

The GoScript type assertion system provides runtime type checking capabilities similar to Go's type assertions. It allows for both registered types (stored in the type registry) and ad-hoc type descriptions (created on-the-fly for type assertions).

## Type System Unification

### Previous Implementation

Previously, the system used two separate interfaces:

1. `TypeDescription`: A flexible interface used primarily as input to `typeAssert()`. It could be a string or a structured object, allowing for ad-hoc type definitions.

2. `TypeInfo`: A more strictly defined interface used for types registered in the type registry.

### Unified Implementation

The new implementation unifies these concepts:

1. `TypeInfo` is now the single source of truth for type representation.

2. The `BaseTypeInfo` interface has optional `name` and `zeroValue` properties. These are mandatory for registered types but optional for ad-hoc type assertions.

3. Type-specific interfaces (like `StructTypeInfo`, `MapTypeInfo`) have been updated to support recursive type properties that can accept either a string or another `TypeInfo` object.

4. Type guard functions (e.g., `isStructTypeInfo`, `isMapTypeInfo`) have been added to provide proper type narrowing in TypeScript.

## Optional Constructor for Struct Type Assertions

### Design Decision

The `constructor` property in `StructTypeInfo` has been made optional for ad-hoc type assertions:

```typescript
export interface StructTypeInfo extends BaseTypeInfo {
  kind: TypeKind.Struct;
  methods: Set<string>;
  constructor?: new (...args: any[]) => any;
  fields?: Set<string>; // Field names for struct types
}
```

### Rationale

1. **Dual Type Checking Strategy**: The type system uses two strategies for checking struct types:
   - First tries `instanceof` check with the constructor (for registered types)
   - Falls back to field-based matching (for ad-hoc type assertions)

2. **Ad-hoc Type Assertions**: For ad-hoc type assertions, the constructor is not necessary because:
   - The field-based matching is sufficient for validating the structure
   - Omitting the constructor simplifies the generated code
   - Using a single interface with optional properties is cleaner than having separate interfaces

3. **Backward Compatibility**: The `matchesStructType` function already checks if `info.constructor` exists before using it, so making it optional doesn't break existing code.

### Implementation Details

1. The `matchesStructType` function handles the case when constructor is not present:

```typescript
function matchesStructType(value: any, info: TypeInfo): boolean {
  if (!isStructTypeInfo(info)) return false;
  
  // For structs, use instanceof with the constructor (if available)
  if (info.constructor && value instanceof info.constructor) {
    return true
  }
  
  // Fall back to field-based matching
  if (info.fields && typeof value === 'object') {
    // ...field matching logic...
  }
  
  return false
}
```

2. The compiler no longer adds a constructor property for ad-hoc type assertions:

```go
// Add empty methods set to satisfy StructTypeInfo interface
c.tsw.WriteLiterally(", methods: new Set()")

// No constructor property is added for ad-hoc type assertions
```

## Type Guard Functions

Type guard functions have been added to provide proper type narrowing in TypeScript:

```typescript
export function isStructTypeInfo(info: TypeInfo): info is StructTypeInfo {
  return info.kind === TypeKind.Struct;
}

export function isMapTypeInfo(info: TypeInfo): info is MapTypeInfo {
  return info.kind === TypeKind.Map;
}

// ... other type guards
```

These functions:
1. Follow the TypeScript pattern for type predicates
2. Enable proper type narrowing in TypeScript code
3. Improve type safety throughout the codebase

## Struct Type Handling in Compiler

The compiler has been updated to properly handle struct types:

1. Added a case for `*types.Struct` in the `WriteGoType` method to generate TypeScript interfaces with all fields from the struct.

2. The generated interfaces include proper field types, making the type assertions more type-safe.

## Conclusion

These design decisions improve the type assertion system by:

1. Simplifying the type system through unification
2. Making ad-hoc type assertions more straightforward
3. Improving type safety with type guards
4. Enhancing the generated TypeScript code for struct types

The changes maintain backward compatibility while providing a more flexible and type-safe system for both registered types and ad-hoc type assertions.

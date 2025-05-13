# Type Assertion Enhancement Design

## Overview
This document describes the design for enhancing the GoScript type system to support more robust type assertions by including field information for structs and method signatures for interfaces.

## Current Implementation
Currently, the GoScript type system registers types for interfaces and structs, but it only includes:
- For structs: the name, kind, zero value, a set of method names, and constructor
- For interfaces: the name, kind, zero value (null), and a set of method names

Type assertions only check for the presence of fields (for structs) or methods (for interfaces) without validating their types or signatures.

## Proposed Enhancement
The enhanced type system will:
1. For structs: register field names along with their types
2. For interfaces: register method names along with their signatures

This will allow type assertions to validate not just the presence of fields/methods but also their types/signatures.

## Implementation Details

### TypeInfo and TypeDescription Interface Updates
The `TypeInfo` and `TypeDescription` interfaces in builtin.ts will be updated to include:
- For structs: a map of field names to their types
- For interfaces: a map of method names to their signatures

### registerType Function Updates
The `registerType` function will be updated to accept and store the additional type information.

### WriteStructTypeSpec and WriteInterfaceTypeSpec Updates
- `WriteStructTypeSpec` will be updated to extract field types and register them
- `WriteInterfaceTypeSpec` will be updated to extract method signatures and register them

### Type Assertion Logic Updates
The type assertion logic will be enhanced to check:
- For structs: field types in addition to field names
- For interfaces: method signatures in addition to method names

## Benefits
The enhanced type system will:
1. Provide more precise type assertions
2. Detect type compatibility issues at runtime
3. Improve debugging by providing more detailed error messages

## Migration
This change is backward compatible as it enhances existing functionality without breaking existing code.

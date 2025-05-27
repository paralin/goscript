# WIP: Package Import Sync/Atomic Test

## Issue Analysis

The `package_import_sync_atomic` compliance test is failing with a `ReferenceError: Cannot access 'noCopy' before initialization` error. This occurs because:

1. **Initialization Order Problem**: The generated TypeScript has the `noCopy` class defined at the bottom of the file (around line 640), but it's being referenced in constructors of classes defined earlier (like `Bool` at line 29).

2. **Underscore Field Issue**: The user specifically wants underscore fields like `_: $.varRef(init?._?.clone() ?? new noCopy())` to be eliminated from the generated TypeScript output entirely.

## Root Cause

Looking at the generated TypeScript file `@goscript/sync/atomic/type.gs.ts`, we can see:

```typescript
constructor(init?: Partial<{_?: noCopy, v?: number}>) {
    this._fields = {
        _: $.varRef(init?._?.clone() ?? new noCopy()),  // <-- Problem here
        v: $.varRef(init?.v ?? 0)
    }
}
```

The `noCopy` type is a Go convention used to prevent copying of certain types (like sync/atomic types), but in TypeScript it's not needed and causes initialization order issues.

## Solution

The fix should be in `compiler/spec-struct.go` where struct fields are processed. We need to:

1. **Filter out underscore fields in struct processing**: Skip fields named `_` when generating getters/setters, _fields property, constructor, and clone method.

2. **Add logic to skip underscore fields**: This should be done in multiple places:
   - Getter/setter generation
   - _fields property definition  
   - Constructor field initialization
   - Clone method field copying

## Implementation Plan

1. In `WriteStructTypeSpec()`, add checks to skip fields named `_` in:
   - The getter/setter generation loop
   - The _fields property definition loop
   - The constructor field initialization loop
   - The clone method field copying loop

2. The check should be: `if fieldKeyName == "_" { continue }`

This will eliminate underscore fields from the generated TypeScript while preserving all other functionality.

## Files to Modify

- `compiler/spec-struct.go`: Add underscore field filtering logic 
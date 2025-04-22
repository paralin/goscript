# Package Structure

This is the typical package structure of the output TypeScript import path:

```
@go/ # Typical Go workspace, all packages live here.
  runtime
```

# Go to TypeScript Compiler Design

## Naming Conventions

- **Exported Identifiers:** Go identifiers (functions, types, variables, struct fields, interface methods) that are exported (start with an uppercase letter) retain their original PascalCase naming in the generated TypeScript code. For example, `MyFunction` in Go becomes `export function MyFunction(...)` in TypeScript, and `MyStruct.MyField` becomes `MyStruct.MyField`.
- **Unexported Identifiers:** Go identifiers that are unexported (start with a lowercase letter) retain their original camelCase naming but are typically not directly accessible in the generated TypeScript unless they are part of an exported struct's definition (where they might become private fields).
- **Built-in Types:** Go built-in types are mapped to corresponding TypeScript types (e.g., `string` -> `string`, `int` -> `number`, `bool` -> `boolean`).
- **Keywords:** Go keywords are generally not an issue, but care must be taken if a Go identifier clashes with a TypeScript keyword.

## Type Mapping

- **Structs:** Converted to TypeScript `class`es. Exported fields become `public` members, unexported fields become `private` members. A `clone()` method is added to support Go's value semantics on assignment.
- **Pointers (`*T`):** Mapped to TypeScript union types (`T | null`).
- **Interfaces:** Mapped to TypeScript `interface` types. Methods retain their original Go casing.
- **Slices/Arrays:** Mapped to TypeScript arrays (`T[]`).
- **Maps:** Mapped to TypeScript `Map<K, V>` or plain objects `{ [key: K]: V }` depending on context (requires type info).
- **Functions:** Converted to TypeScript `function`s. Exported functions are prefixed with `export`.
- **Methods:** Functions with receivers are generated as methods within the corresponding TypeScript `class`. They retain their original Go casing.

## Value Semantics

Go's value semantics (where assigning a struct copies it) are emulated in TypeScript by:
1. Adding a `clone()` method to generated classes.
2. Automatically calling `.clone()` during assignment statements (`=`, `:=`) when the right-hand side is a variable holding a struct type (requires type information during compilation).

## Zero Values

Go's zero values are mapped as follows:
- `number`: `0`
- `string`: `""`
- `boolean`: `false`
- `struct`: `new TypeName()`
- `pointer`, `interface`, `slice`, `map`, `channel`, `function`: `null`

## Packages and Imports

- Go packages are mapped to TypeScript modules under the `@go/` scope (e.g., `import { MyType } from '@go/my/package';`).
- Standard Go library packages might require specific runtime implementations or shims.

## Code Generation Conventions

- **No Trailing Semicolons:** Generated TypeScript code omits semicolons at end of statements. Statements are line-separated without `;`.
- **Receiver Binding in Methods:** For each Go method with a receiver `r`, the generated TypeScript method body starts with `const r = this` to bind the receiver name to `this`.


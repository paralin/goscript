# WIP: Struct Embedding Enhancements

This document outlines the necessary changes to improve struct embedding in GoScript.

## Problem Areas and Proposed Solutions

The current implementation of struct embedding has a few issues that need to be addressed:

Note that Person is specifically a value type embedded struct `Person` and not a pointer `*Person`

1.  **Constructor Initialization for Embedded Structs:**
    *   **Current:** `Person: $.box(init?.Person ?? new Person())`
    *   **Problem:** This creates a new `Person` object without passing any initial values from the `init` object. If `init.Person` is provided, it's ignored for the nested fields.
    *   **Proposed:** `Person: $.box(new Person(init?.Person)),`
    *   **Reasoning:** This ensures that if initialization data for the embedded `Person` struct is provided, it's correctly passed to the `Person` constructor. A comma is also added for correct syntax.

2.  **Deep Copying in `clone()` Method:**
    *   **Current:** `Person: $.box(this._fields.Person.value),`
    *   **Problem:** This creates a shallow copy of the embedded `Person` object. In Go, embedding a struct means its fields are part of the outer struct, and cloning should result in a new, independent instance of the embedded struct as well (deep copy for non-pointer struct values).
    *   **Proposed:** `Person: $.box(this._fields.Person.value.clone()),`
    *   **Reasoning:** Calling `.clone()` on the embedded struct instance ensures that a deep copy is performed, maintaining Go's value semantics.

3.  **Access to Embedded Struct Instance and its Fields/Methods:**
    *   **Problem:** The generated TypeScript currently promotes the fields and methods of the embedded struct to the outer struct (e.g., `Employee` has `Name`, `Age`, `Greet` directly). However, direct access to the embedded struct instance itself (e.g., `employee.Person`) is also a common pattern and sometimes necessary. The example `return this.Person.Age` implies that `this.Person` should resolve to the `Person` instance.
    *   **Proposed:**
        *   Generate a getter for the embedded struct field:
            ```typescript
            public get Person(): Person {
                return this._fields.Person.value;
            }
            ```
        *   Generate a setter for the embedded struct field:
            ```typescript
            public set Person(value: Person) {
                this._fields.Person.value = value;
            }
            ```
    *   **Reasoning:** This provides explicit access to the embedded struct instance, allowing for more complex interactions if needed, while still retaining the convenience of promoted fields/methods. This makes the generated code more flexible and aligns better with how developers might expect to interact with embedded structs.

## Compiler Changes Required

To implement these solutions, the following areas in the compiler (`compiler/write-type-spec.go` and potentially `compiler/compiler.go`) will likely need modification:

1.  **`WriteStructType` (or related functions generating struct constructors):**
    *   Modify the logic for initializing embedded struct fields. When an embedded field is encountered, and it's a struct type, the initialization should be `new EmbeddedStructName(init?.EmbeddedStructName)`.
    *   Ensure commas are correctly placed after each field initialization.

2.  **`WriteStructType` (or related functions generating `clone` methods):**
    *   Modify the logic for cloning embedded struct fields. If the embedded field is a struct type (and not a pointer to a struct), its `clone()` method should be called: `this._fields.EmbeddedStructName.value.clone()`.

3.  **`WriteStructType` (or related functions generating struct field accessors):**
    *   In addition to promoting fields and methods from the embedded struct, generate explicit getter/setter pairs for the embedded struct field itself.
        *   The getter should return `this._fields.EmbeddedStructName.value`.
        *   The setter should assign `this._fields.EmbeddedStructName.value = value`.

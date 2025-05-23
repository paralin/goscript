# Variable References (VarRef) and Pointers Strategy for Translating Go Pointer Semantics to TypeScript

Note: This is a carefully hand-written document, do not edit!

## Purpose

The goal is to replicate Go's pointer mechanics in TypeScript, where:

- Taking the address of a variable (&var) creates a reference that can be used to access or modify the variable indirectly.
- Variables maintain a unique identity when their addresses are taken, allowing multiple pointers to reference and manipulate the same data.

Common misconception: all pointer variables like `*MyStruct` are variable references (varRef): this is incorrect, we only create variable references for variables that have had their address taken or may have their address taken.

For example:

```go
var myVar int = 10
myPtrVar := &myVar
```

This results in:

```typescript
let myVar: VarRef<number> = $.varRef(10)
let myPtrVar: VarRef<number> | null = myVar
```

The VarRef refers to the variable identity not to the pointer.

For example:

```
var myStruct = &MyStruct{}
myOtherStructPtr := myStruct
```

This results in:

```typescript
let myStruct: MyStruct | null = new MyStruct({})
let myOtherStructPtr: MyStruct | null = myStruct
```

We only create a variable reference for myStruct if we take the address of the variable:

```go
var myStruct = &MyStruct{}
myVarPtr := &myStruct
```

This results in:

```typescript
let myStruct: VarRef<MyStruct | null> = $.varRef(new MyStruct({}))
let myVarPtr: VarRef<MyStruct | null> | null = myStruct
```

This way, `*myVarPtr` becomes `myVarPtr.value`.

## Definitions

Below are the core types and functions used in this strategy:

### `VarRef<T>`

A type representing a variable reference of type T. It's a simple object with a single value property.

```typescript
type VarRef<T> = { value: T };
```

### `varRef<T>(value: T): VarRef<T>`

A function that creates a new variable reference containing the specified value.

```typescript
function varRef<T>(value: T): VarRef<T> {
    return { value };
}
```

### `unref<T>(varRef: VarRef<T>): T`

A function that retrieves the value from a variable reference, providing clarity and type safety over direct property access.

```typescript
function unref<T>(varRef: VarRef<T>): T {
    return varRef.value;
}
```
### `NeedsVarRef(obj types.Object) bool`

This function, located in `compiler/analysis.go`, determines if a Go variable needs to be represented as a `$.VarRef` in TypeScript. A variable `NeedsVarRef` if its address is taken (`&var`) and that address is used or assigned.

### `NeedsVarRefAccess(obj types.Object) bool`

This function, located in `compiler/analysis.go`, determines if accessing the value of a variable in TypeScript requires using the `.value` property. This is true if:

1. The corresponding Go variable `NeedsVarRef` (its address is taken). In this case, the TypeScript variable holds the variable reference itself.
2. The corresponding Go variable is a pointer type (`*T`) and is assigned a value that originates from a variable that `NeedsVarRef`. In this case, the TypeScript variable holds a reference to a variable reference.

This distinction is important because a Go pointer variable (`*T`) does not `NeedsVarRef` itself unless its address is taken, but the TypeScript variable representing it might hold a `$.VarRef` if it points to a variable-referenced value. `NeedsVarRefAccess` captures this requirement for `.value` access.

### Pointer Types

In Go, a pointer *T can be nil.

When taking a pointer of a variable, for example:

```go
var myInt int
var myIntPtr *int = &myInt
```

We create a variable reference for myInt to get a pointer to the variable (as per ahead-of-time analysis):

```typescript
var myInt: VarRef<number> = varRef(0)
var myIntPtr: VarRef<number> | null = myInt
```

Note that since we have not taken the address of myIntPtr, it is not a variable reference.

If we were to take the address of myIntPtr the generation would be different:

```go
var myInt int
var myIntPtr *int = &myInt
var myIntPtrPtr **int = &myIntPtr
```

In this case we must create a variable reference for myIntPtr as well:

```typescript
var myInt: VarRef<number> = varRef(0)
var myIntPtr: VarRef<VarRef<number> | null> = varRef(myInt)
var myIntPtrPtr: VarRef<VarRef<number> | null> | null = px
```

The logic for deciding if a variable has a variable reference or not is based on ahead-of-time analysis: 
We create a variable reference for a variable iif we take the address of the variable with `&myVar`.
Otherwise variables are not variable references.

### Dereferencing Pointers

When dereferencing a pointer in Go using the `*` operator, the translation to TypeScript depends on the variable reference status and whether it's a pointer to a struct or a primitive type:

```go
var x int = 5
var px *int = &x
var ppx **int = &px
fmt.Println(*px)    // prints 5
fmt.Println(**ppx)  // also prints 5
*px = 10            // sets x to 10
**ppx = 20          // also sets x to 20
```

In TypeScript, this becomes:

```typescript
let x: VarRef<number> = varRef(5);          // x has a variable reference because we take its address
let px: VarRef<VarRef<number> | null> = varRef(x); // px has a variable reference because we take its address
let ppx: VarRef<VarRef<number> | null> | null = px; // ppx is not a variable reference, it's just a reference

console.log(px.value!.value);    // prints 5 - one .value for px, another for dereferencing
console.log(ppx!.value!.value);  // prints 5 - we access ppx, then get px's varRef, then x's value

px.value!.value = 10;            // sets x to 10
ppx!.value!.value = 20;          // also sets x to 20
```

The key rules for dereferencing:

1. When dereferencing a pointer to a non-struct value (like `*int`), always use `!.value` to access the actual value:
   - The `!` asserts that the pointer is not null
   - The `.value` dereferences the pointer to access the actual value
   - This applies regardless of whether the pointer variable itself has a variable reference

2. When dereferencing a pointer to a struct, the approach is different because structs handle their own variable references:
   ```go
   myStruct := &MyStruct{Field: 5}
   myStruct.Field = 10  // no explicit dereference needed in Go
   ```
   
   In TypeScript:
   ```typescript
   let myStruct: MyStruct | null = new MyStruct({Field: 5});
   myStruct!.Field = 10;  // Just need to assert non-null
   ```

## Translation Rules

### Analysis Phase

- Identify variables whose addresses are taken with &. These must be variable references.
- Pointer variables (e.g., var p *int) remain non-variable references unless their addresses are taken (e.g., &p).

### Compilation Phase

#### Variable Declaration and Initialization

- **Non-Variable Reference Variables**: Variables are not variable references unless analysis indicates their address is taken.

```typescript
// Go: var x int = 5
var x: number = 5;
// Go: var y *MyStruct = &MyStruct{Foo: true}
var y: MyStruct | null = new MyStruct({Foo: true})
```

Note that *MyStruct is represented as just class MyStruct as internally in JavaScript class variables are pointers and we can compare them with `===` and represent nil with `null`.

- **Variable References**: Variables whose addresses are taken are initialized as variable references.

```typescript
// Go: var y int = 10
var y: VarRef<number> = varRef(10);
// Go: var z *int = &y
var z: VarRef<number> | null = y;
```

Example of two-levels of pointers and dereferencing:

```typescript
// Go: var y int = 10
// y is referenced with &y below, so it is variable reference.
var y: VarRef<number> = varRef(10);
// Go: var z *int = &y
// z is referenced with &z below, so it is variable reference.
var z: VarRef<typeof y | null> = varRef(y);
// Go: var m **int = &z
// m is not referenced with & anywhere, so it is not variable reference.
var m: typeof z | null = z;

// Dereferencing

```

#### Pointer Assignment

Go pointer assignments are translated to TypeScript using the variable reference mechanism:

- **Pointer-to-pointer assignment**: When assigning one pointer to another, we're copying the reference to the variable reference.

```typescript
// Go: var x int = 10
var x: VarRef<number> = varRef(10)
// Go: var p1 *int = &x
// Go: var p2 *int = p1
var p1: VarRef<number> | null = x;
var p2: VarRef<number> | null = p1;
// Both point to the same variable reference
```

- **Dereferencing and assignment**: When assigning through a dereferenced pointer, we modify the variable reference.

```typescript
// Go: var x int = 10
// Go: var p *int = &x
// Go: *p = 20
var x: VarRef<number> = varRef(10);
var p: VarRef<number> | null = x;
p!.value = 20; // assert non-null during assignment
```

- **Assigning address to pointer**:
    - If the pointer variable `p` is *not* variable reference:
      ```typescript
      // Go: var x, y int = 10, 20 // x, y will be variable references
      // Go: var p *int = &x       // p is not variable reference
      // Go: p = &y
      let x: VarRef<number> = varRef(10);
      let y: VarRef<number> = varRef(20);
      let p: VarRef<number> | null = x; // p holds reference to x's variable reference
      p = y;                          // p now holds reference to y's variable reference
      ```
    - If the pointer variable `p1` *is itself* variable reference (because `&p1` was taken):
      ```go
      // Go (from compliance/tests/varRef/varRef.go)
      // var x int = 10 // (defined earlier, x is VarRef<number>)
      // var p1 *int = &x // (p1 is VarRef<VarRef<number>|null> because &p1 is taken later)
      var y int = 15   // y is VarRef<number>
      p1 = &y          // Assign address of y to p1
      ```
      ```typescript
      // TypeScript
      // let x: VarRef<number> = varRef(10);
      // let p1: VarRef<VarRef<number> | null> = varRef(x);
      let y: VarRef<number> = varRef(15);
      p1.value = y; // Update the inner value of p1's variable reference to point to y's variable reference
      ```

## Cavets and Edge Cases

### Unhandled Cases

These currently should be handled + documented here but are not:

- if a variable is an exported global variable or const it should be variable reference
   - we don't know how that variable will be used in future by callers ahead of time

### Struct Pointer Variable Reference Logic

A critical distinction exists between these two cases:

1. **Pointer to variable referenced struct variable**:
   ```go
   val := MyStruct{...}  // val needs to be variable reference
   ptrToVal := &val      // ptrToVal points to variable referenced val
   ```
   Which generates:
   ```typescript
   let val: VarRef<MyStruct> = varRef(new MyStruct({...}))
   let ptrToVal = val
   // Access should be: ptrToVal.value.MyInt
   ```

2. **Struct pointer from composite literal**:
   ```go
   ptr := &MyStruct{...}  // ptr is a direct pointer to a struct
   ```
   Which generates:
   ```typescript
   let ptr = new MyStruct({...})
   // Access should be: ptr.MyInt
   ```

The crucial difference is:
- In case 1, `ptrToVal` points to a variable referenced struct variable, requiring `.value` to access the actual struct.
- In case 2, `ptr` directly holds a struct reference, not requiring `.value`.

The analysis tracks this distinction through the variable's assignment sources and usage patterns.
When a pointer variable points to a variable referenced struct variable (a variable whose address is taken elsewhere),
we need an additional `.value` dereference to access the contained struct value.

### Pointer Dereferencing Edge Cases

Dereferencing pointers correctly in TypeScript requires differentiating between several scenarios:

1. **Dereferencing non-variable reference pointer to primitive**:
   ```go
   q1 := &x  // q1 is not variable reference, x is variable reference
   *q1       // Dereference
   ```
   TypeScript: `q1!.value` (single .value needed)

2. **Dereferencing variable reference pointer to primitive**:
   ```go
   p1 := &x  // p1 is variable reference (its address is taken)
   *p1       // Dereference
   ```
   TypeScript: `p1.value!.value` (two .value needed - one for p1 variable reference, one for dereferencing)

3. **Dereferencing multi-level pointers**:
   ```go
   p2 := &p1  // p2 points to p1 (which is variable reference)
   **p2       // Double dereference
   ```
   TypeScript: `p2!.value!.value!.value` (three .value needed - first to access p1, others for dereference chain)

4. **Dereferencing pointers to structs**:
   ```go
   ps := &myStruct  // ps points to a struct
   *ps              // Dereference - rarely needed explicitly in Go
   ```
   TypeScript: `ps!` (no .value needed, structs are reference types)

5. **Field access through pointer**:
   ```go
   ps.field  // Field access through pointer (Go implicitly dereferences)
   ```
   TypeScript: 
   - If ps is non-variable reference: `ps.field`
   - If ps points to a variable referenced struct var: `ps.value.field`

These distinctions are essential for generating correct TypeScript code that correctly mimics Go's pointer semantics.

### Struct Variable Reference

It is possible to take the address of a struct field:

```go
type MyStruct struct {
    MyInt int
}

func main() {
    myStruct := &MyStruct{MyInt: 4}
    myInt := &myStruct.MyInt
    println(*myInt) // 4
    *myInt = 10
    println(myStruct.MyInt) // 10
}
```

To enable this we must create a variable reference for the struct field:

```typescript
class MyStruct {
    public MyInt: VarRef<number | null>
}
```

This makes working with the generated code clumsy:

```typescript
import { MyStruct } from '@goscript/mypkg'

let myStruct = new MyStruct()
myStruct.MyInt.value = 4
// we would prefer myStruct.MyInt = 4
```

However we may take the address of struct fields outside the package, and we can only see the contents of the package we are compiling, so we don't know which to create a variable reference for and which to not.

The solution is to create a variable reference for the fields but add getters and setters which unref transparently:

```typescript
class MyStruct {
    public get PointerField(): number | null {
		return this._fields.PointerField.value
	}

	public set PointerField(value: number | null) {
		this._fields.PointerField.value = value
	}

	public get InterfaceField(): MyInterface {
		return this._fields.InterfaceField.value
	}

	public set InterfaceField(value: MyInterface) {
		this._fields.InterfaceField.value = value
	}

	// _ fields contains the variable references for each field
	public _fields: {
		PointerField: VarRef<number | null>
		InterfaceField: VarRef<MyInterface>
	}

	constructor(init?: Partial<{InterfaceField?: MyInterface, PointerField?: number | null}>) {
		this._fields = {
			PointerField: varRef(init?.PointerField ?? null),
			InterfaceField: varRef(init?.InterfaceField ?? null),
		}
	}
}
```

If we are addressing a struct field, access the variable reference:

```go
fieldRef := &myStruct.MyInt
fieldVal := myStruct.MyInt
```

translates to:

```typescript
let fieldRef: VarRef<number | null> = myStruct._fields.MyInt
let fieldVal: number | null = myStruct.MyInt
```

Similar to the other logic, a `*int` translates to `number | null` if not a variable reference and `VarRef<number | null>` if it is a variable reference.

For unexported fields, they are treated as public fields in the generated TypeScript.

```go
type MyStruct struct {
	myUnexported *int
}

func main() {
    intValue := 10
	myStruct := &MyStruct{myUnexported: nil} // Initialize with nil or a value
	myStruct.myUnexported = &intValue // Assign a pointer to intValue
	if myStruct.myUnexported != nil {
		println(*myStruct.myUnexported) // Dereference and print
	}
}
```

translates to:

```typescript
import * as $ from "@goscript/builtin";

class MyStruct {
    // Unexported field becomes public
    public myUnexported: VarRef<number> | null;

    // Constructor to initialize fields, including unexported ones
    constructor(init?: Partial<{ myUnexported?: VarRef<number> | null }>) {
        this.myUnexported = init?.myUnexported ?? null;
    }
    // clone method would also handle this field
}

export function main(): void {
    let intValue: VarRef<number> = varRef(10); // intValue is variable reference as its address is taken
    let myStruct = new MyStruct({ myUnexported: null });
    myStruct.myUnexported = intValue; // Assign the variable reference
    if (myStruct.myUnexported !== null) {
        console.log(myStruct.myUnexported.value); // Access the value
    }
}
```
(Note: The exact variable reference for `myUnexported` in the class and constructor depends on the universal field variable reference strategy described next. The example above simplifies for clarity on public access.)

### Struct Field Variable Reference and Addressability

A core requirement is replicating Go's ability to take the address of any struct field (`&myStruct.MyField`), regardless of whether the field holds a value (`int`, `string`, nested `struct`) or a pointer (`*int`, `*MyOtherStruct`). Furthermore, fields that are pointers must correctly store and retrieve references (pointers) assigned to them. To achieve this while maintaining a usable TypeScript interface, GoScript employs **Universal Field Variable Reference with Type-Aware Accessors**.

**Strategy:**

1.  **Internal Variable Reference (`_fields`):** All struct fields are stored internally within a dedicated `_fields` property object. Each key in `_fields` corresponds to a Go field name, and its value is *always* a `$.VarRef`. The type *inside* this variable reference (`$.VarRef<InnerType>`) depends on whether the Go field is a value or a pointer.
2.  **Type-Aware Getters and Setters:** Corresponding TypeScript `get` and `set` accessors are generated for each Go field. Crucially, the type signature and behavior of these accessors differ based on the Go field type:

    *   **For Value-Type Fields (e.g., `int`, `string`, `MyValueStruct`):**
        *   The getter/setter signature matches the *direct TypeScript translation* of the Go value type (`number`, `string`, `MyValueStruct`).
        *   The `get` accessor retrieves the value *from* the internal variable reference (`this._fields.FieldName.value`).
        *   The `set` accessor updates the value *within* the internal variable reference (`this._fields.FieldName.value = newValue`).
        *   The internal variable reference type is `$.VarRef<ValueTS_T>`, where `ValueTS_T` is the TypeScript type for the Go value type.

    *   **For Pointer-Type Fields (e.g., `*int`, `*MyOtherStruct`):**
        *   The getter/setter signature matches the *TypeScript representation of the Go pointer type*. This is often `$.VarRef<T> | null` (if the pointed-to type `T` requires variable reference, like basic types or value structs) or `ClassName | null` (if the pointed-to type `T` is a reference type like another struct class). Let's call this `PointerTS_T`.
        *   The `get` accessor retrieves the *pointer reference* (`PointerTS_T`) *from* the internal variable reference (`this._fields.FieldName.value`).
        *   The `set` accessor updates the *pointer reference* (`PointerTS_T`) *within* the internal variable reference (`this._fields.FieldName.value = newPointerReference`).
        *   The internal variable reference type is `$.VarRef<PointerTS_T>`. It variable references the pointer representation itself.

3.  **Taking the Address (`&s.Field`):** When Go code takes the address of *any* field, the translation directly accesses the corresponding `$.VarRef` object within the `_fields` property (`myStruct._fields.FieldName`). This provides the required stable reference to the field's storage location.

4.  **Unexported Fields:** Follow the same pattern as exported fields. They are stored in `_fields` and accessed via public getters/setters.

**Example:**

```go
// Go code
package main

type Point struct{ X, Y int }

type Data struct {
	ID          int            // Value type
	Name        string         // Value type
	Config      *Point         // Pointer to struct
	CountPtr    *int           // Pointer to basic type
	unexpValue  float64        // Unexported value type
	unexpPtr    *string        // Unexported pointer type
}

func main() {
	// ... usage ...
	var count int = 10
	d := Data{ID: 1, Name: "Test"}
	d.CountPtr = &count // Assign address to pointer field

	addrID := &d.ID             // Address of value field
	addrCountPtr := &d.CountPtr // Address of pointer field

	// ... more usage ...
}

```

```typescript
// Generated TypeScript (Conceptual)
import * as $ from "@goscript/builtin";

// Assume Point class exists with constructor, _fields, clone, etc.
export class Point {
    public get X(): number { /*...*/ }
    public set X(v: number) { /*...*/ }
    public get Y(): number { /*...*/ }
    public set Y(v: number) { /*...*/ }
    public _fields: { X: VarRef<number>; Y: VarRef<number> };
    constructor(init?: Partial<{X?: number, Y?: number}>) { /*...*/ }
    public clone(): Point { /*...*/ }
}

export class Data {
    // -- Value-Type Fields --
    public get ID(): number { return this._fields.ID.value; }
    public set ID(value: number) { this._fields.ID.value = value; }

    public get Name(): string { return this._fields.Name.value; }
    public set Name(value: string) { this._fields.Name.value = value; }

    // -- Pointer-Type Fields --
    // *Point -> Point | null (TS pointer representation)
    public get Config(): Point | null { return this._fields.Config.value; }
    public set Config(value: Point | null) { this._fields.Config.value = value; }

    // *int -> VarRef<number> | null (TS pointer representation for variable referenced basic type)
    public get CountPtr(): VarRef<number> | null { return this._fields.CountPtr.value; }
    public set CountPtr(value: VarRef<number> | null) { this._fields.CountPtr.value = value; }

    // -- Unexported Fields --
    // float64 -> number
    public get unexpValue(): number { return this._fields.unexpValue.value; }
    public set unexpValue(value: number) { this._fields.unexpValue.value = value; }

    // *string -> VarRef<string> | null
    public get unexpPtr(): VarRef<string> | null { return this._fields.unexpPtr.value; }
    public set unexpPtr(value: VarRef<string> | null) { this._fields.unexpPtr.value = value; }


    // -- Internal Variable Reference Storage --
    public _fields: {
        ID:          VarRef<number>;                      // VarRef<ValueTS_T>
        Name:        VarRef<string>;                      // VarRef<ValueTS_T>
        Config:      VarRef<Point | null>;                // VarRef<PointerTS_T> where PointerTS_T = Point | null
        CountPtr:    VarRef<VarRef<number> | null>;       // VarRef<PointerTS_T> where PointerTS_T = VarRef<number> | null
        unexpValue:  VarRef<number>;                      // VarRef<ValueTS_T>
        unexpPtr:    VarRef<VarRef<string> | null>;       // VarRef<PointerTS_T>
    };

    constructor(init?: Partial<{
        ID?: number; Name?: string; Config?: Point | null; CountPtr?: VarRef<number> | null;
        unexpValue?: number; unexpPtr?: VarRef<string> | null;
    }>) {
        this._fields = {
            ID:         varRef(init?.ID ?? 0),
            Name:       varRef(init?.Name ?? ""),
            Config:     varRef(init?.Config ?? null),         // VarRef the pointer representation
            CountPtr:   varRef(init?.CountPtr ?? null),       // VarRef the pointer representation
            unexpValue: varRef(init?.unexpValue ?? 0),
            unexpPtr:   varRef(init?.unexpPtr ?? null),
        };
    }

    public clone(): Data {
        const cloned = new Data();
        // Create new outer variable references.
        // For value types, copy/clone the value into the new variable reference.
        cloned._fields.ID = varRef(this._fields.ID.value);
        cloned._fields.Name = varRef(this._fields.Name.value);
        cloned._fields.unexpValue = varRef(this._fields.unexpValue.value);
        // For pointer types, copy the *reference* (the pointer itself) into the new variable reference.
        cloned._fields.Config = varRef(this._fields.Config.value); // Copy the Point | null reference
        cloned._fields.CountPtr = varRef(this._fields.CountPtr.value); // Copy the VarRef<number> | null reference
        cloned._fields.unexpPtr = varRef(this._fields.unexpPtr.value); // Copy the VarRef<string> | null reference
        return cloned;
    }
    // ... other methods ...
}

// --- main function translation excerpt ---
export function main(): void {
    // var count int = 10 (Address taken, so variable reference)
    let count: VarRef<number> = varRef(10);

    // d := Data{ID: 1, Name: "Test"} (Constructor handles init)
    let d: Data = new Data({ ID: 1, Name: "Test" });

    // d.CountPtr = &count
    // Access triggers 'set CountPtr'. RHS '&count' is the 'count' variable reference.
    d.CountPtr = count;

    // addrID := &d.ID
    // Accesses the internal variable reference directly
    let addrID: VarRef<number> | null = d._fields.ID;

    // addrCountPtr := &d.CountPtr
    // Accesses the internal variable reference directly. The variable reference holds the pointer representation.
    let addrCountPtr: VarRef<VarRef<number> | null> | null = d._fields.CountPtr;

    // --- Example Usage of addrCountPtr ---
    // To get the VarRef<number> | null reference:
    let countPtrRef: VarRef<number> | null = addrCountPtr!.value;
    // To modify the original count via the field's address:
    if (countPtrRef !== null) {
         countPtrRef.value = 20; // Modifies the original 'count' variable reference
    }
    console.log(count.value); // Output: 20

    // --- Example Usage of addrID ---
    // To modify ID via its address:
    addrID!.value = 2;
    console.log(d.ID); // Output: 2 (accessed via getter)
}

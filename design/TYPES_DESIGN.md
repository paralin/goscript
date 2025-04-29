# Goscript Runtime Type System – V2

This document specifies the **second-generation runtime type system** that will
replace the current `TypeInfo`/`typeAssert` implementation found in
`builtin/builtin.ts`.  
The goal is to model Go types precisely enough that:

* Value–to–interface assertions fail **when any method signatures differ**.
* Pointer‐element, slice, map, channel and function types can participate in
  assertions or future reflection.
* The design is **extensible** so that a later phase can implement most of
  Go's `reflect` package without breaking changes.

Only the *design* is provided here – actual implementation changes to
`builtin/builtin.ts` will come in a follow-up task.



---

## 1  Core Principles
1. Every Go type is represented by an **object** implementing the
   `GoTypeInfo` base interface.
2. Types are **canonicalised** – "`[]int`" is represented by *exactly one*
   `SliceTypeInfo` instance whose `elem` is the canonical `int`.
3. Equality between types is therefore a **reference comparison**  
   (`===`) on their `GoTypeInfo` objects.
4. Interface *assignability* (`T implements I`) is evaluated at runtime by
   checking that every required method:
   * exists **and**  
   * its **parameter list** and **result list** each have the same arity and
     recursively equal parameter/result types (ignoring parameter names).
5. The API must remain **tree-shakable** – unused type kinds are not dragged
   into the bundle.



---

## 2  Type Kind Enumeration
```ts
export enum GoTypeKind {
  Basic,
  Pointer,
  Slice,
  Array,      // reserved – not required for assertions yet
  Map,
  Chan,
  Struct,
  Interface,
  Func,
}
```



---

## 3  Shared Helper Structures
```ts
// Name & type of one struct field.
export interface FieldInfo {
  name: string
  type: GoTypeInfo
  tag?: string               // raw struct tag
  exported: boolean
}

// Name & type of one formal parameter or result.
export interface VarInfo {
  type: GoTypeInfo
  // Parameter names are irrelevant for assignability => omitted
  isVariadic?: boolean       // only for the last parameter
}

// Complete method signature *without receiver*.
export interface MethodSig {
  name: string
  params: readonly VarInfo[]
  results: readonly VarInfo[]
}
```



---

## 4  GoTypeInfo Hierarchy

```ts
export interface GoTypeInfo {
  readonly kind: GoTypeKind
  readonly name?: string          // present for named types
  readonly zero: any              // canonical zero value
}

/* BASIC --------------------------------------------------------------- */
export interface BasicTypeInfo extends GoTypeInfo {
  readonly kind: GoTypeKind.Basic
  readonly builtinName: 'string' | 'int' | 'bool' | ... // exhaustive
}

/* POINTER ------------------------------------------------------------- */
export interface PointerTypeInfo extends GoTypeInfo {
  readonly kind: GoTypeKind.Pointer
  readonly elem: GoTypeInfo
}

/* SLICE ----------------------------------------------------------------*/
export interface SliceTypeInfo extends GoTypeInfo {
  readonly kind: GoTypeKind.Slice
  readonly elem: GoTypeInfo
}

/* MAP ------------------------------------------------------------------*/
export interface MapTypeInfo extends GoTypeInfo {
  readonly kind: GoTypeKind.Map
  readonly key: GoTypeInfo
  readonly value: GoTypeInfo
}

/* CHANNEL --------------------------------------------------------------*/
export interface ChanTypeInfo extends GoTypeInfo {
  readonly kind: GoTypeKind.Chan
  readonly elem: GoTypeInfo
  readonly dir: 'send' | 'recv' | 'both'
}

/* FUNCTION -------------------------------------------------------------*/
export interface FuncTypeInfo extends GoTypeInfo {
  readonly kind: GoTypeKind.Func
  readonly params: readonly VarInfo[]
  readonly results: readonly VarInfo[]
  readonly variadic: boolean         // convenience flag
}

/* STRUCT ---------------------------------------------------------------*/
export interface StructTypeInfo extends GoTypeInfo {
  readonly kind: GoTypeKind.Struct
  readonly fields: readonly FieldInfo[]
  readonly methods: readonly MethodSig[]   // value methods (pointer recv omitted)
  readonly ctor?: new (...a: any[]) => any
}

/* INTERFACE ------------------------------------------------------------*/
export interface InterfaceTypeInfo extends GoTypeInfo {
  readonly kind: GoTypeKind.Interface
  readonly methods: readonly MethodSig[]
}
```



---

## 5  Type Registry & Canonicalisation
```ts
// Global registry keyed by fully-qualified name OR synthetic signature.
const registry = new Map<string, GoTypeInfo>()

export function registerType(info: GoTypeInfo): GoTypeInfo {
  const key = computeKey(info)   // deterministic unique string
  if (!registry.has(key)) registry.set(key, info)
  return registry.get(key)!
}

export function getType(key: string): GoTypeInfo | undefined {
  return registry.get(key)
}
```

`computeKey` rules (summarised):
* Named types ⇒ their package-qualified name (`"mypkg.MyStruct"`).
* Un-named composite types ⇒ textual canonical form  
  e.g. `"[]int"`, `"map[string]bool"`, `"func(int,string) (error)"`.

A **future optimisation** may use numeric IDs assigned at build-time.



---

## 6  Runtime Assignability Checks

### 6.1  `isAssignable(value: any, target: GoTypeInfo): boolean`
1. Get **source type** with `typeofGo(value)` (to be implemented later).  
   Quick exit if identical reference.
2. If `target.kind === Interface`  
   call `implementsInterface(sourceType, target)`.
3. Else fail unless `sourceType === target`.  
   (For now we ignore type embedding / aliases.)

### 6.2  `implementsInterface(concrete: GoTypeInfo, iface: InterfaceTypeInfo)`
1. For each `req` in `iface.methods`
2. Find `cand` in `allMethodsOf(concrete)` with the same name.
3. Return *false* if not found or `!sigEqual(cand, req)`.

`sigEqual(a,b)` → compare paramCount, resultCount, variadic flag and recursively
equal parameter/result types.

`allMethodsOf` (for now) returns:
* `Struct.methods`
* For `Pointer`, dereference `elem`
* Any other concrete kinds ⇒ empty array

---

## 7  Zero Value Semantics
`zero` property on every `GoTypeInfo` is *eagerly* populated using helpers:
* Basic → `0`, `""`, `false`
* Pointer/Map/Slice/Chan/Interface/Func → `null`
* Struct → `new (ctor??)()` or object with field zeros when ctor is absent

Downstream helpers can clone the zero value when returning to callers.

---

## 8  Open Topics
* Array types (fixed length) – reserved but not yet compulsory.
* Export of reflection APIs (`Kind()`, `NumField()`, etc.).
* Garbage-friendly weak registries to prevent memory leaks in long runs.
* Package-path resolution for duplicate type names.

All of the above are out-of-scope for the initial compliance task but the data
structures are designed so they can be incorporated later without breaking
changes.

---

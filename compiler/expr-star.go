package compiler

import (
	"go/ast"
	"go/types"
)

// WriteStarExpr translates a Go pointer dereference expression (`ast.StarExpr`, e.g., `*p`)
// into its TypeScript equivalent. This involves careful handling of Go's pointers
// and TypeScript's varRefing mechanism for emulating pointer semantics.
//
// The translation depends on whether the pointer variable `p` itself is varrefed and
// what type of value it points to:
//  1. If `p` is not varrefed and points to a primitive or another pointer: `*p` -> `p!.value`.
//     (`p` holds a varRef, so dereference accesses its `value` field).
//  2. If `p` is not varrefed and points to a struct: `*p` -> `p!`.
//     (`p` holds the struct instance directly; structs are reference types in TS).
//  3. If `p` is variable referenced (i.e., `p` is `$.VarRef<PointerType>`) and points to a primitive/pointer:
//     `p.value!.value` (access the variable reference, then dereference the pointer)
//  4. If `p` is varrefed and points to a struct: `p.value!`.
//     (First `.value` unvarRefes `p` to get the struct instance).
//
// `WriteValueExpr(operand)` handles the initial unvarRefing of `p` if `p` itself is a varrefed variable.
// A non-null assertion `!` is always added as pointers can be nil.
// `c.analysis.NeedsVarRefAccess(ptrObj)` determines if the pointer variable itself requires `.value` access (case 3).
// `c.analysis.NeedsVarRefDeref(ptrType)` determines if an additional `.value` is needed for the dereferencing operation itself.
//
// Examples:
//   - Simple pointer to primitive: `p!.value` (where p is *int)
//   - Variable referenced pointer to primitive: `p.value!.value` (where p is VarRef<*int>)
//     Example: let p = $.varRef(x) (where x is another variable reference) => p.value!.value
//   - Pointer to struct: `p!` (where p is *MyStruct)
//     Example: let p = $.varRef(new MyStruct()) => p.value!
//   - Variable referenced pointer to struct: `p.value!` (where p is VarRef<*MyStruct>)
func (c *GoToTSCompiler) WriteStarExpr(exp *ast.StarExpr) error {
	// Generate code for a pointer dereference expression (*p).
	//
	// IMPORTANT: Pointer dereferencing in TypeScript requires careful handling of the varRef/unvarRef state:
	//
	// 1. p!.value - when p is not varrefed and points to a primitive/pointer
	//    Example: let p = x (where x is a varRef) => p!.value
	//
	// 2. p!       - when p is not varrefed and points to a struct
	//    Example: let p = new MyStruct() => p! (structs are reference types)
	//
	// 3. p.value!.value - when p is varrefed and points to a primitive/pointer
	//    Example: let p = $.varRef(x) (where x is another varRef) => p.value!.value
	//
	// 4. p.value! - when p is varrefed and points to a struct
	//    Example: let p = $.varRef(new MyStruct()) => p.value!
	//
	// Critical bug fix: We must handle each case correctly to avoid over-dereferencing
	// (adding too many .value) or under-dereferencing (missing .value where needed)
	//
	// NOTE: This logic aligns with design/VAR_REFS.md.

	// Write the operand (the pointer variable)
	if err := c.WriteValueExpr(exp.X); err != nil {
		return err
	}

	// Add non-null assertion for pointer safety
	c.tsw.WriteLiterally("!")

	// Get the object for the operand to check if it needs variable reference access
	var operandObj types.Object
	if ident, ok := exp.X.(*ast.Ident); ok {
		if use := c.pkg.TypesInfo.Uses[ident]; use != nil {
			operandObj = use
		} else if def := c.pkg.TypesInfo.Defs[ident]; def != nil {
			operandObj = def
		}
	}

	// Determine if we need .value for dereferencing
	// This depends on whether we're dereferencing to a primitive (needs .value)
	// or to a struct (no .value needed)
	if operandObj != nil && c.analysis.NeedsVarRefAccess(operandObj) {
		c.tsw.WriteLiterally(".value")
	}

	return nil
}

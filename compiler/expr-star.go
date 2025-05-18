package compiler

import (
	"fmt"
	"go/ast"
)

// WriteStarExpr translates a Go pointer dereference expression (`ast.StarExpr`, e.g., `*p`)
// into its TypeScript equivalent. This involves careful handling of Go's pointers
// and TypeScript's boxing mechanism for emulating pointer semantics.
//
// The translation depends on whether the pointer variable `p` itself is boxed and
// what type of value it points to:
//  1. If `p` is not boxed and points to a primitive or another pointer: `*p` -> `p!.value`.
//     (`p` holds a box, so dereference accesses its `value` field).
//  2. If `p` is not boxed and points to a struct: `*p` -> `p!`.
//     (`p` holds the struct instance directly; structs are reference types in TS).
//  3. If `p` is boxed (i.e., `p` is `$.Box<PointerType>`) and points to a primitive/pointer:
//     `*p` -> `p.value!.value`.
//     (First `.value` unboxes `p`, then `!.value` dereferences the inner pointer).
//  4. If `p` is boxed and points to a struct: `*p` -> `p.value!`.
//     (First `.value` unboxes `p` to get the struct instance).
//
// `WriteValueExpr(operand)` handles the initial unboxing of `p` if `p` itself is a boxed variable.
// A non-null assertion `!` is always added as pointers can be nil.
// `c.analysis.NeedsBoxedDeref(ptrType)` determines if an additional `.value` is needed
// based on whether the dereferenced type is a primitive/pointer (requires `.value`) or
// a struct (does not require `.value`).
func (c *GoToTSCompiler) WriteStarExpr(exp *ast.StarExpr) error {
	// Generate code for a pointer dereference expression (*p).
	//
	// IMPORTANT: Pointer dereferencing in TypeScript requires careful handling of the box/unbox state:
	//
	// 1. p!.value - when p is not boxed and points to a primitive/pointer
	//    Example: let p = x (where x is a box) => p!.value
	//
	// 2. p!       - when p is not boxed and points to a struct
	//    Example: let p = new MyStruct() => p! (structs are reference types)
	//
	// 3. p.value!.value - when p is boxed and points to a primitive/pointer
	//    Example: let p = $.box(x) (where x is another box) => p.value!.value
	//
	// 4. p.value! - when p is boxed and points to a struct
	//    Example: let p = $.box(new MyStruct()) => p.value!
	//
	// Critical bug fix: We must handle each case correctly to avoid over-dereferencing
	// (adding too many .value) or under-dereferencing (missing .value where needed)
	//
	// NOTE: This logic aligns with design/BOXES_POINTERS.md.

	// Get the operand expression and its type information
	operand := exp.X

	// Get the type of the operand (the pointer being dereferenced)
	ptrType := c.pkg.TypesInfo.TypeOf(operand)

	// Special case for handling multi-level dereferencing:
	// Check if the operand is itself a StarExpr (e.g., **p or ***p)
	// We need to handle these specially to correctly generate nested .value accesses
	if starExpr, isStarExpr := operand.(*ast.StarExpr); isStarExpr {
		// First, write the inner star expression
		if err := c.WriteStarExpr(starExpr); err != nil {
			return fmt.Errorf("failed to write inner star expression: %w", err)
		}

		// Always add .value for multi-level dereferences
		// For expressions like **p, each * adds a .value
		c.tsw.WriteLiterally("!.value")
		return nil
	}

	// Standard case: single-level dereference
	// Write the pointer expression, which will access .value if the variable is boxed
	// WriteValueExpr will add .value if the variable itself is boxed (p.value)
	if err := c.WriteValueExpr(operand); err != nil {
		return fmt.Errorf("failed to write star expression operand: %w", err)
	}

	// Add ! for null assertion - all pointers can be null in TypeScript
	c.tsw.WriteLiterally("!")

	// Add .value only if we need boxed dereferencing for this type of pointer
	// This depends on whether we're dereferencing to a primitive (needs .value)
	// or to a struct (no .value needed)
	if c.analysis.NeedsBoxedDeref(ptrType) {
		c.tsw.WriteLiterally(".value")
	}

	return nil
}

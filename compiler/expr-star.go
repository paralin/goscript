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
// The function determines if `.value` access is needed by checking what the Go pointer operand points to.
//
// For multi-level dereferences like `***p`, this function is called recursively, with each level
// adding the appropriate `!.value` suffix.
//
// Examples:
//   - Simple pointer to primitive: `p!.value` (where p is *int)
//   - Variable referenced pointer to primitive: `p.value!.value` (where p is VarRef<*int>)
//     Example: let p = $.varRef(x) (where x is another variable reference) => p.value!.value
//   - Pointer to struct: `p!` (where p is *MyStruct)
//     Example: let p = $.varRef(new MyStruct()) => p.value!
//   - Variable referenced pointer to struct: `p.value!` (where p is VarRef<*MyStruct>)
//   - Triple pointer: `p3!.value!.value!.value` (where p3 is VarRef<VarRef<VarRef<number> | null> | null> | null)
func (c *GoToTSCompiler) WriteStarExpr(exp *ast.StarExpr) error {
	// Check if the operand is an identifier that is varrefed
	isVarrefedIdent := false
	if ident, ok := exp.X.(*ast.Ident); ok {
		if obj := c.pkg.TypesInfo.ObjectOf(ident); obj != nil {
			isVarrefedIdent = c.analysis.NeedsVarRef(obj)
		}
	}

	// Write the operand
	if isVarrefedIdent {
		// For varrefed identifiers, we need to access the value first
		if err := c.WriteValueExpr(exp.X); err != nil {
			return err
		}
	} else {
		// For non-varrefed identifiers and other expressions
		switch operand := exp.X.(type) {
		case *ast.Ident:
			// Write identifier without .value access
			c.WriteIdent(operand, false)
		default:
			// For other expressions (like nested star expressions), use WriteValueExpr
			if err := c.WriteValueExpr(exp.X); err != nil {
				return err
			}
		}
	}

	// Add non-null assertion for pointer safety
	c.tsw.WriteLiterally("!")

	// Check what the operand points to (not what the result is)
	operandType := c.pkg.TypesInfo.TypeOf(exp.X)
	if ptrType, isPtr := operandType.(*types.Pointer); isPtr {
		elemType := ptrType.Elem()
		// Only add .value if NOT pointing to a struct
		if _, isStruct := elemType.Underlying().(*types.Struct); !isStruct {
			c.tsw.WriteLiterally(".value")
		}
		// If pointing to a struct, don't add .value (structs are reference types in TS)
	}

	return nil
}

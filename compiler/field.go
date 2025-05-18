package compiler

import "go/ast"

// WriteFieldList translates a Go field list (`ast.FieldList`), which can represent
// function parameters, function results, or struct fields, into its TypeScript equivalent.
//   - If `isArguments` is true (for function parameters/results):
//     It iterates through `a.List`, writing each field as `name: type`. Parameter
//     names and types are written using `WriteField` and `WriteGoType` respectively.
//     Multiple parameters are comma-separated.
//   - If `isArguments` is false (for struct fields):
//     It writes an opening brace `{`, indents, then writes each field definition
//     using `WriteField`, followed by a closing brace `}`. If the field list is
//     empty or nil, it simply writes `{}`.
//
// This function is a key part of generating TypeScript type signatures for functions
// and interfaces, as well as struct type definitions.
func (c *GoToTSCompiler) WriteFieldList(a *ast.FieldList, isArguments bool) {
	if !isArguments && (a == nil || a.NumFields() == 0) {
		c.tsw.WriteLiterally("{}")
		return
	}

	if !isArguments && a.Opening.IsValid() {
		c.tsw.WriteLine("{")
		c.tsw.Indent(1)
	}

	// Check if this is a variadic function parameter list
	isVariadic := false
	if isArguments && a != nil && len(a.List) > 0 {
		lastParam := a.List[len(a.List)-1]
		if _, ok := lastParam.Type.(*ast.Ellipsis); ok {
			isVariadic = true
		}
	}

	if isArguments && isVariadic {
		// Handle non-variadic parameters first
		for i, field := range a.List[:len(a.List)-1] {
			if i > 0 {
				c.tsw.WriteLiterally(", ")
			}

			// Handle multiple parameter names for the same type
			for j, name := range field.Names {
				if j > 0 {
					c.tsw.WriteLiterally(", ")
				}
				c.tsw.WriteLiterally(name.Name)
				c.tsw.WriteLiterally(": ")
				typ := c.pkg.TypesInfo.TypeOf(field.Type)
				c.WriteGoType(typ)
			}
		}

		// Handle the variadic parameter
		lastParam := a.List[len(a.List)-1]
		if len(a.List) > 1 {
			c.tsw.WriteLiterally(", ")
		}

		for i, name := range lastParam.Names {
			if i > 0 {
				c.tsw.WriteLiterally(", ")
			}
			c.tsw.WriteLiterally("...")
			c.tsw.WriteLiterally(name.Name)
		}

		c.tsw.WriteLiterally(": ")
		if ellipsis, ok := lastParam.Type.(*ast.Ellipsis); ok {
			c.WriteTypeExpr(ellipsis.Elt)
			c.tsw.WriteLiterally("[]")
		}
	} else {
		// Handle regular parameter list for function declarations
		for i, field := range a.List {
			if i > 0 && isArguments {
				c.tsw.WriteLiterally(", ")
			}

			if isArguments {
				// For function parameters with multiple names, write each with its type
				for j, name := range field.Names {
					if j > 0 {
						c.tsw.WriteLiterally(", ")
					}
					c.tsw.WriteLiterally(name.Name)
					c.tsw.WriteLiterally(": ")
					typ := c.pkg.TypesInfo.TypeOf(field.Type)
					c.WriteGoType(typ) // Use WriteGoType for parameter type
				}
			} else {
				// For struct fields and other non-argument fields
				c.WriteField(field, false)
			}
		}
	}

	if !isArguments && a.Closing.IsValid() {
		c.tsw.Indent(-1)
		c.tsw.WriteLine("}")
	}
}

// WriteField translates a single Go field (`ast.Field`) from a field list
// (e.g., in a struct type or function signature) into its TypeScript representation.
// - If `isArguments` is false (struct field):
//   - Documentation comments (`field.Doc`, `field.Comment`) are preserved.
//   - If the field is anonymous (embedded), it's skipped as promotions are handled
//     elsewhere (e.g., during struct class generation).
//   - For named fields, it writes `public fieldName: FieldType_ts`. The field name
//     retains its Go casing. The type is translated using `WriteGoType`.
//   - Go struct tags (`field.Tag`) are written as a trailing comment.
//
// - If `isArguments` is true (function parameter):
//   - It writes the parameter name (retaining Go casing). The type is handled
//     by the caller (`WriteFieldList`).
//
// This function is used by `WriteFieldList` to process individual items within
// parameter lists and struct field definitions.
func (c *GoToTSCompiler) WriteField(field *ast.Field, isArguments bool) {
	if !isArguments {
		if field.Doc != nil {
			c.WriteDoc(field.Doc)
		}
		if field.Comment != nil {
			c.WriteDoc(field.Comment)
		}
	}

	// Check if this is an embedded field (anonymous field)
	if len(field.Names) == 0 && !isArguments {
		// This is an embedded field, so we're adding promotions instead of declaring it directly
		return
	}

	for i, name := range field.Names {
		if i > 0 && isArguments {
			c.tsw.WriteLiterally(", ")
		}

		// argument names: keep original casing, no access modifier
		if isArguments {
			c.tsw.WriteLiterally(name.Name)
			// Argument type is handled in WriteFieldList, so continue
			continue
		} else {
			// All struct fields are public in TypeScript, keeping original Go casing
			c.tsw.WriteLiterally("public ")
			c.tsw.WriteLiterally(name.Name)
		}

		// write type for struct fields (not arguments)
		c.tsw.WriteLiterally(": ")
		typ := c.pkg.TypesInfo.TypeOf(field.Type)
		c.WriteGoType(typ) // Use WriteGoType for field type

		if !isArguments {
			// write tag comment if any for struct fields
			if field.Tag != nil {
				c.tsw.WriteCommentLinef("tag: %s", field.Tag.Value)
			} else {
				c.tsw.WriteLine("") // No semicolon
			}
		}
	}
}

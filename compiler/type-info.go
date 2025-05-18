package compiler

import "go/types"

// writeTypeInfoObject writes a TypeScript TypeInfo object literal for a given Go type.
func (c *GoToTSCompiler) writeTypeInfoObject(typ types.Type) {
	if typ == nil {
		c.tsw.WriteLiterally("{ kind: $.TypeKind.Basic, name: 'any' }") // Or handle as error
		return
	}

	// If typ is a *types.Named, handle it by reference to break recursion.
	if namedType, ok := typ.(*types.Named); ok {
		if namedType.Obj().Name() == "error" && namedType.Obj().Pkg() == nil { // Check for builtin error
			c.tsw.WriteLiterally("{ kind: $.TypeKind.Interface, name: 'GoError', methods: [{ name: 'Error', args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: 'string' } }] }] }")
		} else {
			// For all other named types, output their name as a string literal.
			// This relies on the type being registered elsewhere (e.g., via registerStructType or registerInterfaceType)
			// so the TypeScript runtime can resolve the reference.
			c.tsw.WriteLiterallyf("%q", namedType.Obj().Name())
		}
		return // Return after handling the named type by reference.
	}

	// If typ is not *types.Named, process its underlying structure.
	underlying := typ.Underlying()
	switch t := underlying.(type) {
	case *types.Basic:
		tsTypeName, _ := GoBuiltinToTypescript(t.Name())
		if tsTypeName == "" {
			tsTypeName = t.Name() // Fallback
		}
		c.tsw.WriteLiterallyf("{ kind: $.TypeKind.Basic, name: %q }", tsTypeName)
	// Note: The original 'case *types.Named:' here for 'underlying' is intentionally omitted.
	// If typ.Underlying() is *types.Named (e.g. type T1 MyInt; type T2 T1;),
	// then writeTypeInfoObject(typ.Underlying()) would be called in some contexts,
	// and that call would handle it via the top-level *types.Named check.
	case *types.Pointer:
		c.tsw.WriteLiterally("{ kind: $.TypeKind.Pointer, elemType: ")
		c.writeTypeInfoObject(t.Elem()) // Recursive call
		c.tsw.WriteLiterally(" }")
	case *types.Slice:
		c.tsw.WriteLiterally("{ kind: $.TypeKind.Slice, elemType: ")
		c.writeTypeInfoObject(t.Elem()) // Recursive call
		c.tsw.WriteLiterally(" }")
	case *types.Array:
		c.tsw.WriteLiterallyf("{ kind: $.TypeKind.Array, length: %d, elemType: ", t.Len())
		c.writeTypeInfoObject(t.Elem()) // Recursive call
		c.tsw.WriteLiterally(" }")
	case *types.Map:
		c.tsw.WriteLiterally("{ kind: $.TypeKind.Map, keyType: ")
		c.writeTypeInfoObject(t.Key()) // Recursive call
		c.tsw.WriteLiterally(", elemType: ")
		c.writeTypeInfoObject(t.Elem()) // Recursive call
		c.tsw.WriteLiterally(" }")
	case *types.Chan:
		dir := "both"
		if t.Dir() == types.SendOnly {
			dir = "send"
		} else if t.Dir() == types.RecvOnly {
			dir = "receive"
		}
		c.tsw.WriteLiterallyf("{ kind: $.TypeKind.Channel, direction: %q, elemType: ", dir)
		c.writeTypeInfoObject(t.Elem()) // Recursive call
		c.tsw.WriteLiterally(" }")
	case *types.Interface: // Anonymous interface or underlying of a non-named type alias
		c.tsw.WriteLiterally("{ kind: $.TypeKind.Interface, methods: [")
		var methods []*types.Func
		for i := 0; i < t.NumExplicitMethods(); i++ {
			methods = append(methods, t.ExplicitMethod(i))
		}
		// TODO: Handle embedded methods for anonymous interfaces if needed.
		c.writeMethodSignatures(methods) // Calls writeMethodSignatures -> writeTypeInfoObject
		c.tsw.WriteLiterally("] }")
	case *types.Signature: // Anonymous func type or underlying of a non-named type alias
		c.tsw.WriteLiterally("{ kind: $.TypeKind.Function, params: [")
		for i := 0; i < t.Params().Len(); i++ {
			if i > 0 {
				c.tsw.WriteLiterally(", ")
			}
			c.writeTypeInfoObject(t.Params().At(i).Type()) // Recursive call
		}
		c.tsw.WriteLiterally("], results: [")
		for i := 0; i < t.Results().Len(); i++ {
			if i > 0 {
				c.tsw.WriteLiterally(", ")
			}
			c.writeTypeInfoObject(t.Results().At(i).Type()) // Recursive call
		}
		c.tsw.WriteLiterally("] }")
	case *types.Struct: // Anonymous struct or underlying of a non-named type alias
		c.tsw.WriteLiterally("{ kind: $.TypeKind.Struct, fields: {")
		for i := 0; i < t.NumFields(); i++ {
			if i > 0 {
				c.tsw.WriteLiterally(", ")
			}
			field := t.Field(i)
			c.tsw.WriteLiterallyf("%q: ", field.Name())
			c.writeTypeInfoObject(field.Type()) // Recursive call
		}
		c.tsw.WriteLiterally("}, methods: [] }") // Anonymous structs don't have methods in this context
	default:
		// Fallback, e.g. for types whose underlying isn't one of the above like *types.Tuple or other complex cases.
		c.tsw.WriteLiterallyf("{ kind: $.TypeKind.Basic, name: %q }", typ.String()) // Fallback using the type's string representation
	}
}

// writeMethodSignatures writes an array of TypeScript MethodSignature objects.
func (c *GoToTSCompiler) writeMethodSignatures(methods []*types.Func) {
	firstMethod := true
	for _, method := range methods {
		if !firstMethod {
			c.tsw.WriteLiterally(", ")
		}
		firstMethod = false

		sig := method.Type().(*types.Signature)
		c.tsw.WriteLiterallyf("{ name: %q, args: [", method.Name())
		for i := 0; i < sig.Params().Len(); i++ {
			if i > 0 {
				c.tsw.WriteLiterally(", ")
			}
			param := sig.Params().At(i)
			c.tsw.WriteLiterallyf("{ name: %q, type: ", param.Name())
			c.writeTypeInfoObject(param.Type())
			c.tsw.WriteLiterally(" }")
		}
		c.tsw.WriteLiterally("], returns: [")
		for i := 0; i < sig.Results().Len(); i++ {
			if i > 0 {
				c.tsw.WriteLiterally(", ")
			}
			result := sig.Results().At(i)
			// Return parameters in Go often don't have names that are relevant for TS signature matching
			c.tsw.WriteLiterally("{ type: ")
			c.writeTypeInfoObject(result.Type())
			c.tsw.WriteLiterally(" }")
		}
		c.tsw.WriteLiterally("] }")
	}
}

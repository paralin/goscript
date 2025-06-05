package compiler

import (
	"go/ast"
	"go/types"
	"strings"
)

// writeAsyncCallIfNeeded writes the await prefix for async function or method calls
// Returns true if await was written, false otherwise
func (c *GoToTSCompiler) writeAsyncCallIfNeeded(exp *ast.CallExpr) bool {
	switch fun := exp.Fun.(type) {
	case *ast.Ident:
		// Function call (e.g., func())
		if obj := c.pkg.TypesInfo.Uses[fun]; obj != nil && c.analysis.IsAsyncFunc(obj) {
			c.tsw.WriteLiterally("await ")
			return true
		}
		return false

	case *ast.SelectorExpr:
		// Method call (e.g., obj.method())
		var ident *ast.Ident
		var identOk bool

		// Handle both direct identifiers and pointer dereferences
		switch x := fun.X.(type) {
		case *ast.Ident:
			ident, identOk = x, true
		case *ast.StarExpr:
			// Handle pointer dereference: (*p).method() or p.method() where p is a pointer
			if id, isIdent := x.X.(*ast.Ident); isIdent {
				ident, identOk = id, true
			}
		default:
			return false
		}

		if !identOk {
			return false
		}

		// Get the type of the receiver
		obj := c.pkg.TypesInfo.Uses[ident]
		if obj == nil {
			return false
		}

		varObj, ok := obj.(*types.Var)
		if !ok {
			return false
		}

		// Get the type name and package
		var namedType *types.Named
		var namedTypeOk bool

		// Handle both direct named types and pointer to named types
		switch t := varObj.Type().(type) {
		case *types.Named:
			namedType, namedTypeOk = t, true
		case *types.Pointer:
			if nt, isNamed := t.Elem().(*types.Named); isNamed {
				namedType, namedTypeOk = nt, true
			}
		}

		if !namedTypeOk {
			return false
		}

		typeName := namedType.Obj().Name()
		methodName := fun.Sel.Name

		// Check if the type is from an imported package
		typePkg := namedType.Obj().Pkg()
		if typePkg != nil && typePkg != c.pkg.Types {
			// Use the full package path from the type information (not just the package name)
			pkgPath := typePkg.Path()

			// Check if this method is async based on pre-computed metadata
			if c.analysis.IsMethodAsync(pkgPath, typeName, methodName) {
				c.tsw.WriteLiterally("await ")
				return true
			}
		} else {
			// For local types, use pre-computed analysis
			pkgPath := c.pkg.Types.Path()
			if c.analysis.IsLocalMethodAsync(pkgPath, typeName, methodName) {
				c.tsw.WriteLiterally("await ")
				return true
			}
		}
		return false

	default:
		return false
	}
}

// addNonNullAssertion adds ! for function calls that might return null
func (c *GoToTSCompiler) addNonNullAssertion(expFun ast.Expr) {
	if funType := c.pkg.TypesInfo.TypeOf(expFun); funType != nil {
		if _, ok := funType.Underlying().(*types.Signature); ok {
			// Check if this is a function parameter identifier that needs not-null assertion
			if ident, isIdent := expFun.(*ast.Ident); isIdent {
				// Check if this identifier is a function parameter
				if obj := c.pkg.TypesInfo.Uses[ident]; obj != nil {
					if _, isVar := obj.(*types.Var); isVar {
						// This is a variable (including function parameters)
						// Function parameters that are function types need ! assertion
						c.tsw.WriteLiterally("!")
					}
				}
			} else if _, isNamed := funType.(*types.Named); isNamed {
				c.tsw.WriteLiterally("!")
			}
		} else {
			// Check if the function type is nullable (e.g., func(...) | null)
			// This handles cases where a function call returns a nullable function
			funTypeStr := funType.String()
			if strings.Contains(funTypeStr, "| null") || strings.Contains(funTypeStr, "null |") {
				c.tsw.WriteLiterally("!")
			}
		}
	}
}

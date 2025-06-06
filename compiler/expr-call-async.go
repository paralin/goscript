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
		if obj := c.pkg.TypesInfo.Uses[fun]; obj != nil {
			if c.analysis.IsAsyncFunc(obj) {
				c.tsw.WriteLiterally("await ")
				return true
			}
		}
		return false

	case *ast.SelectorExpr:
		// Method call (e.g., obj.method() or obj.field.method())
		var obj types.Object
		var objOk bool

		// Handle different patterns of method receiver
		switch x := fun.X.(type) {
		case *ast.Ident:
			// Direct identifier: obj.method()
			obj = c.pkg.TypesInfo.Uses[x]
			objOk = obj != nil

		case *ast.StarExpr:
			// Pointer dereference: (*p).method() or p.method() where p is a pointer
			if id, isIdent := x.X.(*ast.Ident); isIdent {
				obj = c.pkg.TypesInfo.Uses[id]
				objOk = obj != nil
			}

		case *ast.SelectorExpr:
			// Field access: obj.field.method()
			// Get the type of the field access expression
			if fieldType := c.pkg.TypesInfo.TypeOf(x); fieldType != nil {
				// For field access, we create a synthetic object representing the field type
				// We'll handle this case below when we determine the method's type
				objOk = true
			}

		default:
			objOk = false
		}

		if !objOk {
			return false
		}

		// Handle package-level function calls (e.g., time.Sleep)
		if obj != nil {
			if pkgName, isPkg := obj.(*types.PkgName); isPkg {
				methodName := fun.Sel.Name
				pkgPath := pkgName.Imported().Path()

				// Check if this package-level function is async (empty TypeName)
				if c.analysis.IsMethodAsync(pkgPath, "", methodName) {
					c.tsw.WriteLiterally("await ")
					return true
				}
				return false
			}
		}

		// Get the type for method calls on objects
		var targetType types.Type

		if obj != nil {
			// Direct variable case: obj.method()
			if varObj, ok := obj.(*types.Var); ok {
				targetType = varObj.Type()
			} else {
				return false
			}
		} else {
			// Field access case: obj.field.method()
			// Get the type of the field access expression
			targetType = c.pkg.TypesInfo.TypeOf(fun.X)
			if targetType == nil {
				return false
			}
		}

		// Get the named type from the target type
		var namedType *types.Named
		var namedTypeOk bool

		// Handle both direct named types and pointer to named types
		switch t := targetType.(type) {
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

		// Determine the package path for the method
		var pkgPath string
		typePkg := namedType.Obj().Pkg()
		if typePkg != nil {
			pkgPath = typePkg.Path()
		} else {
			// Fallback to current package
			pkgPath = c.pkg.Types.Path()
		}

		// Check if this method is async using unified analysis
		if c.analysis.IsMethodAsync(pkgPath, typeName, methodName) {
			c.tsw.WriteLiterally("await ")
			return true
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

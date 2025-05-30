package compiler

import (
	"go/ast"
	"go/types"
	"strings"
)

// writeAsyncCall writes the await prefix for async function calls
func (c *GoToTSCompiler) writeAsyncCall(exp *ast.CallExpr, funIdent *ast.Ident) bool {
	if funIdent == nil {
		return false
	}

	// Check if this is an async function call
	if obj := c.pkg.TypesInfo.Uses[funIdent]; obj != nil && c.analysis.IsAsyncFunc(obj) {
		c.tsw.WriteLiterally("await ")
		return true
	}

	return false
}

// writeAsyncMethodCall writes the await prefix for async method calls
func (c *GoToTSCompiler) writeAsyncMethodCall(exp *ast.CallExpr) bool {
	selExpr, ok := exp.Fun.(*ast.SelectorExpr)
	if !ok {
		return false
	}

	// Check if this is a method call on a variable (e.g., mu.Lock())
	ident, ok := selExpr.X.(*ast.Ident)
	if !ok {
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
	namedType, ok := varObj.Type().(*types.Named)
	if !ok {
		return false
	}

	typeName := namedType.Obj().Name()
	methodName := selExpr.Sel.Name

	// Check if the type is from an imported package
	typePkg := namedType.Obj().Pkg()
	if typePkg == nil || typePkg == c.pkg.Types {
		return false
	}

	// Use the actual package name from the type information
	pkgName := typePkg.Name()

	// Check if this method is async based on metadata
	if c.analysis.IsMethodAsync(pkgName, typeName, methodName) {
		c.tsw.WriteLiterally("await ")
		return true
	}

	return false
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

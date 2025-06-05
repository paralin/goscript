package compiler

import (
	"go/ast"
	"go/token"
	"go/types"
	"strings"
)

// writeAsyncCallIfNeeded writes the await prefix for async function or method calls
// Returns true if await was written, false otherwise
func (c *GoToTSCompiler) writeAsyncCallIfNeeded(exp *ast.CallExpr) bool {
	// Track if we've already processed this call expression to avoid double await
	if c.awaitedCalls == nil {
		c.awaitedCalls = make(map[*ast.CallExpr]bool)
	}

	if c.awaitedCalls[exp] {
		return false // Already processed this call
	}
	switch fun := exp.Fun.(type) {
	case *ast.Ident:
		// Function call (e.g., func())
		if obj := c.pkg.TypesInfo.Uses[fun]; obj != nil && c.analysis.IsAsyncFunc(obj) {
			c.awaitedCalls[exp] = true
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

			// Check if this method is async based on metadata
			if c.analysis.IsMethodAsync(pkgPath, typeName, methodName) {
				c.awaitedCalls[exp] = true
				c.tsw.WriteLiterally("await ")
				return true
			}
		} else {
			// For local types, check if the method contains async operations at runtime
			// to avoid circular dependencies during analysis
			if c.isLocalMethodAsync(namedType, methodName) {
				c.awaitedCalls[exp] = true
				c.tsw.WriteLiterally("await ")
				return true
			}
		}
		return false

	default:
		return false
	}
}

// isLocalMethodAsync checks if a local method contains async operations by inspecting its body
func (c *GoToTSCompiler) isLocalMethodAsync(namedType *types.Named, methodName string) bool {
	// Find the method in the named type
	for i := 0; i < namedType.NumMethods(); i++ {
		method := namedType.Method(i)
		if method.Name() == methodName {
			// Find the method declaration in the AST
			methodDecl := c.findMethodDecl(namedType, methodName)
			if methodDecl != nil && methodDecl.Body != nil {
				// Check if the method body contains async operations
				return c.containsAsyncOperationsRuntime(methodDecl.Body)
			}
			break
		}
	}
	return false
}

// findMethodDecl finds the AST declaration for a method on a named type
func (c *GoToTSCompiler) findMethodDecl(namedType *types.Named, methodName string) *ast.FuncDecl {
	// Search through all files in the package for the method declaration
	for _, file := range c.pkg.Syntax {
		for _, decl := range file.Decls {
			if funcDecl, ok := decl.(*ast.FuncDecl); ok {
				// Check if this is a method with the right name
				if funcDecl.Name.Name == methodName && funcDecl.Recv != nil {
					// Check if the receiver type matches
					if c.isReceiverOfType(funcDecl, namedType) {
						return funcDecl
					}
				}
			}
		}
	}
	return nil
}

// isReceiverOfType checks if a function declaration is a method of the given named type
func (c *GoToTSCompiler) isReceiverOfType(funcDecl *ast.FuncDecl, namedType *types.Named) bool {
	if funcDecl.Recv == nil || len(funcDecl.Recv.List) == 0 {
		return false
	}

	recvField := funcDecl.Recv.List[0]
	if len(recvField.Names) == 0 {
		return false
	}

	recvIdent := recvField.Names[0]
	if obj := c.pkg.TypesInfo.Defs[recvIdent]; obj != nil {
		if varObj, ok := obj.(*types.Var); ok {
			// Handle both direct named types and pointer to named types
			var receiverNamedType *types.Named
			switch t := varObj.Type().(type) {
			case *types.Named:
				receiverNamedType = t
			case *types.Pointer:
				if nt, isNamed := t.Elem().(*types.Named); isNamed {
					receiverNamedType = nt
				}
			}

			if receiverNamedType != nil {
				// For generic types, compare the origin types and names
				// since instantiated generics have different type objects
				targetObj := namedType.Obj()
				receiverObj := receiverNamedType.Obj()

				// Compare by name and package path
				return targetObj.Name() == receiverObj.Name() &&
					targetObj.Pkg() == receiverObj.Pkg()
			}
		}
	}

	return false
}

// containsAsyncOperationsRuntime checks if a node contains async operations at runtime
func (c *GoToTSCompiler) containsAsyncOperationsRuntime(node ast.Node) bool {
	var hasAsync bool

	ast.Inspect(node, func(n ast.Node) bool {
		if n == nil {
			return false
		}

		switch s := n.(type) {
		case *ast.SendStmt:
			// Channel send operation (ch <- value)
			hasAsync = true
			return false

		case *ast.UnaryExpr:
			// Channel receive operation (<-ch)
			if s.Op == token.ARROW {
				hasAsync = true
				return false
			}

		case *ast.SelectStmt:
			// Select statement with channel operations
			hasAsync = true
			return false

		case *ast.CallExpr:
			// Check if we're calling a function known to be async
			if funcIdent, ok := s.Fun.(*ast.Ident); ok {
				// Get the object for this function call
				if obj := c.pkg.TypesInfo.Uses[funcIdent]; obj != nil && c.analysis.IsAsyncFunc(obj) {
					hasAsync = true
					return false
				}
			}

			// Check for method calls on imported types (similar to analysis.go logic)
			if selExpr, ok := s.Fun.(*ast.SelectorExpr); ok {
				if ident, ok := selExpr.X.(*ast.Ident); ok {
					if obj := c.pkg.TypesInfo.Uses[ident]; obj != nil {
						if varObj, ok := obj.(*types.Var); ok {
							var namedType *types.Named
							switch t := varObj.Type().(type) {
							case *types.Named:
								namedType = t
							case *types.Pointer:
								if nt, isNamed := t.Elem().(*types.Named); isNamed {
									namedType = nt
								}
							}

							if namedType != nil {
								typeName := namedType.Obj().Name()
								methodName := selExpr.Sel.Name

								// Check if the type is from an imported package
								if typePkg := namedType.Obj().Pkg(); typePkg != nil && typePkg != c.pkg.Types {
									pkgPath := typePkg.Path()
									if c.analysis.IsMethodAsync(pkgPath, typeName, methodName) {
										hasAsync = true
										return false
									}
								} else {
									// For local types, recursively check
									if c.isLocalMethodAsync(namedType, methodName) {
										hasAsync = true
										return false
									}
								}
							}
						}
					}
				}
			}
		}

		return true
	})

	return hasAsync
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

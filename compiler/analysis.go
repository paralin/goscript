package compiler

import (
	"go/ast"
	"go/token"
	"go/types"

	"golang.org/x/tools/go/packages"
)

// fileImport tracks an import in a file.
type fileImport struct {
	importPath string
	importVars map[string]struct{}
}

// AssignmentType indicates how a variable's value was assigned or used.
type AssignmentType int

const (
	// DirectAssignment represents a direct value copy (e.g., x = y)
	DirectAssignment AssignmentType = iota
	// AddressOfAssignment represents taking the address (e.g., p = &y)
	// or assigning to a dereferenced pointer (*p = y) - indicating the pointer p is used.
	AddressOfAssignment
)

// AssignmentInfo stores information about a single assignment source or destination.
type AssignmentInfo struct {
	Object types.Object   // The source or destination variable object
	Type   AssignmentType // The type of assignment involved
}

// VariableUsageInfo tracks how a variable is used throughout the code.
type VariableUsageInfo struct {
	// Sources lists variables whose values (or addresses) are assigned TO this variable.
	// Example: For `x = y`, y is a source for x. For `x = &y`, y is a source for x.
	Sources []AssignmentInfo
	// Destinations lists variables that are assigned the value (or address) FROM this variable.
	// Example: For `y = x`, y is a destination for x. For `p = &x`, p is a destination for x.
	Destinations []AssignmentInfo
}

// Analysis holds information gathered during the analysis phase of the Go code compilation.
// This data is used to make decisions about how to generate TypeScript code.
// Analysis is read-only after being built and should not be modified during code generation.
type Analysis struct {
	// VariableUsage tracks how variables are assigned and used, particularly for pointer analysis.
	// The key is the variable's types.Object.
	VariableUsage map[types.Object]*VariableUsageInfo

	// Imports stores the imports for the file
	Imports map[string]*fileImport

	// Cmap stores the comment map for the file
	Cmap ast.CommentMap

	// AsyncFuncs tracks which functions are async using the function's types.Object
	// as the key to avoid false-positive matches with functions having the same name
	AsyncFuncs map[types.Object]bool

	// NeedsDeferMap tracks nodes that need defer handling
	NeedsDeferMap map[ast.Node]bool

	// IsInAsyncFunctionMap tracks nodes that are inside async functions
	IsInAsyncFunctionMap map[ast.Node]bool

	// NamedReturnVars maps *ast.FuncDecl to a slice of named return variable names.
	NamedReturnVars map[*ast.FuncDecl][]string

	// FuncLitNamedReturnVars maps *ast.FuncLit to a slice of named return variable names.
	FuncLitNamedReturnVars map[*ast.FuncLit][]string

	// IsBareNamedReturn maps *ast.ReturnStmt to true if it's a bare return in a function with named returns.
	IsBareNamedReturn map[ast.Node]bool

	// ReturnStmtEnclosingFuncDecl maps *ast.ReturnStmt to its enclosing *ast.FuncDecl.
	ReturnStmtEnclosingFuncDecl map[*ast.ReturnStmt]*ast.FuncDecl

	// ReturnStmtEnclosingFuncLit maps *ast.ReturnStmt to its enclosing *ast.FuncLit.
	ReturnStmtEnclosingFuncLit map[*ast.ReturnStmt]*ast.FuncLit
}

// NewAnalysis creates a new Analysis instance.
func NewAnalysis() *Analysis {
	return &Analysis{
		VariableUsage:               make(map[types.Object]*VariableUsageInfo),
		Imports:                     make(map[string]*fileImport),
		AsyncFuncs:                  make(map[types.Object]bool),
		NeedsDeferMap:               make(map[ast.Node]bool),
		IsInAsyncFunctionMap:        make(map[ast.Node]bool),
		NamedReturnVars:             make(map[*ast.FuncDecl][]string),
		FuncLitNamedReturnVars:      make(map[*ast.FuncLit][]string),
		IsBareNamedReturn:           make(map[ast.Node]bool),
		ReturnStmtEnclosingFuncDecl: make(map[*ast.ReturnStmt]*ast.FuncDecl),
		ReturnStmtEnclosingFuncLit:  make(map[*ast.ReturnStmt]*ast.FuncLit),
	}
}

// NeedsDefer returns whether the given node needs defer handling.
func (a *Analysis) NeedsDefer(node ast.Node) bool {
	if node == nil {
		return false
	}
	return a.NeedsDeferMap[node]
}

// IsInAsyncFunction returns whether the given node is inside an async function.
func (a *Analysis) IsInAsyncFunction(node ast.Node) bool {
	if node == nil {
		return false
	}
	return a.IsInAsyncFunctionMap[node]
}

// IsAsyncFunc returns whether the given object represents an async function.
func (a *Analysis) IsAsyncFunc(obj types.Object) bool {
	if obj == nil {
		return false
	}
	return a.AsyncFuncs[obj]
}

// IsFuncLitAsync checks if a function literal is async based on our analysis.
func (a *Analysis) IsFuncLitAsync(funcLit *ast.FuncLit) bool {
	if funcLit == nil {
		return false
	}
	// Function literals are marked during analysis if they contain async operations
	return a.IsInAsyncFunctionMap[funcLit]
}

// NeedsBoxed returns whether the given object needs to be boxed.
// According to the new logic, a variable needs boxing if its address is taken
// and assigned to another variable (i.e., it appears as a destination with AddressOfAssignment).
func (a *Analysis) NeedsBoxed(obj types.Object) bool {
	if obj == nil {
		return false
	}
	usageInfo, exists := a.VariableUsage[obj]
	if !exists {
		return false
	}
	// Check if any destination assignment involves taking the address of 'obj'
	for _, destInfo := range usageInfo.Destinations {
		if destInfo.Type == AddressOfAssignment {
			return true
		}
	}
	return false
}

// NeedsBoxedAccess returns whether accessing the given object requires '.value' access in TypeScript.
// This function is critical for correctly handling pointer dereferencing by determining when
// a variable is boxed and needs .value to access its content.
//
// Two distinct cases determine when a variable needs .value access:
//
//  1. The variable itself is boxed (its address is taken)
//     Example: let x = $.box(10) => x.value
//
//  2. For pointer variables: it points to a boxed struct variable rather than a direct struct literal
//     Example: let ptrToVal = val (where val is boxed) => ptrToVal.value
//     vs.     let ptr = new MyStruct() => ptr (no .value needed)
//
// This distinction is crucial for avoiding over-dereferencing or under-dereferencing,
// which was the root cause of several bugs in our pointer handling.
func (a *Analysis) NeedsBoxedAccess(obj types.Object) bool {
	if obj == nil {
		return false
	}

	// First, check if the variable itself is boxed - this always requires .value
	// A variable is boxed if its address is taken elsewhere in the code
	if a.NeedsBoxed(obj) {
		return true
	}

	// Check if this is a pointer variable pointing to a boxed struct value
	objType := obj.Type()
	if ptrType, isPointer := objType.Underlying().(*types.Pointer); isPointer {
		// Check if it's a pointer to a struct
		if elemType := ptrType.Elem(); elemType != nil {
			if _, isStructType := elemType.Underlying().(*types.Struct); isStructType {
				// For struct pointers, check if it points to a boxed struct variable
				if usageInfo, exists := a.VariableUsage[obj]; exists {
					for _, src := range usageInfo.Sources {
						// Check if this pointer was assigned the address of another variable
						// (e.g., ptr = &someVar) rather than a direct literal (ptr = &Struct{})
						if src.Type == AddressOfAssignment && src.Object != nil {
							// Bug fix: If the source variable is boxed, the pointer needs .value to access it
							// This distinguishes between:
							// - ptrToVal := &val (val is boxed, so we need ptrToVal.value)
							// - ptr := &MyStruct{} (direct literal, no boxing needed)
							return a.NeedsBoxed(src.Object)
						}
					}
				}
			}
		}
	}

	return false
}

// NeedsBoxedDeref determines whether a pointer dereference operation (*ptr) needs
// the .value suffix in TypeScript when used in a direct dereference expression.
//
// Critical distinction (source of bugs):
//
//  1. For primitive types and pointers-to-primitive: Need .value
//     *p => p!.value
//     **p => p!.value!.value
//
//  2. For pointers to structs: No .value needed because structs are references
//     *p => p!
//     Where p is a pointer to a struct
//
// This distinction is essential because in TypeScript:
// - Primitives are stored inside $.Box with a .value property
// - Structs are reference types, so dereferencing just removes the null possibility
func (a *Analysis) NeedsBoxedDeref(ptrType types.Type) bool {
	// If we don't have a valid pointer type, default to true (safer)
	if ptrType == nil {
		return true
	}

	// Unwrap the pointer to get the element type
	ptrTypeUnwrapped, ok := ptrType.(*types.Pointer)
	if !ok {
		return true // Not a pointer type, default to true
	}

	// Get the underlying element type
	elemType := ptrTypeUnwrapped.Elem()
	if elemType == nil {
		return true
	}

	// Check if the element is another pointer - if so, we always need .value
	// This fixes the bug with multi-level pointer dereferencing like **p
	if _, isPointer := elemType.(*types.Pointer); isPointer {
		return true
	}

	// Check if the element is a struct (directly or via a named type)
	// Bug fix: Struct pointers in TS don't need .value when dereferenced
	// because structs are already references in JavaScript/TypeScript
	if _, isStruct := elemType.Underlying().(*types.Struct); isStruct {
		return false // Pointers to structs don't need .value suffix in direct dereference (*p)
	}

	// For all other cases (primitives, pointers-to-pointers, etc.) need .value
	// This ensures primitives and nested pointers are correctly dereferenced
	return true
}

// NeedsBoxedFieldAccess determines whether a pointer variable needs the .value
// suffix when accessing fields (e.g., ptr.field).
//
// Bug fix: This function was a major source of issues with struct field access.
// The critical discovery was that field access through a pointer depends not on the
// field itself, but on whether the pointer variable is boxed:
//
//  1. For normal struct pointers (unboxed): No .value needed
//     Example: let ptr = new MyStruct() => ptr.field
//     (Common case from &MyStruct{} literals)
//
//  2. For boxed struct pointers: Need .value to access the pointed-to struct
//     Example: let ptrToVal = val (where val is boxed) => ptrToVal.value.field
//
// We ultimately delegated this decision to WriteSelectorExpr which examines
// the actual variable to determine if it's boxed, rather than just the type.
func (a *Analysis) NeedsBoxedFieldAccess(ptrType types.Type) bool {
	// If we don't have a valid pointer type, default to false
	if ptrType == nil {
		return false
	}

	// Unwrap the pointer to get the element type
	ptrTypeUnwrapped, ok := ptrType.(*types.Pointer)
	if !ok {
		return false // Not a pointer type, no dereference needed for field access
	}

	// Check if the element is a struct (directly or via a named type)
	elemType := ptrTypeUnwrapped.Elem()
	if elemType == nil {
		return false // Not pointing to anything
	}

	// For pointers to structs, check if it's a struct type first
	_, isStruct := elemType.Underlying().(*types.Struct)
	if !isStruct {
		return false // Not a pointer to a struct
	}

	// The critical decision: We'll determine if .value is needed in the WriteSelectorExpr function
	// by checking if the pointer variable itself is boxed.
	// This allows us to handle both:
	// - ptr := &MyStruct{} (unboxed, direct access)
	// - ptrToVal := &val (boxed, needs .value)
	return false
}

// analysisVisitor implements ast.Visitor and is used to traverse the AST during analysis.
type analysisVisitor struct {
	// analysis stores information gathered during the traversal
	analysis *Analysis

	// pkg provides type information and other package details
	pkg *packages.Package

	// inAsyncFunction tracks if we're currently inside an async function
	inAsyncFunction bool

	// currentFuncName tracks the name of the function we're currently analyzing
	currentFuncName string

	// currentReceiver tracks the object of the receiver if inside a method
	currentReceiver *types.Var

	// currentFuncObj tracks the object of the function declaration we're currently analyzing
	currentFuncObj types.Object

	// currentFuncDecl tracks the *ast.FuncDecl of the function we're currently analyzing.
	currentFuncDecl *ast.FuncDecl

	// currentFuncLit tracks the *ast.FuncLit of the function literal we're currently analyzing.
	currentFuncLit *ast.FuncLit
}

// getOrCreateUsageInfo retrieves or creates the VariableUsageInfo for a given object.
func (v *analysisVisitor) getOrCreateUsageInfo(obj types.Object) *VariableUsageInfo {
	if obj == nil {
		return nil // Should not happen with valid objects
	}
	info, exists := v.analysis.VariableUsage[obj]
	if !exists {
		info = &VariableUsageInfo{}
		v.analysis.VariableUsage[obj] = info
	}
	return info
}

// Visit implements the ast.Visitor interface.
// It analyzes each node in the AST to gather information needed for code generation.
func (v *analysisVisitor) Visit(node ast.Node) ast.Visitor {
	if node == nil {
		return nil
	}

	// Store async state for the current node
	v.analysis.IsInAsyncFunctionMap[node] = v.inAsyncFunction

	switch n := node.(type) {
	case *ast.GenDecl:
		// Handle general declarations (var, const, type, import)
		if n.Tok == token.VAR {
			for _, spec := range n.Specs {
				if valueSpec, ok := spec.(*ast.ValueSpec); ok {
					// Process each declared variable (LHS)
					for i, lhsIdent := range valueSpec.Names {
						if lhsIdent.Name == "_" {
							continue
						}
						lhsObj := v.pkg.TypesInfo.ObjectOf(lhsIdent)
						if lhsObj == nil {
							continue
						}
						// Ensure usage info exists for LHS
						lhsUsageInfo := v.getOrCreateUsageInfo(lhsObj)

						// Check if there's a corresponding initial value (RHS)
						if valueSpec.Values != nil && i < len(valueSpec.Values) {
							rhsExpr := valueSpec.Values[i]

							// --- Analyze RHS and Update Usage Info (similar to AssignStmt) ---
							assignmentType := DirectAssignment
							var sourceObj types.Object

							if unaryExpr, ok := rhsExpr.(*ast.UnaryExpr); ok && unaryExpr.Op == token.AND {
								// Case: var lhs = &rhs_ident
								assignmentType = AddressOfAssignment
								if rhsIdent, ok := unaryExpr.X.(*ast.Ident); ok {
									sourceObj = v.pkg.TypesInfo.ObjectOf(rhsIdent)
								}
							} else if rhsIdent, ok := rhsExpr.(*ast.Ident); ok {
								// Case: var lhs = rhs_ident
								assignmentType = DirectAssignment
								sourceObj = v.pkg.TypesInfo.ObjectOf(rhsIdent)
							}

							// --- Record Usage ---
							if sourceObj != nil {
								// Record source for LHS
								lhsUsageInfo.Sources = append(lhsUsageInfo.Sources, AssignmentInfo{
									Object: sourceObj,
									Type:   assignmentType,
								})

								// Record destination for RHS source
								sourceUsageInfo := v.getOrCreateUsageInfo(sourceObj)
								sourceUsageInfo.Destinations = append(sourceUsageInfo.Destinations, AssignmentInfo{
									Object: lhsObj,
									Type:   assignmentType,
								})
							}
							// Note: We might need to handle var lhs = &T{} cases later if necessary.
						}
					}
				}
			}
		}
		// Continue traversal AFTER processing the declaration itself
		// to handle expressions within initial values if needed.
		// However, the core usage tracking is done above.
		// Let standard traversal handle children.
		return v

	case *ast.FuncDecl:
		// Save original states to restore after visiting
		originalInAsync := v.inAsyncFunction
		originalFuncObj := v.currentFuncObj
		originalFuncDecl := v.currentFuncDecl
		originalFuncLit := v.currentFuncLit
		originalReceiver := v.currentReceiver

		// Reset for current function
		v.currentFuncName = n.Name.Name
		v.currentFuncDecl = n
		v.currentFuncLit = nil
		v.currentReceiver = nil

		// Determine if this function declaration is async based on its body
		isAsync := false
		if n.Body != nil {
			containsAsyncOps := v.containsAsyncOperations(n.Body)
			if containsAsyncOps {
				// Get the object for this function declaration
				if obj := v.pkg.TypesInfo.ObjectOf(n.Name); obj != nil {
					v.analysis.AsyncFuncs[obj] = true
				}
				isAsync = true
			}
		}
		v.analysis.IsInAsyncFunctionMap[n] = isAsync

		// Set current receiver if this is a method
		if n.Recv != nil && len(n.Recv.List) > 0 {
			// Assuming a single receiver for simplicity for now
			if len(n.Recv.List[0].Names) > 0 {
				if ident := n.Recv.List[0].Names[0]; ident != nil && ident.Name != "_" {
					if def := v.pkg.TypesInfo.Defs[ident]; def != nil {
						if vr, ok := def.(*types.Var); ok {
							v.currentReceiver = vr
							// Add the receiver variable to the VariableUsage map
							// to ensure it is properly analyzed for boxing
							v.getOrCreateUsageInfo(v.currentReceiver)
						}
					}
				}
			}
		}

		// Store named return variables
		if n.Type != nil && n.Type.Results != nil {
			var namedReturns []string
			for _, field := range n.Type.Results.List {
				for _, name := range field.Names {
					namedReturns = append(namedReturns, name.Name)
				}
			}
			if len(namedReturns) > 0 {
				v.analysis.NamedReturnVars[n] = namedReturns
			}
		}

		// Update visitor state for this function
		v.inAsyncFunction = isAsync
		v.currentFuncObj = v.pkg.TypesInfo.ObjectOf(n.Name)
		v.analysis.IsInAsyncFunctionMap[n] = isAsync // Ensure FuncDecl node itself is marked

		if n.Body != nil {
			// Check if the body contains any defer statements
			if v.containsDefer(n.Body) {
				v.analysis.NeedsDeferMap[n.Body] = true
			}

			// Visit the body with updated state
			ast.Walk(v, n.Body)
		}

		// Restore states after visiting
		defer func() {
			v.currentFuncName = ""
			v.inAsyncFunction = originalInAsync
			v.currentReceiver = originalReceiver
			v.currentFuncObj = originalFuncObj
			v.currentFuncDecl = originalFuncDecl
			v.currentFuncLit = originalFuncLit
		}()
		return nil // Stop traversal here, ast.Walk handled the body

	case *ast.FuncLit:
		// Save original inAsyncFunction state to restore after visiting
		originalInAsync := v.inAsyncFunction
		originalFuncDecl := v.currentFuncDecl
		originalFuncLit := v.currentFuncLit

		// Set current function literal
		v.currentFuncDecl = nil
		v.currentFuncLit = n

		// Determine if this function literal is async based on its body
		isAsync := v.containsAsyncOperations(n.Body)
		v.analysis.IsInAsyncFunctionMap[n] = isAsync

		// Store named return variables for function literal
		if n.Type != nil && n.Type.Results != nil {
			var namedReturns []string
			for _, field := range n.Type.Results.List {
				for _, name := range field.Names {
					namedReturns = append(namedReturns, name.Name)
				}
			}
			if len(namedReturns) > 0 {
				v.analysis.FuncLitNamedReturnVars[n] = namedReturns
			}
		}

		v.inAsyncFunction = isAsync

		// Check if the body contains any defer statements
		if n.Body != nil && v.containsDefer(n.Body) {
			v.analysis.NeedsDeferMap[n.Body] = true
		}

		// Visit the body with updated state
		ast.Walk(v, n.Body)

		// Restore inAsyncFunction state after visiting
		v.inAsyncFunction = originalInAsync
		v.currentFuncDecl = originalFuncDecl
		v.currentFuncLit = originalFuncLit
		return nil // Stop traversal here, ast.Walk handled the body

	case *ast.BlockStmt:
		if n == nil || len(n.List) == 0 {
			break
		}

		// Check for defer statements in this block
		if v.containsDefer(n) {
			v.analysis.NeedsDeferMap[n] = true
		}

		// Store async state for this block
		v.analysis.IsInAsyncFunctionMap[n] = v.inAsyncFunction

		return v

	case *ast.UnaryExpr:
		// We handle address-of (&) within AssignStmt where it's actually used.
		// Standalone &x doesn't directly assign, but its usage in assignments
		// or function calls determines boxing. Assignments are handled below.
		// Function calls like foo(&x) would require different tracking if needed.
		// For now, we focus on assignments as per the request.
		return v

	case *ast.CallExpr:
		// Check if this is a function call that might be async
		if funcIdent, ok := n.Fun.(*ast.Ident); ok {
			// Get the object for this function call
			if obj := v.pkg.TypesInfo.Uses[funcIdent]; obj != nil && v.analysis.IsAsyncFunc(obj) {
				// We're calling an async function, so mark current function as async if we're in one
				if v.currentFuncObj != nil {
					v.analysis.AsyncFuncs[v.currentFuncObj] = true
					v.inAsyncFunction = true // Update visitor state
					// Mark the FuncDecl node itself if possible (might need to store the node too)
					for nodeAst := range v.analysis.IsInAsyncFunctionMap { // Find the node to update
						if fd, ok := nodeAst.(*ast.FuncDecl); ok && v.pkg.TypesInfo.ObjectOf(fd.Name) == v.currentFuncObj {
							v.analysis.IsInAsyncFunctionMap[nodeAst] = true
						}
					}
				}
			}
		}

		// Store async state for this call expression
		v.analysis.IsInAsyncFunctionMap[n] = v.inAsyncFunction

		return v

	case *ast.SelectorExpr:
		// No need to track private field access since all fields are public
		return v

	case *ast.AssignStmt:
		for i, currentLHSExpr := range n.Lhs {
			if i >= len(n.Rhs) {
				break // Should not happen in valid Go
			}
			currentRHSExpr := n.Rhs[i]

			// --- Analyze RHS to determine assignment type and source object (if any) ---
			rhsAssignmentType := DirectAssignment
			var rhsSourceObj types.Object // The variable object on the RHS (e.g., 'y' in x = y or x = &y)

			if unaryExpr, ok := currentRHSExpr.(*ast.UnaryExpr); ok && unaryExpr.Op == token.AND {
				// RHS is &some_expr
				rhsAssignmentType = AddressOfAssignment
				if rhsIdent, ok := unaryExpr.X.(*ast.Ident); ok {
					// RHS is &variable
					rhsSourceObj = v.pkg.TypesInfo.ObjectOf(rhsIdent)
				}
				// If RHS is &structLit{} or &array[0], rhsSourceObj remains nil.
				// _, ok := unaryExpr.X.(*ast.CompositeLit); ok
			} else if rhsIdent, ok := currentRHSExpr.(*ast.Ident); ok {
				// RHS is variable
				rhsAssignmentType = DirectAssignment
				rhsSourceObj = v.pkg.TypesInfo.ObjectOf(rhsIdent)
			}
			// If RHS is a literal, function call, etc., rhsSourceObj remains nil.

			// --- Determine the LHS object (if it's a simple variable or a known field) ---
			var lhsTrackedObj types.Object // The object on the LHS we might record info *for* (e.g. its sources)

			if lhsIdent, ok := currentLHSExpr.(*ast.Ident); ok {
				if lhsIdent.Name == "_" {
					continue // Skip blank identifier assignments
				}
				lhsTrackedObj = v.pkg.TypesInfo.ObjectOf(lhsIdent)
			} else if selExpr, ok := currentLHSExpr.(*ast.SelectorExpr); ok {
				// LHS is struct.field or package.Var
				if selection := v.pkg.TypesInfo.Selections[selExpr]; selection != nil {
					lhsTrackedObj = selection.Obj() // This is the field or selected var object
				}
			} else if _, ok := currentLHSExpr.(*ast.StarExpr); ok {
				// LHS is *pointer.
				// We don't try to get a types.Object for the dereferenced entity itself to store in VariableUsage.
				// lhsTrackedObj remains nil. The effect on rhsSourceObj (if its address is taken) is handled below.
			}
			// For other complex LHS (e.g., map_expr[key_expr]), lhsTrackedObj remains nil.

			// --- Record Usage Information ---

			// 1. If LHS is a trackable variable/field, record what's assigned to it (its sources).
			// We only want to create VariableUsage entries for actual variables/fields.
			if _, isVar := lhsTrackedObj.(*types.Var); isVar {
				lhsUsageInfo := v.getOrCreateUsageInfo(lhsTrackedObj)
				if rhsSourceObj != nil {
					// Case: var1 = var2  OR  var1 = &var2 OR field1 = var2 OR field1 = &var2
					lhsUsageInfo.Sources = append(lhsUsageInfo.Sources, AssignmentInfo{
						Object: rhsSourceObj,
						Type:   rhsAssignmentType,
					})
				} else if rhsAssignmentType == AddressOfAssignment {
					// Case: var1 = &non_ident_expr (e.g., &T{}) OR field1 = &non_ident_expr
					// lhsTrackedObj is assigned an address, but not of a named variable.
					lhsUsageInfo.Sources = append(lhsUsageInfo.Sources, AssignmentInfo{
						Object: nil, // No specific source variable object
						Type:   rhsAssignmentType,
					})
				}
				// If rhsSourceObj is nil and rhsAssignmentType is DirectAssignment (e.g. var1 = 10),
				// no source object to record for LHS sources.
			}

			// 2. If RHS involved a source variable (rhsSourceObj is not nil),
			//    record that this source variable was used (its destinations).
			//    This is CRITICAL for boxing analysis (e.g., if &rhsSourceObj was assigned).
			if rhsSourceObj != nil {
				sourceUsageInfo := v.getOrCreateUsageInfo(rhsSourceObj)
				// The 'Object' in DestinationInfo is what/where rhsSourceObj (or its address) was assigned TO.
				// This can be lhsTrackedObj (if LHS was an ident or field).
				// If LHS was complex (e.g., *ptr, map[k]), lhsTrackedObj might be nil for that DestinationInfo.Object.
				// Even if lhsTrackedObj is nil for the DestinationInfo.Object, if rhsAssignmentType is AddressOfAssignment,
				// it's important to record that rhsSourceObj's address was taken.
				sourceUsageInfo.Destinations = append(sourceUsageInfo.Destinations, AssignmentInfo{
					Object: lhsTrackedObj, // This can be nil if LHS is complex (*p, map[k])
					Type:   rhsAssignmentType,
				})
			}
		}
		return v // Continue traversal

	case *ast.ReturnStmt:
		// Record the enclosing function/literal for this return statement
		if v.currentFuncDecl != nil {
			v.analysis.ReturnStmtEnclosingFuncDecl[n] = v.currentFuncDecl
		} else if v.currentFuncLit != nil {
			v.analysis.ReturnStmtEnclosingFuncLit[n] = v.currentFuncLit
		}

		// Check if it's a bare return
		if len(n.Results) == 0 {
			if v.currentFuncDecl != nil {
				// Check if the enclosing function declaration has named returns
				if _, ok := v.analysis.NamedReturnVars[v.currentFuncDecl]; ok {
					v.analysis.IsBareNamedReturn[n] = true
				}
			} else if v.currentFuncLit != nil {
				// Check if the enclosing function literal has named returns
				if _, ok := v.analysis.FuncLitNamedReturnVars[v.currentFuncLit]; ok {
					v.analysis.IsBareNamedReturn[n] = true
				}
			}
		}
		return v // Continue traversal
	}

	// For all other nodes, continue traversal
	return v
}

// containsAsyncOperations checks if a node contains any async operations like channel operations.
func (v *analysisVisitor) containsAsyncOperations(node ast.Node) bool {
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

		case *ast.CallExpr:
			// Check if we're calling a function known to be async
			if funcIdent, ok := s.Fun.(*ast.Ident); ok {
				// Get the object for this function call
				if obj := v.pkg.TypesInfo.Uses[funcIdent]; obj != nil && v.analysis.IsAsyncFunc(obj) {
					hasAsync = true
					return false
				}
			}

			// TODO: Add detection of method calls on async types
		}

		return true
	})

	return hasAsync
}

// containsDefer checks if a block contains any defer statements.
func (v *analysisVisitor) containsDefer(block *ast.BlockStmt) bool {
	hasDefer := false

	ast.Inspect(block, func(n ast.Node) bool {
		if n == nil {
			return true
		}
		if _, ok := n.(*ast.DeferStmt); ok {
			hasDefer = true
			return false
		}
		return true
	})

	return hasDefer
}

// AnalyzeFile analyzes a Go source file AST and populates the Analysis struct with information
// that will be used during code generation to properly handle pointers, variables that need boxing, etc.
func AnalyzeFile(file *ast.File, pkg *packages.Package, analysis *Analysis, cmap ast.CommentMap) {
	// Store the comment map in the analysis object
	analysis.Cmap = cmap

	// Process imports from the file
	for _, imp := range file.Imports {
		path := ""
		if imp.Path != nil {
			path = imp.Path.Value
			// Remove quotes from the import path string
			path = path[1 : len(path)-1]
		}

		// Store the import in the analysis
		if path != "" {
			name := ""
			if imp.Name != nil {
				name = imp.Name.Name
			}

			fileImp := &fileImport{
				importPath: path,
				importVars: make(map[string]struct{}),
			}

			// Use the import name or path as the key
			key := path
			if name != "" {
				key = name
			}

			analysis.Imports[key] = fileImp
		}
	}

	// Create an analysis visitor to traverse the AST
	visitor := &analysisVisitor{
		analysis:        analysis,
		pkg:             pkg,
		inAsyncFunction: false,
		currentReceiver: nil, // Initialize currentReceiver
	}

	// Walk the AST with our visitor
	ast.Walk(visitor, file)
}

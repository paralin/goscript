package compiler

import (
	"go/ast"
	"go/token"
	"go/types"
	"path/filepath"
	"strings"

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

// ShadowingInfo tracks variable shadowing in if statement initializations
type ShadowingInfo struct {
	// ShadowedVariables maps shadowed variable names to their outer scope objects
	ShadowedVariables map[string]types.Object
	// TempVariables maps shadowed variable names to temporary variable names
	TempVariables map[string]string
}

// FunctionTypeInfo represents Go function type information for reflection
type FunctionTypeInfo struct {
	Params   []types.Type // Parameter types
	Results  []types.Type // Return types
	Variadic bool         // Whether the function is variadic
}

// FunctionInfo consolidates function-related tracking data.
type FunctionInfo struct {
	IsAsync      bool
	NamedReturns []string
}

// ReflectedFunctionInfo tracks functions that need reflection support
type ReflectedFunctionInfo struct {
	FuncType     *types.Signature // The function's type signature
	NeedsReflect bool             // Whether this function is used with reflection
}

// NodeInfo consolidates node-related tracking data.
type NodeInfo struct {
	NeedsDefer        bool
	InAsyncContext    bool
	IsBareReturn      bool
	EnclosingFuncDecl *ast.FuncDecl
	EnclosingFuncLit  *ast.FuncLit
	IsInsideFunction  bool           // true if this declaration is inside a function body
	IsMethodValue     bool           // true if this SelectorExpr is a method value that needs binding
	ShadowingInfo     *ShadowingInfo // variable shadowing information for if statements
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

	// FunctionData consolidates function-related tracking into one map
	FunctionData map[types.Object]*FunctionInfo

	// NodeData consolidates node-related tracking into one map
	NodeData map[ast.Node]*NodeInfo

	// Keep specialized maps that serve different purposes
	// FuncLitData tracks function literal specific data since they don't have types.Object
	FuncLitData map[*ast.FuncLit]*FunctionInfo

	// ReflectedFunctions tracks functions that need reflection type metadata
	ReflectedFunctions map[ast.Node]*ReflectedFunctionInfo

	// FunctionAssignments tracks which function literals are assigned to which variables
	FunctionAssignments map[types.Object]ast.Node

	// PackageMetadata holds package-level metadata
	PackageMetadata map[string]interface{}
}

// PackageAnalysis holds cross-file analysis data for a package
type PackageAnalysis struct {
	// FunctionDefs maps file names to the functions defined in that file
	// Key: filename (without .go extension), Value: list of function names
	FunctionDefs map[string][]string

	// FunctionCalls maps file names to the functions they call from other files
	// Key: filename (without .go extension), Value: map[sourceFile][]functionNames
	FunctionCalls map[string]map[string][]string
}

// NewAnalysis creates a new Analysis instance.
func NewAnalysis() *Analysis {
	return &Analysis{
		VariableUsage:       make(map[types.Object]*VariableUsageInfo),
		Imports:             make(map[string]*fileImport),
		FunctionData:        make(map[types.Object]*FunctionInfo),
		NodeData:            make(map[ast.Node]*NodeInfo),
		FuncLitData:         make(map[*ast.FuncLit]*FunctionInfo),
		ReflectedFunctions:  make(map[ast.Node]*ReflectedFunctionInfo),
		FunctionAssignments: make(map[types.Object]ast.Node),
		PackageMetadata:     make(map[string]interface{}),
	}
}

// NewPackageAnalysis creates a new PackageAnalysis instance
func NewPackageAnalysis() *PackageAnalysis {
	return &PackageAnalysis{
		FunctionDefs:  make(map[string][]string),
		FunctionCalls: make(map[string]map[string][]string),
	}
}

// NeedsDefer returns whether the given node needs defer handling.
func (a *Analysis) NeedsDefer(node ast.Node) bool {
	if node == nil {
		return false
	}
	nodeInfo := a.NodeData[node]
	if nodeInfo == nil {
		return false
	}
	return nodeInfo.NeedsDefer
}

// IsInAsyncFunction returns whether the given node is inside an async function.
func (a *Analysis) IsInAsyncFunction(node ast.Node) bool {
	if node == nil {
		return false
	}
	nodeInfo := a.NodeData[node]
	if nodeInfo == nil {
		return false
	}
	return nodeInfo.InAsyncContext
}

// IsAsyncFunc returns whether the given object represents an async function.
func (a *Analysis) IsAsyncFunc(obj types.Object) bool {
	if obj == nil {
		return false
	}
	funcInfo := a.FunctionData[obj]
	if funcInfo == nil {
		return false
	}
	return funcInfo.IsAsync
}

// IsFuncLitAsync checks if a function literal is async based on our analysis.
func (a *Analysis) IsFuncLitAsync(funcLit *ast.FuncLit) bool {
	if funcLit == nil {
		return false
	}
	// Check function literal specific data first
	if funcInfo := a.FuncLitData[funcLit]; funcInfo != nil {
		return funcInfo.IsAsync
	}
	// Fall back to node data for backwards compatibility
	nodeInfo := a.NodeData[funcLit]
	if nodeInfo == nil {
		return false
	}
	return nodeInfo.InAsyncContext
}

// NeedsVarRef returns whether the given object needs to be variable referenced.
// This is true when the object's address is taken (e.g., &myVar) in the analyzed code.
// Variables that have their address taken must be wrapped in VarRef to maintain identity.
func (a *Analysis) NeedsVarRef(obj types.Object) bool {
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

// NeedsVarRefAccess returns whether accessing the given object requires '.value' access in TypeScript.
// This is more nuanced than NeedsVarRef and considers both direct variable references and
// pointers that may point to variable-referenced values.
//
// Examples:
//   - Direct variable reference (NeedsVarRef = true):
//     Example: let x = $.varRef(10) => x.value
//   - Pointer pointing to a variable-referenced value:
//     Example: let p: VarRef<number> | null = x => p!.value
//   - Regular pointer (NeedsVarRef = false, but points to variable reference):
//     Example: let q = x => q!.value (where x is VarRef)
func (a *Analysis) NeedsVarRefAccess(obj types.Object) bool {
	if obj == nil {
		return false
	}

	// If the variable itself is variable referenced, it needs .value access
	if a.NeedsVarRef(obj) {
		return true
	}

	// For pointer variables, check if they point to a variable-referenced value
	if ptrType, ok := obj.Type().(*types.Pointer); ok {
		// Check all assignments to this pointer variable
		for varObj, info := range a.VariableUsage {
			if varObj == obj {
				for _, src := range info.Sources {
					if src.Type == AddressOfAssignment && src.Object != nil {
						// This pointer was assigned &someVar, check if someVar is variable referenced
						return a.NeedsVarRef(src.Object)
					}
				}
			}
		}

		// Handle direct pointer initialization like: var p *int = &x
		// Check if the pointer type's element type requires variable referencing
		_ = ptrType.Elem()
		// For now, conservatively return false for untracked cases
	}

	return false
}

// IsMethodValue returns whether the given SelectorExpr node is a method value that needs binding.
func (a *Analysis) IsMethodValue(node *ast.SelectorExpr) bool {
	if node == nil {
		return false
	}
	nodeInfo := a.NodeData[node]
	if nodeInfo == nil {
		return false
	}
	return nodeInfo.IsMethodValue
}

// HasVariableShadowing returns whether the given node has variable shadowing issues
func (a *Analysis) HasVariableShadowing(node ast.Node) bool {
	if node == nil {
		return false
	}
	nodeInfo := a.NodeData[node]
	if nodeInfo == nil {
		return false
	}
	return nodeInfo.ShadowingInfo != nil
}

// GetShadowingInfo returns the variable shadowing information for the given node
func (a *Analysis) GetShadowingInfo(node ast.Node) *ShadowingInfo {
	if node == nil {
		return nil
	}
	nodeInfo := a.NodeData[node]
	if nodeInfo == nil {
		return nil
	}
	return nodeInfo.ShadowingInfo
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

	// Initialize and store async state for the current node
	if v.analysis.NodeData[node] == nil {
		v.analysis.NodeData[node] = &NodeInfo{}
	}
	v.analysis.NodeData[node].InAsyncContext = v.inAsyncFunction

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
						// Check if there's a corresponding initial value (RHS)
						if valueSpec.Values != nil && i < len(valueSpec.Values) {
							rhsExpr := valueSpec.Values[i]

							// --- Analyze RHS and Update Usage Info (similar to AssignStmt) ---
							assignmentType := DirectAssignment
							var sourceObj types.Object
							shouldTrackUsage := true

							if unaryExpr, ok := rhsExpr.(*ast.UnaryExpr); ok && unaryExpr.Op == token.AND {
								// Case: var lhs = &rhs_expr
								assignmentType = AddressOfAssignment
								if rhsIdent, ok := unaryExpr.X.(*ast.Ident); ok {
									// Case: var lhs = &rhs_ident (taking address of a variable)
									sourceObj = v.pkg.TypesInfo.ObjectOf(rhsIdent)
								} else {
									// Case: var lhs = &CompositeLit{} (taking address of composite literal)
									// No variable tracking needed - this doesn't create VarRef requirements
									shouldTrackUsage = false
								}
							} else if rhsIdent, ok := rhsExpr.(*ast.Ident); ok {
								// Case: var lhs = rhs_ident
								assignmentType = DirectAssignment
								sourceObj = v.pkg.TypesInfo.ObjectOf(rhsIdent)
							} else if funcLit, ok := rhsExpr.(*ast.FuncLit); ok {
								// Case: var lhs = func(...) { ... }
								// Track function literal assignment
								v.analysis.FunctionAssignments[lhsObj] = funcLit
							}

							// --- Record Usage ---
							// Only create usage tracking if we're dealing with variable references
							if shouldTrackUsage {
								// Ensure usage info exists for LHS only when needed
								lhsUsageInfo := v.getOrCreateUsageInfo(lhsObj)

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
							}
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
					v.analysis.FunctionData[obj] = &FunctionInfo{
						IsAsync:      true,
						NamedReturns: v.getNamedReturns(n),
					}
					isAsync = true
				}
			}
		}
		if v.analysis.NodeData[n] == nil {
			v.analysis.NodeData[n] = &NodeInfo{}
		}
		v.analysis.NodeData[n].InAsyncContext = isAsync

		// Set current receiver if this is a method
		if n.Recv != nil && len(n.Recv.List) > 0 {
			// Assuming a single receiver for simplicity for now
			if len(n.Recv.List[0].Names) > 0 {
				if ident := n.Recv.List[0].Names[0]; ident != nil && ident.Name != "_" {
					if def := v.pkg.TypesInfo.Defs[ident]; def != nil {
						if vr, ok := def.(*types.Var); ok {
							v.currentReceiver = vr
							// Add the receiver variable to the VariableUsage map
							// to ensure it is properly analyzed for varRefing
							v.getOrCreateUsageInfo(v.currentReceiver)
						}
					}
				}
			}
		}

		// Store named return variables (sanitized for TypeScript)
		if n.Type != nil && n.Type.Results != nil {
			var namedReturns []string
			for _, field := range n.Type.Results.List {
				for _, name := range field.Names {
					namedReturns = append(namedReturns, sanitizeIdentifier(name.Name))
				}
			}
			if len(namedReturns) > 0 {
				if obj := v.pkg.TypesInfo.ObjectOf(n.Name); obj != nil {
					if v.analysis.FunctionData[obj] == nil {
						v.analysis.FunctionData[obj] = &FunctionInfo{}
					}
					v.analysis.FunctionData[obj].NamedReturns = namedReturns
				}
			}
		}

		// Update visitor state for this function
		v.inAsyncFunction = isAsync
		v.currentFuncObj = v.pkg.TypesInfo.ObjectOf(n.Name)
		v.analysis.NodeData[n].InAsyncContext = isAsync // Ensure FuncDecl node itself is marked

		if n.Body != nil {
			// Check if the body contains any defer statements
			if v.containsDefer(n.Body) {
				if v.analysis.NodeData[n] == nil {
					v.analysis.NodeData[n] = &NodeInfo{}
				}
				v.analysis.NodeData[n].NeedsDefer = true
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
		if v.analysis.NodeData[n] == nil {
			v.analysis.NodeData[n] = &NodeInfo{}
		}
		v.analysis.NodeData[n].InAsyncContext = isAsync

		// Store named return variables for function literal
		if n.Type != nil && n.Type.Results != nil {
			var namedReturns []string
			for _, field := range n.Type.Results.List {
				for _, name := range field.Names {
					namedReturns = append(namedReturns, name.Name)
				}
			}
			if len(namedReturns) > 0 {
				v.analysis.FuncLitData[n] = &FunctionInfo{
					IsAsync:      isAsync,
					NamedReturns: namedReturns,
				}
			}
		}

		v.inAsyncFunction = isAsync

		// Check if the body contains any defer statements
		if n.Body != nil && v.containsDefer(n.Body) {
			if v.analysis.NodeData[n] == nil {
				v.analysis.NodeData[n] = &NodeInfo{}
			}
			v.analysis.NodeData[n].NeedsDefer = true
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

		// Initialize NodeData for this block
		if v.analysis.NodeData[n] == nil {
			v.analysis.NodeData[n] = &NodeInfo{}
		}

		// Check for defer statements in this block
		if v.containsDefer(n) {
			v.analysis.NodeData[n].NeedsDefer = true
		}

		// Store async state for this block
		v.analysis.NodeData[n].InAsyncContext = v.inAsyncFunction

		return v

	case *ast.UnaryExpr:
		// We handle address-of (&) within AssignStmt where it's actually used.
		// Standalone &x doesn't directly assign, but its usage in assignments
		// or function calls determines varRefing. Assignments are handled below.
		// Function calls like foo(&x) would require different tracking if needed.
		// TODO: for now, we focus on assignments
		return v

	case *ast.CallExpr:
		// Check if this is a function call that might be async
		if funcIdent, ok := n.Fun.(*ast.Ident); ok {
			// Get the object for this function call
			if obj := v.pkg.TypesInfo.Uses[funcIdent]; obj != nil && v.analysis.IsAsyncFunc(obj) {
				// We're calling an async function, so mark current function as async if we're in one
				if v.currentFuncObj != nil {
					v.analysis.FunctionData[v.currentFuncObj] = &FunctionInfo{
						IsAsync:      true,
						NamedReturns: v.getNamedReturns(v.currentFuncDecl),
					}
					v.inAsyncFunction = true // Update visitor state
					// Mark the FuncDecl node itself if possible (might need to store the node too)
					for nodeAst := range v.analysis.NodeData { // Find the node to update
						if fd, ok := nodeAst.(*ast.FuncDecl); ok && v.pkg.TypesInfo.ObjectOf(fd.Name) == v.currentFuncObj {
							if v.analysis.NodeData[nodeAst] == nil {
								v.analysis.NodeData[nodeAst] = &NodeInfo{}
							}
							v.analysis.NodeData[nodeAst].InAsyncContext = true
						}
					}
				}
			}
		}

		// Check for reflect function calls that operate on functions
		v.checkReflectUsage(n)

		// Store async state for this call expression
		if v.analysis.NodeData[n] == nil {
			v.analysis.NodeData[n] = &NodeInfo{}
		}
		v.analysis.NodeData[n].InAsyncContext = v.inAsyncFunction

		return v

	case *ast.SelectorExpr:
		// Initialize NodeData for this selector expression
		if v.analysis.NodeData[n] == nil {
			v.analysis.NodeData[n] = &NodeInfo{}
		}
		v.analysis.NodeData[n].InAsyncContext = v.inAsyncFunction

		// Check if this is a method value (method being used as a value, not called immediately)
		if selection := v.pkg.TypesInfo.Selections[n]; selection != nil {
			if selection.Kind() == types.MethodVal {
				// This is a method value - mark it for binding during code generation
				v.analysis.NodeData[n].IsMethodValue = true
			}
		}
		return v // Continue traversal

	case *ast.AssignStmt:
		// Detect variable shadowing in any := assignment
		if n.Tok == token.DEFINE {
			shadowingInfo := v.detectVariableShadowing(n)
			if shadowingInfo != nil {
				// Store shadowing info on the assignment statement itself
				if v.analysis.NodeData[n] == nil {
					v.analysis.NodeData[n] = &NodeInfo{}
				}
				v.analysis.NodeData[n].ShadowingInfo = shadowingInfo
			}
		}

		// Continue with the existing assignment analysis logic
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

				// Check if RHS is a function literal and track the assignment
				if funcLit, ok := currentRHSExpr.(*ast.FuncLit); ok {
					v.analysis.FunctionAssignments[lhsTrackedObj] = funcLit
				}
			} else if selExpr, ok := currentLHSExpr.(*ast.SelectorExpr); ok {
				// LHS is struct.field or package.Var
				if selection := v.pkg.TypesInfo.Selections[selExpr]; selection != nil {
					lhsTrackedObj = selection.Obj() // This is the field or selected var object
				}
			} /* else if _, ok := currentLHSExpr.(*ast.StarExpr); ok {
				// LHS is *pointer.
				// We don't try to get a types.Object for the dereferenced entity itself to store in VariableUsage.
				// lhsTrackedObj remains nil. The effect on rhsSourceObj (if its address is taken) is handled below.
			} */
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
			//    This is CRITICAL for varRefing analysis (e.g., if &rhsSourceObj was assigned).
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
		// Initialize NodeData for return statement
		if v.analysis.NodeData[n] == nil {
			v.analysis.NodeData[n] = &NodeInfo{}
		}

		// Record the enclosing function/literal for this return statement
		if v.currentFuncDecl != nil {
			v.analysis.NodeData[n].EnclosingFuncDecl = v.currentFuncDecl
		} else if v.currentFuncLit != nil {
			v.analysis.NodeData[n].EnclosingFuncLit = v.currentFuncLit
		}

		// Check if it's a bare return
		if len(n.Results) == 0 {
			if v.currentFuncDecl != nil {
				// Check if the enclosing function declaration has named returns
				if obj := v.pkg.TypesInfo.ObjectOf(v.currentFuncDecl.Name); obj != nil {
					if _, ok := v.analysis.FunctionData[obj]; ok {
						if v.analysis.NodeData[n] == nil {
							v.analysis.NodeData[n] = &NodeInfo{}
						}
						v.analysis.NodeData[n].IsBareReturn = true
					}
				}
			} else if v.currentFuncLit != nil {
				// Check if the enclosing function literal has named returns
				if _, ok := v.analysis.FuncLitData[v.currentFuncLit]; ok {
					if v.analysis.NodeData[n] == nil {
						v.analysis.NodeData[n] = &NodeInfo{}
					}
					v.analysis.NodeData[n].IsBareReturn = true
				}
			}
		}
		return v // Continue traversal

	case *ast.DeclStmt:
		// Handle declarations inside functions (const, var, type declarations within function bodies)
		// These should not have export modifiers in TypeScript
		if genDecl, ok := n.Decl.(*ast.GenDecl); ok {
			// Check if we're inside a function (either FuncDecl or FuncLit)
			isInsideFunction := v.currentFuncDecl != nil || v.currentFuncLit != nil

			if isInsideFunction {
				// Mark all specs in this declaration as being inside a function
				for _, spec := range genDecl.Specs {
					if v.analysis.NodeData[spec] == nil {
						v.analysis.NodeData[spec] = &NodeInfo{}
					}
					v.analysis.NodeData[spec].IsInsideFunction = true
				}
			}
		}
		return v // Continue traversal

	case *ast.IfStmt:
		// Detect variable shadowing in if statement initializations
		if n.Init != nil {
			if assignStmt, ok := n.Init.(*ast.AssignStmt); ok && assignStmt.Tok == token.DEFINE {
				shadowingInfo := v.detectVariableShadowing(assignStmt)
				if shadowingInfo != nil {
					// Initialize NodeData for this if statement
					if v.analysis.NodeData[n] == nil {
						v.analysis.NodeData[n] = &NodeInfo{}
					}
					v.analysis.NodeData[n].ShadowingInfo = shadowingInfo
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

			// Check for method calls on imported types (e.g., sync.Mutex.Lock())
			if selExpr, ok := s.Fun.(*ast.SelectorExpr); ok {
				// Check if this is a method call on a variable (e.g., mu.Lock())
				if ident, ok := selExpr.X.(*ast.Ident); ok {
					// Get the type of the receiver
					if obj := v.pkg.TypesInfo.Uses[ident]; obj != nil {
						if varObj, ok := obj.(*types.Var); ok {
							// Get the type name and package
							if namedType, ok := varObj.Type().(*types.Named); ok {
								typeName := namedType.Obj().Name()
								methodName := selExpr.Sel.Name

								// Check if the type is from an imported package
								if typePkg := namedType.Obj().Pkg(); typePkg != nil && typePkg != v.pkg.Types {
									// Use the actual package name from the type information
									pkgName := typePkg.Name()

									// Check if this method is async based on metadata
									if v.analysis.IsMethodAsync(pkgName, typeName, methodName) {
										hasAsync = true
										return false
									}
								}
							}
						}
					}
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
// that will be used during code generation to properly handle pointers, variables that need varRefing, etc.
func AnalyzeFile(file *ast.File, pkg *packages.Package, analysis *Analysis, cmap ast.CommentMap) {
	// Store the comment map in the analysis object
	analysis.Cmap = cmap

	// Load package metadata for async function detection
	analysis.LoadPackageMetadata()

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

			// Use the import name or the actual package name as the key
			var key string
			if name != "" {
				// Explicit alias provided
				key = name
			} else {
				// No explicit alias, use the actual package name from type information
				// This handles cases where package name differs from the last path segment
				if actualName, err := getActualPackageName(path, pkg.Imports); err == nil {
					key = actualName
				} else {
					// Fallback to last segment of path if package not found in type information
					pts := strings.Split(path, "/")
					key = pts[len(pts)-1]
				}
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

	// Post-processing: Find all CallExpr nodes and unmark their Fun SelectorExpr as method values
	// This distinguishes between method calls (obj.Method()) and method values (obj.Method)
	ast.Inspect(file, func(n ast.Node) bool {
		if callExpr, ok := n.(*ast.CallExpr); ok {
			if selExpr, ok := callExpr.Fun.(*ast.SelectorExpr); ok {
				// This SelectorExpr is the function being called, so it's NOT a method value
				if nodeInfo := analysis.NodeData[selExpr]; nodeInfo != nil {
					nodeInfo.IsMethodValue = false
				}
			}
		}
		return true
	})
}

// getNamedReturns retrieves the named returns for a function
func (v *analysisVisitor) getNamedReturns(funcDecl *ast.FuncDecl) []string {
	var namedReturns []string
	if funcDecl.Type != nil && funcDecl.Type.Results != nil {
		for _, field := range funcDecl.Type.Results.List {
			for _, name := range field.Names {
				namedReturns = append(namedReturns, name.Name)
			}
		}
	}
	return namedReturns
}

// AnalyzePackage performs package-level analysis to collect function definitions
// and calls across all files in the package for auto-import generation
func AnalyzePackage(pkg *packages.Package) *PackageAnalysis {
	analysis := NewPackageAnalysis()

	// First pass: collect all function definitions per file
	for i, syntax := range pkg.Syntax {
		fileName := pkg.CompiledGoFiles[i]
		baseFileName := strings.TrimSuffix(filepath.Base(fileName), ".go")

		var functions []string
		for _, decl := range syntax.Decls {
			if funcDecl, ok := decl.(*ast.FuncDecl); ok {
				// Only collect top-level functions (not methods)
				if funcDecl.Recv == nil {
					functions = append(functions, funcDecl.Name.Name)
				}
			}
		}

		if len(functions) > 0 {
			analysis.FunctionDefs[baseFileName] = functions
		}
	}

	// Second pass: analyze function calls and determine which need imports
	for i, syntax := range pkg.Syntax {
		fileName := pkg.CompiledGoFiles[i]
		baseFileName := strings.TrimSuffix(filepath.Base(fileName), ".go")

		// Find all function calls in this file
		callsFromOtherFiles := make(map[string][]string)

		ast.Inspect(syntax, func(n ast.Node) bool {
			if callExpr, ok := n.(*ast.CallExpr); ok {
				if ident, ok := callExpr.Fun.(*ast.Ident); ok {
					funcName := ident.Name

					// Check if this function is defined in the current file
					currentFileFuncs := analysis.FunctionDefs[baseFileName]
					isDefinedInCurrentFile := false
					for _, f := range currentFileFuncs {
						if f == funcName {
							isDefinedInCurrentFile = true
							break
						}
					}

					// If not defined in current file, find which file defines it
					if !isDefinedInCurrentFile {
						for sourceFile, funcs := range analysis.FunctionDefs {
							if sourceFile == baseFileName {
								continue // Skip current file
							}
							for _, f := range funcs {
								if f == funcName {
									// Found the function in another file
									if callsFromOtherFiles[sourceFile] == nil {
										callsFromOtherFiles[sourceFile] = []string{}
									}
									// Check if already added to avoid duplicates
									found := false
									for _, existing := range callsFromOtherFiles[sourceFile] {
										if existing == funcName {
											found = true
											break
										}
									}
									if !found {
										callsFromOtherFiles[sourceFile] = append(callsFromOtherFiles[sourceFile], funcName)
									}
									break
								}
							}
						}
					}
				}
			}
			return true
		})

		if len(callsFromOtherFiles) > 0 {
			analysis.FunctionCalls[baseFileName] = callsFromOtherFiles
		}
	}

	return analysis
}

// LoadPackageMetadata loads metadata from gs packages to determine which functions are async
func (a *Analysis) LoadPackageMetadata() {
	// List of gs packages that have metadata
	metadataPackages := []string{
		"github.com/aperturerobotics/goscript/gs/sync",
		"github.com/aperturerobotics/goscript/gs/unicode",
	}

	for _, pkgPath := range metadataPackages {
		cfg := &packages.Config{
			Mode: packages.NeedTypes | packages.NeedTypesInfo | packages.NeedSyntax,
		}

		pkgs, err := packages.Load(cfg, pkgPath)
		if err != nil || len(pkgs) == 0 {
			continue // Skip if package can't be loaded
		}

		pkg := pkgs[0]
		if pkg.Types == nil {
			continue
		}

		// Extract the package name (e.g., "sync" from "github.com/aperturerobotics/goscript/gs/sync")
		parts := strings.Split(pkgPath, "/")
		pkgName := parts[len(parts)-1]

		// Look for metadata variables in the package scope
		scope := pkg.Types.Scope()
		for _, name := range scope.Names() {
			obj := scope.Lookup(name)
			if obj == nil {
				continue
			}

			// Check if this is a metadata variable (ends with "Info")
			if strings.HasSuffix(name, "Info") {
				if varObj, ok := obj.(*types.Var); ok {
					// Store the metadata with a key like "sync.MutexLock"
					methodName := strings.TrimSuffix(name, "Info")
					key := pkgName + "." + methodName
					a.PackageMetadata[key] = varObj
				}
			}
		}
	}
}

// IsMethodAsync checks if a method call is async based on package metadata
func (a *Analysis) IsMethodAsync(pkgName, typeName, methodName string) bool {
	// The metadata keys are stored as "sync.MutexLock", "sync.WaitGroupWait", etc.
	// We need to match "sync.Mutex.Lock" -> "sync.MutexLock"
	key := pkgName + "." + typeName + methodName

	if metaObj, exists := a.PackageMetadata[key]; exists {
		if varObj, ok := metaObj.(*types.Var); ok {
			// Try to get the actual value of the variable
			// For now, we'll use the variable name to determine if it's async
			// The variable names follow the pattern: MutexLockInfo, WaitGroupWaitInfo, etc.
			// We can check if the corresponding metadata indicates IsAsync: true
			varName := varObj.Name()

			// Based on our metadata definitions, these should be async:
			asyncMethods := map[string]bool{
				"MutexLockInfo":        true,
				"RWMutexLockInfo":      true,
				"RWMutexRLockInfo":     true,
				"WaitGroupWaitInfo":    true,
				"OnceDoInfo":           true,
				"CondWaitInfo":         true,
				"MapDeleteInfo":        true,
				"MapLoadInfo":          true,
				"MapLoadAndDeleteInfo": true,
				"MapLoadOrStoreInfo":   true,
				"MapRangeInfo":         true,
				"MapStoreInfo":         true,
			}

			isAsync := asyncMethods[varName]
			return isAsync
		}
	}

	return false
}

// NeedsReflectionMetadata returns whether the given function node needs reflection type metadata
func (a *Analysis) NeedsReflectionMetadata(node ast.Node) bool {
	if node == nil {
		return false
	}
	reflectInfo := a.ReflectedFunctions[node]
	return reflectInfo != nil && reflectInfo.NeedsReflect
}

// GetFunctionTypeInfo returns the function type information for reflection
func (a *Analysis) GetFunctionTypeInfo(node ast.Node) *ReflectedFunctionInfo {
	if node == nil {
		return nil
	}
	return a.ReflectedFunctions[node]
}

// MarkFunctionForReflection marks a function node as needing reflection support
func (a *Analysis) MarkFunctionForReflection(node ast.Node, funcType *types.Signature) {
	if node == nil || funcType == nil {
		return
	}
	a.ReflectedFunctions[node] = &ReflectedFunctionInfo{
		FuncType:     funcType,
		NeedsReflect: true,
	}
}

// checkReflectUsage checks for reflect function calls that operate on functions
func (v *analysisVisitor) checkReflectUsage(callExpr *ast.CallExpr) {
	// Check if this is a reflect package function call
	if selExpr, ok := callExpr.Fun.(*ast.SelectorExpr); ok {
		// Check if the selector is from reflect package
		if ident, ok := selExpr.X.(*ast.Ident); ok {
			// Check if this is a reflect package call (reflect.TypeOf, reflect.ValueOf, etc.)
			if obj := v.pkg.TypesInfo.Uses[ident]; obj != nil {
				if pkgName, ok := obj.(*types.PkgName); ok && pkgName.Imported().Path() == "reflect" {
					methodName := selExpr.Sel.Name

					// Check for reflect.TypeOf and reflect.ValueOf calls
					if methodName == "TypeOf" || methodName == "ValueOf" {
						// Check if any argument is a function
						for _, arg := range callExpr.Args {
							v.checkReflectArgument(arg)
						}
					}
				}
			}
		}
	}
}

// checkReflectArgument checks if an argument to a reflect function is a function that needs metadata
func (v *analysisVisitor) checkReflectArgument(arg ast.Expr) {
	// Check if the argument is an identifier (variable)
	if ident, ok := arg.(*ast.Ident); ok {
		// Get the object this identifier refers to
		if obj := v.pkg.TypesInfo.Uses[ident]; obj != nil {
			// Check if this object has a function type
			if funcType, ok := obj.Type().(*types.Signature); ok {
				// This is a function variable being passed to reflect
				// We need to find the original function definition/assignment
				v.markFunctionVariable(ident, funcType)
			}
		}
	} else if funcLit, ok := arg.(*ast.FuncLit); ok {
		// This is a function literal being passed directly to reflect
		if funcType := v.pkg.TypesInfo.Types[funcLit].Type.(*types.Signature); funcType != nil {
			v.analysis.MarkFunctionForReflection(funcLit, funcType)
		}
	}
}

// markFunctionVariable finds the function definition/assignment for a variable and marks it for reflection
func (v *analysisVisitor) markFunctionVariable(ident *ast.Ident, funcType *types.Signature) {
	// Get the object for this identifier
	obj := v.pkg.TypesInfo.Uses[ident]
	if obj == nil {
		return
	}

	// Check if we have a tracked function assignment for this variable
	if funcNode := v.analysis.FunctionAssignments[obj]; funcNode != nil {
		// Mark the function node for reflection
		v.analysis.MarkFunctionForReflection(funcNode, funcType)
	}
}

// detectVariableShadowing detects variable shadowing in any := assignment
func (v *analysisVisitor) detectVariableShadowing(assignStmt *ast.AssignStmt) *ShadowingInfo {
	shadowingInfo := &ShadowingInfo{
		ShadowedVariables: make(map[string]types.Object),
		TempVariables:     make(map[string]string),
	}

	hasShadowing := false

	// First, collect all LHS variable names that are being declared
	lhsVarNames := make(map[string]*ast.Ident)
	for _, lhsExpr := range assignStmt.Lhs {
		if lhsIdent, ok := lhsExpr.(*ast.Ident); ok && lhsIdent.Name != "_" {
			lhsVarNames[lhsIdent.Name] = lhsIdent
		}
	}

	// Next, check all RHS expressions for usage of variables that are also being declared on LHS
	for _, rhsExpr := range assignStmt.Rhs {
		v.findVariableUsageInExpr(rhsExpr, lhsVarNames, shadowingInfo, &hasShadowing)
	}

	if hasShadowing {
		return shadowingInfo
	}
	return nil
}

// findVariableUsageInExpr recursively searches for variable usage in an expression
func (v *analysisVisitor) findVariableUsageInExpr(expr ast.Expr, lhsVarNames map[string]*ast.Ident, shadowingInfo *ShadowingInfo, hasShadowing *bool) {
	if expr == nil {
		return
	}

	switch e := expr.(type) {
	case *ast.Ident:
		// Check if this identifier is being shadowed
		if lhsIdent, exists := lhsVarNames[e.Name]; exists {
			// This variable is being used on RHS but also declared on LHS - this is shadowing!

			// Get the outer scope object for this variable
			if outerObj := v.pkg.TypesInfo.Uses[e]; outerObj != nil {
				// Make sure this isn't the same object as the LHS (which would mean no shadowing)
				if lhsObj := v.pkg.TypesInfo.Defs[lhsIdent]; lhsObj != outerObj {
					shadowingInfo.ShadowedVariables[e.Name] = outerObj
					shadowingInfo.TempVariables[e.Name] = "_temp_" + e.Name
					*hasShadowing = true
				}
			}
		}

	case *ast.CallExpr:
		// Check function arguments
		for _, arg := range e.Args {
			v.findVariableUsageInExpr(arg, lhsVarNames, shadowingInfo, hasShadowing)
		}
		// Check function expression itself
		v.findVariableUsageInExpr(e.Fun, lhsVarNames, shadowingInfo, hasShadowing)

	case *ast.SelectorExpr:
		// Check the base expression (e.g., x in x.Method())
		v.findVariableUsageInExpr(e.X, lhsVarNames, shadowingInfo, hasShadowing)

	case *ast.IndexExpr:
		// Check both the expression and index (e.g., arr[i])
		v.findVariableUsageInExpr(e.X, lhsVarNames, shadowingInfo, hasShadowing)
		v.findVariableUsageInExpr(e.Index, lhsVarNames, shadowingInfo, hasShadowing)

	case *ast.SliceExpr:
		// Check the expression and slice bounds
		v.findVariableUsageInExpr(e.X, lhsVarNames, shadowingInfo, hasShadowing)
		if e.Low != nil {
			v.findVariableUsageInExpr(e.Low, lhsVarNames, shadowingInfo, hasShadowing)
		}
		if e.High != nil {
			v.findVariableUsageInExpr(e.High, lhsVarNames, shadowingInfo, hasShadowing)
		}
		if e.Max != nil {
			v.findVariableUsageInExpr(e.Max, lhsVarNames, shadowingInfo, hasShadowing)
		}

	case *ast.UnaryExpr:
		// Check the operand (e.g., &x, -x, !x)
		v.findVariableUsageInExpr(e.X, lhsVarNames, shadowingInfo, hasShadowing)

	case *ast.BinaryExpr:
		// Check both operands (e.g., x + y)
		v.findVariableUsageInExpr(e.X, lhsVarNames, shadowingInfo, hasShadowing)
		v.findVariableUsageInExpr(e.Y, lhsVarNames, shadowingInfo, hasShadowing)

	case *ast.ParenExpr:
		// Check the parenthesized expression
		v.findVariableUsageInExpr(e.X, lhsVarNames, shadowingInfo, hasShadowing)

	case *ast.TypeAssertExpr:
		// Check the expression being type-asserted
		v.findVariableUsageInExpr(e.X, lhsVarNames, shadowingInfo, hasShadowing)

	case *ast.StarExpr:
		// Check the expression being dereferenced
		v.findVariableUsageInExpr(e.X, lhsVarNames, shadowingInfo, hasShadowing)

	// Add more expression types as needed
	default:
		// For other expression types, we might need to add specific handling
		// For now, we'll ignore them as they're less common in shadowing scenarios
	}
}

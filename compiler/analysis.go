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

// FunctionInfo consolidates function-related tracking data.
type FunctionInfo struct {
	IsAsync      bool
	NamedReturns []string
}

// NodeInfo consolidates node-related tracking data.
type NodeInfo struct {
	NeedsDefer        bool
	InAsyncContext    bool
	IsBareReturn      bool
	EnclosingFuncDecl *ast.FuncDecl
	EnclosingFuncLit  *ast.FuncLit
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
		VariableUsage: make(map[types.Object]*VariableUsageInfo),
		Imports:       make(map[string]*fileImport),
		FunctionData:  make(map[types.Object]*FunctionInfo),
		NodeData:      make(map[ast.Node]*NodeInfo),
		FuncLitData:   make(map[*ast.FuncLit]*FunctionInfo),
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

		// Store named return variables
		if n.Type != nil && n.Type.Results != nil {
			var namedReturns []string
			for _, field := range n.Type.Results.List {
				for _, name := range field.Names {
					namedReturns = append(namedReturns, name.Name)
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

		// Store async state for this call expression
		if v.analysis.NodeData[n] == nil {
			v.analysis.NodeData[n] = &NodeInfo{}
		}
		v.analysis.NodeData[n].InAsyncContext = v.inAsyncFunction

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
// that will be used during code generation to properly handle pointers, variables that need varRefing, etc.
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

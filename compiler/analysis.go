package compiler

import (
	"encoding/json"
	"fmt"
	"go/ast"
	"go/token"
	"go/types"
	"path/filepath"
	"strings"

	"github.com/aperturerobotics/goscript"
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
	ReceiverUsed bool
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
	IdentifierMapping string         // replacement name for this identifier (e.g., receiver -> "receiver")
}

// GsMetadata represents the structure of a meta.json file in gs/ packages
type GsMetadata struct {
	Dependencies []string        `json:"dependencies,omitempty"`
	AsyncMethods map[string]bool `json:"asyncMethods,omitempty"`
}

// InterfaceMethodKey uniquely identifies an interface method
type InterfaceMethodKey struct {
	InterfaceType string // The string representation of the interface type
	MethodName    string // The method name
}

// MethodKey uniquely identifies a method for async analysis
type MethodKey struct {
	PackagePath  string // Package path
	ReceiverType string // Receiver type name (empty for package-level functions)
	MethodName   string // Method or function name
}

// ImplementationInfo tracks information about a struct that implements an interface method
type ImplementationInfo struct {
	StructType    *types.Named // The struct type that implements the interface
	Method        *types.Func  // The method object
	IsAsyncByFlow bool         // Whether this implementation is async based on control flow analysis
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

	// NamedBasicTypes tracks types that should be implemented as type aliases with standalone functions
	// This includes named types with basic underlying types (like uint32, string) that have methods
	NamedBasicTypes map[types.Type]bool

	// AllPackages stores all loaded packages for dependency analysis
	// Key: package path, Value: package data
	AllPackages map[string]*packages.Package

	// InterfaceImplementations tracks which struct types implement which interface methods
	// This is used to determine interface method async status based on implementations
	InterfaceImplementations map[InterfaceMethodKey][]ImplementationInfo

	// InterfaceMethodAsyncStatus caches the async status determination for interface methods
	// This is computed once during analysis and reused during code generation
	InterfaceMethodAsyncStatus map[InterfaceMethodKey]bool

	// MethodAsyncStatus stores the async status of all methods analyzed
	// This is computed once during analysis and reused during code generation
	MethodAsyncStatus map[MethodKey]bool
}

// PackageAnalysis holds cross-file analysis data for a package
type PackageAnalysis struct {
	// FunctionDefs maps file names to the functions defined in that file
	// Key: filename (without .go extension), Value: list of function names
	FunctionDefs map[string][]string

	// FunctionCalls maps file names to the functions they call from other files
	// Key: filename (without .go extension), Value: map[sourceFile][]functionNames
	FunctionCalls map[string]map[string][]string

	// TypeDefs maps file names to the types defined in that file
	// Key: filename (without .go extension), Value: list of type names
	TypeDefs map[string][]string

	// TypeCalls maps file names to the types they reference from other files
	// Key: filename (without .go extension), Value: map[sourceFile][]typeNames
	TypeCalls map[string]map[string][]string
}

// NewAnalysis creates a new Analysis instance.
func NewAnalysis(allPackages map[string]*packages.Package) *Analysis {
	if allPackages == nil {
		allPackages = make(map[string]*packages.Package)
	}

	return &Analysis{
		VariableUsage:       make(map[types.Object]*VariableUsageInfo),
		Imports:             make(map[string]*fileImport),
		FunctionData:        make(map[types.Object]*FunctionInfo),
		NodeData:            make(map[ast.Node]*NodeInfo),
		FuncLitData:         make(map[*ast.FuncLit]*FunctionInfo),
		ReflectedFunctions:  make(map[ast.Node]*ReflectedFunctionInfo),
		FunctionAssignments: make(map[types.Object]ast.Node),
		// PackageMetadata removed - using MethodAsyncStatus only
		NamedBasicTypes:            make(map[types.Type]bool),
		AllPackages:                allPackages,
		InterfaceImplementations:   make(map[InterfaceMethodKey][]ImplementationInfo),
		InterfaceMethodAsyncStatus: make(map[InterfaceMethodKey]bool),
		MethodAsyncStatus:          make(map[MethodKey]bool),
	}
}

// NewPackageAnalysis creates a new PackageAnalysis instance
func NewPackageAnalysis() *PackageAnalysis {
	return &PackageAnalysis{
		FunctionDefs:  make(map[string][]string),
		FunctionCalls: make(map[string]map[string][]string),
		TypeDefs:      make(map[string][]string),
		TypeCalls:     make(map[string]map[string][]string),
	}
}

// ensureNodeData ensures that NodeData exists for a given node and returns it
func (a *Analysis) ensureNodeData(node ast.Node) *NodeInfo {
	if node == nil {
		return nil
	}
	if a.NodeData[node] == nil {
		a.NodeData[node] = &NodeInfo{}
	}
	return a.NodeData[node]
}

// ensureFunctionData ensures that FunctionData exists for a given object and returns it
func (a *Analysis) ensureFunctionData(obj types.Object) *FunctionInfo {
	if obj == nil {
		return nil
	}
	if a.FunctionData[obj] == nil {
		a.FunctionData[obj] = &FunctionInfo{}
	}
	return a.FunctionData[obj]
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

	// Use MethodAsyncStatus for all async status lookups
	funcObj, ok := obj.(*types.Func)
	if !ok {
		return false
	}

	// Create MethodKey for lookup
	methodKey := MethodKey{
		PackagePath:  funcObj.Pkg().Path(),
		ReceiverType: "", // Functions have no receiver, methods are handled separately
		MethodName:   funcObj.Name(),
	}

	// Check if it's a method with receiver
	if sig, ok := funcObj.Type().(*types.Signature); ok && sig.Recv() != nil {
		// For methods, get the receiver type name using same format as analysis
		recv := sig.Recv()
		recvType := recv.Type()
		// Handle pointer receivers
		if ptr, isPtr := recvType.(*types.Pointer); isPtr {
			recvType = ptr.Elem()
		}
		// Use short type name, not full path (consistent with analysis)
		if named, ok := recvType.(*types.Named); ok {
			methodKey.ReceiverType = named.Obj().Name()
		} else {
			methodKey.ReceiverType = recvType.String()
		}
	}

	if isAsync, exists := a.MethodAsyncStatus[methodKey]; exists {
		return isAsync
	}
	return false
}

func (a *Analysis) IsReceiverUsed(obj types.Object) bool {
	if obj == nil {
		return false
	}
	funcInfo := a.FunctionData[obj]
	if funcInfo == nil {
		return false
	}
	return funcInfo.ReceiverUsed
}

// IsFuncLitAsync checks if a function literal is async based on our analysis.
func (a *Analysis) IsFuncLitAsync(funcLit *ast.FuncLit) bool {
	if funcLit == nil {
		return false
	}
	// Check function literal specific data first - but IsAsync field was removed
	// Function literals don't have types.Object, so fall back to node data
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

	// visitingMethods tracks methods currently being analyzed to prevent infinite recursion
	visitingMethods map[MethodKey]bool
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
	nodeInfo := v.analysis.ensureNodeData(node)
	nodeInfo.InAsyncContext = v.inAsyncFunction

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
		return v

	case *ast.FuncDecl:
		return v.visitFuncDecl(n)

	case *ast.FuncLit:
		return v.visitFuncLit(n)

	case *ast.BlockStmt:
		return v.visitBlockStmt(n)

	case *ast.UnaryExpr:
		// We handle address-of (&) within AssignStmt where it's actually used.
		return v

	case *ast.CallExpr:
		return v.visitCallExpr(n)

	case *ast.SelectorExpr:
		return v.visitSelectorExpr(n)

	case *ast.AssignStmt:
		return v.visitAssignStmt(n)

	case *ast.ReturnStmt:
		return v.visitReturnStmt(n)

	case *ast.DeclStmt:
		return v.visitDeclStmt(n)

	case *ast.IfStmt:
		return v.visitIfStmt(n)

	case *ast.TypeAssertExpr:
		return v.visitTypeAssertExpr(n)
	}

	// For all other nodes, continue traversal
	return v
}

// visitFuncDecl handles function declaration analysis
func (v *analysisVisitor) visitFuncDecl(n *ast.FuncDecl) ast.Visitor {
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

	nodeInfo := v.analysis.ensureNodeData(n)
	// InAsyncContext will be set by the second analysis phase

	// Set current receiver if this is a method
	if n.Recv != nil && len(n.Recv.List) > 0 {
		// Assuming a single receiver for simplicity for now
		if len(n.Recv.List[0].Names) > 0 {
			if ident := n.Recv.List[0].Names[0]; ident != nil && ident.Name != "_" {
				if def := v.pkg.TypesInfo.Defs[ident]; def != nil {
					if vr, ok := def.(*types.Var); ok {
						v.currentReceiver = vr
						// Add the receiver variable to the VariableUsage map
						v.getOrCreateUsageInfo(v.currentReceiver)

						// Check if receiver is used in method body
						receiverUsed := false
						if n.Body != nil {
							receiverUsed = v.containsReceiverUsage(n.Body, vr)
						}

						// Update function data with receiver usage info
						if obj := v.pkg.TypesInfo.ObjectOf(n.Name); obj != nil {
							funcInfo := v.analysis.ensureFunctionData(obj)
							funcInfo.ReceiverUsed = receiverUsed
						}
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
				funcInfo := v.analysis.ensureFunctionData(obj)
				funcInfo.NamedReturns = namedReturns
			}
		}
	}

	// Update visitor state for this function
	// Note: inAsyncFunction will be determined later by comprehensive analysis phase
	v.currentFuncObj = v.pkg.TypesInfo.ObjectOf(n.Name)

	if n.Body != nil {
		// Check if the body contains any defer statements
		if v.containsDefer(n.Body) {
			nodeInfo.NeedsDefer = true
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
}

// visitFuncLit handles function literal analysis
func (v *analysisVisitor) visitFuncLit(n *ast.FuncLit) ast.Visitor {
	// Save original inAsyncFunction state to restore after visiting
	originalInAsync := v.inAsyncFunction
	originalFuncDecl := v.currentFuncDecl
	originalFuncLit := v.currentFuncLit

	// Set current function literal
	v.currentFuncDecl = nil
	v.currentFuncLit = n

	// Note: Function literal async analysis is handled by comprehensive analysis phase
	nodeInfo := v.analysis.ensureNodeData(n)

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
				NamedReturns: namedReturns,
				// IsAsync will be set by comprehensive analysis
			}
		}
	}

	// Check if the body contains any defer statements
	if n.Body != nil && v.containsDefer(n.Body) {
		nodeInfo.NeedsDefer = true
	}

	// Visit the body with updated state
	ast.Walk(v, n.Body)

	// Restore inAsyncFunction state after visiting
	v.inAsyncFunction = originalInAsync
	v.currentFuncDecl = originalFuncDecl
	v.currentFuncLit = originalFuncLit
	return nil // Stop traversal here, ast.Walk handled the body
}

// visitBlockStmt handles block statement analysis
func (v *analysisVisitor) visitBlockStmt(n *ast.BlockStmt) ast.Visitor {
	if n == nil || len(n.List) == 0 {
		return v
	}

	// Initialize NodeData for this block
	nodeInfo := v.analysis.ensureNodeData(n)

	// Check for defer statements in this block
	if v.containsDefer(n) {
		nodeInfo.NeedsDefer = true
	}

	return v
}

// visitCallExpr handles call expression analysis
func (v *analysisVisitor) visitCallExpr(n *ast.CallExpr) ast.Visitor {
	// Check for reflect function calls that operate on functions
	v.checkReflectUsage(n)

	// Track interface implementations from function call arguments
	v.trackInterfaceCallArguments(n)

	return v
}

// visitSelectorExpr handles selector expression analysis
func (v *analysisVisitor) visitSelectorExpr(n *ast.SelectorExpr) ast.Visitor {
	// Check if this is a method value (method being used as a value, not called immediately)
	if selection := v.pkg.TypesInfo.Selections[n]; selection != nil {
		if selection.Kind() == types.MethodVal {
			// This is a method value - mark it for binding during code generation
			nodeInfo := v.analysis.ensureNodeData(n)
			nodeInfo.IsMethodValue = true
		}
	}
	return v
}

// visitAssignStmt handles assignment statement analysis
func (v *analysisVisitor) visitAssignStmt(n *ast.AssignStmt) ast.Visitor {
	// Handle variable assignment tracking and generate shadowing information
	shadowingInfo := v.detectVariableShadowing(n)

	// Store shadowing information if needed for code generation
	if shadowingInfo != nil {
		nodeInfo := v.analysis.ensureNodeData(n)
		nodeInfo.ShadowingInfo = shadowingInfo
	}

	// Track assignment relationships for pointer analysis
	for i, lhsExpr := range n.Lhs {
		if i < len(n.Rhs) {
			v.analyzeAssignment(lhsExpr, n.Rhs[i])
		}
	}

	// Track interface implementations for assignments to interface variables
	v.trackInterfaceAssignments(n)

	// Track function assignments (function literals assigned to variables)
	if len(n.Lhs) == 1 && len(n.Rhs) == 1 {
		if lhsIdent, ok := n.Lhs[0].(*ast.Ident); ok {
			if rhsFuncLit, ok := n.Rhs[0].(*ast.FuncLit); ok {
				// Get the object for the LHS variable
				if obj := v.pkg.TypesInfo.ObjectOf(lhsIdent); obj != nil {
					v.analysis.FunctionAssignments[obj] = rhsFuncLit
				}
			}
		}
	}

	return v
}

// visitReturnStmt handles return statement analysis
func (v *analysisVisitor) visitReturnStmt(n *ast.ReturnStmt) ast.Visitor {
	nodeInfo := v.analysis.ensureNodeData(n)

	// Record the enclosing function/literal for this return statement
	if v.currentFuncDecl != nil {
		nodeInfo.EnclosingFuncDecl = v.currentFuncDecl
	} else if v.currentFuncLit != nil {
		nodeInfo.EnclosingFuncLit = v.currentFuncLit
	}

	// Check if it's a bare return
	if len(n.Results) == 0 {
		if v.currentFuncDecl != nil {
			// Check if the enclosing function declaration has named returns
			if obj := v.pkg.TypesInfo.ObjectOf(v.currentFuncDecl.Name); obj != nil {
				if _, ok := v.analysis.FunctionData[obj]; ok {
					nodeInfo.IsBareReturn = true
				}
			}
		} else if v.currentFuncLit != nil {
			// Check if the enclosing function literal has named returns
			if _, ok := v.analysis.FuncLitData[v.currentFuncLit]; ok {
				nodeInfo.IsBareReturn = true
			}
		}
	}
	return v
}

// visitDeclStmt handles declaration statement analysis
func (v *analysisVisitor) visitDeclStmt(n *ast.DeclStmt) ast.Visitor {
	// Handle declarations inside functions (const, var, type declarations within function bodies)
	// These should not have export modifiers in TypeScript
	if genDecl, ok := n.Decl.(*ast.GenDecl); ok {
		// Check if we're inside a function (either FuncDecl or FuncLit)
		isInsideFunction := v.currentFuncDecl != nil || v.currentFuncLit != nil

		if isInsideFunction {
			// Mark all specs in this declaration as being inside a function
			for _, spec := range genDecl.Specs {
				nodeInfo := v.analysis.ensureNodeData(spec)
				nodeInfo.IsInsideFunction = true
			}
		}
	}
	return v
}

// visitIfStmt handles if statement analysis
func (v *analysisVisitor) visitIfStmt(n *ast.IfStmt) ast.Visitor {
	// Detect variable shadowing in if statement initializations
	if n.Init != nil {
		if assignStmt, ok := n.Init.(*ast.AssignStmt); ok && assignStmt.Tok == token.DEFINE {
			shadowingInfo := v.detectVariableShadowing(assignStmt)
			if shadowingInfo != nil {
				nodeInfo := v.analysis.ensureNodeData(n)
				nodeInfo.ShadowingInfo = shadowingInfo
			}
		}
	}
	return v
}

// visitTypeAssertExpr handles type assertion expression analysis
func (v *analysisVisitor) visitTypeAssertExpr(n *ast.TypeAssertExpr) ast.Visitor {
	// Track interface implementations when we see type assertions
	v.trackTypeAssertion(n)
	return v
}

// containsAsyncOperations checks if a node contains any async operations like channel operations.

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

// containsReceiverUsage checks if a method body contains any references to the receiver variable.
func (v *analysisVisitor) containsReceiverUsage(node ast.Node, receiver *types.Var) bool {
	if receiver == nil {
		return false
	}

	var hasReceiverUsage bool

	ast.Inspect(node, func(n ast.Node) bool {
		if n == nil {
			return true
		}

		switch expr := n.(type) {
		case *ast.Ident:
			// Check if this identifier refers to the receiver variable
			if obj := v.pkg.TypesInfo.Uses[expr]; obj != nil && obj == receiver {
				hasReceiverUsage = true
				return false
			}
		case *ast.SelectorExpr:
			// Check if selector expression uses the receiver (e.g., m.Field, m.Method())
			if ident, ok := expr.X.(*ast.Ident); ok {
				if obj := v.pkg.TypesInfo.Uses[ident]; obj != nil && obj == receiver {
					hasReceiverUsage = true
					return false
				}
			}
		}

		return true
	})

	return hasReceiverUsage
}

// AnalyzePackageFiles analyzes all Go source files in a package and populates the Analysis struct
// with information that will be used during code generation to properly handle pointers,
// variables that need varRefing, receiver usage, etc. This replaces the old file-by-file analysis.
func AnalyzePackageFiles(pkg *packages.Package, allPackages map[string]*packages.Package) *Analysis {
	analysis := NewAnalysis(allPackages)

	// Load package metadata for async function detection
	analysis.LoadPackageMetadata()

	// Process imports from all files in the package
	for _, file := range pkg.Syntax {
		// Create comment map for each file and store it (we'll merge them if needed)
		cmap := ast.NewCommentMap(pkg.Fset, file, file.Comments)
		if len(analysis.Cmap) == 0 {
			analysis.Cmap = cmap
		} else {
			// Merge comment maps from multiple files
			for node, comments := range cmap {
				analysis.Cmap[node] = append(analysis.Cmap[node], comments...)
			}
		}

		// Process imports from this file
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
	}

	// Create visitor for the entire package
	visitor := &analysisVisitor{
		analysis:        analysis,
		pkg:             pkg,
		visitingMethods: make(map[MethodKey]bool),
	}

	// First pass: analyze all declarations and statements across all files
	for _, file := range pkg.Syntax {
		ast.Walk(visitor, file)
	}

	// Post-processing: Find all CallExpr nodes and unmark their Fun SelectorExpr as method values
	// This distinguishes between method calls (obj.Method()) and method values (obj.Method)
	for _, file := range pkg.Syntax {
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

	// Second pass: analyze interface implementations first
	interfaceVisitor := &interfaceImplementationVisitor{
		analysis: analysis,
		pkg:      pkg,
	}
	for _, file := range pkg.Syntax {
		ast.Walk(interfaceVisitor, file)
	}

	// Third pass: comprehensive async analysis for all methods
	// Interface implementation async status is now updated on-demand in IsInterfaceMethodAsync
	visitor.analyzeAllMethodsAsync()

	return analysis
}

// AnalyzePackageImports performs package-level analysis to collect function definitions
// and calls across all files in the package for auto-import generation
func AnalyzePackageImports(pkg *packages.Package) *PackageAnalysis {
	analysis := NewPackageAnalysis()

	// First pass: collect all function definitions per file
	for i, syntax := range pkg.Syntax {
		fileName := pkg.CompiledGoFiles[i]
		baseFileName := strings.TrimSuffix(filepath.Base(fileName), ".go")

		var functions []string
		var types []string
		for _, decl := range syntax.Decls {
			if funcDecl, ok := decl.(*ast.FuncDecl); ok {
				// Only collect top-level functions (not methods)
				if funcDecl.Recv == nil {
					functions = append(functions, funcDecl.Name.Name)
				}
			}
			if genDecl, ok := decl.(*ast.GenDecl); ok {
				// Collect type declarations
				for _, spec := range genDecl.Specs {
					if typeSpec, ok := spec.(*ast.TypeSpec); ok {
						types = append(types, typeSpec.Name.Name)
					}
				}
			}
		}

		if len(functions) > 0 {
			analysis.FunctionDefs[baseFileName] = functions
		}
		if len(types) > 0 {
			analysis.TypeDefs[baseFileName] = types
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

	// Third pass: analyze type references and determine which need imports
	for i, syntax := range pkg.Syntax {
		fileName := pkg.CompiledGoFiles[i]
		baseFileName := strings.TrimSuffix(filepath.Base(fileName), ".go")

		// Find all type references in this file
		typeRefsFromOtherFiles := make(map[string][]string)

		ast.Inspect(syntax, func(n ast.Node) bool {
			// Look for type references in struct fields, function parameters, etc.
			if ident, ok := n.(*ast.Ident); ok {
				// Check if this identifier refers to a type
				if obj := pkg.TypesInfo.Uses[ident]; obj != nil {
					if _, ok := obj.(*types.TypeName); ok {
						typeName := ident.Name

						// Check if this type is defined in the current file
						currentFileTypes := analysis.TypeDefs[baseFileName]
						isDefinedInCurrentFile := false
						for _, t := range currentFileTypes {
							if t == typeName {
								isDefinedInCurrentFile = true
								break
							}
						}

						// If not defined in current file, find which file defines it
						if !isDefinedInCurrentFile {
							for sourceFile, types := range analysis.TypeDefs {
								if sourceFile == baseFileName {
									continue // Skip current file
								}
								for _, t := range types {
									if t == typeName {
										// Found the type in another file
										if typeRefsFromOtherFiles[sourceFile] == nil {
											typeRefsFromOtherFiles[sourceFile] = []string{}
										}
										// Check if already added to avoid duplicates
										found := false
										for _, existing := range typeRefsFromOtherFiles[sourceFile] {
											if existing == typeName {
												found = true
												break
											}
										}
										if !found {
											typeRefsFromOtherFiles[sourceFile] = append(typeRefsFromOtherFiles[sourceFile], typeName)
										}
										break
									}
								}
							}
						}
					}
				}
			}
			return true
		})

		if len(typeRefsFromOtherFiles) > 0 {
			analysis.TypeCalls[baseFileName] = typeRefsFromOtherFiles
		}
	}

	return analysis
}

// LoadPackageMetadata loads metadata from gs packages using embedded JSON files
func (a *Analysis) LoadPackageMetadata() {
	// Discover all packages in the embedded gs/ directory
	packagePaths := a.discoverEmbeddedGsPackages()

	for _, pkgPath := range packagePaths {
		metaFilePath := filepath.Join("gs", pkgPath, "meta.json")

		// Try to read the meta.json file from embedded filesystem
		// We need access to the embedded FS, which should be imported from the parent package
		if metadata := a.loadGsMetadata(metaFilePath); metadata != nil {
			// Store async method information
			for methodKey, isAsync := range metadata.AsyncMethods {
				// Convert method key to our internal key format
				parts := strings.Split(methodKey, ".")
				var typeName, methodName string

				if len(parts) == 2 {
					// "Type.Method" format for methods
					typeName = parts[0]
					methodName = parts[1]
				} else if len(parts) == 1 {
					// "Function" format for package-level functions
					typeName = "" // Empty type name for package-level functions
					methodName = parts[0]
				} else {
					// Skip invalid formats
					continue
				}

				// Use MethodKey instead of PackageMetadataKey for consistency
				key := MethodKey{
					PackagePath:  pkgPath,
					ReceiverType: typeName,
					MethodName:   methodName,
				}

				// Store the async value directly in MethodAsyncStatus
				a.MethodAsyncStatus[key] = isAsync
			}
		}
	}
}

// discoverEmbeddedGsPackages finds all packages in the embedded gs/ directory
func (a *Analysis) discoverEmbeddedGsPackages() []string {
	var packageList []string

	// Read the gs/ directory from the embedded filesystem
	entries, err := goscript.GsOverrides.ReadDir("gs")
	if err != nil {
		// If we can't read the gs/ directory, return empty list
		return packageList
	}

	// Iterate through all entries in gs/
	for _, entry := range entries {
		if entry.IsDir() {
			packageList = append(packageList, entry.Name())
		}
	}

	return packageList
}

// loadGsMetadata loads metadata from a meta.json file in the embedded filesystem
func (a *Analysis) loadGsMetadata(metaFilePath string) *GsMetadata {
	// Read the meta.json file from the embedded filesystem
	content, err := goscript.GsOverrides.ReadFile(metaFilePath)
	if err != nil {
		return nil // No metadata file found
	}

	var metadata GsMetadata
	if err := json.Unmarshal(content, &metadata); err != nil {
		return nil // Invalid JSON
	}

	return &metadata
}

// IsMethodAsync checks if a method call is async based on package metadata
func (a *Analysis) IsMethodAsync(pkgPath, typeName, methodName string) bool {
	// First, check pre-computed method async status
	methodKey := MethodKey{
		PackagePath:  pkgPath,
		ReceiverType: typeName,
		MethodName:   methodName,
	}

	if status, exists := a.MethodAsyncStatus[methodKey]; exists {
		return status
	}

	// If no pre-computed status found, external methods default to sync
	// Comprehensive analysis should have already analyzed all packages and loaded metadata
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

// trackInterfaceImplementation records that a struct type implements an interface method
func (a *Analysis) trackInterfaceImplementation(interfaceType *types.Interface, structType *types.Named, method *types.Func, isAsync bool) {
	key := InterfaceMethodKey{
		InterfaceType: interfaceType.String(),
		MethodName:    method.Name(),
	}

	implementation := ImplementationInfo{
		StructType:    structType,
		Method:        method,
		IsAsyncByFlow: isAsync,
	}

	a.InterfaceImplementations[key] = append(a.InterfaceImplementations[key], implementation)
}

// IsInterfaceMethodAsync determines if an interface method should be async based on its implementations
func (a *Analysis) IsInterfaceMethodAsync(interfaceType *types.Interface, methodName string) bool {
	key := InterfaceMethodKey{
		InterfaceType: interfaceType.String(),
		MethodName:    methodName,
	}

	// Check if we've already computed this
	if result, exists := a.InterfaceMethodAsyncStatus[key]; exists {
		return result
	}

	// Find all implementations of this interface method
	implementations, exists := a.InterfaceImplementations[key]
	if !exists {
		// No implementations found, default to sync
		a.InterfaceMethodAsyncStatus[key] = false
		return false
	}

	// Update implementations with current async status before checking
	for i := range implementations {
		impl := &implementations[i]

		// Create method key for this implementation
		methodKey := MethodKey{
			PackagePath:  impl.StructType.Obj().Pkg().Path(),
			ReceiverType: impl.StructType.Obj().Name(),
			MethodName:   impl.Method.Name(),
		}

		// Update with current async status from method analysis
		if isAsync, exists := a.MethodAsyncStatus[methodKey]; exists {
			impl.IsAsyncByFlow = isAsync
		}
	}

	// Store the updated implementations back to the map
	a.InterfaceImplementations[key] = implementations

	// If ANY implementation is async, the interface method is async
	for _, impl := range implementations {
		if impl.IsAsyncByFlow {
			a.InterfaceMethodAsyncStatus[key] = true
			return true
		}
	}

	// All implementations are sync
	a.InterfaceMethodAsyncStatus[key] = false
	return false
}

// MustBeAsyncDueToInterface checks if a struct method must be async due to interface constraints
func (a *Analysis) MustBeAsyncDueToInterface(structType *types.Named, methodName string) bool {
	// Find all interfaces that this struct implements
	for key, implementations := range a.InterfaceImplementations {
		if key.MethodName != methodName {
			continue
		}

		// Check if this struct is among the implementations
		for _, impl := range implementations {
			if impl.StructType == structType {
				// This struct implements this interface method
				// Check if the interface method is marked as async
				interfaceType := a.findInterfaceTypeByString(key.InterfaceType)
				if interfaceType != nil && a.IsInterfaceMethodAsync(interfaceType, methodName) {
					return true
				}
			}
		}
	}

	return false
}

// findInterfaceTypeByString finds an interface type by its string representation
// This is a helper method for MustBeAsyncDueToInterface
func (a *Analysis) findInterfaceTypeByString(interfaceString string) *types.Interface {
	// This is a simplified implementation - in practice, we might need to store
	// the actual interface types in our tracking data structure
	for _, pkg := range a.AllPackages {
		for _, syntax := range pkg.Syntax {
			for _, decl := range syntax.Decls {
				if genDecl, ok := decl.(*ast.GenDecl); ok {
					for _, spec := range genDecl.Specs {
						if typeSpec, ok := spec.(*ast.TypeSpec); ok {
							if interfaceType, ok := typeSpec.Type.(*ast.InterfaceType); ok {
								if goType := pkg.TypesInfo.TypeOf(interfaceType); goType != nil {
									if iface, ok := goType.(*types.Interface); ok {
										if iface.String() == interfaceString {
											return iface
										}
									}
								}
							}
						}
					}
				}
			}
		}
	}
	return nil
}

// GetReceiverMapping returns the receiver variable mapping for a function declaration
func (a *Analysis) GetReceiverMapping(funcDecl *ast.FuncDecl) string {
	if funcDecl.Recv != nil && len(funcDecl.Recv.List) > 0 {
		for _, field := range funcDecl.Recv.List {
			for _, name := range field.Names {
				if name != nil && name.Name != "_" {
					return "receiver"
				}
			}
		}
	}
	return ""
}

// GetIdentifierMapping returns the replacement name for an identifier
func (a *Analysis) GetIdentifierMapping(ident *ast.Ident) string {
	if ident == nil {
		return ""
	}

	// Check if this identifier has a mapping in NodeData
	if nodeInfo := a.NodeData[ident]; nodeInfo != nil {
		return nodeInfo.IdentifierMapping
	}

	return ""
}

// trackTypeAssertion analyzes type assertions and records interface implementations
func (v *analysisVisitor) trackTypeAssertion(typeAssert *ast.TypeAssertExpr) {
	// Get the type being asserted to
	assertedType := v.pkg.TypesInfo.TypeOf(typeAssert.Type)
	if assertedType == nil {
		return
	}

	// Check if the asserted type is an interface
	interfaceType, isInterface := assertedType.Underlying().(*types.Interface)
	if !isInterface {
		return
	}

	// Get the type of the expression being asserted
	exprType := v.pkg.TypesInfo.TypeOf(typeAssert.X)
	if exprType == nil {
		return
	}

	// Handle pointer types by getting the element type
	if ptrType, isPtr := exprType.(*types.Pointer); isPtr {
		exprType = ptrType.Elem()
	}

	// Check if the expression type is a named struct type
	namedType, isNamed := exprType.(*types.Named)
	if !isNamed {
		return
	}

	// For each method in the interface, check if the struct implements it
	for i := 0; i < interfaceType.NumExplicitMethods(); i++ {
		interfaceMethod := interfaceType.ExplicitMethod(i)

		// Find the corresponding method in the struct type
		structMethod := v.findStructMethod(namedType, interfaceMethod.Name())
		if structMethod != nil {
			// Determine if this struct method is async using unified system
			isAsync := false
			if obj := structMethod; obj != nil {
				isAsync = v.analysis.IsAsyncFunc(obj)
			}

			// Track this interface implementation
			v.analysis.trackInterfaceImplementation(interfaceType, namedType, structMethod, isAsync)
		}
	}
}

// findStructMethod finds a method with the given name on a named type
func (v *analysisVisitor) findStructMethod(namedType *types.Named, methodName string) *types.Func {
	// Check methods directly on the type
	for i := 0; i < namedType.NumMethods(); i++ {
		method := namedType.Method(i)
		if method.Name() == methodName {
			return method
		}
	}
	return nil
}

// analyzeAssignment analyzes a single assignment for pointer analysis
func (v *analysisVisitor) analyzeAssignment(lhsExpr, rhsExpr ast.Expr) {
	// Determine RHS assignment type and source object
	rhsAssignmentType := DirectAssignment
	var rhsSourceObj types.Object

	if unaryExpr, ok := rhsExpr.(*ast.UnaryExpr); ok && unaryExpr.Op == token.AND {
		// RHS is &some_expr
		rhsAssignmentType = AddressOfAssignment
		if rhsIdent, ok := unaryExpr.X.(*ast.Ident); ok {
			rhsSourceObj = v.pkg.TypesInfo.ObjectOf(rhsIdent)
		}
	} else if rhsIdent, ok := rhsExpr.(*ast.Ident); ok {
		// RHS is variable
		rhsAssignmentType = DirectAssignment
		rhsSourceObj = v.pkg.TypesInfo.ObjectOf(rhsIdent)
	}

	// Determine LHS object
	var lhsTrackedObj types.Object

	if lhsIdent, ok := lhsExpr.(*ast.Ident); ok {
		if lhsIdent.Name != "_" {
			lhsTrackedObj = v.pkg.TypesInfo.ObjectOf(lhsIdent)
		}
	} else if selExpr, ok := lhsExpr.(*ast.SelectorExpr); ok {
		if selection := v.pkg.TypesInfo.Selections[selExpr]; selection != nil {
			lhsTrackedObj = selection.Obj()
		}
	}

	// Record usage information
	if _, isVar := lhsTrackedObj.(*types.Var); isVar {
		lhsUsageInfo := v.getOrCreateUsageInfo(lhsTrackedObj)
		if rhsSourceObj != nil {
			lhsUsageInfo.Sources = append(lhsUsageInfo.Sources, AssignmentInfo{
				Object: rhsSourceObj,
				Type:   rhsAssignmentType,
			})
		} else if rhsAssignmentType == AddressOfAssignment {
			lhsUsageInfo.Sources = append(lhsUsageInfo.Sources, AssignmentInfo{
				Object: nil,
				Type:   rhsAssignmentType,
			})
		}
	}

	if rhsSourceObj != nil {
		sourceUsageInfo := v.getOrCreateUsageInfo(rhsSourceObj)
		sourceUsageInfo.Destinations = append(sourceUsageInfo.Destinations, AssignmentInfo{
			Object: lhsTrackedObj,
			Type:   rhsAssignmentType,
		})
	}
}

// trackInterfaceAssignments tracks interface implementations in assignment statements
func (v *analysisVisitor) trackInterfaceAssignments(assignStmt *ast.AssignStmt) {
	// For each assignment, check if we're assigning a struct to an interface variable
	for i, lhsExpr := range assignStmt.Lhs {
		if i >= len(assignStmt.Rhs) {
			continue
		}
		rhsExpr := assignStmt.Rhs[i]

		// Get the type of the LHS (destination)
		lhsType := v.pkg.TypesInfo.TypeOf(lhsExpr)
		if lhsType == nil {
			continue
		}

		// Check if LHS is an interface type
		interfaceType, isInterface := lhsType.Underlying().(*types.Interface)
		if !isInterface {
			continue
		}

		// Get the type of the RHS (source)
		rhsType := v.pkg.TypesInfo.TypeOf(rhsExpr)
		if rhsType == nil {
			continue
		}

		// Handle pointer types
		if ptrType, isPtr := rhsType.(*types.Pointer); isPtr {
			rhsType = ptrType.Elem()
		}

		// Check if RHS is a named struct type
		namedType, isNamed := rhsType.(*types.Named)
		if !isNamed {
			continue
		}

		// Track implementations for all interface methods
		for j := 0; j < interfaceType.NumExplicitMethods(); j++ {
			interfaceMethod := interfaceType.ExplicitMethod(j)

			structMethod := v.findStructMethod(namedType, interfaceMethod.Name())
			if structMethod != nil {
				// Determine if this struct method is async using unified system
				isAsync := v.analysis.IsAsyncFunc(structMethod)

				v.analysis.trackInterfaceImplementation(interfaceType, namedType, structMethod, isAsync)
			}
		}
	}
}

// trackInterfaceCallArguments analyzes function call arguments to detect interface implementations
func (v *analysisVisitor) trackInterfaceCallArguments(callExpr *ast.CallExpr) {
	// Get the function signature to determine parameter types
	var funcType *types.Signature

	if callFunType := v.pkg.TypesInfo.TypeOf(callExpr.Fun); callFunType != nil {
		if sig, ok := callFunType.(*types.Signature); ok {
			funcType = sig
		}
	}

	if funcType == nil {
		return
	}

	// Check each argument against its corresponding parameter
	params := funcType.Params()
	for i, arg := range callExpr.Args {
		if i >= params.Len() {
			break // More arguments than parameters (variadic case)
		}

		paramType := params.At(i).Type()

		// Check if the parameter is an interface type
		interfaceType, isInterface := paramType.Underlying().(*types.Interface)
		if !isInterface {
			continue
		}

		// Get the type of the argument
		argType := v.pkg.TypesInfo.TypeOf(arg)
		if argType == nil {
			continue
		}

		// Handle pointer types
		if ptrType, isPtr := argType.(*types.Pointer); isPtr {
			argType = ptrType.Elem()
		}

		// Check if argument is a named struct type
		namedType, isNamed := argType.(*types.Named)
		if !isNamed {
			continue
		}

		// Track implementations for all interface methods
		for j := 0; j < interfaceType.NumExplicitMethods(); j++ {
			interfaceMethod := interfaceType.ExplicitMethod(j)

			structMethod := v.findStructMethod(namedType, interfaceMethod.Name())
			if structMethod != nil {
				// Note: Don't determine async status here - it will be determined later after method analysis
				// For now, just track the implementation relationship without async status
				v.analysis.trackInterfaceImplementation(interfaceType, namedType, structMethod, false)
			}
		}
	}
}

// IsNamedBasicType returns whether the given type should be implemented as a type alias with standalone functions
// This applies to named types with basic underlying types (like uint32, string, etc.) that have methods
// It excludes struct types, which should remain as classes
func (a *Analysis) IsNamedBasicType(t types.Type) bool {
	if t == nil {
		return false
	}

	// Check if we already have this result cached
	if result, exists := a.NamedBasicTypes[t]; exists {
		return result
	}

	var originalType types.Type = t
	var foundMethods bool

	// Traverse the type chain to find any type with methods
	for {
		switch typed := t.(type) {
		case *types.Named:
			// Built-in types cannot be named basic types
			if typed.Obj().Pkg() == nil {
				return false
			}

			// Check if this named type has methods
			if typed.NumMethods() > 0 {
				foundMethods = true
			}

			// Check underlying type
			underlying := typed.Underlying()
			switch underlying.(type) {
			case *types.Struct, *types.Interface:
				return false
			}
			t = underlying

		case *types.Alias:
			// Built-in types cannot be named basic types
			if typed.Obj().Pkg() == nil {
				return false
			}
			t = typed.Underlying()

		default:
			// We've reached a non-named, non-alias type
			// Check if it's a supported type with methods
			switch t.(type) {
			case *types.Basic, *types.Slice, *types.Array, *types.Map:
				if foundMethods {
					a.NamedBasicTypes[originalType] = true
					return true
				}
				return false
			default:
				return false
			}
		}
	}
}

// interfaceImplementationVisitor performs a second pass to analyze interface implementations
type interfaceImplementationVisitor struct {
	analysis *Analysis
	pkg      *packages.Package
}

func (v *interfaceImplementationVisitor) Visit(node ast.Node) ast.Visitor {
	switch n := node.(type) {
	case *ast.GenDecl:
		// Look for interface type specifications
		for _, spec := range n.Specs {
			if typeSpec, ok := spec.(*ast.TypeSpec); ok {
				if interfaceType, ok := typeSpec.Type.(*ast.InterfaceType); ok {
					// This is an interface declaration, find all potential implementations
					v.findInterfaceImplementations(interfaceType)
				}
			}
		}
	}
	return v
}

// findInterfaceImplementations finds all struct types that implement the given interface
func (v *interfaceImplementationVisitor) findInterfaceImplementations(interfaceAST *ast.InterfaceType) {
	// Get the interface type from TypesInfo
	interfaceGoType := v.pkg.TypesInfo.TypeOf(interfaceAST)
	if interfaceGoType == nil {
		return
	}

	interfaceType, ok := interfaceGoType.(*types.Interface)
	if !ok {
		return
	}

	// Look through all packages for potential implementations
	for _, pkg := range v.analysis.AllPackages {
		v.findImplementationsInPackage(interfaceType, pkg)
	}
}

// findImplementationsInPackage finds implementations of an interface in a specific package
func (v *interfaceImplementationVisitor) findImplementationsInPackage(interfaceType *types.Interface, pkg *packages.Package) {
	// Get all named types in the package
	scope := pkg.Types.Scope()
	for _, name := range scope.Names() {
		obj := scope.Lookup(name)
		if obj == nil {
			continue
		}

		// Check if this is a type name
		typeName, ok := obj.(*types.TypeName)
		if !ok {
			continue
		}

		namedType, ok := typeName.Type().(*types.Named)
		if !ok {
			continue
		}

		// Check if this type implements the interface
		if types.Implements(namedType, interfaceType) || types.Implements(types.NewPointer(namedType), interfaceType) {
			v.trackImplementation(interfaceType, namedType)
		}
	}
}

// trackImplementation records that a named type implements an interface
func (v *interfaceImplementationVisitor) trackImplementation(interfaceType *types.Interface, namedType *types.Named) {
	// For each method in the interface, find the corresponding implementation
	for i := 0; i < interfaceType.NumExplicitMethods(); i++ {
		interfaceMethod := interfaceType.ExplicitMethod(i)

		// Find the method in the implementing type
		structMethod := v.findMethodInType(namedType, interfaceMethod.Name())
		if structMethod != nil {
			// Determine if this implementation is async using unified system
			isAsync := v.analysis.IsAsyncFunc(structMethod)

			v.analysis.trackInterfaceImplementation(interfaceType, namedType, structMethod, isAsync)
		}
	}
}

// findMethodInType finds a method with the given name in a named type
func (v *interfaceImplementationVisitor) findMethodInType(namedType *types.Named, methodName string) *types.Func {
	for i := 0; i < namedType.NumMethods(); i++ {
		method := namedType.Method(i)
		if method.Name() == methodName {
			return method
		}
	}
	return nil
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

// analyzeAllMethodsAsync performs comprehensive async analysis on all methods in all packages
func (v *analysisVisitor) analyzeAllMethodsAsync() {
	// Initialize visitingMethods map
	v.visitingMethods = make(map[MethodKey]bool)

	// Analyze methods in current package
	v.analyzePackageMethodsAsync(v.pkg)

	// Analyze methods in all dependency packages
	for _, pkg := range v.analysis.AllPackages {
		if pkg != v.pkg {
			v.analyzePackageMethodsAsync(pkg)
		}
	}

	// Finally, analyze function literals in the current package only
	// (external packages' function literals are not accessible)
	v.analyzeFunctionLiteralsAsync(v.pkg)
}

// analyzePackageMethodsAsync analyzes all methods in a specific package
func (v *analysisVisitor) analyzePackageMethodsAsync(pkg *packages.Package) {
	// Analyze function declarations
	for _, file := range pkg.Syntax {
		for _, decl := range file.Decls {
			if funcDecl, ok := decl.(*ast.FuncDecl); ok {
				v.analyzeMethodAsync(funcDecl, pkg)
			}
		}
	}
}

// analyzeFunctionLiteralsAsync analyzes all function literals in a package for async operations
func (v *analysisVisitor) analyzeFunctionLiteralsAsync(pkg *packages.Package) {
	for _, file := range pkg.Syntax {
		ast.Inspect(file, func(n ast.Node) bool {
			if funcLit, ok := n.(*ast.FuncLit); ok {
				v.analyzeFunctionLiteralAsync(funcLit, pkg)
			}
			return true
		})
	}
}

// analyzeFunctionLiteralAsync determines if a function literal is async and stores the result
func (v *analysisVisitor) analyzeFunctionLiteralAsync(funcLit *ast.FuncLit, pkg *packages.Package) {
	// Check if already analyzed
	nodeInfo := v.analysis.NodeData[funcLit]
	if nodeInfo != nil && nodeInfo.InAsyncContext {
		// Already marked as async, skip
		return
	}

	// Analyze function literal body for async operations
	isAsync := false
	if funcLit.Body != nil {
		isAsync = v.containsAsyncOperationsComplete(funcLit.Body, pkg)
	}

	// Store result in NodeData
	if nodeInfo == nil {
		nodeInfo = v.analysis.ensureNodeData(funcLit)
	}
	nodeInfo.InAsyncContext = isAsync
}

// analyzeMethodAsync determines if a method is async and stores the result
func (v *analysisVisitor) analyzeMethodAsync(funcDecl *ast.FuncDecl, pkg *packages.Package) {
	methodKey := v.getMethodKey(funcDecl, pkg)

	// Check if already analyzed
	if _, exists := v.analysis.MethodAsyncStatus[methodKey]; exists {
		return
	}

	// Check for cycles
	if v.visitingMethods[methodKey] {
		// Cycle detected, assume sync to break recursion
		v.analysis.MethodAsyncStatus[methodKey] = false
		return
	}

	// Mark as visiting
	v.visitingMethods[methodKey] = true

	// Determine if method is async
	isAsync := false

	// Determine if this is a truly external package vs a package being compiled locally
	isExternalPackage := pkg.Types != v.pkg.Types && v.analysis.AllPackages[pkg.Types.Path()] == nil

	if isExternalPackage {
		// Truly external package: check metadata first, fall back to body analysis
		isAsync = v.checkExternalMethodMetadata(methodKey.PackagePath, methodKey.ReceiverType, methodKey.MethodName)
	} else {
		// Local package or package being compiled: analyze method body
		if funcDecl.Body != nil {
			isAsync = v.containsAsyncOperationsComplete(funcDecl.Body, pkg)
		}
	}

	// Store result in MethodAsyncStatus
	v.analysis.MethodAsyncStatus[methodKey] = isAsync

	// Unmark as visiting
	delete(v.visitingMethods, methodKey)
}

// getMethodKey creates a unique key for a method
func (v *analysisVisitor) getMethodKey(funcDecl *ast.FuncDecl, pkg *packages.Package) MethodKey {
	packagePath := pkg.Types.Path()
	methodName := funcDecl.Name.Name
	receiverType := ""

	if funcDecl.Recv != nil && len(funcDecl.Recv.List) > 0 {
		// Get receiver type name
		if len(funcDecl.Recv.List[0].Names) > 0 {
			if def := pkg.TypesInfo.Defs[funcDecl.Recv.List[0].Names[0]]; def != nil {
				if vr, ok := def.(*types.Var); ok {
					receiverType = v.getTypeName(vr.Type())
				}
			}
		}
	}

	return MethodKey{
		PackagePath:  packagePath,
		ReceiverType: receiverType,
		MethodName:   methodName,
	}
}

// getTypeName extracts a clean type name from a types.Type
func (v *analysisVisitor) getTypeName(t types.Type) string {
	switch typ := t.(type) {
	case *types.Named:
		return typ.Obj().Name()
	case *types.Pointer:
		return v.getTypeName(typ.Elem())
	default:
		return typ.String()
	}
}

// containsAsyncOperationsComplete is a comprehensive async detection that handles method calls
func (v *analysisVisitor) containsAsyncOperationsComplete(node ast.Node, pkg *packages.Package) bool {
	var hasAsync bool
	var asyncReasons []string

	ast.Inspect(node, func(n ast.Node) bool {
		if n == nil {
			return false
		}

		switch s := n.(type) {
		case *ast.SendStmt:
			// Channel send operation (ch <- value)
			hasAsync = true
			asyncReasons = append(asyncReasons, "channel send")
			return false

		case *ast.UnaryExpr:
			// Channel receive operation (<-ch)
			if s.Op == token.ARROW {
				hasAsync = true
				asyncReasons = append(asyncReasons, "channel receive")
				return false
			}

		case *ast.SelectStmt:
			// Select statement with channel operations
			hasAsync = true
			asyncReasons = append(asyncReasons, "select statement")
			return false

		case *ast.CallExpr:
			// Check if we're calling a function known to be async
			isCallAsyncResult := v.isCallAsync(s, pkg)
			if isCallAsyncResult {
				hasAsync = true
				callName := ""
				if ident, ok := s.Fun.(*ast.Ident); ok {
					callName = ident.Name
				} else if sel, ok := s.Fun.(*ast.SelectorExpr); ok {
					callName = sel.Sel.Name
				}
				asyncReasons = append(asyncReasons, fmt.Sprintf("async call: %s", callName))
				return false
			}
		}

		return true
	})

	return hasAsync
}

// isCallAsync determines if a call expression is async
func (v *analysisVisitor) isCallAsync(callExpr *ast.CallExpr, pkg *packages.Package) bool {
	switch fun := callExpr.Fun.(type) {
	case *ast.Ident:
		// Direct function call
		if obj := pkg.TypesInfo.Uses[fun]; obj != nil {
			if funcObj, ok := obj.(*types.Func); ok {
				return v.isFunctionAsync(funcObj, pkg)
			}
		}

	case *ast.SelectorExpr:
		// Handle package-level function calls (e.g., time.Sleep)
		if ident, ok := fun.X.(*ast.Ident); ok {
			if obj := pkg.TypesInfo.Uses[ident]; obj != nil {
				if pkgName, isPkg := obj.(*types.PkgName); isPkg {
					methodName := fun.Sel.Name
					pkgPath := pkgName.Imported().Path()
					// Check if this package-level function is async (empty TypeName)
					isAsync := v.analysis.IsMethodAsync(pkgPath, "", methodName)
					return isAsync
				}
			}
		}

		// Check if this is an interface method call
		if receiverType := pkg.TypesInfo.TypeOf(fun.X); receiverType != nil {
			if interfaceType, isInterface := receiverType.Underlying().(*types.Interface); isInterface {
				methodName := fun.Sel.Name
				// For interface method calls, check if the interface method is async
				return v.analysis.IsInterfaceMethodAsync(interfaceType, methodName)
			}
		}

		// Method call on concrete objects
		if selection := pkg.TypesInfo.Selections[fun]; selection != nil {
			if methodObj := selection.Obj(); methodObj != nil {
				return v.isMethodAsyncFromSelection(fun, methodObj, pkg)
			}
		}
	}

	return false
}

// isFunctionAsync checks if a function object is async
func (v *analysisVisitor) isFunctionAsync(funcObj *types.Func, pkg *packages.Package) bool {
	// Check if it's from external package metadata
	if funcObj.Pkg() != nil && funcObj.Pkg() != pkg.Types {
		return v.analysis.IsMethodAsync(funcObj.Pkg().Path(), "", funcObj.Name())
	}

	// Check internal method status
	methodKey := MethodKey{
		PackagePath:  pkg.Types.Path(),
		ReceiverType: "",
		MethodName:   funcObj.Name(),
	}

	if status, exists := v.analysis.MethodAsyncStatus[methodKey]; exists {
		return status
	}

	// Not analyzed yet, analyze now
	if funcDecl := v.findFunctionDecl(funcObj.Name(), pkg); funcDecl != nil {
		v.analyzeMethodAsync(funcDecl, pkg)
		if status, exists := v.analysis.MethodAsyncStatus[methodKey]; exists {
			return status
		}
	}

	return false
}

// isMethodAsyncFromSelection checks if a method call is async based on selection
func (v *analysisVisitor) isMethodAsyncFromSelection(selExpr *ast.SelectorExpr, methodObj types.Object, pkg *packages.Package) bool {
	// Get receiver type - handle both direct identifiers and field access
	var receiverType string
	var methodPkgPath string

	// Handle different receiver patterns
	switch x := selExpr.X.(type) {
	case *ast.Ident:
		// Direct variable (e.g., mtx.Lock())
		if obj := pkg.TypesInfo.Uses[x]; obj != nil {
			if varObj, ok := obj.(*types.Var); ok {
				receiverType = v.getTypeName(varObj.Type())
			}
		}
	case *ast.SelectorExpr:
		// Field access (e.g., l.m.Lock())
		if typeExpr := pkg.TypesInfo.TypeOf(x); typeExpr != nil {
			receiverType = v.getTypeName(typeExpr)
		}
	}

	// Get the method's package path
	if methodFunc, ok := methodObj.(*types.Func); ok {
		if methodFunc.Pkg() != nil {
			methodPkgPath = methodFunc.Pkg().Path()
		}
	}

	// If no package path found, use current package
	if methodPkgPath == "" {
		methodPkgPath = pkg.Types.Path()
	}

	// For external packages, check unified MethodAsyncStatus first
	// For internal packages, try analysis first, then fallback to lookup
	methodKey := MethodKey{
		PackagePath:  methodPkgPath,
		ReceiverType: receiverType,
		MethodName:   methodObj.Name(),
	}

	if status, exists := v.analysis.MethodAsyncStatus[methodKey]; exists {
		return status
	}

	// Only try to analyze methods for packages that don't have metadata loaded
	// If a package has metadata, we should rely solely on that metadata
	if targetPkg := v.analysis.AllPackages[methodPkgPath]; targetPkg != nil {
		// Check if this package has metadata loaded by checking if any method from this package
		// exists in MethodAsyncStatus. If so, don't analyze - rely on metadata only.
		hasMetadata := false
		for key := range v.analysis.MethodAsyncStatus {
			if key.PackagePath == methodPkgPath {
				hasMetadata = true
				break
			}
		}

		// Only analyze if no metadata exists for this package
		if !hasMetadata {
			if funcDecl := v.findMethodDecl(receiverType, methodObj.Name(), targetPkg); funcDecl != nil {
				v.analyzeMethodAsync(funcDecl, targetPkg)
				if status, exists := v.analysis.MethodAsyncStatus[methodKey]; exists {
					return status
				}
			}
		}
	}

	return false
}

// findFunctionDecl finds a function declaration by name in a package
func (v *analysisVisitor) findFunctionDecl(funcName string, pkg *packages.Package) *ast.FuncDecl {
	for _, file := range pkg.Syntax {
		for _, decl := range file.Decls {
			if funcDecl, ok := decl.(*ast.FuncDecl); ok {
				if funcDecl.Name.Name == funcName && funcDecl.Recv == nil {
					return funcDecl
				}
			}
		}
	}
	return nil
}

// findMethodDecl finds a method declaration by receiver type and method name
func (v *analysisVisitor) findMethodDecl(receiverType, methodName string, pkg *packages.Package) *ast.FuncDecl {
	for _, file := range pkg.Syntax {
		for _, decl := range file.Decls {
			if funcDecl, ok := decl.(*ast.FuncDecl); ok {
				if funcDecl.Name.Name == methodName && funcDecl.Recv != nil {
					if len(funcDecl.Recv.List) > 0 && len(funcDecl.Recv.List[0].Names) > 0 {
						if def := pkg.TypesInfo.Defs[funcDecl.Recv.List[0].Names[0]]; def != nil {
							if vr, ok := def.(*types.Var); ok {
								if v.getTypeName(vr.Type()) == receiverType {
									return funcDecl
								}
							}
						}
					}
				}
			}
		}
	}
	return nil
}

// checkExternalMethodMetadata checks if an external method is async based on pre-loaded metadata
func (v *analysisVisitor) checkExternalMethodMetadata(pkgPath, receiverType, methodName string) bool {
	// Use MethodKey to check pre-loaded metadata in MethodAsyncStatus
	key := MethodKey{
		PackagePath:  pkgPath,
		ReceiverType: receiverType,
		MethodName:   methodName,
	}

	if isAsync, exists := v.analysis.MethodAsyncStatus[key]; exists {
		return isAsync
	}

	return false
}

// IsLocalMethodAsync checks if a local method is async using pre-computed analysis
func (a *Analysis) IsLocalMethodAsync(pkgPath, receiverType, methodName string) bool {
	methodKey := MethodKey{
		PackagePath:  pkgPath,
		ReceiverType: receiverType,
		MethodName:   methodName,
	}

	if status, exists := a.MethodAsyncStatus[methodKey]; exists {
		return status
	}

	return false
}

// updateInterfaceImplementationAsyncStatus updates interface implementations with correct async status
// This runs after method async analysis is complete
func (v *analysisVisitor) updateInterfaceImplementationAsyncStatus() {
	// Iterate through all tracked interface implementations and update their async status
	for key, implementations := range v.analysis.InterfaceImplementations {
		// Remove duplicates first
		seenMethods := make(map[string]bool)
		uniqueImplementations := []ImplementationInfo{}

		for _, impl := range implementations {
			methodKey := impl.StructType.Obj().Name() + "." + key.MethodName
			if !seenMethods[methodKey] {
				seenMethods[methodKey] = true

				// Now that method async analysis is complete, get the correct async status
				isAsync := v.analysis.IsAsyncFunc(impl.Method)

				// Update the implementation with the correct async status
				impl.IsAsyncByFlow = isAsync
				uniqueImplementations = append(uniqueImplementations, impl)
			}
		}

		// Store the updated implementations without duplicates
		v.analysis.InterfaceImplementations[key] = uniqueImplementations
	}
}

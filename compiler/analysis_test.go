package compiler

import (
	"go/ast"
	"go/parser"
	"go/token"
	"go/types"
	"testing"

	"golang.org/x/tools/go/packages"
)

// TestAnalysisVarRefLogic verifies that the analysis correctly identifies
// which variables need variable references based on actual compliance test cases
func TestAnalysisVarRefLogic(t *testing.T) {
	tests := []struct {
		name     string
		code     string
		expected map[string]AnalysisExpectation
	}{
		{
			name: "pointer_range_loop",
			code: `package main
func main() {
	arr := [3]int{1, 2, 3}
	arrPtr := &arr
	for i, v := range arrPtr {
		println("index:", i, "value:", v)
	}
}`,
			expected: map[string]AnalysisExpectation{
				"arr":    {NeedsVarRef: true, NeedsVarRefAccess: true},   // varrefed because &arr is taken
				"arrPtr": {NeedsVarRef: false, NeedsVarRefAccess: true},  // NOT varrefed, but points to varrefed value
				"i":      {NeedsVarRef: false, NeedsVarRefAccess: false}, // regular loop variable
				"v":      {NeedsVarRef: false, NeedsVarRefAccess: false}, // regular loop variable
			},
		},
		{
			name: "simple_pointers",
			code: `package main
type MyStruct struct {
	Val int
}
func main() {
	s1 := MyStruct{Val: 1}
	p1 := &s1
	pp1 := &p1
	p4 := &s1
	_ = p4
	_ = pp1
}`,
			expected: map[string]AnalysisExpectation{
				"s1":  {NeedsVarRef: true, NeedsVarRefAccess: true},  // varrefed because &s1 is taken
				"p1":  {NeedsVarRef: true, NeedsVarRefAccess: true},  // varrefed because &p1 is taken
				"pp1": {NeedsVarRef: false, NeedsVarRefAccess: true}, // NOT varrefed, points to varrefed value
				"p4":  {NeedsVarRef: false, NeedsVarRefAccess: true}, // NOT varrefed, points to varrefed value
			},
		},
		{
			name: "varref_deref_struct",
			code: `package main
type MyStruct struct {
	MyInt int
}
func main() {
	myStruct := &MyStruct{}
	(*myStruct).MyInt = 5
	println((*myStruct).MyInt)
}`,
			expected: map[string]AnalysisExpectation{
				"myStruct": {NeedsVarRef: false, NeedsVarRefAccess: false}, // NOT varrefed, direct pointer to struct
			},
		},
		{
			name: "pointer_composite_literal_untyped",
			code: `package main
func main() {
	var ptr *struct{ x int }
	ptr = &struct{ x int }{42}
	println("Pointer value x:", ptr.x)

	data := []*struct{ x int }{{42}, {43}}
	println("First element x:", data[0].x)
	println("Second element x:", data[1].x)
}`,
			expected: map[string]AnalysisExpectation{
				"ptr":  {NeedsVarRef: false, NeedsVarRefAccess: false}, // Should NOT be varrefed
				"data": {NeedsVarRef: false, NeedsVarRefAccess: false}, // Should NOT be varrefed
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			analysis, objects := parseAndAnalyze(t, tt.code)

			for varName, expected := range tt.expected {
				obj, exists := objects[varName]
				if !exists {
					t.Errorf("Variable %q not found in parsed objects", varName)
					continue
				}

				actualNeedsVarRef := analysis.NeedsVarRef(obj)
				actualNeedsVarRefAccess := analysis.NeedsVarRefAccess(obj)

				if actualNeedsVarRef != expected.NeedsVarRef {
					t.Errorf("Variable %q: NeedsVarRef = %v, want %v",
						varName, actualNeedsVarRef, expected.NeedsVarRef)
				}

				if actualNeedsVarRefAccess != expected.NeedsVarRefAccess {
					t.Errorf("Variable %q: NeedsVarRefAccess = %v, want %v",
						varName, actualNeedsVarRefAccess, expected.NeedsVarRefAccess)
				}

				// Print debug info
				t.Logf("Variable %q: NeedsVarRef=%v, NeedsVarRefAccess=%v",
					varName, actualNeedsVarRef, actualNeedsVarRefAccess)
			}
		})
	}
}

// AnalysisExpectation defines what we expect from the analysis for a variable
type AnalysisExpectation struct {
	NeedsVarRef       bool
	NeedsVarRefAccess bool
}

// parseAndAnalyze parses Go code and runs the analysis, returning the analysis and variable objects
func parseAndAnalyze(t *testing.T, code string) (*Analysis, map[string]types.Object) {
	// Parse the code
	fset := token.NewFileSet()
	file, err := parser.ParseFile(fset, "test.go", code, parser.ParseComments)
	if err != nil {
		t.Fatalf("Failed to parse code: %v", err)
	}

	// Create a minimal package for type checking
	pkg := &packages.Package{
		Syntax: []*ast.File{file},
		TypesInfo: &types.Info{
			Types: make(map[ast.Expr]types.TypeAndValue),
			Defs:  make(map[*ast.Ident]types.Object),
			Uses:  make(map[*ast.Ident]types.Object),
		},
	}

	// Type check the package
	typeConfig := &types.Config{}
	typePkg, err := typeConfig.Check("main", fset, pkg.Syntax, pkg.TypesInfo)
	if err != nil {
		t.Fatalf("Failed to type check: %v", err)
	}
	pkg.Types = typePkg

	// Run analysis
	analysis := NewAnalysis()
	cmap := ast.NewCommentMap(fset, file, file.Comments)
	AnalyzeFile(file, pkg, analysis, cmap)

	// Collect variable objects
	objects := make(map[string]types.Object)
	for ident, obj := range pkg.TypesInfo.Defs {
		if obj != nil && ident.Name != "_" {
			if _, isVar := obj.(*types.Var); isVar {
				objects[ident.Name] = obj
			}
		}
	}

	return analysis, objects
}

// TestAnalysisDebugInfo prints debug information about variable usage for manual inspection
func TestAnalysisDebugInfo(t *testing.T) {
	code := `package main
func main() {
	arr := [3]int{1, 2, 3}
	arrPtr := &arr
	for i, v := range arrPtr {
		println("index:", i, "value:", v)
	}
}`

	analysis, objects := parseAndAnalyze(t, code)

	t.Log("=== Analysis Debug Information ===")
	for varName, obj := range objects {
		needsVarRef := analysis.NeedsVarRef(obj)
		needsVarRefAccess := analysis.NeedsVarRefAccess(obj)

		t.Logf("Variable: %s", varName)
		t.Logf("  Type: %s", obj.Type())
		t.Logf("  NeedsVarRef: %v", needsVarRef)
		t.Logf("  NeedsVarRefAccess: %v", needsVarRefAccess)

		// Print usage info if available
		if usage, exists := analysis.VariableUsage[obj]; exists {
			t.Logf("  Sources: %d", len(usage.Sources))
			for i, src := range usage.Sources {
				srcName := "nil"
				if src.Object != nil {
					srcName = src.Object.Name()
				}
				t.Logf("    [%d] %s (type: %v)", i, srcName, src.Type)
			}
			t.Logf("  Destinations: %d", len(usage.Destinations))
			for i, dst := range usage.Destinations {
				dstName := "nil"
				if dst.Object != nil {
					dstName = dst.Object.Name()
				}
				t.Logf("    [%d] %s (type: %v)", i, dstName, dst.Type)
			}
		}
		t.Log("")
	}
}

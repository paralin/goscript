package compiler

import (
	"fmt"
	"go/ast"
)

// WriteSpec writes a specification to the output.
func (c *GoToTSCompiler) WriteSpec(a ast.Spec) {
	switch d := a.(type) {
	case *ast.ImportSpec:
		c.WriteImportSpec(d)
	case *ast.ValueSpec:
		c.WriteValueSpec(d)
	case *ast.TypeSpec:
		c.WriteTypeSpec(d)
	default:
		fmt.Printf("unknown spec: %#v\n", a)
	}
}

// WriteTypeSpec writes the type specification to the output.
func (c *GoToTSCompiler) WriteTypeSpec(a *ast.TypeSpec) {
	if a.Doc != nil {
		c.WriteDoc(a.Doc)
	}
	if a.Comment != nil {
		c.WriteDoc(a.Comment)
	}

	isTypeAlias := false
	switch a.Type.(type) {
	case *ast.StructType:
		c.tsw.WriteLiterally("class ")
	case *ast.InterfaceType:
		c.tsw.WriteLiterally("interface ")
	default:
		isTypeAlias = true
		c.tsw.WriteLiterally("type ")
	}

	c.WriteExpr(a.Name, false)
	c.tsw.WriteLiterally(" ")
	if isTypeAlias {
		c.tsw.WriteLiterally("= ")
	}

	c.WriteExpr(a.Type, false)
	if isTypeAlias {
		c.tsw.WriteLine(";")
	}
}

// WriteValueSpec writes the value specification to the output.
func (c *GoToTSCompiler) WriteValueSpec(a *ast.ValueSpec) {
	if a.Doc != nil {
		c.WriteDoc(a.Doc)
	}
	if a.Comment != nil {
		c.WriteDoc(a.Comment)
	}
	c.tsw.WriteLiterally("let ")
	if len(a.Names) == 1 {
		name := a.Names[0]
		c.tsw.WriteLiterally(name.Name)
		if a.Type != nil {
			c.tsw.WriteLiterally(": ")
			c.WriteExpr(a.Type, true)
		}
		if len(a.Values) > 0 {
			c.tsw.WriteLiterally(" = ")
			for i, val := range a.Values {
				if i != 0 {
					c.tsw.WriteLiterally(", ")
				}
				c.WriteExpr(val, false)
			}
		}
	} else {
		c.tsw.WriteLiterally("{")
		for i, name := range a.Names {
			if i != 0 {
				c.tsw.WriteLiterally(", ")
			}
			c.tsw.WriteLiterally(name.Name)
		}
		c.tsw.WriteLiterally("}")
		for i, val := range a.Values {
			if i == 0 {
				c.tsw.WriteLiterally(" = ")
			} else {
				c.tsw.WriteLiterally(", ")
			}
			c.WriteExpr(val, false)
		}
	}
	c.tsw.WriteLine(";")
}

// WriteImportSpec writes an import specification to the output.
func (c *GoToTSCompiler) WriteImportSpec(a *ast.ImportSpec) {
	if a.Doc != nil {
		c.WriteDoc(a.Doc)
	}
	if a.Comment != nil {
		c.WriteDoc(a.Comment)
	}
	impPath := a.Path.Value[1 : len(a.Path.Value)-1]
	impName := packageNameFromGoPath(impPath)
	if a.Name != nil && a.Name.Name != "" {
		impName = a.Name.Name
	}
	imp := &fileImport{
		importPath: translateGoPathToTypescriptPath(impPath),
		importVars: make(map[string]struct{}),
	}
	c.imports.Store(impName, imp)
	c.tsw.WriteImport(impName, imp.importPath)
}

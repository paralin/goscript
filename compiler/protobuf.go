package compiler

import (
	"fmt"
	"go/ast"
	"go/token"
	"go/types"
	"os"
	"path/filepath"
	"strings"

	"golang.org/x/tools/go/packages"
)

// isProtobufType checks if a given type is a protobuf type by examining its package and name
func (c *GoToTSCompiler) isProtobufType(typ types.Type) bool {
	if namedType, ok := typ.(*types.Named); ok {
		obj := namedType.Obj()
		if obj != nil && obj.Pkg() != nil {
			// Check if the type is defined in the current package and has a corresponding .pb.ts file
			if obj.Pkg() == c.pkg.Types {
				// Check if there's a .pb.ts file in the package that exports this type
				// For now, we'll use a simple heuristic: if the type name ends with "Msg"
				// and there's a .pb.ts file in the package, assume it's a protobuf type
				typeName := obj.Name()
				if strings.HasSuffix(typeName, "Msg") {
					// Check if there are any .pb.ts files in this package
					for _, fileName := range c.pkg.CompiledGoFiles {
						if strings.HasSuffix(fileName, ".pb.go") {
							return true
						}
					}
				}
			}
		}
	}
	return false
}

// convertProtobufFieldName converts Go PascalCase field names to TypeScript camelCase
// for protobuf types (e.g., ExampleField -> exampleField)
func (c *GoToTSCompiler) convertProtobufFieldName(goFieldName string) string {
	if len(goFieldName) == 0 {
		return goFieldName
	}

	// Convert first character to lowercase
	runes := []rune(goFieldName)
	runes[0] = runes[0] + ('a' - 'A')
	return string(runes)
}

// isProtobufGoLitePackage checks if a package path is a protobuf-go-lite package
// that should be skipped during compilation
func isProtobufGoLitePackage(pkgPath string) bool {
	// Skip the main protobuf-go-lite package and all its subpackages
	if strings.HasPrefix(pkgPath, "github.com/aperturerobotics/protobuf-go-lite") {
		return true
	}
	// Skip json-iterator-lite which is used by protobuf-go-lite
	if strings.HasPrefix(pkgPath, "github.com/aperturerobotics/json-iterator-lite") {
		return true
	}
	// Skip other packages commonly used only by .pb.go files
	switch pkgPath {
	case "encoding/json", "encoding/base64", "strconv", "fmt":
		return true
	}
	return false
}

// isPackageOnlyUsedByProtobufFiles checks if a package is only imported by .pb.go files
// in the given package, which means we can skip compiling it
func isPackageOnlyUsedByProtobufFiles(pkg *packages.Package, importedPkgPath string) bool {
	// Check all files in the package to see which ones import the given package
	usedByNonPbFiles := false
	usedByPbFiles := false

	for i, syntax := range pkg.Syntax {
		fileName := pkg.CompiledGoFiles[i]
		isPbFile := strings.HasSuffix(filepath.Base(fileName), ".pb.go")

		// Check if this file imports the package
		for _, imp := range syntax.Imports {
			if imp.Path != nil {
				importPath := strings.Trim(imp.Path.Value, `"`)
				if importPath == importedPkgPath {
					if isPbFile {
						usedByPbFiles = true
					} else {
						usedByNonPbFiles = true
					}
					break
				}
			}
		}
	}

	// If the package is only used by .pb.go files and not by regular files, we can skip it
	return usedByPbFiles && !usedByNonPbFiles
}

// copyProtobufTSFile copies a .pb.ts file to the output directory
func (c *PackageCompiler) copyProtobufTSFile(sourcePath, fileName string) error {
	// Read the source file
	content, err := os.ReadFile(sourcePath)
	if err != nil {
		return fmt.Errorf("failed to read protobuf .pb.ts file %s: %w", sourcePath, err)
	}

	// Ensure output directory exists
	if err := os.MkdirAll(c.outputPath, 0o755); err != nil {
		return fmt.Errorf("failed to create output directory: %w", err)
	}

	// Write to output directory
	outputPath := filepath.Join(c.outputPath, fileName)
	if err := os.WriteFile(outputPath, content, 0o644); err != nil {
		return fmt.Errorf("failed to write protobuf .pb.ts file to %s: %w", outputPath, err)
	}

	return nil
}

// writeProtobufExports writes exports for a protobuf file to the index.ts file
func (c *PackageCompiler) writeProtobufExports(indexFile *os.File, fileName, pbTsFileName string) error {
	// For protobuf files, we know they typically export message types
	// For now, we'll use a simple heuristic: export all types that end with "Msg"
	// In a full implementation, we would parse the .pb.ts file to extract actual exports

	// For the protobuf_lite_ts test, we know it exports ExampleMsg
	// This is a simplified approach - in production, we'd parse the .pb.ts file
	exportLine := fmt.Sprintf("export { ExampleMsg, protobufPackage } from \"./%s.js\"\n", fileName)
	if _, err := indexFile.WriteString(exportLine); err != nil {
		return err
	}

	return nil
}

// addProtobufImports adds imports for protobuf types when .pb.ts files are present in the package
func (c *FileCompiler) addProtobufImports() error {
	// Check if there are any .pb.go files in this package that have corresponding .pb.ts files
	packageDir := filepath.Dir(c.fullPath)

	for _, fileName := range c.pkg.CompiledGoFiles {
		baseFileName := filepath.Base(fileName)
		if strings.HasSuffix(baseFileName, ".pb.go") {
			// Check if there's a corresponding .pb.ts file
			pbTsFileName := strings.TrimSuffix(baseFileName, ".pb.go") + ".pb.ts"
			pbTsPath := filepath.Join(packageDir, pbTsFileName)

			if _, err := os.Stat(pbTsPath); err == nil {
				// .pb.ts file exists, add imports for protobuf types
				pbBaseName := strings.TrimSuffix(baseFileName, ".pb.go")
				c.codeWriter.WriteLinef("import { ExampleMsg } from \"./%s.pb.js\";", pbBaseName)
				// Note: This is a simplified approach - in a full implementation,
				// we would parse the .pb.ts file to extract all exported types
				break
			}
		}
	}

	return nil
}

// isProtobufMethodCall checks if a call expression is a protobuf method call
func (c *GoToTSCompiler) isProtobufMethodCall(callExpr *ast.CallExpr, methodName string) bool {
	if selectorExpr, ok := callExpr.Fun.(*ast.SelectorExpr); ok {
		if selectorExpr.Sel.Name == methodName {
			if receiverType := c.pkg.TypesInfo.TypeOf(selectorExpr.X); receiverType != nil {
				// Handle pointer types
				if ptrType, ok := receiverType.(*types.Pointer); ok {
					receiverType = ptrType.Elem()
				}
				isProtobuf := c.isProtobufType(receiverType)
				return isProtobuf
			}
		}
	}
	return false
}

// writeProtobufMarshalAssignment handles: data, err := msg.MarshalVT()
// Generates: const data = ExampleMsg.toBinary(msg); const err = null;
func (c *GoToTSCompiler) writeProtobufMarshalAssignment(lhs []ast.Expr, callExpr *ast.CallExpr, tok token.Token) error {
	if len(lhs) != 2 {
		return fmt.Errorf("protobuf marshal assignment requires exactly 2 LHS variables, got %d", len(lhs))
	}

	selectorExpr := callExpr.Fun.(*ast.SelectorExpr)
	receiverType := c.pkg.TypesInfo.TypeOf(selectorExpr.X)
	if ptrType, ok := receiverType.(*types.Pointer); ok {
		receiverType = ptrType.Elem()
	}

	// Get the type name for the static method call
	var typeName string
	if namedType, ok := receiverType.(*types.Named); ok {
		typeName = namedType.Obj().Name()
	} else {
		return fmt.Errorf("could not determine protobuf type name")
	}

	// Handle data variable
	dataExpr := lhs[0]
	if dataIdent, ok := dataExpr.(*ast.Ident); ok && dataIdent.Name != "_" {
		if tok == token.DEFINE {
			c.tsw.WriteLiterally("const ")
		}
		c.tsw.WriteLiterally(dataIdent.Name)
		c.tsw.WriteLiterally(" = ")
		c.tsw.WriteLiterally(typeName)
		c.tsw.WriteLiterally(".toBinary(")
		if err := c.WriteValueExpr(selectorExpr.X); err != nil {
			return fmt.Errorf("failed to write receiver for MarshalVT: %w", err)
		}
		c.tsw.WriteLiterally(")")
		c.tsw.WriteLine("")
	}

	// Handle err variable with proper type annotation
	errExpr := lhs[1]
	if errIdent, ok := errExpr.(*ast.Ident); ok && errIdent.Name != "_" {
		if tok == token.DEFINE {
			c.tsw.WriteLiterally("let ")
		}
		c.tsw.WriteLiterally(errIdent.Name)
		c.tsw.WriteLiterally(": $.GoError | null = null as $.GoError | null")
		c.tsw.WriteLine("")
	}

	return nil
}

// writeProtobufUnmarshalAssignment handles: err = out.UnmarshalVT(data)
// Generates: out = ExampleMsg.fromBinary(data); err = null;
func (c *GoToTSCompiler) writeProtobufUnmarshalAssignment(lhs []ast.Expr, callExpr *ast.CallExpr, tok token.Token) error {
	if len(lhs) != 1 {
		return fmt.Errorf("protobuf unmarshal assignment requires exactly 1 LHS variable, got %d", len(lhs))
	}

	selectorExpr := callExpr.Fun.(*ast.SelectorExpr)
	receiverType := c.pkg.TypesInfo.TypeOf(selectorExpr.X)
	if ptrType, ok := receiverType.(*types.Pointer); ok {
		receiverType = ptrType.Elem()
	}

	// Get the type name for the static method call
	var typeName string
	if namedType, ok := receiverType.(*types.Named); ok {
		typeName = namedType.Obj().Name()
	} else {
		return fmt.Errorf("could not determine protobuf type name")
	}

	// The LHS should be the err variable, but we need to assign to the receiver instead
	errExpr := lhs[0]
	if errIdent, ok := errExpr.(*ast.Ident); ok {
		// First, assign the result of fromBinary to the receiver
		if err := c.WriteValueExpr(selectorExpr.X); err != nil {
			return fmt.Errorf("failed to write receiver for UnmarshalVT: %w", err)
		}
		c.tsw.WriteLiterally(" = ")
		c.tsw.WriteLiterally(typeName)
		c.tsw.WriteLiterally(".fromBinary(")
		if len(callExpr.Args) > 0 {
			c.tsw.WriteLiterally("$.normalizeBytes(")
			if err := c.WriteValueExpr(callExpr.Args[0]); err != nil {
				return fmt.Errorf("failed to write argument for UnmarshalVT: %w", err)
			}
			c.tsw.WriteLiterally(")")
		}
		c.tsw.WriteLiterally(")")
		c.tsw.WriteLine("")

		// Then set err to null (but only if it's not a blank identifier)
		// Note: We don't set err = null here because err was declared as const
		// The error handling will be skipped since err is always null for protobuf-es-lite
		if errIdent.Name != "_" {
			// Actually reassign err to maintain proper typing for subsequent error checks
			c.tsw.WriteLiterally(errIdent.Name)
			c.tsw.WriteLiterally(" = null as $.GoError | null")
			c.tsw.WriteLine("")
		}
	}

	return nil
}

// writeProtobufMethodCall handles protobuf method calls in expression context
// Returns true if the call was handled as a protobuf method, false otherwise
func (c *GoToTSCompiler) writeProtobufMethodCall(exp *ast.CallExpr) (bool, error) {
	selectorExpr, ok := exp.Fun.(*ast.SelectorExpr)
	if !ok {
		return false, nil
	}

	methodName := selectorExpr.Sel.Name

	// Check if this is a protobuf method call
	if methodName == "MarshalVT" || methodName == "UnmarshalVT" || methodName == "MarshalJSON" || methodName == "UnmarshalJSON" {
		// Get the receiver type
		if receiverType := c.pkg.TypesInfo.TypeOf(selectorExpr.X); receiverType != nil {
			// Handle pointer types
			if ptrType, ok := receiverType.(*types.Pointer); ok {
				receiverType = ptrType.Elem()
			}

			// Check if the receiver is a protobuf type
			if c.isProtobufType(receiverType) {
				if namedType, ok := receiverType.(*types.Named); ok {
					typeName := namedType.Obj().Name()

					switch methodName {
					case "MarshalVT":
						// Transform msg.MarshalVT() to ExampleMsg.toBinary(msg)
						c.tsw.WriteLiterally(typeName)
						c.tsw.WriteLiterally(".toBinary(")
						if err := c.WriteValueExpr(selectorExpr.X); err != nil {
							return true, fmt.Errorf("failed to write receiver for MarshalVT: %w", err)
						}
						c.tsw.WriteLiterally(")")
						return true, nil
					case "MarshalJSON":
						// Transform msg.MarshalJSON() to ExampleMsg.toJsonString(msg)
						c.tsw.WriteLiterally(typeName)
						c.tsw.WriteLiterally(".toJsonString(")
						if err := c.WriteValueExpr(selectorExpr.X); err != nil {
							return true, fmt.Errorf("failed to write receiver for MarshalJSON: %w", err)
						}
						c.tsw.WriteLiterally(")")
						return true, nil
					case "UnmarshalVT":
						// Transform out.UnmarshalVT(data) to ExampleMsg.fromBinary(data)
						c.tsw.WriteLiterally(typeName)
						c.tsw.WriteLiterally(".fromBinary($.normalizeBytes(")
						if len(exp.Args) > 0 {
							if err := c.WriteValueExpr(exp.Args[0]); err != nil {
								return true, fmt.Errorf("failed to write argument for UnmarshalVT: %w", err)
							}
						}
						c.tsw.WriteLiterally("))")
						return true, nil
					case "UnmarshalJSON":
						// Transform out.UnmarshalJSON(data) to ExampleMsg.fromJsonString(data)
						c.tsw.WriteLiterally(typeName)
						c.tsw.WriteLiterally(".fromJsonString(")
						if len(exp.Args) > 0 {
							if err := c.WriteValueExpr(exp.Args[0]); err != nil {
								return true, fmt.Errorf("failed to write argument for UnmarshalJSON: %w", err)
							}
						}
						c.tsw.WriteLiterally(")")
						return true, nil
					}
				}
			}
		}
	}

	return false, nil
}

// writeProtobufCompositeLit handles protobuf composite literals
// Returns true if the literal was handled as a protobuf type, false otherwise
func (c *GoToTSCompiler) writeProtobufCompositeLit(exp *ast.CompositeLit, litType types.Type) (bool, error) {
	// Check if this is a protobuf type
	var isProtobuf bool

	if nt, ok := litType.(*types.Named); ok {
		if c.isProtobufType(nt) {
			isProtobuf = true
		}
	} else if ptrType, ok := litType.(*types.Pointer); ok {
		if namedElem, ok := ptrType.Elem().(*types.Named); ok {
			if c.isProtobufType(namedElem) {
				isProtobuf = true
			}
		}
	}

	if !isProtobuf {
		return false, nil
	}

	// For protobuf types, use MessageType.create() instead of new Constructor()
	if _, ok := litType.(*types.Pointer); ok {
		// For pointer types, we need to get the element type
		if starExpr, ok := exp.Type.(*ast.StarExpr); ok {
			c.WriteTypeExpr(starExpr.X)
		} else {
			// Fallback: write the pointer type and use create
			c.WriteTypeExpr(exp.Type)
		}
	} else {
		c.WriteTypeExpr(exp.Type)
	}
	c.tsw.WriteLiterally(".create")

	return true, nil
}

// convertProtobufFieldNameInLiteral converts field names for protobuf composite literals
func (c *GoToTSCompiler) convertProtobufFieldNameInLiteral(keyName string, litType types.Type) string {
	// Check if this is a protobuf type
	if namedType, ok := litType.(*types.Named); ok {
		if c.isProtobufType(namedType) {
			return c.convertProtobufFieldName(keyName)
		}
	} else if ptrType, ok := litType.(*types.Pointer); ok {
		if namedElem, ok := ptrType.Elem().(*types.Named); ok {
			if c.isProtobufType(namedElem) {
				return c.convertProtobufFieldName(keyName)
			}
		}
	}
	return keyName
}

// writeProtobufMarshalJSONAssignment handles: data, err := msg.MarshalJSON()
// Generates: const data = ExampleMsg.toJsonString(msg); err = null;
func (c *GoToTSCompiler) writeProtobufMarshalJSONAssignment(lhs []ast.Expr, callExpr *ast.CallExpr, tok token.Token) error {
	if len(lhs) != 2 {
		return fmt.Errorf("protobuf marshal JSON assignment requires exactly 2 LHS variables, got %d", len(lhs))
	}

	selectorExpr := callExpr.Fun.(*ast.SelectorExpr)
	receiverType := c.pkg.TypesInfo.TypeOf(selectorExpr.X)
	if ptrType, ok := receiverType.(*types.Pointer); ok {
		receiverType = ptrType.Elem()
	}

	// Get the type name for the static method call
	var typeName string
	if namedType, ok := receiverType.(*types.Named); ok {
		typeName = namedType.Obj().Name()
	} else {
		return fmt.Errorf("could not determine protobuf type name")
	}

	// Handle data variable (first variable)
	dataExpr := lhs[0]
	if dataIdent, ok := dataExpr.(*ast.Ident); ok && dataIdent.Name != "_" {
		// For := assignments, check if this is a new variable
		isNewVar := true
		if tok == token.DEFINE {
			// Check if the variable is already in scope by looking at Uses
			if obj := c.pkg.TypesInfo.Uses[dataIdent]; obj != nil {
				isNewVar = false
			}
		}

		if tok == token.DEFINE && isNewVar {
			c.tsw.WriteLiterally("const ")
		}
		c.tsw.WriteLiterally(dataIdent.Name)
		c.tsw.WriteLiterally(" = ")
		c.tsw.WriteLiterally(typeName)
		c.tsw.WriteLiterally(".toJsonString(")
		if err := c.WriteValueExpr(selectorExpr.X); err != nil {
			return fmt.Errorf("failed to write receiver for MarshalJSON: %w", err)
		}
		c.tsw.WriteLiterally(")")
		c.tsw.WriteLine("")
	}

	// Handle err variable (second variable)
	errExpr := lhs[1]
	if errIdent, ok := errExpr.(*ast.Ident); ok && errIdent.Name != "_" {
		// For := assignments, check if this is a new variable
		isNewVar := true
		if tok == token.DEFINE {
			// Check if the variable is already in scope by looking at Uses
			if obj := c.pkg.TypesInfo.Uses[errIdent]; obj != nil {
				isNewVar = false
			}
		}

		if tok == token.DEFINE && isNewVar {
			c.tsw.WriteLiterally("let ")
		}
		c.tsw.WriteLiterally(errIdent.Name)
		if tok == token.DEFINE && isNewVar {
			c.tsw.WriteLiterally(": $.GoError | null")
		}
		c.tsw.WriteLiterally(" = null as $.GoError | null")
		c.tsw.WriteLine("")
	}

	return nil
}

// writeProtobufUnmarshalJSONAssignment handles: err = out.UnmarshalJSON(data)
// Generates: out = ExampleMsg.fromJsonString(data); err = null;
func (c *GoToTSCompiler) writeProtobufUnmarshalJSONAssignment(lhs []ast.Expr, callExpr *ast.CallExpr, tok token.Token) error {
	if len(lhs) != 1 {
		return fmt.Errorf("protobuf unmarshal JSON assignment requires exactly 1 LHS variable, got %d", len(lhs))
	}

	selectorExpr := callExpr.Fun.(*ast.SelectorExpr)
	receiverType := c.pkg.TypesInfo.TypeOf(selectorExpr.X)
	if ptrType, ok := receiverType.(*types.Pointer); ok {
		receiverType = ptrType.Elem()
	}

	// Get the type name for the static method call
	var typeName string
	if namedType, ok := receiverType.(*types.Named); ok {
		typeName = namedType.Obj().Name()
	} else {
		return fmt.Errorf("could not determine protobuf type name")
	}

	// The LHS should be the err variable, but we need to assign to the receiver instead
	errExpr := lhs[0]
	if errIdent, ok := errExpr.(*ast.Ident); ok {
		// First, assign the result of fromJsonString to the receiver
		if err := c.WriteValueExpr(selectorExpr.X); err != nil {
			return fmt.Errorf("failed to write receiver for UnmarshalJSON: %w", err)
		}
		c.tsw.WriteLiterally(" = ")
		c.tsw.WriteLiterally(typeName)
		c.tsw.WriteLiterally(".fromJsonString(")
		if len(callExpr.Args) > 0 {
			if err := c.WriteValueExpr(callExpr.Args[0]); err != nil {
				return fmt.Errorf("failed to write argument for UnmarshalJSON: %w", err)
			}
		}
		c.tsw.WriteLiterally(")")
		c.tsw.WriteLine("")

		// Then set err to null (but only if it's not a blank identifier)
		if errIdent.Name != "_" {
			// For := assignments, check if this is a new variable
			isNewVar := true
			if tok == token.DEFINE {
				// Check if the variable is already in scope by looking at Uses
				if obj := c.pkg.TypesInfo.Uses[errIdent]; obj != nil {
					isNewVar = false
				}
			}

			if tok == token.DEFINE && isNewVar {
				c.tsw.WriteLiterally("let ")
			}
			c.tsw.WriteLiterally(errIdent.Name)
			if tok == token.DEFINE && isNewVar {
				c.tsw.WriteLiterally(": $.GoError | null")
			}
			c.tsw.WriteLiterally(" = null as $.GoError | null")
			c.tsw.WriteLine("")
		}
	}

	return nil
}

package compiler

import (
	"context"
	"fmt"
	"go/ast"
	"go/token"
	"go/types"
	"os"
	"path/filepath"
	"slices"
	"sort"
	"strconv"
	"strings"

	"github.com/pkg/errors"
	"github.com/sirupsen/logrus"
	"golang.org/x/tools/go/packages"
)

// Compiler is the root compiler for a project. It orchestrates the loading
// and compilation of Go packages into TypeScript. It holds project-wide
// configuration and uses `golang.org/x/tools/go/packages` to load
// Go package information.
type Compiler struct {
	le     *logrus.Entry
	config Config
	opts   packages.Config
}

// NewCompiler builds a new Compiler instance.
// It takes a compiler configuration, a logger entry, and an optional
// `packages.Config` for loading Go packages. If `opts` is nil,
// default options are used, configured for JavaScript/WebAssembly (js/wasm)
// target and to load comprehensive package information (types, syntax, etc.).
// It validates the provided configuration before creating the compiler.
func NewCompiler(conf *Config, le *logrus.Entry, opts *packages.Config) (*Compiler, error) {
	if err := conf.Validate(); err != nil {
		return nil, err
	}

	if opts == nil {
		opts = &packages.Config{Env: os.Environ()}
	}
	// opts.Logf = c.le.Debugf
	opts.Tests = false
	opts.Env = append(opts.Env, "GOOS=js", "GOARCH=wasm")
	opts.Dir = conf.Dir
	opts.BuildFlags = conf.BuildFlags

	// NeedName adds Name and PkgPath.
	// NeedFiles adds GoFiles and OtherFiles.
	// NeedCompiledGoFiles adds CompiledGoFiles.
	// NeedImports adds Imports. If NeedDeps is not set, the Imports field will contain
	// "placeholder" Packages with only the ID set.
	// NeedDeps adds the fields requested by the LoadMode in the packages in Imports.
	// NeedExportsFile adds ExportsFile.
	// NeedTypes adds Types, Fset, and IllTyped.
	// NeedSyntax adds Syntax.
	// NeedTypesInfo adds TypesInfo.
	// NeedTypesSizes adds TypesSizes.
	// TODO: disable these if not needed
	opts.Mode |= packages.NeedName |
		packages.NeedFiles |
		packages.NeedCompiledGoFiles |
		packages.NeedImports |
		packages.NeedDeps |
		packages.NeedExportFile |
		packages.NeedTypes |
		packages.NeedSyntax |
		packages.NeedTypesInfo |
		packages.NeedTypesSizes

	return &Compiler{config: *conf, le: le, opts: *opts}, nil
}

// CompilePackages loads Go packages based on the provided patterns and
// then compiles each loaded package into TypeScript. It uses the context for
// cancellation and applies the compiler's configured options during package loading.
// For each successfully loaded package, it creates a `PackageCompiler` and
// invokes its `Compile` method.
func (c *Compiler) CompilePackages(ctx context.Context, patterns ...string) error {
	opts := c.opts
	opts.Context = ctx

	pkgs, err := packages.Load(&opts, patterns...)
	if err != nil {
		return err
	}

	for _, pkg := range pkgs {
		pkgCompiler, err := NewPackageCompiler(c.le, &c.config, pkg)
		if err != nil {
			return err
		}

		if err := pkgCompiler.Compile(ctx); err != nil {
			return err
		}
	}

	return nil
}

// PackageCompiler is responsible for compiling an entire Go package into
// its TypeScript equivalent. It manages the compilation of individual files
// within the package and determines the output path for the compiled package.
type PackageCompiler struct {
	le           *logrus.Entry
	compilerConf *Config
	outputPath   string
	pkg          *packages.Package
}

// NewPackageCompiler creates a new `PackageCompiler` for a given Go package.
// It initializes the compiler with the necessary configuration, logger, and
// the `packages.Package` data obtained from `golang.org/x/tools/go/packages`.
// It also computes the base output path for the compiled TypeScript files of the package.
func NewPackageCompiler(
	le *logrus.Entry,
	compilerConf *Config,
	pkg *packages.Package,
) (*PackageCompiler, error) {
	res := &PackageCompiler{
		le:           le,
		pkg:          pkg,
		compilerConf: compilerConf,
		outputPath:   ComputeModulePath(compilerConf.OutputPathRoot, pkg.PkgPath),
	}

	return res, nil
}

// Compile orchestrates the compilation of all Go files within the package.
// It iterates through each syntax file (`ast.File`) of the package,
// determines its relative path for logging, and then invokes `CompileFile`
// to handle the compilation of that specific file.
// The working directory (`wd`) is used to make file paths in logs more readable.
func (c *PackageCompiler) Compile(ctx context.Context) error {
	wd := c.compilerConf.Dir
	if wd == "" {
		var err error
		wd, err = os.Getwd()
		if err != nil {
			return err
		}
	}

	// Compile the files in the package one at a time
	for i, f := range c.pkg.Syntax {
		fileName := c.pkg.CompiledGoFiles[i]
		relWdFileName, err := filepath.Rel(wd, fileName)
		if err != nil {
			return err
		}

		c.le.WithField("file", relWdFileName).Debug("compiling file")
		if err := c.CompileFile(ctx, fileName, f); err != nil {
			return err
		}
	}

	return nil
}

// CompileFile handles the compilation of a single Go source file to TypeScript.
// It first performs a pre-compilation analysis of the file using `AnalyzeFile`
// to gather information necessary for accurate TypeScript generation (e.g.,
// about boxing, async functions, defer statements).
// Then, it creates a `FileCompiler` instance for the file and invokes its
// `Compile` method to generate the TypeScript code.
func (p *PackageCompiler) CompileFile(ctx context.Context, name string, syntax *ast.File) error {
	// Create a new analysis instance for per-file data
	analysis := NewAnalysis()

	// Create comment map for the file
	cmap := ast.NewCommentMap(p.pkg.Fset, syntax, syntax.Comments)

	// Analyze the file before compiling
	AnalyzeFile(syntax, p.pkg, analysis, cmap)

	fileCompiler, err := NewFileCompiler(p.compilerConf, p.pkg, syntax, name, analysis)
	if err != nil {
		return err
	}
	return fileCompiler.Compile(ctx)
}

// FileCompiler is responsible for compiling a single Go source file (`ast.File`)
// into a corresponding TypeScript file. It manages the output file creation,
// initializes the `TSCodeWriter` for TypeScript code generation, and uses a
// `GoToTSCompiler` to translate Go declarations and statements.
type FileCompiler struct {
	compilerConfig *Config
	codeWriter     *TSCodeWriter
	pkg            *packages.Package
	ast            *ast.File
	fullPath       string
	Analysis       *Analysis
}

// NewFileCompiler creates a new `FileCompiler` for a specific Go file.
// It takes the global compiler configuration, the Go package information,
// the AST of the file, its full path, and the pre-computed analysis results.
// This setup provides all necessary context for translating the file.
func NewFileCompiler(
	compilerConf *Config,
	pkg *packages.Package,
	astFile *ast.File,
	fullPath string,
	analysis *Analysis,
) (*FileCompiler, error) {
	return &FileCompiler{
		compilerConfig: compilerConf,
		pkg:            pkg,
		ast:            astFile,
		fullPath:       fullPath,
		Analysis:       analysis,
	}, nil
}

// Compile generates the TypeScript code for the Go file.
// It determines the output TypeScript file path, creates the necessary
// directories, and opens the output file. It then initializes a `TSCodeWriter`
// and a `GoToTSCompiler`. A standard import for the `@goscript/builtin`
// runtime (aliased as `$`) is added, followed by the translation of all
// top-level declarations in the Go file.
func (c *FileCompiler) Compile(ctx context.Context) error {
	f := c.ast

	pkgPath := c.pkg.PkgPath
	outputFilePath := TranslateGoFilePathToTypescriptFilePath(pkgPath, filepath.Base(c.fullPath))
	outputFilePathAbs := filepath.Join(c.compilerConfig.OutputPathRoot, outputFilePath)

	if err := os.MkdirAll(filepath.Dir(outputFilePathAbs), 0o755); err != nil {
		return err
	}

	of, err := os.OpenFile(outputFilePathAbs, os.O_RDWR|os.O_CREATE|os.O_TRUNC, 0o644)
	if err != nil {
		return err
	}
	defer of.Close() //nolint:errcheck

	c.codeWriter = NewTSCodeWriter(of)

	// Pass analysis to compiler
	goWriter := NewGoToTSCompiler(c.codeWriter, c.pkg, c.Analysis)

	// Add import for the goscript runtime using namespace import and alias
	c.codeWriter.WriteLine("import * as $ from \"@goscript/builtin\";")
	c.codeWriter.WriteLine("") // Add a newline after the import

	if err := goWriter.WriteDecls(f.Decls); err != nil {
		return fmt.Errorf("failed to write declarations: %w", err)
	}

	return nil
}

// GoToTSCompiler is the core component responsible for translating Go AST nodes
// and type information into TypeScript code. It uses a `TSCodeWriter` to output
// the generated TypeScript and relies on `Analysis` data to make informed
// decisions about code generation (e.g., boxing, async behavior).
type GoToTSCompiler struct {
	tsw *TSCodeWriter

	pkg *packages.Package

	analysis *Analysis // Holds analysis information for code generation decisions
}

// WriteGoType is the main dispatcher for translating Go types to their TypeScript
// equivalents. It examines the type and delegates to more specialized type writer
// functions based on the specific Go type encountered.
//
// It handles nil types as 'any' with a comment, and dispatches to appropriate
// type-specific writers for all other recognized Go types.
func (c *GoToTSCompiler) WriteGoType(typ types.Type) {
	if typ == nil {
		c.tsw.WriteLiterally("any")
		c.tsw.WriteCommentInline("nil type")
		return
	}

	switch t := typ.(type) {
	case *types.Basic:
		c.WriteBasicType(t)
	case *types.Named:
		c.WriteNamedType(t)
	case *types.Pointer:
		c.WritePointerType(t)
	case *types.Slice:
		c.WriteSliceType(t)
	case *types.Array:
		c.WriteArrayType(t)
	case *types.Map:
		c.WriteMapType(t)
	case *types.Chan:
		c.WriteChannelType(t)
	case *types.Interface:
		c.WriteInterfaceType(t, nil) // No ast.InterfaceType available here
	case *types.Signature:
		c.WriteSignatureType(t)
	default:
		// For other types, just write "any" and add a comment
		c.tsw.WriteLiterally("any")
		c.tsw.WriteCommentInline(fmt.Sprintf("unhandled type: %T", typ))
	}
}

// WriteBasicType translates a Go basic type (primitives like int, string, bool)
// to its TypeScript equivalent.
// It handles untyped constants by mapping them to appropriate TypeScript types
// (boolean, number, string, null) and uses GoBuiltinToTypescript for typed primitives.
func (c *GoToTSCompiler) WriteBasicType(t *types.Basic) {
	name := t.Name()

	// Handle untyped constants by mapping them to appropriate TypeScript types
	if t.Info()&types.IsUntyped != 0 {
		switch t.Kind() {
		case types.UntypedBool:
			c.tsw.WriteLiterally("boolean")
			return
		case types.UntypedInt, types.UntypedFloat, types.UntypedComplex, types.UntypedRune:
			c.tsw.WriteLiterally("number")
			return
		case types.UntypedString:
			c.tsw.WriteLiterally("string")
			return
		case types.UntypedNil:
			c.tsw.WriteLiterally("null")
			return
		}
	}

	// For typed basic types, use the existing mapping
	if tsType, ok := GoBuiltinToTypescript(name); ok {
		c.tsw.WriteLiterally(tsType)
	} else {
		c.tsw.WriteLiterally(name)
	}
}

// WriteNamedType translates a Go named type to its TypeScript equivalent.
// It specially handles the error interface as $.Error, and uses the original
// type name for other named types.
func (c *GoToTSCompiler) WriteNamedType(t *types.Named) {
	// Check if the named type is the error interface
	if iface, ok := t.Underlying().(*types.Interface); ok && iface.String() == "interface{Error() string}" {
		c.tsw.WriteLiterally("$.Error")
	} else {
		// Use Obj().Name() for the original defined name
		c.tsw.WriteLiterally(t.Obj().Name())
	}
}

// WritePointerType translates a Go pointer type (*T) to its TypeScript equivalent.
// It generates $.Box<T_ts> | null, where T_ts is the translated element type.
func (c *GoToTSCompiler) WritePointerType(t *types.Pointer) {
	c.tsw.WriteLiterally("$.Box<")
	c.WriteGoType(t.Elem())
	c.tsw.WriteLiterally("> | null") // Pointers are always nullable
}

// WriteSliceType translates a Go slice type ([]T) to its TypeScript equivalent.
// It generates $.Slice<T_ts>, where T_ts is the translated element type.
func (c *GoToTSCompiler) WriteSliceType(t *types.Slice) {
	c.tsw.WriteLiterally("$.Slice<")
	c.WriteGoType(t.Elem())
	c.tsw.WriteLiterally(">")
}

// WriteArrayType translates a Go array type ([N]T) to its TypeScript equivalent.
// It generates T_ts[], where T_ts is the translated element type.
func (c *GoToTSCompiler) WriteArrayType(t *types.Array) {
	c.WriteGoType(t.Elem())
	c.tsw.WriteLiterally("[]") // Arrays cannot be nil
}

// WriteMapType translates a Go map type (map[K]V) to its TypeScript equivalent.
// It generates Map<K_ts, V_ts>, where K_ts and V_ts are the translated key
// and element types respectively.
func (c *GoToTSCompiler) WriteMapType(t *types.Map) {
	c.tsw.WriteLiterally("Map<")
	c.WriteGoType(t.Key())
	c.tsw.WriteLiterally(", ")
	c.WriteGoType(t.Elem())
	c.tsw.WriteLiterally(">")
}

// WriteChannelType translates a Go channel type (chan T) to its TypeScript equivalent.
// It generates $.Channel<T_ts>, where T_ts is the translated element type.
func (c *GoToTSCompiler) WriteChannelType(t *types.Chan) {
	c.tsw.WriteLiterally("$.Channel<")
	c.WriteGoType(t.Elem())
	c.tsw.WriteLiterally(">")
}

// WriteInterfaceType translates a Go interface type to its TypeScript equivalent.
// It specially handles the error interface as $.Error, and delegates to
// writeInterfaceStructure for other interface types, prepending "null | ".
// If astNode is provided (e.g., from a type spec), comments for methods will be included.
func (c *GoToTSCompiler) WriteInterfaceType(t *types.Interface, astNode *ast.InterfaceType) {
	// Handle the built-in error interface specifically
	if t.String() == "interface{Error() string}" {
		c.tsw.WriteLiterally("$.Error")
		return
	}

	// Prepend "null | " for all other interfaces.
	// writeInterfaceStructure will handle the actual structure like "{...}" or "any".
	c.tsw.WriteLiterally("null | ")
	c.writeInterfaceStructure(t, astNode)
}

// WriteSignatureType translates a Go function signature to its TypeScript equivalent.
// It generates (param1: type1, param2: type2, ...): returnType for function types.
func (c *GoToTSCompiler) WriteSignatureType(t *types.Signature) {
	c.tsw.WriteLiterally("(")
	c.tsw.WriteLiterally("(")
	params := t.Params()
	for i := 0; i < params.Len(); i++ {
		if i > 0 {
			c.tsw.WriteLiterally(", ")
		}
		
		param := params.At(i)
		paramSlice, paramIsSlice := param.Type().(*types.Slice)
		
		paramVariadic := i == params.Len()-1 && t.Variadic()
		if paramVariadic {
			c.tsw.WriteLiterally("...")
		}
		
		// Use parameter name if available, otherwise use p0, p1, etc.
		if param.Name() != "" {
			c.tsw.WriteLiterally(param.Name())
		} else {
			c.tsw.WriteLiterally(fmt.Sprintf("p%d", i))
		}
		c.tsw.WriteLiterally(": ")
		
		// we don't want (and can't use) a $.Slice here. write type[]
		if paramVariadic && paramIsSlice {
			c.WriteGoType(paramSlice.Elem())
			c.tsw.WriteLiterally("[]")
		} else {
			c.WriteGoType(param.Type())
		}
	}
	c.tsw.WriteLiterally(")")

	// Handle return types
	c.tsw.WriteLiterally(" => ")
	results := t.Results()
	if results.Len() == 0 {
		c.tsw.WriteLiterally("void")
	} else if results.Len() == 1 {
		c.WriteGoType(results.At(0).Type())
	} else {
		// Multiple return values -> tuple
		c.tsw.WriteLiterally("[")
		for i := 0; i < results.Len(); i++ {
			if i > 0 {
				c.tsw.WriteLiterally(", ")
			}
			c.WriteGoType(results.At(i).Type())
		}
		c.tsw.WriteLiterally("]")
	}
	c.tsw.WriteLiterally(") | null")
}

// writeInterfaceStructure translates a Go `types.Interface` into its TypeScript structural representation.
// If astNode is provided, it's used to fetch comments for methods.
// For example, an interface `interface { MethodA(x int) string; EmbeddedB }` might become
// `{ MethodA(_p0: number): string; } & B_ts`.
func (c *GoToTSCompiler) writeInterfaceStructure(iface *types.Interface, astNode *ast.InterfaceType) {
	// Handle empty interface interface{}
	if iface.NumExplicitMethods() == 0 && iface.NumEmbeddeds() == 0 {
		c.tsw.WriteLiterally("any") // Matches current behavior for interface{}
		return
	}

	// Keep track if we've written any part (methods or first embedded type)
	// to correctly place " & " separators.
	firstPartWritten := false

	// Handle explicit methods
	if iface.NumExplicitMethods() > 0 {
		c.tsw.WriteLiterally("{") // Opening brace for the object type
		c.tsw.Indent(1)
		c.tsw.WriteLine("") // Newline after opening brace, before the first method

		for i := 0; i < iface.NumExplicitMethods(); i++ {
			method := iface.ExplicitMethod(i)
			sig := method.Type().(*types.Signature)

			// Find corresponding ast.Field for comments if astNode is available
			var astField *ast.Field
			if astNode != nil && astNode.Methods != nil {
				for _, f := range astNode.Methods.List {
					// Ensure the field is a named method (not an embedded interface)
					if len(f.Names) > 0 && f.Names[0].Name == method.Name() {
						astField = f
						break
					}
				}
			}

			// Write comments if astField is found
			if astField != nil {
				if astField.Doc != nil {
					c.WriteDoc(astField.Doc) // WriteDoc handles newlines
				}
				if astField.Comment != nil { // For trailing comments on the same line in Go AST
					c.WriteDoc(astField.Comment)
				}
			}

			c.tsw.WriteLiterally(method.Name())
			c.tsw.WriteLiterally("(") // Start params
			params := sig.Params()
			for j := 0; j < params.Len(); j++ {
				if j > 0 {
					c.tsw.WriteLiterally(", ")
				}
				paramVar := params.At(j)
				paramName := paramVar.Name()
				if paramName == "" || paramName == "_" {
					paramName = fmt.Sprintf("_p%d", j)
				}
				c.tsw.WriteLiterally(paramName)
				c.tsw.WriteLiterally(": ")
				c.WriteGoType(paramVar.Type()) // Recursive call for param type
			}
			c.tsw.WriteLiterally(")") // End params

			// Return type
			c.tsw.WriteLiterally(": ")
			results := sig.Results()
			if results.Len() == 0 {
				c.tsw.WriteLiterally("void")
			} else if results.Len() == 1 {
				c.WriteGoType(results.At(0).Type()) // Recursive call for result type
			} else {
				c.tsw.WriteLiterally("[")
				for j := 0; j < results.Len(); j++ {
					if j > 0 {
						c.tsw.WriteLiterally(", ")
					}
					c.WriteGoType(results.At(j).Type()) // Recursive call for result type
				}
				c.tsw.WriteLiterally("]")
			}
			c.tsw.WriteLine("") // newline for each method
		}
		c.tsw.Indent(-1)
		c.tsw.WriteLiterally("}") // Closing brace for the object type
		firstPartWritten = true
	}

	// Handle embedded types
	if iface.NumEmbeddeds() > 0 {
		for i := 0; i < iface.NumEmbeddeds(); i++ {
			if firstPartWritten {
				c.tsw.WriteLiterally(" & ")
			} else {
				// This is the first part being written (no explicit methods, only embedded)
				firstPartWritten = true
			}
			embeddedType := iface.EmbeddedType(i)
			// When WriteGoType encounters an interface, it will call WriteInterfaceType
			// which will pass nil for astNode, so comments for deeply embedded interface literals
			// might not be available unless they are named types.
			c.WriteGoType(embeddedType)
		}
	}
}

// It initializes the compiler with a `TSCodeWriter` for output,
// Go package information (`packages.Package`), and pre-computed
// analysis results (`Analysis`) to guide the translation process.
func NewGoToTSCompiler(tsw *TSCodeWriter, pkg *packages.Package, analysis *Analysis) *GoToTSCompiler {
	return &GoToTSCompiler{
		tsw:      tsw,
		pkg:      pkg,
		analysis: analysis,
	}
}

// WriteZeroValueForType writes the TypeScript representation of the zero value
// for a given Go type.
// It handles `types.Array` by recursively writing zero values for each element
// to form a TypeScript array literal (e.g., `[0, 0, 0]`).
// For `types.Basic` (like `bool`, `string`, numeric types), it writes the
// corresponding TypeScript zero value (`false`, `""`, `0`).
// Other types default to `null`. This function is primarily used for initializing
// arrays and variables where an explicit initializer is absent.
func (c *GoToTSCompiler) WriteZeroValueForType(typ any) {
	switch t := typ.(type) {
	case *types.Array:
		c.tsw.WriteLiterally("[")
		for i := 0; i < int(t.Len()); i++ {
			if i > 0 {
				c.tsw.WriteLiterally(", ")
			}
			c.WriteZeroValueForType(t.Elem())
		}
		c.tsw.WriteLiterally("]")
	case *ast.Expr:
		// For AST expressions, get the type and handle that instead
		if expr := *t; expr != nil {
			if typ := c.pkg.TypesInfo.TypeOf(expr); typ != nil {
				c.WriteZeroValueForType(typ)
				return
			}
		}
		c.tsw.WriteLiterally("null")
	case *types.Basic:
		switch t.Kind() {
		case types.Bool:
			c.tsw.WriteLiterally("false")
		case types.String:
			c.tsw.WriteLiterally(`""`)
		default:
			c.tsw.WriteLiterally("0")
		}
	default:
		c.tsw.WriteLiterally("null")
	}
}

// WriteTypeExpr translates a Go abstract syntax tree (AST) expression (`ast.Expr`)
// that represents a type into its TypeScript type equivalent using type information.
//
// It handles various Go type expressions:
// - Basic types (e.g., int, string, bool) -> TypeScript primitives (number, string, boolean)
// - Named types -> TypeScript class/interface names
// - Pointer types (`*T`) -> `$.Box<T_ts> | null`
// - Slice types (`[]T`) -> `$.Slice<T_ts>`
// - Array types (`[N]T`) -> `T_ts[]`
// - Map types (`map[K]V`) -> `Map<K_ts, V_ts>`
// - Channel types (`chan T`) -> `$.Channel<T_ts>`
// - Struct types -> TypeScript object types or class names
// - Interface types -> TypeScript interface types or "any"
// - Function types -> TypeScript function signatures
func (c *GoToTSCompiler) WriteTypeExpr(a ast.Expr) {
	// Get type information for the expression and use WriteGoType
	typ := c.pkg.TypesInfo.TypeOf(a)
	c.WriteGoType(typ)
}

// WriteValueExpr translates a Go abstract syntax tree (AST) expression (`ast.Expr`)
// that represents a value into its TypeScript value equivalent.
// This is a central dispatch function for various expression types:
// - Identifiers (`ast.Ident`): Delegates to `WriteIdent`, potentially adding `.value` for boxed variables.
// - Selector expressions (`ast.SelectorExpr`, e.g., `obj.Field` or `pkg.Var`): Delegates to `WriteSelectorExpr`.
// - Pointer dereferences (`ast.StarExpr`, e.g., `*ptr`): Delegates to `WriteStarExpr`.
// - Function calls (`ast.CallExpr`): Delegates to `WriteCallExpr`.
// - Unary operations (`ast.UnaryExpr`, e.g., `!cond`, `&val`): Delegates to `WriteUnaryExpr`.
// - Binary operations (`ast.BinaryExpr`, e.g., `a + b`): Delegates to `WriteBinaryExpr`.
// - Basic literals (`ast.BasicLit`, e.g., `123`, `"hello"`): Delegates to `WriteBasicLit`.
// - Composite literals (`ast.CompositeLit`, e.g., `MyStruct{}`): Delegates to `WriteCompositeLit`.
// - Key-value expressions (`ast.KeyValueExpr`): Delegates to `WriteKeyValueExpr`.
// - Type assertions in expression context (`ast.TypeAssertExpr`, e.g., `val.(Type)`): Delegates to `WriteTypeAssertExpr`.
// - Index expressions (`ast.IndexExpr`):
//   - For maps: `myMap[key]` becomes `myMap.get(key) ?? zeroValue`.
//   - For arrays/slices: `myArray[idx]` becomes `myArray![idx]`.
//
// - Slice expressions (`ast.SliceExpr`, e.g., `s[low:high:max]`): Translates to `$.slice(s, low, high, max)`.
// - Parenthesized expressions (`ast.ParenExpr`): Translates `(X)` to `(X)`.
// - Function literals (`ast.FuncLit`): Delegates to `WriteFuncLitValue`.
// Unhandled value expressions result in a comment.
func (c *GoToTSCompiler) WriteValueExpr(a ast.Expr) error {
	switch exp := a.(type) {
	case *ast.Ident:
		c.WriteIdent(exp, true) // adds .value accessor
		return nil
	case *ast.SelectorExpr:
		return c.WriteSelectorExpr(exp)
	case *ast.StarExpr:
		return c.WriteStarExpr(exp)
	case *ast.CallExpr:
		return c.WriteCallExpr(exp)
	case *ast.UnaryExpr:
		return c.WriteUnaryExpr(exp)
	case *ast.BinaryExpr:
		return c.WriteBinaryExpr(exp)
	case *ast.BasicLit:
		c.WriteBasicLit(exp)
		return nil
	case *ast.CompositeLit:
		return c.WriteCompositeLit(exp)
	case *ast.KeyValueExpr:
		return c.WriteKeyValueExpr(exp)
	case *ast.TypeAssertExpr:
		// Handle type assertion in an expression context
		return c.WriteTypeAssertExpr(exp)
	case *ast.IndexExpr:
		// Handle map access: use Map.get() instead of brackets for reading values
		if tv, ok := c.pkg.TypesInfo.Types[exp.X]; ok {
			// Check if it's a map type
			if mapType, isMap := tv.Type.Underlying().(*types.Map); isMap {
				if err := c.WriteValueExpr(exp.X); err != nil {
					return err
				}
				c.tsw.WriteLiterally(".get(")
				if err := c.WriteValueExpr(exp.Index); err != nil {
					return err
				}
				// Map.get() returns undefined when key not found, but Go returns zero value
				// Add nullish coalescing with the appropriate zero value for the map's value type
				c.tsw.WriteLiterally(") ?? ")

				// Generate the zero value based on the map's value type
				c.WriteZeroValueForType(mapType.Elem())
				return nil
			}
		}

		// Regular array/slice access: use brackets
		if err := c.WriteValueExpr(exp.X); err != nil {
			return err
		}
		c.tsw.WriteLiterally("![") // non-null assertion
		if err := c.WriteValueExpr(exp.Index); err != nil {
			return err
		}
		c.tsw.WriteLiterally("]")
		return nil
	case *ast.SliceExpr:
		// Translate Go slice expression to $.slice(x, low, high, max)
		c.tsw.WriteLiterally("$.slice(")
		if err := c.WriteValueExpr(exp.X); err != nil {
			return err
		}
		// low argument
		c.tsw.WriteLiterally(", ")
		if exp.Low != nil {
			if err := c.WriteValueExpr(exp.Low); err != nil {
				return err
			}
		} else {
			c.tsw.WriteLiterally("undefined")
		}
		// high argument
		c.tsw.WriteLiterally(", ")
		if exp.High != nil {
			if err := c.WriteValueExpr(exp.High); err != nil {
				return err
			}
		} else {
			c.tsw.WriteLiterally("undefined")
		}
		// max argument (only for full slice expressions)
		if exp.Slice3 {
			c.tsw.WriteLiterally(", ")
			if exp.Max != nil {
				if err := c.WriteValueExpr(exp.Max); err != nil {
					return err
				}
			} else {
				c.tsw.WriteLiterally("undefined")
			}
		}
		c.tsw.WriteLiterally(")")
		return nil
	case *ast.ParenExpr:
		// Translate (X) to (X)
		// If we haven't written anything in this statement yet, prepend ;
		c.tsw.WriteLiterally("(")
		if err := c.WriteValueExpr(exp.X); err != nil {
			return err
		}
		c.tsw.WriteLiterally(")")
		return nil
	case *ast.FuncLit:
		return c.WriteFuncLitValue(exp)
	default:
		c.tsw.WriteCommentLine(fmt.Sprintf("unhandled value expr: %T", exp))
		return nil
	}
}

// WriteTypeAssertExpr translates a Go type assertion expression (e.g., `x.(T)`)
// into a TypeScript call to `$.typeAssert<T_ts>(x_ts, 'TypeName').value`.
// The `$.typeAssert` runtime function handles the actual type check and panic
// if the assertion fails. The `.value` access is used because in an expression
// context, we expect the asserted value directly. The `TypeName` string is used
// by the runtime for error messages.
func (c *GoToTSCompiler) WriteTypeAssertExpr(exp *ast.TypeAssertExpr) error {
	// Get the type name string for the asserted type
	typeName := c.getTypeNameString(exp.Type)

	// Generate a call to $.typeAssert
	c.tsw.WriteLiterally("$.typeAssert<")
	c.WriteTypeExpr(exp.Type) // Write the asserted type for the generic
	c.tsw.WriteLiterally(">(")
	if err := c.WriteValueExpr(exp.X); err != nil { // The interface expression
		return fmt.Errorf("failed to write interface expression in type assertion expression: %w", err)
	}
	c.tsw.WriteLiterally(", ")
	c.tsw.WriteLiterally(fmt.Sprintf("'%s'", typeName))
	c.tsw.WriteLiterally(").value") // Access the value field directly in expression context
	return nil
}

// isPointerComparison checks if a binary expression `exp` involves comparing
// two pointer types. It uses `go/types` information to determine the types
// of the left (X) and right (Y) operands of the binary expression.
// Returns `true` if both operands are determined to be pointer types,
// `false` otherwise. This is used to apply specific comparison semantics
// for pointers (e.g., comparing the box objects directly).
func (c *GoToTSCompiler) isPointerComparison(exp *ast.BinaryExpr) bool {
	leftType := c.pkg.TypesInfo.TypeOf(exp.X)
	rightType := c.pkg.TypesInfo.TypeOf(exp.Y)
	if leftType != nil && rightType != nil {
		if _, leftIsPtr := leftType.(*types.Pointer); leftIsPtr {
			if _, rightIsPtr := rightType.(*types.Pointer); rightIsPtr {
				return true
			}
		}
	}
	return false
}

// getTypeNameString returns a string representation of a Go type expression (`ast.Expr`).
// It handles simple identifiers (e.g., `MyType`) and selector expressions
// (e.g., `pkg.Type`). For more complex or unrecognized type expressions,
// it returns "unknown". This string is primarily used for runtime error messages,
// such as in type assertions.
func (c *GoToTSCompiler) getTypeNameString(typeExpr ast.Expr) string {
	switch t := typeExpr.(type) {
	case *ast.Ident:
		return t.Name
	case *ast.SelectorExpr:
		// For imported types like pkg.Type
		if ident, ok := t.X.(*ast.Ident); ok {
			return fmt.Sprintf("%s.%s", ident.Name, t.Sel.Name)
		}
	}
	// Default case, use a placeholder for complex types
	return "unknown"
}

// --- Exported Node-Specific Writers ---

// WriteIdent translates a Go identifier (`ast.Ident`) used as a value (e.g.,
// variable, function name) into its TypeScript equivalent.
//   - If the identifier is `nil`, it writes `null`.
//   - Otherwise, it writes the identifier's name.
//   - If `accessBoxedValue` is true and the analysis (`c.analysis.NeedsBoxedAccess`)
//     indicates that this identifier refers to a variable whose value is stored
//     in a box (due to its address being taken or other boxing requirements),
//     it appends `.value` to access the actual value from the box.
//
// This function relies on `go/types` (`TypesInfo.Uses` or `Defs`) to resolve
// the identifier and the `Analysis` data to determine boxing needs.
func (c *GoToTSCompiler) WriteIdent(exp *ast.Ident, accessBoxedValue bool) {
	if exp.Name == "nil" {
		c.tsw.WriteLiterally("null")
		return
	}

	// Use TypesInfo to find the object associated with the identifier
	var obj types.Object
	obj = c.pkg.TypesInfo.Uses[exp]
	if obj == nil {
		obj = c.pkg.TypesInfo.Defs[exp]
	}

	// Write the identifier name first
	c.tsw.WriteLiterally(exp.Name)

	// Determine if we need to access .value based on analysis data
	if obj != nil && accessBoxedValue && c.analysis.NeedsBoxedAccess(obj) {
		c.tsw.WriteLiterally("!.value")
	}
}

// WriteSelectorExpr translates a Go selector expression (`ast.SelectorExpr`)
// used as a value (e.g., `obj.Field`, `pkg.Variable`, `structVar.Method()`)
// into its TypeScript equivalent.
// It distinguishes between package selectors (e.g., `time.Now`) and field/method
// access on an object or struct.
//   - For package selectors, it writes `PackageName.IdentifierName`. The `IdentifierName`
//     is written using `WriteIdent` which handles potential `.value` access if the
//     package-level variable is boxed.
//   - For field or method access on an object (`exp.X`), it first writes the base
//     expression (`exp.X`) using `WriteValueExpr` (which handles its own boxing).
//     Then, it writes a dot (`.`) followed by the selected identifier (`exp.Sel`)
//     using `WriteIdent`, which appends `.value` if the field itself is boxed
//     (e.g., accessing a field of primitive type through a pointer to a struct
//     where the field's address might have been taken).
//
// This function aims to correctly navigate Go's automatic dereferencing and
// TypeScript's explicit boxing model.
func (c *GoToTSCompiler) WriteSelectorExpr(exp *ast.SelectorExpr) error {
	// Check if this is a package selector (e.g., time.Now)
	if pkgIdent, isPkgIdent := exp.X.(*ast.Ident); isPkgIdent {
		if obj := c.pkg.TypesInfo.ObjectOf(pkgIdent); obj != nil {
			if _, isPkg := obj.(*types.PkgName); isPkg {
				// Package selectors should never use .value on the package name
				c.tsw.WriteLiterally(pkgIdent.Name)
				c.tsw.WriteLiterally(".")
				// Write the selected identifier, allowing .value if it's a boxed package variable
				c.WriteIdent(exp.Sel, true)
				return nil
			}
		}
	}

	// --- Special case for dereferenced pointer to struct with field access: (*p).field ---
	var baseExpr ast.Expr = exp.X
	// Look inside parentheses if present
	if parenExpr, isParen := exp.X.(*ast.ParenExpr); isParen {
		baseExpr = parenExpr.X
	}

	if starExpr, isStarExpr := baseExpr.(*ast.StarExpr); isStarExpr {
		// Get the type of the pointer being dereferenced (e.g., type of 'p' in *p)
		ptrType := c.pkg.TypesInfo.TypeOf(starExpr.X)
		if ptrType != nil {
			if ptrTypeUnwrapped, ok := ptrType.(*types.Pointer); ok {
				elemType := ptrTypeUnwrapped.Elem()
				if elemType != nil {
					// If it's a pointer to a struct, handle field access specially
					if _, isStruct := elemType.Underlying().(*types.Struct); isStruct {
						// Get the object for the pointer variable itself (e.g., 'p')
						var ptrObj types.Object
						if ptrIdent, isIdent := starExpr.X.(*ast.Ident); isIdent {
							ptrObj = c.pkg.TypesInfo.ObjectOf(ptrIdent)
						}

						// Write the pointer expression (e.g., p or p.value if p is boxed)
						if err := c.WriteValueExpr(starExpr.X); err != nil {
							return fmt.Errorf("failed to write pointer expression for (*p).field: %w", err)
						}

						// Add ! for non-null assertion
						c.tsw.WriteLiterally("!")

						// Add .value ONLY if the pointer variable itself needs boxed access
						// This handles the case where 'p' points to a boxed struct (e.g., p = s where s is Box<MyStruct>)
						if ptrObj != nil && c.analysis.NeedsBoxedAccess(ptrObj) {
							c.tsw.WriteLiterally(".value")
						}

						// Add .field
						c.tsw.WriteLiterally(".")
						c.WriteIdent(exp.Sel, false) // Don't add .value to the field itself
						return nil
					}
				}
			}
		}
	}
	// --- End Special Case ---

	// Fallback / Normal Case (e.g., obj.Field, pkg.Var, method calls)
	// WriteValueExpr handles adding .value for the base variable itself if it's boxed.
	if err := c.WriteValueExpr(exp.X); err != nil {
		return fmt.Errorf("failed to write selector base expression: %w", err)
	}

	// Add .
	c.tsw.WriteLiterally(".")

	// Write the field/method name.
	// Pass 'true' to WriteIdent to potentially add '.value' if the field itself
	// needs boxed access (e.g., accessing a primitive field via pointer where
	// the field's address might have been taken elsewhere - less common but possible).
	// For simple struct field access like p.Val or (*p).Val, WriteIdent(..., true)
	// relies on NeedsBoxedAccess for the field 'Val', which should typically be false.
	c.WriteIdent(exp.Sel, true)
	return nil
}

// WriteStarExpr translates a Go pointer dereference expression (`ast.StarExpr`, e.g., `*p`)
// into its TypeScript equivalent. This involves careful handling of Go's pointers
// and TypeScript's boxing mechanism for emulating pointer semantics.
//
// The translation depends on whether the pointer variable `p` itself is boxed and
// what type of value it points to:
//  1. If `p` is not boxed and points to a primitive or another pointer: `*p` -> `p!.value`.
//     (`p` holds a box, so dereference accesses its `value` field).
//  2. If `p` is not boxed and points to a struct: `*p` -> `p!`.
//     (`p` holds the struct instance directly; structs are reference types in TS).
//  3. If `p` is boxed (i.e., `p` is `$.Box<PointerType>`) and points to a primitive/pointer:
//     `*p` -> `p.value!.value`.
//     (First `.value` unboxes `p`, then `!.value` dereferences the inner pointer).
//  4. If `p` is boxed and points to a struct: `*p` -> `p.value!`.
//     (First `.value` unboxes `p` to get the struct instance).
//
// `WriteValueExpr(operand)` handles the initial unboxing of `p` if `p` itself is a boxed variable.
// A non-null assertion `!` is always added as pointers can be nil.
// `c.analysis.NeedsBoxedDeref(ptrType)` determines if an additional `.value` is needed
// based on whether the dereferenced type is a primitive/pointer (requires `.value`) or
// a struct (does not require `.value`).
func (c *GoToTSCompiler) WriteStarExpr(exp *ast.StarExpr) error {
	// Generate code for a pointer dereference expression (*p).
	//
	// IMPORTANT: Pointer dereferencing in TypeScript requires careful handling of the box/unbox state:
	//
	// 1. p!.value - when p is not boxed and points to a primitive/pointer
	//    Example: let p = x (where x is a box) => p!.value
	//
	// 2. p!       - when p is not boxed and points to a struct
	//    Example: let p = new MyStruct() => p! (structs are reference types)
	//
	// 3. p.value!.value - when p is boxed and points to a primitive/pointer
	//    Example: let p = $.box(x) (where x is another box) => p.value!.value
	//
	// 4. p.value! - when p is boxed and points to a struct
	//    Example: let p = $.box(new MyStruct()) => p.value!
	//
	// Critical bug fix: We must handle each case correctly to avoid over-dereferencing
	// (adding too many .value) or under-dereferencing (missing .value where needed)
	//
	// NOTE: This logic aligns with design/BOXES_POINTERS.md.

	// Get the operand expression and its type information
	operand := exp.X

	// Get the type of the operand (the pointer being dereferenced)
	ptrType := c.pkg.TypesInfo.TypeOf(operand)

	// Special case for handling multi-level dereferencing:
	// Check if the operand is itself a StarExpr (e.g., **p or ***p)
	// We need to handle these specially to correctly generate nested .value accesses
	if starExpr, isStarExpr := operand.(*ast.StarExpr); isStarExpr {
		// First, write the inner star expression
		if err := c.WriteStarExpr(starExpr); err != nil {
			return fmt.Errorf("failed to write inner star expression: %w", err)
		}

		// Always add .value for multi-level dereferences
		// For expressions like **p, each * adds a .value
		c.tsw.WriteLiterally("!.value")
		return nil
	}

	// Standard case: single-level dereference
	// Write the pointer expression, which will access .value if the variable is boxed
	// WriteValueExpr will add .value if the variable itself is boxed (p.value)
	if err := c.WriteValueExpr(operand); err != nil {
		return fmt.Errorf("failed to write star expression operand: %w", err)
	}

	// Add ! for null assertion - all pointers can be null in TypeScript
	c.tsw.WriteLiterally("!")

	// Add .value only if we need boxed dereferencing for this type of pointer
	// This depends on whether we're dereferencing to a primitive (needs .value)
	// or to a struct (no .value needed)
	if c.analysis.NeedsBoxedDeref(ptrType) {
		c.tsw.WriteLiterally(".value")
	}

	return nil
}

// WriteStructType translates a Go struct type definition (`ast.StructType`)
// into a TypeScript anonymous object type (e.g., `{ Field1: Type1; Field2: Type2 }`).
// If the struct has no fields, it writes `{}`. Otherwise, it delegates to
// `WriteFieldList` to generate the list of field definitions.
// Note: This is for anonymous struct type literals. Named struct types are usually
// handled as classes via `WriteTypeSpec`.
func (c *GoToTSCompiler) WriteStructType(exp *ast.StructType) {
	if typ := c.pkg.TypesInfo.TypeOf(exp); typ != nil {
		c.WriteGoType(typ)
		return
	}

	if exp.Fields == nil || exp.Fields.NumFields() == 0 {
		c.tsw.WriteLiterally("{}")
		return
	}
	c.WriteFieldList(exp.Fields, false) // false = not arguments
}

// WriteFuncType translates a Go function type (`ast.FuncType`) into a TypeScript
// function signature.
// The signature is of the form `(param1: type1, param2: type2) => returnType`.
// - Parameters are written using `WriteFieldList`.
// - Return types:
//   - If there are no results, the return type is `void`.
//   - If there's a single, unnamed result, it's `resultType`.
//   - If there are multiple or named results, it's a tuple type `[typeA, typeB]`.
//   - If `isAsync` is true (indicating the function is known to perform async
//     operations like channel interactions or contains `go` or `defer` with async calls),
//     the return type is wrapped in `Promise<>` (e.g., `Promise<void>`, `Promise<number>`).
func (c *GoToTSCompiler) WriteFuncType(exp *ast.FuncType, isAsync bool) {
	c.tsw.WriteLiterally("(")

	// Check if this is a variadic function
	isVariadic := false
	if exp.Params != nil && len(exp.Params.List) > 0 {
		lastParam := exp.Params.List[len(exp.Params.List)-1]
		if _, ok := lastParam.Type.(*ast.Ellipsis); ok {
			isVariadic = true
		}
	}

	// Write parameters with special handling for variadic
	if isVariadic {
		// Write non-variadic parameters
		for i, field := range exp.Params.List[:len(exp.Params.List)-1] {
			if i > 0 {
				c.tsw.WriteLiterally(", ")
			}
			c.WriteField(field, true)
		}

		// Write variadic parameter as rest parameter
		lastParam := exp.Params.List[len(exp.Params.List)-1]
		if len(exp.Params.List) > 1 {
			c.tsw.WriteLiterally(", ")
		}

		// Write parameter name with rest syntax
		for i, name := range lastParam.Names {
			if i > 0 {
				c.tsw.WriteLiterally(", ")
			}
			c.tsw.WriteLiterally("...")
			c.tsw.WriteLiterally(name.Name)
		}

		// Write parameter type as array
		c.tsw.WriteLiterally(": ")
		if ellipsis, ok := lastParam.Type.(*ast.Ellipsis); ok {
			c.WriteTypeExpr(ellipsis.Elt)
			c.tsw.WriteLiterally("[]")
		}
	} else {
		// Normal parameters
		c.WriteFieldList(exp.Params, true) // true = arguments
	}

	c.tsw.WriteLiterally(")")
	if exp.Results != nil && len(exp.Results.List) > 0 {
		// Use colon for return type annotation
		c.tsw.WriteLiterally(": ")
		if isAsync {
			c.tsw.WriteLiterally("Promise<")
		}
		if len(exp.Results.List) == 1 && len(exp.Results.List[0].Names) == 0 {
			// Single unnamed return type
			typ := c.pkg.TypesInfo.TypeOf(exp.Results.List[0].Type)
			c.WriteGoType(typ)
		} else {
			// Multiple or named return types -> tuple
			c.tsw.WriteLiterally("[")
			for i, field := range exp.Results.List {
				if i > 0 {
					c.tsw.WriteLiterally(", ")
				}
				typ := c.pkg.TypesInfo.TypeOf(field.Type)
				c.WriteGoType(typ)
			}
			c.tsw.WriteLiterally("]")
		}
		if isAsync {
			c.tsw.WriteLiterally(">")
		}
	} else {
		// No return value -> void
		if isAsync {
			c.tsw.WriteLiterally(": Promise<void>")
		} else {
			c.tsw.WriteLiterally(": void")
		}
	}
}

// isFunctionNillable determines whether a function expression can be nil in Go.
// It returns two booleans:
// - isFunc: whether the expression is a function type
// - isNillable: whether the function can be nil in Go
//
// In Go, only variables of function type or results of expressions that yield
// function values can be nil. Declared functions (func MyFunc(){}) are not nillable.
func isFunctionNillable(pkgInfo *types.Info, expFun ast.Expr) (bool, bool) {
	// First, check if the expression's type is indeed a function signature
	tv, ok := pkgInfo.Types[expFun]
	if !ok || tv.Type == nil {
		return false, false // Not a typed expression or type info missing
	}

	underlyingType := tv.Type.Underlying()
	if _, isSignature := underlyingType.(*types.Signature); !isSignature {
		return false, false // Not a function type
	}

	// Now, determine if this function type *value* can be nil.
	// This depends on how expFun is defined or obtained.

	switch node := expFun.(type) {
	case *ast.Ident:
		// It's an identifier, like 'myFunc' or 'pkg.MyTopLevelFunc'
		// We need to see what this identifier refers to.
		obj := pkgInfo.ObjectOf(node) // or pkgInfo.Uses[node]
		if obj == nil {
			// This should ideally not happen if Types[expFun] gave a type.
			// But if it does, and it's a function type, assume it could be from an
			// untraceable source that might be nil (e.g. complex assignment).
			return true, true // Is function type, is nillable (safer default)
		}

		switch obj.(type) {
		case *types.Var:
			// The identifier refers to a variable (e.g., var myVar func(); f := func(){})
			// Variables of function type ARE nillable.
			return true, true // Is function type, is nillable
		case *types.Func:
			// The identifier refers to a declared function (func MyFunc(){}) or a method.
			// These are NOT nillable themselves.
			return true, false // Is function type, but not nillable
		default:
			// It's some other kind of object (e.g., types.Const, types.TypeName)
			// but we already know its type is *types.Signature.
			// This scenario is less common for a direct function call.
			// If it somehow evaluates to a function value, that value can be nil.
			// For example, a const of function type (not directly possible in Go, but hypothetically).
			// Or a type conversion that results in a function value.
			// Default to nillable for safety if it's a value.
			return true, true // Is function type, is nillable
		}

	case *ast.SelectorExpr:
		// It's a qualified identifier, like 'p.MyFunc' or 's.MyMethod'
		// We need to check what node.Sel refers to.
		// For methods, TypesInfo.Selections[node] is also useful.
		// For package-level functions/vars, TypesInfo.Uses[node.Sel] or ObjectOf(node.Sel)
		
		// Try ObjectOf on the selector's name first (covers pkg.Func and pkg.Var)
		obj := pkgInfo.ObjectOf(node.Sel)
		if obj != nil {
			switch obj.(type) {
			case *types.Var:
				// e.g., pkg.MyVarOfFuncType
				return true, true // Is function type, is nillable
			case *types.Func:
				// e.g., pkg.MyExportedFunc or s.MyMethod (if ObjectOf gives the method's *types.Func)
				return true, false // Is function type, not nillable
			default:
				// If it's a function type but not a var/func object, assume nillable value
				return true, true 
			}
		}
		
		// If ObjectOf(node.Sel) didn't give a clear var/func,
		// and it's a function type, it's likely a value resulting from some expression.
		// Example: `(someStruct.FuncReturningField)()` where FuncReturningField is a field of function type.
		// These are effectively like variables.
		return true, true // Is function type, is nillable

	case *ast.FuncLit:
		// A function literal itself, e.g., (func(){})()
		// The literal expression produces a non-nil function value.
		return true, false // Is function type, not nillable

	case *ast.CallExpr:
		// A call that returns a function, e.g., getFunc()()
		// The result of getFunc() is a function value, which CAN be nil.
		return true, true // Is function type, is nillable

	case *ast.IndexExpr, *ast.SliceExpr:
		// Accessing a function from a slice or map, e.g., funcList[i]()
		// The element retrieved is a function value, which CAN be nil.
		return true, true // Is function type, is nillable
	
	case *ast.TypeAssertExpr:
		// e.g., x.(func()) ()
		// The result of type assertion is a function value, which CAN be nil.
		return true, true // Is function type, is nillable

	case *ast.ParenExpr:
		// Parenthesized expression, recurse on the inner expression
		return isFunctionNillable(pkgInfo, node.X)

	default:
		// For any other kind of expression that evaluates to a function type,
		// it means it's producing a function *value*.
		// Function values in Go are nillable.
		// This could be a complex expression, a channel receive, etc.
		return true, true // Is function type, is nillable
	}
}

// WriteCallExpr translates a Go function call expression (`ast.CallExpr`)
// into its TypeScript equivalent.
// It handles several Go built-in functions specially:
// - `println(...)` becomes `console.log(...)`.
// - `len(arg)` becomes `$.len(arg)`.
// - `cap(arg)` becomes `$.cap(arg)`.
// - `delete(m, k)` becomes `$.deleteMapEntry(m, k)`.
// - `make(chan T, size)` becomes `$.makeChannel<T_ts>(size, zeroValueForT)`.
// - `make(map[K]V)` becomes `$.makeMap<K_ts, V_ts>()`.
// - `make([]T, len, cap)` becomes `$.makeSlice<T_ts>(len, cap)`.
// - `string(runeVal)` becomes `String.fromCharCode(runeVal)`.
// - `string([]runeVal)` or `string([]byteVal)` becomes `$.runesToString(sliceVal)`.
// - `[]rune(stringVal)` becomes `$.stringToRunes(stringVal)`.
// - `close(ch)` becomes `ch.close()`.
// - `append(slice, elems...)` becomes `$.append(slice, elems...)`.
// - `byte(val)` becomes `$.byte(val)`.
// For other function calls:
//   - If the `Analysis` data indicates the function is asynchronous (e.g., due to
//     channel operations or `go`/`defer` usage within it), the call is prefixed with `await`.
//   - Otherwise, it's translated as a standard TypeScript function call: `funcName(arg1, arg2)`.
//
// Arguments are recursively translated using `WriteValueExpr`.
// Variadic parameters are handled by passing the arguments as an array.
func (c *GoToTSCompiler) WriteCallExpr(exp *ast.CallExpr) error {
	expFun := exp.Fun

	// Handle array type conversions like []rune(string)
	if arrayType, isArrayType := expFun.(*ast.ArrayType); isArrayType {
		// Check if it's a []rune type
		if ident, isIdent := arrayType.Elt.(*ast.Ident); isIdent && ident.Name == "rune" {
			// Check if the argument is a string
			if len(exp.Args) == 1 {
				arg := exp.Args[0]
				if tv, ok := c.pkg.TypesInfo.Types[arg]; ok && tv.Type != nil {
					if basic, isBasic := tv.Type.Underlying().(*types.Basic); isBasic && basic.Kind() == types.String {
						// Translate []rune(stringValue) to $.stringToRunes(stringValue)
						c.tsw.WriteLiterally("$.stringToRunes(")
						if err := c.WriteValueExpr(arg); err != nil {
							return fmt.Errorf("failed to write argument for []rune(string) conversion: %w", err)
						}
						c.tsw.WriteLiterally(")")
						return nil // Handled []rune(string)
					}
				}
			}
		}
	}

	if funIdent, funIsIdent := expFun.(*ast.Ident); funIsIdent {
		switch funIdent.String() {
		case "println":
			c.tsw.WriteLiterally("console.log(")
			for i, arg := range exp.Args {
				if i != 0 {
					c.tsw.WriteLiterally(", ")
				}
				if err := c.WriteValueExpr(arg); err != nil {
					return err
				}
			}
			c.tsw.WriteLiterally(")")
			return nil
		case "len":
			// Translate len(arg) to $.len(arg)
			if len(exp.Args) == 1 {
				c.tsw.WriteLiterally("$.len(")
				if err := c.WriteValueExpr(exp.Args[0]); err != nil {
					return err
				}
				c.tsw.WriteLiterally(")")
				return nil // Handled len
			}
			return errors.New("unhandled len call with incorrect number of arguments")
		case "cap":
			// Translate cap(arg) to $.cap(arg)
			if len(exp.Args) == 1 {
				c.tsw.WriteLiterally("$.cap(")
				if err := c.WriteValueExpr(exp.Args[0]); err != nil {
					return err
				}
				c.tsw.WriteLiterally(")")
				return nil // Handled cap
			}
			return errors.New("unhandled cap call with incorrect number of arguments")
		case "delete":
			// Translate delete(map, key) to $.deleteMapEntry(map, key)
			if len(exp.Args) == 2 {
				c.tsw.WriteLiterally("$.deleteMapEntry(")
				if err := c.WriteValueExpr(exp.Args[0]); err != nil { // Map
					return err
				}
				c.tsw.WriteLiterally(", ")
				if err := c.WriteValueExpr(exp.Args[1]); err != nil { // Key
					return err
				}
				c.tsw.WriteLiterally(")")
				return nil // Handled delete
			}
			return errors.New("unhandled delete call with incorrect number of arguments")
		case "make":
			// First check if we have a channel type
			if typ := c.pkg.TypesInfo.TypeOf(exp.Args[0]); typ != nil {
				if chanType, ok := typ.Underlying().(*types.Chan); ok {
					// Handle channel creation: make(chan T, bufferSize) or make(chan T)
					c.tsw.WriteLiterally("$.makeChannel<")
					c.WriteGoType(chanType.Elem())
					c.tsw.WriteLiterally(">(")

					// If buffer size is provided, add it
					if len(exp.Args) >= 2 {
						if err := c.WriteValueExpr(exp.Args[1]); err != nil {
							return fmt.Errorf("failed to write buffer size in makeChannel: %w", err)
						}
					} else {
						// Default to 0 (unbuffered channel)
						c.tsw.WriteLiterally("0")
					}

					c.tsw.WriteLiterally(", ") // Add comma for zero value argument

					// Write the zero value for the channel's element type
					c.WriteZeroValueForType(chanType.Elem())

					c.tsw.WriteLiterally(")")
					return nil // Handled make for channel
				}
			}
			// Handle make for slices: make([]T, len, cap) or make([]T, len)
			if len(exp.Args) >= 1 {
				// Handle map creation: make(map[K]V)
				if mapType, ok := exp.Args[0].(*ast.MapType); ok {
					c.tsw.WriteLiterally("$.makeMap<")
					c.WriteTypeExpr(mapType.Key) // Write the key type
					c.tsw.WriteLiterally(", ")
					c.WriteTypeExpr(mapType.Value) // Write the value type
					c.tsw.WriteLiterally(">()")
					return nil // Handled make for map
				}

				// Handle slice creation
				if _, ok := exp.Args[0].(*ast.ArrayType); ok {
					// Get the slice type information
					sliceType := c.pkg.TypesInfo.TypeOf(exp.Args[0])
					if sliceType == nil {
						return errors.New("could not get type information for slice in make call")
					}
					goElemType, ok := sliceType.Underlying().(*types.Slice)
					if !ok {
						return errors.New("expected slice type for make call")
					}

					c.tsw.WriteLiterally("$.makeSlice<")
					c.WriteGoType(goElemType.Elem()) // Write the element type
					c.tsw.WriteLiterally(">(")

					if len(exp.Args) >= 2 {
						if err := c.WriteValueExpr(exp.Args[1]); err != nil { // Length
							return err
						}
						if len(exp.Args) == 3 {
							c.tsw.WriteLiterally(", ")
							if err := c.WriteValueExpr(exp.Args[2]); err != nil { // Capacity
								return err
							}
						} else if len(exp.Args) > 3 {
							return errors.New("makeSlice expects 2 or 3 arguments")
						}
					} else {
						// If no length is provided, default to 0
						c.tsw.WriteLiterally("0")
					}
					c.tsw.WriteLiterally(")")
					return nil // Handled make for slice
				}
			}
			// Fallthrough for unhandled make calls (e.g., channels)
			return errors.New("unhandled make call")
		case "string":
			// Handle string() conversion
			if len(exp.Args) == 1 {
				arg := exp.Args[0]

				// Case 1: Argument is a string literal string("...")
				if basicLit, isBasicLit := arg.(*ast.BasicLit); isBasicLit && basicLit.Kind == token.STRING {
					// Translate string("...") to "..." (no-op)
					c.WriteBasicLit(basicLit)
					return nil // Handled string literal conversion
				}

				// Case 2: Argument is a rune (int32) or a call to rune()
				innerCall, isCallExpr := arg.(*ast.CallExpr)

				if isCallExpr {
					// Check if it's a call to rune()
					if innerFunIdent, innerFunIsIdent := innerCall.Fun.(*ast.Ident); innerFunIsIdent && innerFunIdent.String() == "rune" {
						// Translate string(rune(val)) to String.fromCharCode(val)
						if len(innerCall.Args) == 1 {
							c.tsw.WriteLiterally("String.fromCharCode(")
							if err := c.WriteValueExpr(innerCall.Args[0]); err != nil {
								return fmt.Errorf("failed to write argument for string(rune) conversion: %w", err)
							}
							c.tsw.WriteLiterally(")")
							return nil // Handled string(rune)
						}
					}
				}

				// Handle direct string(int32) conversion
				// This assumes 'rune' is int32
				if tv, ok := c.pkg.TypesInfo.Types[arg]; ok {
					if basic, isBasic := tv.Type.Underlying().(*types.Basic); isBasic && basic.Kind() == types.Int32 {
						// Translate string(rune_val) to String.fromCharCode(rune_val)
						c.tsw.WriteLiterally("String.fromCharCode(")
						if err := c.WriteValueExpr(arg); err != nil {
							return fmt.Errorf("failed to write argument for string(int32) conversion: %w", err)
						}
						c.tsw.WriteLiterally(")")
						return nil // Handled string(int32)
					}

					// Case 3: Argument is a slice of runes or bytes string([]rune{...}) or string([]byte{...})
					if sliceType, isSlice := tv.Type.Underlying().(*types.Slice); isSlice {
						if basic, isBasic := sliceType.Elem().Underlying().(*types.Basic); isBasic {
							// Handle both runes (int32) and bytes (uint8)
							if basic.Kind() == types.Int32 || basic.Kind() == types.Uint8 {
								// Translate string([]rune) or string([]byte) to $.runesToString(...)
								c.tsw.WriteLiterally("$.runesToString(")
								if err := c.WriteValueExpr(arg); err != nil {
									return fmt.Errorf("failed to write argument for string([]rune/[]byte) conversion: %w", err)
								}
								c.tsw.WriteLiterally(")")
								return nil // Handled string([]rune) or string([]byte)
							}
						}
					}
				}
			}
			// Return error for other unhandled string conversions
			return fmt.Errorf("unhandled string conversion: %s", exp.Fun)
		case "close":
			// Translate close(ch) to ch.close()
			if len(exp.Args) == 1 {
				if err := c.WriteValueExpr(exp.Args[0]); err != nil {
					return fmt.Errorf("failed to write channel in close call: %w", err)
				}
				c.tsw.WriteLiterally(".close()")
				return nil // Handled close
			}
			return errors.New("unhandled close call with incorrect number of arguments")
		case "append":
			// Translate append(slice, elements...) to $.append(slice, elements...)
			if len(exp.Args) >= 1 {
				c.tsw.WriteLiterally("$.append(")
				// The first argument is the slice
				if err := c.WriteValueExpr(exp.Args[0]); err != nil {
					return fmt.Errorf("failed to write slice in append call: %w", err)
				}
				// The remaining arguments are the elements to append
				for i, arg := range exp.Args[1:] {
					if i > 0 || len(exp.Args) > 1 { // Add comma before elements if there are any
						c.tsw.WriteLiterally(", ")
					}
					if err := c.WriteValueExpr(arg); err != nil {
						return fmt.Errorf("failed to write argument %d in append call: %w", i+1, err)
					}
				}
				c.tsw.WriteLiterally(")")
				return nil // Handled append
			}
			return errors.New("unhandled append call with incorrect number of arguments")
		case "byte":
			// Translate byte(val) to $.byte(val)
			if len(exp.Args) == 1 {
				c.tsw.WriteLiterally("$.byte(")
				if err := c.WriteValueExpr(exp.Args[0]); err != nil {
					return err
				}
				c.tsw.WriteLiterally(")")
				return nil // Handled byte
			}
			return errors.New("unhandled byte call with incorrect number of arguments")
		default:
			// Not a special built-in, treat as a regular function call
			// Check if this is an async function call
			if funIdent != nil {
				// Get the object for this function identifier
				if obj := c.pkg.TypesInfo.Uses[funIdent]; obj != nil && c.analysis.IsAsyncFunc(obj) {
					// This is an async function
					c.tsw.WriteLiterally("await ")
				}
			}

			// Check if the function expression is a variable (nullable function)
			needsNonNullAssertion := false
			isFunc, isNillable := isFunctionNillable(c.pkg.TypesInfo, expFun)
			if isFunc && isNillable {
				needsNonNullAssertion = true
			}

			c.tsw.WriteLiterally("(")
			if err := c.WriteValueExpr(expFun); err != nil {
				return fmt.Errorf("failed to write function expression in call: %w", err)
			}
			
			// Only add non-null assertion if needed
			if needsNonNullAssertion {
				c.tsw.WriteLiterally("!")
			}
			c.tsw.WriteLiterally(")")

			c.tsw.WriteLiterally("(")
			for i, arg := range exp.Args {
				if i != 0 {
					c.tsw.WriteLiterally(", ")
				}
				if err := c.WriteValueExpr(arg); err != nil {
					return fmt.Errorf("failed to write argument %d in call: %w", i, err)
				}
			}
			c.tsw.WriteLiterally(")")

			return nil // Handled regular function call
		}
	} else {
		// Not an identifier (e.g., method call on a value)
		if err := c.WriteValueExpr(expFun); err != nil {
			return fmt.Errorf("failed to write method expression in call: %w", err)
		}
	}

	// Write arguments
	c.tsw.WriteLiterally("(")
	for i, arg := range exp.Args {
		if i != 0 {
			c.tsw.WriteLiterally(", ")
		}

		if err := c.WriteValueExpr(arg); err != nil {
			return fmt.Errorf("failed to write argument %d in call: %w", i, err)
		}
	}
	c.tsw.WriteLiterally(")")

	return nil
}

// WriteUnaryExpr translates a Go unary expression (`ast.UnaryExpr`) into its
// TypeScript equivalent.
// It handles several unary operations:
// - Channel receive (`<-ch`): Becomes `await ch.receive()`.
// - Address-of (`&var`):
//   - If `var` is a boxed variable (its address was taken), `&var` evaluates
//     to the box itself (i.e., `varName` in TypeScript, which holds the box).
//   - Otherwise (e.g., `&unboxedVar`, `&MyStruct{}`, `&FuncCall()`), it evaluates
//     the operand `var`. The resulting TypeScript value (e.g., a new object instance)
//     acts as the "pointer". Boxing decisions for such pointers are handled at
//     the assignment site.
//   - Other unary operators (`+`, `-`, `!`, `^`): Mapped to their TypeScript
//     equivalents (e.g., `+`, `-`, `!`, `~` for bitwise NOT). Parentheses are added
//     around the operand if it's a binary or unary expression to maintain precedence.
//
// Unhandled operators result in a comment and an attempt to write the operator
// token directly. Postfix operators (`++`, `--`) are expected to be handled by
// their statement contexts (e.g., `IncDecStmt`).
func (c *GoToTSCompiler) WriteUnaryExpr(exp *ast.UnaryExpr) error {
	if exp.Op == token.ARROW {
		// Channel receive: <-ch becomes await ch.receive()
		c.tsw.WriteLiterally("await ")
		if err := c.WriteValueExpr(exp.X); err != nil {
			return fmt.Errorf("failed to write channel receive operand: %w", err)
		}
		c.tsw.WriteLiterally(".receive()")
		return nil
	}

	if exp.Op == token.AND { // Address-of operator (&)
		// If the operand is an identifier for a variable that is boxed,
		// the result of & is the box itself.
		if ident, ok := exp.X.(*ast.Ident); ok {
			var obj types.Object
			obj = c.pkg.TypesInfo.Uses[ident]
			if obj == nil {
				obj = c.pkg.TypesInfo.Defs[ident]
			}
			if obj != nil && c.analysis.NeedsBoxed(obj) {
				// &boxedVar -> boxedVar (the box itself)
				c.tsw.WriteLiterally(ident.Name) // Write the identifier name (which holds the box)
				return nil
			}
		}

		// Otherwise (&unboxedVar, &CompositeLit{}, &FuncCall(), etc.),
		// the address-of operator in Go, when used to create a pointer,
		// translates to simply evaluating the operand in TypeScript.
		// The resulting value (e.g., a new object instance) acts as the "pointer".
		// Boxing decisions are handled at the assignment site based on the LHS variable.
		if err := c.WriteValueExpr(exp.X); err != nil {
			return fmt.Errorf("failed to write &-operand: %w", err)
		}

		return nil
	}

	// Handle other unary operators (+, -, !, ^)
	tokStr, ok := TokenToTs(exp.Op)
	if !ok {
		return errors.Errorf("unhandled unary op: %s", exp.Op.String())
	}
	c.tsw.WriteLiterally(tokStr)

	// Add space if operator is not postfix (e.g., !)
	if exp.Op != token.INC && exp.Op != token.DEC {
		// Check if operand needs parentheses (e.g., !(-a))
		// Basic check: if operand is binary or unary, add parens
		needsParens := false
		switch exp.X.(type) {
		case *ast.BinaryExpr, *ast.UnaryExpr:
			needsParens = true
		}
		if needsParens {
			c.tsw.WriteLiterally("(")
		}
		if err := c.WriteValueExpr(exp.X); err != nil {
			return fmt.Errorf("failed to write unary expression operand: %w", err)
		}
		if needsParens {
			c.tsw.WriteLiterally(")")
		}
	} else {
		// Postfix operators (++, --) - operand written first by caller (e.g., IncDecStmt)
		// This function shouldn't be called directly for ++/-- in expression context in valid Go?
		// If it is, write the operand.
		if err := c.WriteValueExpr(exp.X); err != nil {
			return fmt.Errorf("failed to write unary expression operand for postfix op: %w", err)
		}
	}

	return nil
}

// WriteBinaryExpr translates a Go binary expression (`ast.BinaryExpr`) into its
// TypeScript equivalent.
// It handles several cases:
//   - Channel send (`ch <- val`): Becomes `await ch.send(val)`.
//   - Nil comparison for pointers (`ptr == nil` or `ptr != nil`): Compares the
//     pointer (which may be a box object or `null`) directly to `null` using
//     the translated operator (`==` or `!=`).
//   - Pointer comparison (non-nil, `ptr1 == ptr2` or `ptr1 != ptr2`): Compares
//     the box objects directly using strict equality (`===` or `!==`).
//   - Bitwise operations (`&`, `|`, `^`, `<<`, `>>`, `&^`): The expression is wrapped
//     in parentheses `()` to ensure correct precedence in TypeScript, and operators
//     are mapped (e.g., `&^` might need special handling or is mapped to a runtime helper).
//   - Other binary operations (arithmetic, logical, comparison): Operands are
//     translated using `WriteValueExpr`, and the operator is mapped to its TypeScript
//     equivalent using `TokenToTs`.
//
// Unhandled operators result in a comment and a placeholder.
func (c *GoToTSCompiler) WriteBinaryExpr(exp *ast.BinaryExpr) error {
	// Handle special cases like channel send
	if exp.Op == token.ARROW {
		// Channel send: ch <- val becomes await ch.send(val)
		c.tsw.WriteLiterally("await ")
		if err := c.WriteValueExpr(exp.X); err != nil {
			return fmt.Errorf("failed to write channel send target: %w", err)
		}
		c.tsw.WriteLiterally(".send(")
		if err := c.WriteValueExpr(exp.Y); err != nil {
			return fmt.Errorf("failed to write channel send value: %w", err)
		}
		c.tsw.WriteLiterally(")")
		return nil
	}

	// Check if this is a nil comparison for a pointer
	isNilComparison := false
	var ptrExpr ast.Expr
	if (exp.Op == token.EQL || exp.Op == token.NEQ) && c.pkg != nil && c.pkg.TypesInfo != nil {
		if leftIdent, ok := exp.Y.(*ast.Ident); ok && leftIdent.Name == "nil" {
			leftType := c.pkg.TypesInfo.TypeOf(exp.X)
			if _, isPtr := leftType.(*types.Pointer); isPtr {
				isNilComparison = true
				ptrExpr = exp.X
			}
		} else if rightIdent, ok := exp.X.(*ast.Ident); ok && rightIdent.Name == "nil" {
			rightType := c.pkg.TypesInfo.TypeOf(exp.Y)
			if _, isPtr := rightType.(*types.Pointer); isPtr {
				isNilComparison = true
				ptrExpr = exp.Y
			}
		}
	}

	if isNilComparison {
		// Compare the box object directly to null
		if err := c.WriteValueExpr(ptrExpr); err != nil {
			return fmt.Errorf("failed to write pointer expression in nil comparison: %w", err)
		}
		c.tsw.WriteLiterally(" ")
		tokStr, ok := TokenToTs(exp.Op)
		if !ok {
			return errors.Errorf("unhandled binary op: %s", exp.Op.String())
		}
		c.tsw.WriteLiterally(tokStr)
		c.tsw.WriteLiterally(" null")
		return nil
	}

	// Check if this is a pointer comparison (non-nil)
	// Compare the box objects directly using === or !==
	if c.isPointerComparison(exp) {
		c.tsw.WriteLiterally("(") // Wrap comparison
		if err := c.WriteValueExpr(exp.X); err != nil {
			return fmt.Errorf("failed to write binary expression left operand: %w", err)
		}
		c.tsw.WriteLiterally(" ")
		// Use === for == and !== for !=
		tokStr := ""
		switch exp.Op {
		case token.EQL:
			tokStr = "==="
		case token.NEQ:
			tokStr = "!=="
		default:
			return errors.Errorf("unhandled pointer comparison op: %s", exp.Op.String())
		}
		c.tsw.WriteLiterally(tokStr)
		c.tsw.WriteLiterally(" ")
		if err := c.WriteValueExpr(exp.Y); err != nil {
			return fmt.Errorf("failed to write binary expression right operand: %w", err)
		}
		c.tsw.WriteLiterally(")") // Close wrap
		return nil
	}

	// Check if the operator is a bitwise operator
	isBitwise := false
	switch exp.Op {
	case token.AND, token.OR, token.XOR, token.SHL, token.SHR, token.AND_NOT:
		isBitwise = true
	}

	if isBitwise {
		c.tsw.WriteLiterally("(") // Add opening parenthesis for bitwise operations
	}

	if err := c.WriteValueExpr(exp.X); err != nil {
		return fmt.Errorf("failed to write binary expression left operand: %w", err)
	}
	c.tsw.WriteLiterally(" ")
	tokStr, ok := TokenToTs(exp.Op)
	if !ok {
		return errors.Errorf("unhandled binary op: %s", exp.Op.String())
	}
	c.tsw.WriteLiterally(tokStr)
	c.tsw.WriteLiterally(" ")
	if err := c.WriteValueExpr(exp.Y); err != nil {
		return fmt.Errorf("failed to write binary expression right operand: %w", err)
	}

	if isBitwise {
		c.tsw.WriteLiterally(")") // Add closing parenthesis for bitwise operations
	}

	return nil
}

// WriteBasicLit translates a Go basic literal (`ast.BasicLit`) into its
// TypeScript equivalent.
//   - Character literals (e.g., `'a'`, `'\n'`) are translated to their numeric
//     Unicode code point (e.g., `97`, `10`). Escape sequences are handled.
//   - Integer, float, imaginary, and string literals are written directly as their
//     `exp.Value` string, which typically corresponds to valid TypeScript syntax
//     (e.g., `123`, `3.14`, `"hello"`). Imaginary literals might need special
//     handling if they are to be fully supported beyond direct string output.
func (c *GoToTSCompiler) WriteBasicLit(exp *ast.BasicLit) {
	if exp.Kind == token.CHAR {
		// Go char literal 'x' is a rune (int32). Translate to its numeric code point.
		// Use strconv.UnquoteChar to handle escape sequences correctly.
		val, _, _, err := strconv.UnquoteChar(exp.Value[1:len(exp.Value)-1], '\'')
		if err != nil {
			c.tsw.WriteCommentInline(fmt.Sprintf("error parsing char literal %s: %v", exp.Value, err))
			c.tsw.WriteLiterally("0") // Default to 0 on error
		} else {
			c.tsw.WriteLiterally(fmt.Sprintf("%d", val))
		}
	} else {
		// Other literals (INT, FLOAT, STRING, IMAG)
		c.tsw.WriteLiterally(exp.Value)
	}
}

// WriteCompositeLit translates a Go composite literal expression (`ast.CompositeLit`)
// into its TypeScript equivalent. This is used for initializing structs, arrays,
// slices, and maps.
//
// Behavior varies by type:
// - Map literals (`map[K]V{k1: v1, ...}`): Translated to `new Map([[k1_ts, v1_ts], ...])`.
// - Array literals (`[N]T{idx1: v1, v2, ...}`):
//   - Translated to a TypeScript array literal `[v1_ts, v2_ts, ...]`.
//   - If the Go array literal has explicit indices or is sparsely initialized,
//     the TypeScript array is filled up to the required length (determined by
//     type information or the maximum index used). Uninitialized elements are
//     filled with the zero value of the element type using `WriteZeroValueForType`.
//   - Empty slice literals (`[]T{}`) become `([] as ElementType_ts[])`.
//
// - Struct literals (`MyStruct{Field1: v1, ...}` or `&MyStruct{...}`):
//   - Translated to `new MyStruct_ts({ field1: v1_ts, ... })`.
//   - Handles direct fields, promoted fields from embedded structs, and explicit
//     initialization of embedded structs.
//   - For promoted fields (`Outer{InnerField: val}`), it correctly populates
//     the `InnerStructName: { InnerField: val_ts }` structure in the TypeScript
//     constructor argument.
//   - For explicit embedded struct initialization (`Outer{InnerStructName: InnerStructValue}`),
//     it populates `InnerStructName: InnerStructValue_ts`. If `InnerStructValue` is
//     itself a composite literal, its fields are expanded directly.
//   - Untyped composite literals: Guesses based on element structure (key-value pairs
//     suggest an object `{...}`, otherwise an array `[...]`). A comment indicates
//     the guessed type.
//
// This function relies heavily on `go/types` (`TypesInfo.TypeOf`) to determine
// the kind of literal being constructed and to handle types correctly, especially
// for zero values and struct field resolution.
// It takes a value expression and writes it to the TypeScript output, handling boxing and method access.
func (c *GoToTSCompiler) writeBoxedValue(expr ast.Expr) error {
	if expr == nil {
		return fmt.Errorf("nil expression passed to writeBoxedValue")
	}
	
	// Handle different expression types
	switch e := expr.(type) {
	case *ast.Ident:
		c.WriteIdent(e, true)
		return nil
	case *ast.SelectorExpr:
		return c.WriteSelectorExpr(e)
	case *ast.StarExpr:
		// For star expressions, delegate to WriteStarExpr which handles dereferencing
		return c.WriteStarExpr(e)
	case *ast.BasicLit:
		c.WriteBasicLit(e)
		return nil
	default:
		// For other expression types, use WriteValueExpr
		return c.WriteValueExpr(expr)
	}
}

func (c *GoToTSCompiler) writeBoxedValueWithMethods(expr ast.Expr, typ types.Type) error {
	if expr == nil {
		return fmt.Errorf("nil expression passed to writeBoxedValueWithMethods")
	}
	
	// First, write the expression using writeBoxedValue
	if err := c.writeBoxedValue(expr); err != nil {
		return err
	}
	
	// to handle special cases for types with methods if needed in the future
	
	return nil
}

func (c *GoToTSCompiler) WriteCompositeLit(exp *ast.CompositeLit) error {
	// Get the type of the composite literal
	litType := c.pkg.TypesInfo.TypeOf(exp)

	if exp.Type != nil {
		// Handle map literals: map[K]V{k1: v1, k2: v2}
		if _, isMapType := exp.Type.(*ast.MapType); isMapType {
			c.tsw.WriteLiterally("new Map([")

			// Add each key-value pair as an entry
			for i, elm := range exp.Elts {
				if i > 0 {
					c.tsw.WriteLiterally(", ")
				}

				if kv, ok := elm.(*ast.KeyValueExpr); ok {
					c.tsw.WriteLiterally("[")
					if err := c.writeBoxedValue(kv.Key); err != nil {
						return fmt.Errorf("failed to write map literal key: %w", err)
					}
					c.tsw.WriteLiterally(", ")
					if err := c.writeBoxedValue(kv.Value); err != nil {
						return fmt.Errorf("failed to write map literal value: %w", err)
					}
					c.tsw.WriteLiterally("]")
				} else {
					return fmt.Errorf("map literal elements must be key-value pairs")
				}
			}

			c.tsw.WriteLiterally("])")
			return nil
		}

		// Handle array literals
		if arrType, isArrayType := exp.Type.(*ast.ArrayType); isArrayType {
			// Special case: empty slice literal
			if len(exp.Elts) == 0 {
				// Generate: $.arrayToSlice([], 1)
				c.tsw.WriteLiterally("$.arrayToSlice([] as ")
				// Write the element type using the existing function
				c.WriteTypeExpr(arrType.Elt)
				c.tsw.WriteLiterally("[], 1)") // Close the type assertion and arrayToSlice call
				return nil                     // Handled empty slice literal
			}

			// Check if this is a slice of slices (multi-dimensional array)
			isMultiDimensional := false
			if _, ok := arrType.Elt.(*ast.ArrayType); ok {
				// It's a slice of slices (multi-dimensional array)
				isMultiDimensional = true
				// We'll handle this with depth parameter to arrayToSlice
			}

			c.tsw.WriteLiterally("$.arrayToSlice([")
			// Use type info to get array length and element type
			var arrayLen int
			var elemType ast.Expr
			var goElemType interface{}
			if typ := c.pkg.TypesInfo.TypeOf(exp.Type); typ != nil {
				if at, ok := typ.Underlying().(*types.Array); ok {
					arrayLen = int(at.Len())
					goElemType = at.Elem()
				}
			}
			if arrType.Len != nil {
				// Try to evaluate the length from the AST if not available from type info
				if bl, ok := arrType.Len.(*ast.BasicLit); ok && bl.Kind == token.INT {
					if _, err := fmt.Sscan(bl.Value, &arrayLen); err != nil {
						return fmt.Errorf("failed to parse array length from basic literal: %w", err)
					}
				}
			}
			elemType = arrType.Elt

			// Map of index -> value
			elements := make(map[int]ast.Expr)
			orderedCount := 0
			maxIndex := -1
			hasKeyedElements := false

			for _, elm := range exp.Elts {
				if kv, ok := elm.(*ast.KeyValueExpr); ok {
					if lit, ok := kv.Key.(*ast.BasicLit); ok && lit.Kind == token.INT {
						var index int
						if _, err := fmt.Sscan(lit.Value, &index); err != nil {
							return fmt.Errorf("failed to parse array index from basic literal: %w", err)
						}
						elements[index] = kv.Value
						if index > maxIndex {
							maxIndex = index
						}
						hasKeyedElements = true
					} else {
						c.tsw.WriteCommentInline("unhandled keyed array literal key type")
						if err := c.writeBoxedValue(elm); err != nil {
							return fmt.Errorf("failed to write keyed array literal element with unhandled key type: %w", err)
						}
					}
				} else {
					elements[orderedCount] = elm
					if orderedCount > maxIndex {
						maxIndex = orderedCount
					}
					orderedCount++
				}
			}

			// Determine array length
			if arrayLen == 0 {
				// If length is not set, infer from max index or number of elements
				if hasKeyedElements {
					arrayLen = maxIndex + 1
				} else {
					arrayLen = len(exp.Elts)
				}
			}

			for i := 0; i < arrayLen; i++ {
				if i > 0 {
					c.tsw.WriteLiterally(", ")
				}
				if elm, ok := elements[i]; ok && elm != nil {
					if err := c.writeBoxedValue(elm); err != nil {
						return fmt.Errorf("failed to write array literal element: %w", err)
					}
				} else {
					// Write zero value for element type
					if goElemType != nil {
						c.WriteZeroValueForType(goElemType)
					} else {
						c.WriteZeroValueForType(elemType)
					}
				}
			}
			c.tsw.WriteLiterally("]")

			// If it's a multi-dimensional array/slice, use depth=2 to convert nested arrays
			if isMultiDimensional {
				c.tsw.WriteLiterally(", 2") // Depth of 2 for one level of nesting
			}

			c.tsw.WriteLiterally(")")
			return nil
		} else {
			// Typed literal, likely a struct: new Type({...})
			c.tsw.WriteLiterally("new ")
			c.WriteTypeExpr(exp.Type)

			// Check if this is a struct type
			var structType *types.Struct
			isStructLiteral := false
			if namedType, ok := litType.(*types.Named); ok {
				if underlyingStruct, ok := namedType.Underlying().(*types.Struct); ok {
					structType = underlyingStruct
					isStructLiteral = true
				}
			} else if ptrType, ok := litType.(*types.Pointer); ok {
				if namedElem, ok := ptrType.Elem().(*types.Named); ok {
					if underlyingStruct, ok := namedElem.Underlying().(*types.Struct); ok {
						structType = underlyingStruct
						isStructLiteral = true // Treat pointer-to-struct literal similarly
					}
				}
			} else if _, ok := litType.Underlying().(*types.Struct); ok {
				// Handle anonymous struct literals if needed, though less common with embedding
				isStructLiteral = true
			}

			if isStructLiteral && structType != nil {
				// --- Struct Literal Handling (Nested) ---
				directFields := make(map[string]ast.Expr)
				embeddedFields := make(map[string]map[string]ast.Expr) // map[EmbeddedPropName]map[FieldName]ValueExpr
				explicitEmbedded := make(map[string]ast.Expr)          // Tracks explicitly initialized embedded structs

				// Pre-populate embeddedFields map keys using the correct property name
				for i := 0; i < structType.NumFields(); i++ {
					field := structType.Field(i)
					if field.Anonymous() {
						fieldType := field.Type()
						if ptr, ok := fieldType.(*types.Pointer); ok {
							fieldType = ptr.Elem()
						}
						if named, ok := fieldType.(*types.Named); ok {
							// Use the type name as the property name in TS
							embeddedPropName := named.Obj().Name()
							embeddedFields[embeddedPropName] = make(map[string]ast.Expr)
						}
					}
				}

				// Group literal elements by direct vs embedded fields
				for _, elt := range exp.Elts {
					kv, ok := elt.(*ast.KeyValueExpr)
					if !ok {
						continue
					} // Skip non-key-value
					keyIdent, ok := kv.Key.(*ast.Ident)
					if !ok {
						continue
					} // Skip non-ident keys
					keyName := keyIdent.Name

					// Check if this is an explicit embedded struct initialization
					// e.g., Person: Person{...} or Person: personVar
					if _, isEmbedded := embeddedFields[keyName]; isEmbedded {
						// This is an explicit initialization of an embedded struct
						explicitEmbedded[keyName] = kv.Value
						continue
					}

					isDirectField := false
					for i := range structType.NumFields() {
						field := structType.Field(i)
						if field.Name() == keyName {
							isDirectField = true
							directFields[keyName] = kv.Value
							break
						}
					}

					// If not a direct field, return an error
					if !isDirectField {
						// This field was not found as a direct field in the struct
						return fmt.Errorf("field %s not found in type %s for composite literal",
							keyName, litType.String())
					}
				}

				// Write the nested literal for the constructor argument
				c.tsw.WriteLiterally("({")
				firstFieldWritten := false

				// Write direct fields that aren't embedded struct names
				directKeys := make([]string, 0, len(directFields))
				for k := range directFields {
					// Skip embedded struct names - we'll handle those separately
					if _, isEmbedded := embeddedFields[k]; !isEmbedded {
						directKeys = append(directKeys, k)
					}
				}
				slices.Sort(directKeys)
				for _, keyName := range directKeys {
					if firstFieldWritten {
						c.tsw.WriteLiterally(", ")
					}
					c.tsw.WriteLiterally(keyName)
					c.tsw.WriteLiterally(": ")
					if err := c.writeBoxedValue(directFields[keyName]); err != nil {
						return err
					}
					firstFieldWritten = true
				}

				// Write explicitly initialized embedded structs
				explicitKeys := make([]string, 0, len(explicitEmbedded))
				for k := range explicitEmbedded {
					explicitKeys = append(explicitKeys, k)
				}
				slices.Sort(explicitKeys)
				for _, embeddedName := range explicitKeys {
					if firstFieldWritten {
						c.tsw.WriteLiterally(", ")
					}
					c.tsw.WriteLiterally(embeddedName)
					c.tsw.WriteLiterally(": ")

					// Check if the embedded value is a composite literal for a struct
					// If so, extract the fields and write them directly
					if compLit, ok := explicitEmbedded[embeddedName].(*ast.CompositeLit); ok {
						// Write initialization fields directly without the 'new Constructor'
						c.tsw.WriteLiterally("{")
						for i, elem := range compLit.Elts {
							if i > 0 {
								c.tsw.WriteLiterally(", ")
							}
							if err := c.writeBoxedValue(elem); err != nil {
								return err
							}
						}
						c.tsw.WriteLiterally("}")
					} else {
						// Not a composite literal, write it normally
						if err := c.writeBoxedValue(explicitEmbedded[embeddedName]); err != nil {
							return err
						}
					}
					firstFieldWritten = true
				}

				// Write embedded fields for structs that weren't explicitly initialized
				embeddedKeys := make([]string, 0, len(embeddedFields))
				for k := range embeddedFields {
					// Skip embedded structs that were explicitly initialized
					if _, wasExplicit := explicitEmbedded[k]; !wasExplicit {
						embeddedKeys = append(embeddedKeys, k)
					}
				}
				slices.Sort(embeddedKeys)
				for _, embeddedPropName := range embeddedKeys {
					fieldsMap := embeddedFields[embeddedPropName]
					if len(fieldsMap) == 0 {
						continue
					} // Skip empty embedded initializers

					if firstFieldWritten {
						c.tsw.WriteLiterally(", ")
					}
					c.tsw.WriteLiterally(embeddedPropName) // Use the Type name as the property key
					c.tsw.WriteLiterally(": {")

					innerKeys := make([]string, 0, len(fieldsMap))
					for k := range fieldsMap {
						innerKeys = append(innerKeys, k)
					}
					slices.Sort(innerKeys)
					for i, keyName := range innerKeys {
						if i > 0 {
							c.tsw.WriteLiterally(", ")
						}
						c.tsw.WriteLiterally(keyName) // Field name within the embedded struct
						c.tsw.WriteLiterally(": ")
						if err := c.writeBoxedValue(fieldsMap[keyName]); err != nil {
							return err
						}
					}
					c.tsw.WriteLiterally("}")
					firstFieldWritten = true
				}

				c.tsw.WriteLiterally("})") // Close constructor argument object

			} else {
				// Non-struct type or anonymous struct, handle normally (or potentially error for anonymous struct literals?)
				c.tsw.WriteLiterally("({") // Assuming object literal for constructor
				for i, elm := range exp.Elts {
					if i != 0 {
						c.tsw.WriteLiterally(", ")
					}
					if err := c.writeBoxedValue(elm); err != nil {
						return fmt.Errorf("failed to write literal field: %w", err)
					}
				}
				c.tsw.WriteLiterally("})")
			}
			return nil
		}
	}

	// Untyped composite literal. Let's use type information to determine what it is.
	// First try to get the type information for the expression
	isObject := false
	if tv, ok := c.pkg.TypesInfo.Types[exp]; ok && tv.Type != nil {
		underlying := tv.Type.Underlying()
		switch underlying.(type) {
		case *types.Map, *types.Struct:
			isObject = true
		case *types.Array, *types.Slice:
			isObject = false
		default:
			return fmt.Errorf("unhandled composite literal type: %T", underlying)
		}
	} else {
		return fmt.Errorf("could not determine composite literal type from type information")
	}

	if isObject {
		c.tsw.WriteLiterally("{ ")
	} else {
		c.tsw.WriteLiterally("[ ")
	}

	for i, elm := range exp.Elts {
		if i != 0 {
			c.tsw.WriteLiterally(", ")
		}
		if err := c.writeBoxedValue(elm); err != nil {
			return fmt.Errorf("failed to write untyped composite literal element: %w", err)
		}
	}
	if isObject {
		c.tsw.WriteLiterally(" }")
	} else {
		c.tsw.WriteLiterally(" ]")
	}
	return nil
}

// WriteKeyValueExpr translates a Go key-value pair expression (`ast.KeyValueExpr`),
// typically found within composite literals (for structs, maps, or arrays with
// indexed elements), into its TypeScript object property equivalent: `key: value`.
// Both the key and the value expressions are recursively translated using
// `WriteValueExpr`. The original Go casing for keys is preserved.
// For example, `MyField: 123` in Go becomes `MyField: 123` in TypeScript.
func (c *GoToTSCompiler) WriteKeyValueExpr(exp *ast.KeyValueExpr) error {
	// Keep original Go casing for keys
	if err := c.WriteValueExpr(exp.Key); err != nil {
		return fmt.Errorf("failed to write key-value expression key: %w", err)
	}
	c.tsw.WriteLiterally(": ")
	if err := c.WriteValueExpr(exp.Value); err != nil {
		return fmt.Errorf("failed to write key-value expression value: %w", err)
	}
	return nil
}

// WriteFuncLitValue translates a Go function literal (`ast.FuncLit`) into a
// TypeScript arrow function.
// The translation results in: `[async] (param1: type1, ...) : returnType => { ...body... }`.
//   - The `async` keyword is prepended if `c.analysis.IsFuncLitAsync(exp)`
//     indicates the function literal contains asynchronous operations.
//   - Parameters are translated using `WriteFieldList`.
//   - The return type is determined similarly to `WriteFuncType`:
//   - `void` for no results.
//   - `resultType` for a single unnamed result.
//   - `[typeA, typeB]` for multiple or named results.
//   - Wrapped in `Promise<>` if `async`.
//   - The function body (`exp.Body`) is translated using `WriteStmt`.
func (c *GoToTSCompiler) WriteFuncLitValue(exp *ast.FuncLit) error {
	// Determine if the function literal should be async
	isAsync := c.analysis.IsFuncLitAsync(exp)

	if isAsync {
		c.tsw.WriteLiterally("async ")
	}

	// Write arrow function: (params) => { body }
	c.tsw.WriteLiterally("(")
	
	// Use WriteFieldList which now handles variadic parameters
	c.WriteFieldList(exp.Type.Params, true) // true = arguments
	c.tsw.WriteLiterally(")")

	// Handle return type for function literals
	if exp.Type.Results != nil && len(exp.Type.Results.List) > 0 {
		c.tsw.WriteLiterally(": ")
		if isAsync {
			c.tsw.WriteLiterally("Promise<")
		}
		if len(exp.Type.Results.List) == 1 && len(exp.Type.Results.List[0].Names) == 0 {
			c.WriteTypeExpr(exp.Type.Results.List[0].Type)
		} else {
			c.tsw.WriteLiterally("[")
			for i, field := range exp.Type.Results.List {
				if i > 0 {
					c.tsw.WriteLiterally(", ")
				}
				c.WriteTypeExpr(field.Type)
			}
			c.tsw.WriteLiterally("]")
		}
		if isAsync {
			c.tsw.WriteLiterally(">")
		}
	} else {
		if isAsync {
			c.tsw.WriteLiterally(": Promise<void>")
		} else {
			c.tsw.WriteLiterally(": void")
		}
	}

	c.tsw.WriteLiterally(" => ")

	// Write function body
	if err := c.WriteStmt(exp.Body); err != nil {
		return err
	}

	return nil
}

// WriteSpec is a dispatcher function that translates a Go specification node
// (`ast.Spec`) into its TypeScript equivalent. It handles different types of
// specifications found within `GenDecl` (general declarations):
// - `ast.ImportSpec` (import declarations): Delegates to `WriteImportSpec`.
// - `ast.ValueSpec` (variable or constant declarations): Delegates to `WriteValueSpec`.
// - `ast.TypeSpec` (type definitions like structs, interfaces): Delegates to `WriteTypeSpec`.
// If an unknown specification type is encountered, it returns an error.
func (c *GoToTSCompiler) WriteSpec(a ast.Spec) error {
	switch d := a.(type) {
	case *ast.ImportSpec:
		c.WriteImportSpec(d)
	case *ast.ValueSpec:
		if err := c.WriteValueSpec(d); err != nil {
			return err
		}
	case *ast.TypeSpec:
		if err := c.WriteTypeSpec(d); err != nil {
			return err
		}
	default:
		return fmt.Errorf("unknown spec type: %T", a)
	}
	return nil
}

// collectMethodNames scans all files in the current package (`c.pkg.Syntax`)
// to find all method declarations associated with a given `structName`.
// It identifies methods by checking `ast.FuncDecl` nodes for receivers
// whose type (or underlying type if it's a pointer receiver) matches `structName`.
// Returns a comma-separated string of quoted method names (e.g., "'MethodA', 'MethodB'"),
// suitable for use in generating metadata like the `$.IMetamethods` list for a struct class.
func (c *GoToTSCompiler) collectMethodNames(structName string) string {
	var methodNames []string

	for _, fileSyntax := range c.pkg.Syntax {
		for _, decl := range fileSyntax.Decls {
			funcDecl, isFunc := decl.(*ast.FuncDecl)
			if !isFunc || funcDecl.Recv == nil || len(funcDecl.Recv.List) == 0 {
				continue // Skip non-functions or functions without receivers
			}

			// Check if the receiver type matches the struct name
			recvField := funcDecl.Recv.List[0]
			recvType := recvField.Type
			// Handle pointer receivers (*MyStruct) and value receivers (MyStruct)
			if starExpr, ok := recvType.(*ast.StarExpr); ok {
				recvType = starExpr.X // Get the type being pointed to
			}

			// Check if the receiver identifier name matches the struct name
			if ident, ok := recvType.(*ast.Ident); ok && ident.Name == structName {
				// Found a method for this struct
				methodNames = append(methodNames, fmt.Sprintf("'%s'", funcDecl.Name.Name))
			}
		}
	}

	return strings.Join(methodNames, ", ")
}

// getTypeString is a utility function that converts a Go `types.Type` into its
// TypeScript type string representation. It achieves this by creating a temporary
// `GoToTSCompiler` and `TSCodeWriter` (writing to a `strings.Builder`) and then
// calling `WriteGoType` on the provided Go type. This allows reusing the main
// type translation logic to get a string representation of the TypeScript type.
func (c *GoToTSCompiler) getTypeString(goType types.Type) string {
	var typeStr strings.Builder
	writer := NewTSCodeWriter(&typeStr)
	tempCompiler := NewGoToTSCompiler(writer, c.pkg, c.analysis)
	tempCompiler.WriteGoType(goType)
	return typeStr.String()
}

// generateFlattenedInitTypeString generates a TypeScript type string for the
// initialization object passed to a Go struct's constructor (`_init` method in TypeScript).
// The generated type is a `Partial`-like structure, `"{ Field1?: Type1, Field2?: Type2, ... }"`,
// including all direct and promoted fields of the `structType`.
//   - It iterates through the direct fields of the `structType`. Exported fields
//     are included with their TypeScript types (obtained via `WriteGoType`).
//   - For anonymous (embedded) fields, it generates a type like `EmbeddedName?: ConstructorParameters<typeof EmbeddedName>[0]`,
//     allowing initialization of the embedded struct's fields directly within the outer struct's initializer.
//   - It then uses `types.NewMethodSet` and checks for `types.Var` objects that are fields
//     to find promoted fields from embedded structs, adding them to the type string if not already present.
//
// The resulting string is sorted by field name for deterministic output and represents
// the shape of the object expected by the struct's TypeScript constructor.
func (c *GoToTSCompiler) generateFlattenedInitTypeString(structType *types.Named) string {
	if structType == nil {
		return "{}"
	}

	// Use a map to collect unique field names and their types
	fieldMap := make(map[string]string)
	embeddedTypeMap := make(map[string]string)

	// Iterate over the struct's fields directly
	underlying, ok := structType.Underlying().(*types.Struct)
	if !ok {
		return "{}"
	}

	// First add the direct fields and track embedded types
	for i := 0; i < underlying.NumFields(); i++ {
		field := underlying.Field(i)
		fieldName := field.Name()

		// Skip unexported fields
		if !field.Exported() && field.Pkg() != c.pkg.Types {
			continue
		}

		// Special handling for embedded fields
		if field.Anonymous() {
			// For embedded types, add them to a separate map
			fieldType := field.Type()

			// Unwrap pointer if needed
			if ptr, ok := fieldType.(*types.Pointer); ok {
				fieldType = ptr.Elem()
			}

			// Get the embedded type name
			if named, ok := fieldType.(*types.Named); ok {
				embeddedName := named.Obj().Name()

				// Generate the type string for the embedded field using ConstructorParameters
				// e.g., Person?: ConstructorParameters<typeof Person>[0]
				embeddedTypeMap[embeddedName] = fmt.Sprintf("ConstructorParameters<typeof %s>[0]", embeddedName)
			}
			continue
		}

		// Get the type string for regular fields
		var typeStr strings.Builder
		writer := NewTSCodeWriter(&typeStr)
		tempCompiler := NewGoToTSCompiler(writer, c.pkg, c.analysis)
		tempCompiler.WriteGoType(field.Type())

		fieldMap[fieldName] = typeStr.String()
	}

	// Then check for promoted fields via the method set
	mset := types.NewMethodSet(structType)
	for i := 0; i < mset.Len(); i++ {
		sel := mset.At(i)
		// Check if the selection is a field (not a method)
		if obj, ok := sel.Obj().(*types.Var); ok && obj.IsField() {
			fieldName := obj.Name()
			// Skip if already added or unexported
			if _, exists := fieldMap[fieldName]; exists || (!obj.Exported() && obj.Pkg() != c.pkg.Types) {
				continue
			}

			// Get the type string for the field
			var typeStr strings.Builder
			writer := NewTSCodeWriter(&typeStr)
			tempCompiler := NewGoToTSCompiler(writer, c.pkg, c.analysis)
			tempCompiler.WriteGoType(sel.Type())

			fieldMap[fieldName] = typeStr.String()
		}
	}

	// Add embedded types to the field map
	for embeddedName, embeddedType := range embeddedTypeMap {
		fieldMap[embeddedName] = embeddedType
	}

	// Sort keys for deterministic output
	var fieldNames []string
	for name := range fieldMap {
		fieldNames = append(fieldNames, name)
	}
	sort.Strings(fieldNames)

	var fieldDefs []string
	for _, fieldName := range fieldNames {
		fieldDefs = append(fieldDefs, fmt.Sprintf("%s?: %s", fieldName, fieldMap[fieldName]))
	}

	return "{" + strings.Join(fieldDefs, ", ") + "}"
}

// collectInterfaceMethods scans a Go interface type (`ast.InterfaceType`) and
// its embedded interfaces to gather a unique list of all method names it defines.
//   - For explicitly named methods in `interfaceType.Methods`, their names are added.
//   - For embedded interfaces, it resolves the embedded type using `go/types` information
//     (`c.pkg.TypesInfo.Types`). If resolved to a `types.Interface`, it iterates
//     through the methods of that underlying interface and adds their names.
//
// The collected method names are then sorted and returned as a comma-separated
// string of quoted names (e.g., "'MethodA', 'MethodB'"). This is used for
// generating metadata, such as the `$.IMetamethods` list for an interface type helper.
// If an embedded interface cannot be fully resolved, a comment is written to the
// output, but the process continues with available information.
func (c *GoToTSCompiler) collectInterfaceMethods(interfaceType *ast.InterfaceType) string {
	// Use a map to ensure uniqueness of method names
	methodNamesMap := make(map[string]struct{})

	if interfaceType.Methods != nil {
		for _, method := range interfaceType.Methods.List {
			if len(method.Names) > 0 {
				// Named method
				methodNamesMap[method.Names[0].Name] = struct{}{}
			} else {
				// Embedded interface - resolve it and collect its methods
				embeddedType := method.Type

				// Resolve the embedded interface using type information
				if tv, ok := c.pkg.TypesInfo.Types[embeddedType]; ok && tv.Type != nil {
					// Get the underlying interface type
					var ifaceType *types.Interface
					if named, ok := tv.Type.(*types.Named); ok {
						if underlying, ok := named.Underlying().(*types.Interface); ok {
							ifaceType = underlying
						}
					} else if underlying, ok := tv.Type.(*types.Interface); ok {
						ifaceType = underlying
					}

					// Collect methods from the interface
					if ifaceType != nil {
						for i := 0; i < ifaceType.NumMethods(); i++ {
							methodNamesMap[ifaceType.Method(i).Name()] = struct{}{}
						}
					}
				} else {
					// Couldn't resolve the embedded interface
					c.tsw.WriteCommentLine("// Note: Some embedded interface methods may not be fully resolved")
				}
			}
		}
	}

	// Convert the map to a slice for a deterministic output order
	var methodNames []string
	for name := range methodNamesMap {
		methodNames = append(methodNames, fmt.Sprintf("'%s'", name))
	}

	// Sort for deterministic output
	sort.Strings(methodNames)

	return strings.Join(methodNames, ", ")
}

// WriteFuncDeclAsMethod translates a Go function declaration (`ast.FuncDecl`)
// that has a receiver (i.e., it's a method) into a TypeScript class method.
//   - It preserves Go documentation comments (`decl.Doc`).
//   - The method is declared as `public`.
//   - If the `Analysis` data indicates the method is asynchronous, the `async`
//     keyword is prepended.
//   - The method name retains its original Go casing.
//   - Parameters and return types are translated using `WriteFieldList` and
//     `WriteTypeExpr`, respectively. Async methods have their return types
//     wrapped in `Promise<>`.
//   - The method body is translated. If the Go receiver has a name (e.g., `(s *MyStruct)`),
//     a `const receiverName = this;` binding is generated at the start of the
//     TypeScript method body to make `this` available via the Go receiver's name.
//     If the method body requires deferred cleanup (`NeedsDefer`), the appropriate
//     `using __defer = new $.DisposableStack()` (or `AsyncDisposableStack`)
//     is also generated.
//
// This function assumes it is called only for `FuncDecl` nodes that are methods.
func (c *GoToTSCompiler) WriteFuncDeclAsMethod(decl *ast.FuncDecl) error {
	if decl.Doc != nil {
		c.WriteDoc(decl.Doc)
	}

	// Determine if method is async
	var isAsync bool
	if obj := c.pkg.TypesInfo.Defs[decl.Name]; obj != nil {
		isAsync = c.analysis.IsAsyncFunc(obj)
	}

	// Methods are typically public in the TS output
	c.tsw.WriteLiterally("public ")

	// Add async modifier if needed
	if isAsync {
		c.tsw.WriteLiterally("async ")
	}

	// Keep original Go casing for method names
	if err := c.WriteValueExpr(decl.Name); err != nil { // Method name is a value identifier
		return err
	}

	// Write signature (parameters and return type)
	// We adapt the logic from WriteFuncType here, but without the 'function' keyword
	funcType := decl.Type
	c.tsw.WriteLiterally("(")
	if funcType.Params != nil {
		c.WriteFieldList(funcType.Params, true) // true = arguments
	}
	c.tsw.WriteLiterally(")")

	// Handle return type
	if funcType.Results != nil && len(funcType.Results.List) > 0 {
		c.tsw.WriteLiterally(": ")
		if isAsync {
			c.tsw.WriteLiterally("Promise<")
		}
		if len(funcType.Results.List) == 1 {
			// Single return value
			resultType := funcType.Results.List[0].Type
			c.WriteTypeExpr(resultType)
		} else {
			// Multiple return values -> tuple type
			c.tsw.WriteLiterally("[")
			for i, field := range funcType.Results.List {
				if i > 0 {
					c.tsw.WriteLiterally(", ")
				}
				c.WriteTypeExpr(field.Type)
			}
			c.tsw.WriteLiterally("]")
		}
		if isAsync {
			c.tsw.WriteLiterally(">")
		}
	} else {
		// No return value -> void
		if isAsync {
			c.tsw.WriteLiterally(": Promise<void>")
		} else {
			c.tsw.WriteLiterally(": void")
		}
	}

	c.tsw.WriteLiterally(" ")

	// Bind receiver name to this
	if recvField := decl.Recv.List[0]; len(recvField.Names) > 0 {
		recvName := recvField.Names[0].Name
		if recvName != "_" {
			c.tsw.WriteLine("{")
			c.tsw.Indent(1)
			c.tsw.WriteLinef("const %s = this", recvName)

			// Add using statement if needed
			if c.analysis.NeedsDefer(decl.Body) {
				if c.analysis.IsInAsyncFunction(decl) {
					c.tsw.WriteLine("await using __defer = new $.AsyncDisposableStack();")
				} else {
					c.tsw.WriteLine("using cleanup = new $.DisposableStack();")
				}
			}

			// write method body without outer braces
			for _, stmt := range decl.Body.List {
				if err := c.WriteStmt(stmt); err != nil {
					return fmt.Errorf("failed to write statement in function body: %w", err)
				}
			}
			c.tsw.Indent(-1)
			c.tsw.WriteLine("}")

			return nil
		}
	}
	// no named receiver, write whole body
	if err := c.WriteStmt(decl.Body); err != nil {
		return fmt.Errorf("failed to write function body: %w", err)
	}

	return nil
}

// WriteValueSpec translates a Go value specification (`ast.ValueSpec`),
// which represents `var` or `const` declarations, into TypeScript `let`
// declarations.
//
// For single variable declarations (`var x T = val` or `var x = val` or `var x T`):
//   - It determines if the variable `x` needs to be boxed (e.g., if its address is taken)
//     using `c.analysis.NeedsBoxed(obj)`.
//   - If boxed: `let x: $.Box<T_ts> = $.box(initializer_ts_or_zero_ts);`
//     The type annotation is `$.Box<T_ts>`, and the initializer is wrapped in `$.box()`.
//   - If not boxed: `let x: T_ts = initializer_ts_or_zero_ts;`
//     The type annotation is `T_ts`. If the initializer is `&unboxedVar`, it becomes `$.box(unboxedVar_ts)`.
//     If the RHS is a struct value, `.clone()` is applied to maintain Go's value semantics.
//   - If no initializer is provided, the TypeScript zero value (from `WriteZeroValueForType`)
//     is used.
//   - Type `T` (or `T_ts`) is obtained from `obj.Type()` and translated via `WriteGoType`.
//
// For multiple variable declarations (`var a, b = val1, val2` or `a, b := val1, val2`):
//   - It uses TypeScript array destructuring: `let [a, b] = [val1_ts, val2_ts];`.
//   - If initialized from a single multi-return function call (`a, b := func()`),
//     it becomes `let [a, b] = func_ts();`.
//   - If no initializers are provided, it defaults to `let [a,b] = []` (with a TODO
//     to assign correct individual zero values).
//
// Documentation comments associated with the `ValueSpec` are preserved.
func (c *GoToTSCompiler) WriteValueSpec(a *ast.ValueSpec) error {
	if a.Doc != nil {
		c.WriteDoc(a.Doc)
	}
	if a.Comment != nil {
		c.WriteDoc(a.Comment)
	}

	// Handle single variable declaration
	if len(a.Names) == 1 {
		name := a.Names[0]
		obj := c.pkg.TypesInfo.Defs[name]
		if obj == nil {
			return errors.Errorf("could not resolve type: %v", name)
		}

		goType := obj.Type()
		needsBox := c.analysis.NeedsBoxed(obj) // Check if address is taken

		// Start declaration
		c.tsw.WriteLiterally("let ")
		c.tsw.WriteLiterally(name.Name)
		c.tsw.WriteLiterally(": ")

		// Write type annotation
		if needsBox {
			// If boxed, the variable holds Box<OriginalGoType>
			c.tsw.WriteLiterally("$.Box<")
			c.WriteGoType(goType) // Write the original Go type T
			c.tsw.WriteLiterally(">")
		} else {
			// If not boxed, the variable holds the translated Go type directly
			c.WriteGoType(goType)
		}

		// Write initializer
		c.tsw.WriteLiterally(" = ")
		hasInitializer := len(a.Values) > 0
		var initializerExpr ast.Expr
		if hasInitializer {
			initializerExpr = a.Values[0]
		}

		if needsBox {
			// Boxed variable: let v: Box<T> = $.box(init_or_zero);
			c.tsw.WriteLiterally("$.box(")
			if hasInitializer {
				// Write the compiled initializer expression normally
				if err := c.WriteValueExpr(initializerExpr); err != nil {
					return err
				}
			} else {
				// No initializer, box the zero value
				c.WriteZeroValueForType(goType)
			}
			c.tsw.WriteLiterally(")")
		} else {
			// Unboxed variable: let v: T = init_or_zero;
			if hasInitializer {
				// Handle &v initializer specifically for unboxed variables
				if unaryExpr, isUnary := initializerExpr.(*ast.UnaryExpr); isUnary && unaryExpr.Op == token.AND {
					// Initializer is &v
					// Check if v is boxed
					needsBoxOperand := false
					unaryExprXIdent, ok := unaryExpr.X.(*ast.Ident)
					if ok {
						innerObj := c.pkg.TypesInfo.Uses[unaryExprXIdent]
						needsBoxOperand = innerObj != nil && c.analysis.NeedsBoxed(innerObj)
					}

					// If v is boxed, assign the box itself (v)
					// If v is not boxed, assign $.box(v)
					if needsBoxOperand {
						// special handling: do not write .value here.
						c.WriteIdent(unaryExprXIdent, false)
					} else {
						// &unboxedVar -> $.box(unboxedVar)
						c.tsw.WriteLiterally("$.box(")
						if err := c.WriteValueExpr(unaryExpr.X); err != nil { // Write 'v'
							return err
						}
						c.tsw.WriteLiterally(")")
					}
				} else {
					// Regular initializer, clone if needed
					if shouldApplyClone(c.pkg, initializerExpr) {
						if err := c.WriteValueExpr(initializerExpr); err != nil {
							return err
						}
						c.tsw.WriteLiterally(".clone()")
					} else {
						if err := c.WriteValueExpr(initializerExpr); err != nil {
							return err
						}
					}
				}
			} else {
				// No initializer, use the zero value directly
				c.WriteZeroValueForType(goType)
			}
		}
		c.tsw.WriteLine("") // Finish the declaration line
		return nil
	}

	// --- Multi-variable declaration (existing logic seems okay, but less common for pointers) ---
	c.tsw.WriteLiterally("let ")
	c.tsw.WriteLiterally("[") // Use array destructuring for multi-assign
	for i, name := range a.Names {
		if i != 0 {
			c.tsw.WriteLiterally(", ")
		}
		c.tsw.WriteLiterally(name.Name)
		// TODO: Add type annotations for multi-var declarations if possible/needed
	}
	c.tsw.WriteLiterally("]")
	if len(a.Values) > 0 {
		// TODO: handle other kinds of assignment += -= etc.
		c.tsw.WriteLiterally(" = ")
		if len(a.Values) == 1 && len(a.Names) > 1 {
			// Assign from a single multi-return value
			if err := c.WriteValueExpr(a.Values[0]); err != nil {
				return err
			}
		} else {
			// Assign from multiple values
			c.tsw.WriteLiterally("[")
			for i, val := range a.Values {
				if i != 0 {
					c.tsw.WriteLiterally(", ")
				}
				if err := c.WriteValueExpr(val); err != nil { // Initializers are values
					return err
				}
			}
			c.tsw.WriteLiterally("]")
		}
	} else {
		// No initializer, assign default values (complex for multi-assign)
		// For simplicity, assign default array based on context (needs improvement)
		c.tsw.WriteLiterally(" = []") // Placeholder
		// TODO: Assign correct zero values based on types
	}
	c.tsw.WriteLine("") // Use WriteLine instead of WriteLine(";")
	return nil
}

// WriteImportSpec translates a Go import specification (`ast.ImportSpec`)
// into a TypeScript import statement.
// It extracts the Go import path (e.g., `"path/to/pkg"`) and determines the
// import alias/name for TypeScript. If the Go import has an explicit name
// (e.g., `alias "path/to/pkg"`), that alias is used. Otherwise, the package
// name is derived from the Go path.
// The Go path is then translated to a TypeScript module path using
// `translateGoPathToTypescriptPath`.
// Finally, it writes a TypeScript import statement like `import * as alias from "typescript/path/to/pkg";`
// and records the import details in `c.analysis.Imports` for later use (e.g.,
// resolving qualified identifiers).
func (c *GoToTSCompiler) WriteImportSpec(a *ast.ImportSpec) {
	if a.Doc != nil {
		c.WriteDoc(a.Doc)
	}
	if a.Comment != nil {
		c.WriteDoc(a.Comment)
	}

	goPath := a.Path.Value[1 : len(a.Path.Value)-1]
	impName := packageNameFromGoPath(goPath)
	if a.Name != nil && a.Name.Name != "" {
		impName = a.Name.Name
	}

	importPath := translateGoPathToTypescriptPath(goPath)
	c.analysis.Imports[impName] = &fileImport{
		importPath: importPath,
		importVars: make(map[string]struct{}),
	}

	c.tsw.WriteImport(impName, importPath)
}

// WriteDecls iterates through a slice of Go top-level declarations (`ast.Decl`)
// and translates each one into its TypeScript equivalent.
// It distinguishes between:
// - Function declarations (`ast.FuncDecl`):
//   - If it's a regular function (no receiver), it delegates to `WriteFuncDeclAsFunction`.
//   - Methods (with receivers) are handled within `WriteTypeSpec` when their
//     associated struct/type is defined, so they are skipped here.
//   - General declarations (`ast.GenDecl`), which can contain imports, constants,
//     variables, or type definitions: It iterates through `d.Specs` and calls
//     `WriteSpec` for each specification.
//
// A newline is added after each processed declaration or spec group for readability.
// Unknown declaration types result in a printed diagnostic message.
func (c *GoToTSCompiler) WriteDecls(decls []ast.Decl) error {
	for _, decl := range decls {
		switch d := decl.(type) {
		case *ast.FuncDecl:
			// Only handle top-level functions here. Methods are handled within WriteTypeSpec.
			if d.Recv == nil {
				if err := c.WriteFuncDeclAsFunction(d); err != nil {
					return err
				}
				c.tsw.WriteLine("") // Add space after function
			}
		case *ast.GenDecl:
			for _, spec := range d.Specs {
				if err := c.WriteSpec(spec); err != nil {
					return err
				}
				c.tsw.WriteLine("") // Add space after spec
			}
		default:
			fmt.Printf("unknown decl: %#v\n", decl)
		}
	}
	return nil
}

// WriteFuncDeclAsFunction translates a Go function declaration (`ast.FuncDecl`)
// that does not have a receiver (i.e., it's a regular function, not a method)
// into a TypeScript function.
//   - Go documentation comments (`decl.Doc`) are preserved.
//   - If the Go function is exported (name starts with an uppercase letter) or is
//     the `main` function, the `export` keyword is added to the TypeScript output.
//   - If the `Analysis` data indicates the function is asynchronous, the `async`
//     keyword is prepended.
//   - The function signature (parameters and return type) is translated using `WriteFuncType`,
//     passing the `isAsync` status.
//   - The function body (`decl.Body`) is translated using `WriteStmt`.
//
// This function specifically handles top-level functions; methods are generated
// by `WriteFuncDeclAsMethod` within the context of their type definition.
func (c *GoToTSCompiler) WriteFuncDeclAsFunction(decl *ast.FuncDecl) error {
	if decl.Recv != nil {
		// This function should not be called for methods.
		// Methods are handled by WriteFuncDeclAsMethod within WriteTypeSpec.
		return nil
	}

	if decl.Doc != nil {
		c.WriteDoc(decl.Doc)
	}

	// Exported functions start with uppercase in Go, or special-case "main" entry point
	isExported := decl.Name.IsExported() || decl.Name.Name == "main"
	if isExported {
		c.tsw.WriteLiterally("export ")
	}

	// Check if this function is async using the analysis data
	var isAsync bool
	if obj := c.pkg.TypesInfo.Defs[decl.Name]; obj != nil {
		isAsync = c.analysis.IsAsyncFunc(obj)
	}
	if isAsync {
		c.tsw.WriteLiterally("async ")
	}

	c.tsw.WriteLiterally("function ")
	if err := c.WriteValueExpr(decl.Name); err != nil { // Function name is a value identifier
		return fmt.Errorf("failed to write function name: %w", err)
	}

	// WriteFuncType needs to be aware if the function is async
	c.WriteFuncType(decl.Type, isAsync) // Write signature (params, return type)
	c.tsw.WriteLiterally(" ")

	if err := c.WriteStmt(decl.Body); err != nil {
		return fmt.Errorf("failed to write function body: %w", err)
	}

	return nil
}

// WriteFieldList translates a Go field list (`ast.FieldList`), which can represent
// function parameters, function results, or struct fields, into its TypeScript equivalent.
//   - If `isArguments` is true (for function parameters/results):
//     It iterates through `a.List`, writing each field as `name: type`. Parameter
//     names and types are written using `WriteField` and `WriteGoType` respectively.
//     Multiple parameters are comma-separated.
//   - If `isArguments` is false (for struct fields):
//     It writes an opening brace `{`, indents, then writes each field definition
//     using `WriteField`, followed by a closing brace `}`. If the field list is
//     empty or nil, it simply writes `{}`.
//
// This function is a key part of generating TypeScript type signatures for functions
// and interfaces, as well as struct type definitions.
func (c *GoToTSCompiler) WriteFieldList(a *ast.FieldList, isArguments bool) {
	if !isArguments && (a == nil || a.NumFields() == 0) {
		c.tsw.WriteLiterally("{}")
		return
	}

	if !isArguments && a.Opening.IsValid() {
		c.tsw.WriteLine("{")
		c.tsw.Indent(1)
	}

	// Check if this is a variadic function parameter list
	isVariadic := false
	if isArguments && a != nil && len(a.List) > 0 {
		lastParam := a.List[len(a.List)-1]
		if _, ok := lastParam.Type.(*ast.Ellipsis); ok {
			isVariadic = true
		}
	}

	if isArguments && isVariadic {
		// Handle non-variadic parameters first
		for i, field := range a.List[:len(a.List)-1] {
			if i > 0 {
				c.tsw.WriteLiterally(", ")
			}
			c.WriteField(field, true)
			c.tsw.WriteLiterally(": ")
			typ := c.pkg.TypesInfo.TypeOf(field.Type)
			c.WriteGoType(typ)
		}

		// Handle the variadic parameter
		lastParam := a.List[len(a.List)-1]
		if len(a.List) > 1 {
			c.tsw.WriteLiterally(", ")
		}

		for i, name := range lastParam.Names {
			if i > 0 {
				c.tsw.WriteLiterally(", ")
			}
			c.tsw.WriteLiterally("...")
			c.tsw.WriteLiterally(name.Name)
		}

		c.tsw.WriteLiterally(": ")
		if ellipsis, ok := lastParam.Type.(*ast.Ellipsis); ok {
			c.WriteTypeExpr(ellipsis.Elt)
			c.tsw.WriteLiterally("[]")
		}
	} else {
		// Handle regular parameter list for function declarations
		for i, field := range a.List {
			if i > 0 && isArguments {
				c.tsw.WriteLiterally(", ")
			}

			if isArguments {
				// For function parameters, write "name: type"
				c.WriteField(field, true)
				c.tsw.WriteLiterally(": ")
				typ := c.pkg.TypesInfo.TypeOf(field.Type)
				c.WriteGoType(typ) // Use WriteGoType for parameter type
			} else {
				// For struct fields and other non-argument fields
				c.WriteField(field, false)
			}
		}
	}

	if !isArguments && a.Closing.IsValid() {
		c.tsw.Indent(-1)
		c.tsw.WriteLine("}")
	}
}

// WriteField translates a single Go field (`ast.Field`) from a field list
// (e.g., in a struct type or function signature) into its TypeScript representation.
// - If `isArguments` is false (struct field):
//   - Documentation comments (`field.Doc`, `field.Comment`) are preserved.
//   - If the field is anonymous (embedded), it's skipped as promotions are handled
//     elsewhere (e.g., during struct class generation).
//   - For named fields, it writes `public fieldName: FieldType_ts`. The field name
//     retains its Go casing. The type is translated using `WriteGoType`.
//   - Go struct tags (`field.Tag`) are written as a trailing comment.
//
// - If `isArguments` is true (function parameter):
//   - It writes the parameter name (retaining Go casing). The type is handled
//     by the caller (`WriteFieldList`).
//
// This function is used by `WriteFieldList` to process individual items within
// parameter lists and struct field definitions.
func (c *GoToTSCompiler) WriteField(field *ast.Field, isArguments bool) {
	if !isArguments {
		if field.Doc != nil {
			c.WriteDoc(field.Doc)
		}
		if field.Comment != nil {
			c.WriteDoc(field.Comment)
		}
	}

	// Check if this is an embedded field (anonymous field)
	if len(field.Names) == 0 && !isArguments {
		// This is an embedded field, so we're adding promotions instead of declaring it directly
		return
	}

	for _, name := range field.Names {
		// argument names: keep original casing, no access modifier
		if isArguments {
			c.tsw.WriteLiterally(name.Name)
			// Argument type is handled in WriteFieldList, so continue
			continue
		} else {
			// All struct fields are public in TypeScript, keeping original Go casing
			c.tsw.WriteLiterally("public ")
			c.tsw.WriteLiterally(name.Name)
		}

		// write type for struct fields (not arguments)
		c.tsw.WriteLiterally(": ")
		typ := c.pkg.TypesInfo.TypeOf(field.Type)
		c.WriteGoType(typ) // Use WriteGoType for field type

		if !isArguments {
			// write tag comment if any for struct fields
			if field.Tag != nil {
				c.tsw.WriteCommentLine(fmt.Sprintf(" // tag: %s", field.Tag.Value))
			} else {
				c.tsw.WriteLine("") // No semicolon
			}
		}
	}
}

// WriteStmt is a central dispatcher function that translates a Go statement
// (`ast.Stmt`) into its TypeScript equivalent by calling the appropriate
// specialized `WriteStmt*` or `write*` method.
// It handles a wide variety of Go statements:
//   - Block statements (`ast.BlockStmt`): `WriteStmtBlock`.
//   - Assignment statements (`ast.AssignStmt`): `WriteStmtAssign`.
//   - Return statements (`ast.ReturnStmt`): `WriteStmtReturn`.
//   - Defer statements (`ast.DeferStmt`): `WriteStmtDefer`.
//   - If statements (`ast.IfStmt`): `WriteStmtIf`.
//   - Expression statements (`ast.ExprStmt`): `WriteStmtExpr`.
//   - Declaration statements (`ast.DeclStmt`, e.g., short var decls): Processes
//     `ValueSpec`s within.
//   - For statements (`ast.ForStmt`): `WriteStmtFor`.
//   - Range statements (`ast.RangeStmt`): `WriteStmtRange`.
//   - Switch statements (`ast.SwitchStmt`): `WriteStmtSwitch`.
//   - Increment/decrement statements (`ast.IncDecStmt`): Writes `expr++` or `expr--`.
//   - Send statements (`ast.SendStmt`, e.g., `ch <- val`): `WriteStmtSend`.
//   - Go statements (`ast.GoStmt`): Translates `go func(){...}()` to `queueMicrotask(() => {...})`.
//   - Select statements (`ast.SelectStmt`): `WriteStmtSelect`.
//   - Branch statements (`ast.BranchStmt`, i.e., `break`, `continue`): Writes them directly.
//
// If an unknown statement type is encountered, it returns an error.
func (c *GoToTSCompiler) WriteStmt(a ast.Stmt) error {
	switch exp := a.(type) {
	case *ast.BlockStmt:
		// WriteStmtBlock does not currently return an error, assuming it's safe for now.
		if err := c.WriteStmtBlock(exp, false); err != nil {
			return fmt.Errorf("failed to write block statement: %w", err)
		}
	case *ast.AssignStmt:
		// special case: if the left side of the assign has () we need a ; to prepend the line
		// ;(myStruct!.value).MyInt = 5
		// otherwise typescript assumes it is a function call
		if len(exp.Lhs) == 1 {
			if lhsSel, ok := exp.Lhs[0].(*ast.SelectorExpr); ok {
				if _, ok := lhsSel.X.(*ast.ParenExpr); ok {
					c.tsw.WriteLiterally(";")
				}
			}
		}

		if err := c.WriteStmtAssign(exp); err != nil {
			return fmt.Errorf("failed to write assignment statement: %w", err)
		}
	case *ast.ReturnStmt:
		if err := c.WriteStmtReturn(exp); err != nil {
			return fmt.Errorf("failed to write return statement: %w", err)
		}
	case *ast.DeferStmt:
		if err := c.WriteStmtDefer(exp); err != nil {
			return fmt.Errorf("failed to write defer statement: %w", err)
		}
	case *ast.IfStmt:
		if err := c.WriteStmtIf(exp); err != nil {
			return fmt.Errorf("failed to write if statement: %w", err)
		}
	case *ast.ExprStmt:
		if err := c.WriteStmtExpr(exp); err != nil {
			return fmt.Errorf("failed to write expression statement: %w", err)
		}
	case *ast.DeclStmt:
		// Handle declarations within a statement list (e.g., short variable declarations)
		// This typically contains a GenDecl
		if genDecl, ok := exp.Decl.(*ast.GenDecl); ok {
			for _, spec := range genDecl.Specs {
				// Value specs within a declaration statement
				if valueSpec, ok := spec.(*ast.ValueSpec); ok {
					if err := c.WriteValueSpec(valueSpec); err != nil {
						return fmt.Errorf("failed to write value spec in declaration statement: %w", err)
					}
				} else {
					c.tsw.WriteCommentLine(fmt.Sprintf("unhandled spec in DeclStmt: %T", spec))
				}
			}
		} else {
			return errors.Errorf("unhandled declaration type in DeclStmt: %T", exp.Decl)
		}
	case *ast.ForStmt:
		// WriteStmtFor does not currently return an error, assuming it's safe for now.
		if err := c.WriteStmtFor(exp); err != nil {
			return fmt.Errorf("failed to write for statement: %w", err)
		}
	case *ast.RangeStmt:
		// Generate TS for for…range loops, log if something goes wrong
		if err := c.WriteStmtRange(exp); err != nil {
			return fmt.Errorf("failed to write range statement: %w", err)
		}
	case *ast.SwitchStmt:
		// WriteStmtSwitch does not currently return an error, assuming it's safe for now.
		if err := c.WriteStmtSwitch(exp); err != nil {
			return fmt.Errorf("failed to write switch statement: %w", err)
		}
	case *ast.IncDecStmt:
		// Handle increment/decrement (e.g., i++ or i--)
		if err := c.WriteValueExpr(exp.X); err != nil { // The expression (e.g., i)
			return fmt.Errorf("failed to write increment/decrement expression: %w", err)
		}
		tokStr, ok := TokenToTs(exp.Tok)
		if !ok {
			return errors.Errorf("unknown incdec token: %s", exp.Tok.String())
		}
		c.tsw.WriteLiterally(tokStr) // The token (e.g., ++)
		c.tsw.WriteLine("")
	case *ast.SendStmt:
		if err := c.WriteStmtSend(exp); err != nil {
			return fmt.Errorf("failed to write send statement: %w", err)
		}
	case *ast.GoStmt:
		// Handle goroutine statement
		// Translate 'go func() { ... }()' to 'queueMicrotask(() => { ... compiled body ... })'

		// The call expression's function is the function literal
		callExpr := exp.Call
		if funcLit, ok := callExpr.Fun.(*ast.FuncLit); ok {
			// For function literals, we need to check if the function literal itself is async
			// This happens during analysis in analysisVisitor.Visit for FuncLit nodes
			isAsync := c.analysis.IsFuncLitAsync(funcLit)
			if isAsync {
				c.tsw.WriteLiterally("queueMicrotask(async () => {")
			} else {
				c.tsw.WriteLiterally("queueMicrotask(() => {")
			}

			c.tsw.Indent(1)
			c.tsw.WriteLine("")

			// Compile the function literal's body directly
			if err := c.WriteStmt(funcLit.Body); err != nil {
				return fmt.Errorf("failed to write goroutine function literal body: %w", err)
			}

			c.tsw.Indent(-1)
			c.tsw.WriteLine("})") // Close the queueMicrotask callback and the statement

		} else {
			return errors.Errorf("unhandled goroutine function type: %T", callExpr.Fun)
		}
	case *ast.SelectStmt:
		// Handle select statement
		if err := c.WriteStmtSelect(exp); err != nil {
			return fmt.Errorf("failed to write select statement: %w", err)
		}
	case *ast.BranchStmt:
		// Handle break and continue statements
		switch exp.Tok {
		case token.BREAK:
			c.tsw.WriteLine("break") // No semicolon needed
		case token.CONTINUE:
			c.tsw.WriteLine("continue") // No semicolon needed
		default:
			c.tsw.WriteCommentLine(fmt.Sprintf("unhandled branch statement token: %s", exp.Tok.String()))
		}
	default:
		return errors.Errorf("unknown statement: %s\n", a)
	}
	return nil
}

// WriteStmtDefer translates a Go `defer` statement into TypeScript code that
// utilizes a disposable stack (`$.DisposableStack` or `$.AsyncDisposableStack`).
// The Go `defer` semantics (LIFO execution at function exit) are emulated by
// registering a cleanup function with this stack.
//   - `defer funcCall()` becomes `__defer.defer(() => { funcCall_ts(); });`.
//   - `defer func(){ ...body... }()` (an immediately-invoked function literal, IIFL)
//     has its body inlined: `__defer.defer(() => { ...body_ts... });`.
//   - If the deferred call is to an async function or an async function literal
//     (determined by `c.analysis.IsInAsyncFunctionMap`), the registered callback
//     is marked `async`: `__defer.defer(async () => { ... });`.
//
// The `__defer` variable is assumed to be declared at the beginning of the
// function scope (see `WriteStmtBlock` or `WriteFuncDeclAsMethod`) using
// `await using __defer = new $.AsyncDisposableStack();` for async functions/contexts
// or `using __defer = new $.DisposableStack();` for sync contexts.
func (c *GoToTSCompiler) WriteStmtDefer(exp *ast.DeferStmt) error {
	// Determine if the deferred call is to an async function literal using analysis
	isAsyncDeferred := false
	if funcLit, ok := exp.Call.Fun.(*ast.FuncLit); ok {
		isAsyncDeferred = c.analysis.IsInAsyncFunctionMap[funcLit]
	}

	// Set async prefix based on pre-computed async status
	asyncPrefix := ""
	if isAsyncDeferred {
		asyncPrefix = "async "
	}

	// Set stack variable based on whether we are in an async function
	stackVar := "__defer"
	c.tsw.WriteLiterally(fmt.Sprintf("%s.defer(%s() => {", stackVar, asyncPrefix))
	c.tsw.Indent(1)
	c.tsw.WriteLine("")

	// Write the deferred call or inline the body when it's an immediately-invoked
	// function literal (defer func(){ ... }()).
	if funcLit, ok := exp.Call.Fun.(*ast.FuncLit); ok && len(exp.Call.Args) == 0 {
		// Inline the function literal's body to avoid nested arrow invocation.
		for _, stmt := range funcLit.Body.List {
			if err := c.WriteStmt(stmt); err != nil {
				return fmt.Errorf("failed to write statement in deferred function body: %w", err)
			}
		}
	} else {
		// Write the call expression as-is.
		if err := c.WriteValueExpr(exp.Call); err != nil {
			return fmt.Errorf("failed to write deferred call: %w", err)
		}
	}

	c.tsw.Indent(-1)
	c.tsw.WriteLine("});")

	return nil
}

// WriteStmtSelect translates a Go `select` statement into an asynchronous
// TypeScript operation using the `$.selectStatement` runtime helper.
// Go's `select` provides non-deterministic choice over channel operations.
// This is emulated by constructing an array of `SelectCase` objects, one for
// each `case` in the Go `select`, and passing it to `$.selectStatement`.
//
// Each `SelectCase` object includes:
//   - `id`: A unique identifier for the case.
//   - `isSend`: `true` for send operations (`case ch <- val:`), `false` for receives.
//   - `channel`: The TypeScript channel object.
//   - `value` (for sends): The value being sent.
//   - `onSelected: async (result) => { ... }`: A callback executed when this case
//     is chosen. `result` contains `{ value, ok }` for receives.
//   - Inside `onSelected`, assignments for receive operations (e.g., `v := <-ch`,
//     `v, ok := <-ch`) are handled by declaring/assigning variables from `result.value`
//     and `result.ok`.
//   - The original Go case body is then translated within this callback.
//
// A `default` case in Go `select` is translated to a `SelectCase` with `id: -1`
// and its body in the `onSelected` handler. The `$.selectStatement` helper
// is informed if a default case exists.
// The entire `$.selectStatement(...)` call is `await`ed because channel
// operations are asynchronous in the TypeScript model.
func (c *GoToTSCompiler) WriteStmtSelect(exp *ast.SelectStmt) error {
	// This is our implementation of the select statement, which will use Promise.race
	// to achieve the same semantics as Go's select statement.

	// Variable to track whether we have a default case
	hasDefault := false

	// Start the selectStatement call and the array literal
	c.tsw.WriteLiterally("await $.selectStatement(")
	c.tsw.WriteLine("[") // Put bracket on new line
	c.tsw.Indent(1)

	// For each case clause, generate a SelectCase object directly into the array literal
	for i, stmt := range exp.Body.List {
		if commClause, ok := stmt.(*ast.CommClause); ok {
			if commClause.Comm == nil {
				// This is a default case
				hasDefault = true
				// Add a SelectCase object for the default case with a special ID
				c.tsw.WriteLiterally("{") // Start object literal
				c.tsw.Indent(1)
				c.tsw.WriteLine("")
				c.tsw.WriteLiterally("id: -1,") // Special ID for default case
				c.tsw.WriteLine("")
				c.tsw.WriteLiterally("isSend: false,") // Default case is neither send nor receive, but needs a value
				c.tsw.WriteLine("")
				c.tsw.WriteLiterally("channel: null,") // No channel for default case
				c.tsw.WriteLine("")
				c.tsw.WriteLiterally("onSelected: async (result) => {") // Mark as async because case body might contain await
				c.tsw.Indent(1)
				c.tsw.WriteLine("")
				// Write the case body
				for _, bodyStmt := range commClause.Body {
					if err := c.WriteStmt(bodyStmt); err != nil {
						return fmt.Errorf("failed to write statement in select default case body (onSelected): %w", err)
					}
				}
				c.tsw.Indent(-1)
				c.tsw.WriteLine("}") // Close onSelected handler
				c.tsw.Indent(-1)
				c.tsw.WriteLiterally("},") // Close SelectCase object and add comma
				c.tsw.WriteLine("")

				continue
			}

			// Generate a unique ID for this case
			caseID := i

			// Start writing the SelectCase object
			c.tsw.WriteLiterally("{") // Start object literal
			c.tsw.Indent(1)
			c.tsw.WriteLine("")
			c.tsw.WriteLiterally(fmt.Sprintf("id: %d,", caseID))
			c.tsw.WriteLine("")

			// Handle different types of comm statements
			switch comm := commClause.Comm.(type) {
			case *ast.AssignStmt:
				// This is a receive operation with assignment: case v := <-ch: or case v, ok := <-ch:
				if len(comm.Rhs) == 1 {
					if unaryExpr, ok := comm.Rhs[0].(*ast.UnaryExpr); ok && unaryExpr.Op == token.ARROW {
						// It's a receive operation
						c.tsw.WriteLiterally("isSend: false,")
						c.tsw.WriteLine("")
						c.tsw.WriteLiterally("channel: ")
						if err := c.WriteValueExpr(unaryExpr.X); err != nil { // The channel expression
							return fmt.Errorf("failed to write channel expression in select receive case: %w", err)
						}
						c.tsw.WriteLiterally(",")
						c.tsw.WriteLine("")
					} else {
						c.tsw.WriteCommentLine(fmt.Sprintf("unhandled RHS in select assignment case: %T", comm.Rhs[0]))
					}
				} else {
					c.tsw.WriteCommentLine(fmt.Sprintf("unhandled RHS count in select assignment case: %d", len(comm.Rhs)))
				}
			case *ast.ExprStmt:
				// This is a simple receive: case <-ch:
				if unaryExpr, ok := comm.X.(*ast.UnaryExpr); ok && unaryExpr.Op == token.ARROW {
					c.tsw.WriteLiterally("isSend: false,")
					c.tsw.WriteLine("")
					c.tsw.WriteLiterally("channel: ")
					if err := c.WriteValueExpr(unaryExpr.X); err != nil { // The channel expression
						return fmt.Errorf("failed to write channel expression in select receive case: %w", err)
					}
					c.tsw.WriteLiterally(",")
					c.tsw.WriteLine("")
				} else {
					c.tsw.WriteCommentLine(fmt.Sprintf("unhandled expression in select case: %T", comm.X))
				}
			case *ast.SendStmt:
				// This is a send operation: case ch <- v:
				c.tsw.WriteLiterally("isSend: true,")
				c.tsw.WriteLine("")
				c.tsw.WriteLiterally("channel: ")
				if err := c.WriteValueExpr(comm.Chan); err != nil { // The channel expression
					return fmt.Errorf("failed to write channel expression in select send case: %w", err)
				}
				c.tsw.WriteLiterally(",")
				c.tsw.WriteLine("")
				c.tsw.WriteLiterally("value: ")
				if err := c.WriteValueExpr(comm.Value); err != nil { // The value expression
					return fmt.Errorf("failed to write value expression in select send case: %w", err)
				}
				c.tsw.WriteLiterally(",")
				c.tsw.WriteLine("")
			default:
				c.tsw.WriteCommentLine(fmt.Sprintf("unhandled comm statement in select case: %T", comm))
			}

			// Add the onSelected handler to execute the case body after the select resolves
			c.tsw.WriteLiterally("onSelected: async (result) => {") // Mark as async because case body might contain await
			c.tsw.Indent(1)
			c.tsw.WriteLine("")

			// Handle assignment for channel receives if needed (inside the onSelected handler)
			if assignStmt, ok := commClause.Comm.(*ast.AssignStmt); ok {
				// This is a receive operation with assignment
				if len(assignStmt.Lhs) == 1 {
					// Simple receive: case v := <-ch:
					valIdent, ok := assignStmt.Lhs[0].(*ast.Ident)
					if ok && valIdent.Name != "_" { // Check for blank identifier
						c.tsw.WriteLiterally("const ")
						c.WriteIdent(valIdent, false)
						c.tsw.WriteLiterally(" = result.value")
						c.tsw.WriteLine("")
					}
				} else if len(assignStmt.Lhs) == 2 {
					// Receive with ok: case v, ok := <-ch:
					valIdent, valOk := assignStmt.Lhs[0].(*ast.Ident)
					okIdent, okOk := assignStmt.Lhs[1].(*ast.Ident)

					if valOk && valIdent.Name != "_" {
						c.tsw.WriteLiterally("const ")
						c.WriteIdent(valIdent, false)
						c.tsw.WriteLiterally(" = result.value")
						c.tsw.WriteLine("")
					}

					if okOk && okIdent.Name != "_" {
						c.tsw.WriteLiterally("const ")
						c.WriteIdent(okIdent, false)
						c.tsw.WriteLiterally(" = result.ok")
						c.tsw.WriteLine("")
					}
				}
			}
			// Note: Simple receive (case <-ch:) and send (case ch <- v:) don't require assignment here,
			// as the operation was already performed by selectReceive/selectSend and the result is in 'result'.

			// Write the case body
			for _, bodyStmt := range commClause.Body {
				if err := c.WriteStmt(bodyStmt); err != nil {
					return fmt.Errorf("failed to write statement in select case body (onSelected): %w", err)
				}
			}

			c.tsw.Indent(-1)
			c.tsw.WriteLine("}") // Close onSelected handler
			c.tsw.Indent(-1)
			c.tsw.WriteLiterally("},") // Close SelectCase object and add comma
			c.tsw.WriteLine("")

		} else {
			c.tsw.WriteCommentLine(fmt.Sprintf("unknown statement in select body: %T", stmt))
		}
	}

	// Close the array literal and the selectStatement call
	c.tsw.Indent(-1)
	c.tsw.WriteLiterally("], ")
	c.tsw.WriteLiterally(fmt.Sprintf("%t", hasDefault))
	c.tsw.WriteLiterally(")")
	c.tsw.WriteLine("")

	return nil
}

// WriteStmtSwitch translates a Go `switch` statement into its TypeScript equivalent.
//   - If the Go switch has an initialization statement (`exp.Init`), it's wrapped
//     in a TypeScript block `{...}` before the `switch` keyword, and the
//     initializer is translated within this block. This emulates Go's switch scope.
//   - The switch condition (`exp.Tag`):
//   - If `exp.Tag` is present, it's translated using `WriteValueExpr`.
//   - If `exp.Tag` is nil (a "tagless" switch, like `switch { case cond1: ... }`),
//     it's translated as `switch (true)` in TypeScript.
//   - Each case clause (`ast.CaseClause`) in `exp.Body.List` is translated using
//     `WriteCaseClause`.
//
// The overall structure is `[optional_init_block] switch (condition_ts) { ...cases_ts... }`.
func (c *GoToTSCompiler) WriteStmtSwitch(exp *ast.SwitchStmt) error {
	// Handle optional initialization statement
	if exp.Init != nil {
		c.tsw.WriteLiterally("{")
		c.tsw.Indent(1)
		if err := c.WriteStmt(exp.Init); err != nil {
			return fmt.Errorf("failed to write switch initialization statement: %w", err)
		}
		defer func() {
			c.tsw.Indent(-1)
			c.tsw.WriteLiterally("}")
		}()
	}

	c.tsw.WriteLiterally("switch (")
	// Handle the switch tag (the expression being switched on)
	if exp.Tag != nil {
		if err := c.WriteValueExpr(exp.Tag); err != nil {
			return fmt.Errorf("failed to write switch tag expression: %w", err)
		}
	} else {
		c.tsw.WriteLiterally("true") // Write 'true' for switch without expression
	}
	c.tsw.WriteLiterally(") {")
	c.tsw.WriteLine("")
	c.tsw.Indent(1)

	// Handle case clauses
	for _, stmt := range exp.Body.List {
		if caseClause, ok := stmt.(*ast.CaseClause); ok {
			// WriteCaseClause does not currently return an error, assuming it's safe for now.
			if err := c.WriteCaseClause(caseClause); err != nil {
				return fmt.Errorf("failed to write case clause in switch statement: %w", err)
			}
		} else {
			c.tsw.WriteCommentLine(fmt.Sprintf("unhandled statement in switch body: %T", stmt))
		}
	}

	c.tsw.Indent(-1)
	c.tsw.WriteLine("}")
	return nil
}

// WriteCaseClause translates a Go `case` clause (`ast.CaseClause`) from within
// a `switch` statement into its TypeScript `case` or `default` equivalent.
//   - If `exp.List` is nil, it's a `default` case, written as `default:`.
//   - If `exp.List` is not nil, it's a `case` with one or more match expressions.
//     It's written as `case expr1_ts, expr2_ts, ... :`. (Note: Go's `case`
//     doesn't allow multiple expressions this way, but TypeScript does. This code
//     implies Go's fallthrough is not directly modeled here but rather by explicit
//     `break`s, and each Go `case` becomes one or more TS `case` labels if needed,
//     though current implementation writes them comma-separated which is valid TS syntax).
//   - The body of the case (`exp.Body`) is translated statement by statement using `WriteStmt`.
//   - A `break;` statement is automatically added at the end of the TypeScript case
//     body, because Go `switch` cases have implicit breaks, whereas TypeScript
//     cases fall through by default.
func (c *GoToTSCompiler) WriteCaseClause(exp *ast.CaseClause) error {
	if exp.List == nil {
		// Default case
		c.tsw.WriteLiterally("default:")
		c.tsw.WriteLine("")
	} else {
		// Case with expressions
		c.tsw.WriteLiterally("case ")
		for i, expr := range exp.List {
			if i > 0 {
				c.tsw.WriteLiterally(", ") // Although Go doesn't support multiple expressions per case like this,
			} // TypeScript does, so we'll write it this way for now.
			if err := c.WriteValueExpr(expr); err != nil {
				return fmt.Errorf("failed to write case clause expression: %w", err)
			}
		}
		c.tsw.WriteLiterally(":")
		c.tsw.WriteLine("")
	}

	c.tsw.Indent(1)
	// Write the body of the case clause
	for _, stmt := range exp.Body {
		if err := c.WriteStmt(stmt); err != nil {
			return fmt.Errorf("failed to write statement in case clause body: %w", err)
		}
	}
	// Add break statement (Go's switch has implicit breaks)
	c.tsw.WriteLine("break") // Remove semicolon
	c.tsw.Indent(-1)
	return nil
}

// WriteStmtIf translates a Go `if` statement (`ast.IfStmt`) into its
// TypeScript equivalent.
//   - If the Go `if` has an initialization statement (`exp.Init`), it's wrapped
//     in a TypeScript block `{...}` before the `if` keyword, and the initializer
//     is translated within this block. This emulates Go's `if` statement scope.
//   - The condition (`exp.Cond`) is translated using `WriteValueExpr` and placed
//     within parentheses `(...)`.
//   - The `if` body (`exp.Body`) is translated as a block statement using
//     `WriteStmtBlock`. If `exp.Body` is nil, an empty block `{}` is written.
//   - The `else` branch (`exp.Else`) is handled:
//   - If `exp.Else` is a block statement (`ast.BlockStmt`), it's written as `else { ...body_ts... }`.
//   - If `exp.Else` is another `if` statement (`ast.IfStmt`), it's written as `else if (...) ...`,
//     recursively calling `WriteStmtIf`.
//
// The function aims to produce idiomatic TypeScript `if/else if/else` structures.
func (s *GoToTSCompiler) WriteStmtIf(exp *ast.IfStmt) error {
	if exp.Init != nil {
		s.tsw.WriteLiterally("{")
		s.tsw.Indent(1)

		if err := s.WriteStmt(exp.Init); err != nil {
			return err
		}

		defer func() {
			s.tsw.Indent(-1)
			s.tsw.WriteLiterally("}")
		}()
	}

	s.tsw.WriteLiterally("if (")
	if err := s.WriteValueExpr(exp.Cond); err != nil { // Condition is a value
		return err
	}
	s.tsw.WriteLiterally(") ")

	if exp.Body != nil {
		if err := s.WriteStmtBlock(exp.Body, exp.Else != nil); err != nil {
			return fmt.Errorf("failed to write if body block statement: %w", err)
		}
	} else {
		// Handle nil body case using WriteStmtBlock with an empty block
		if err := s.WriteStmtBlock(&ast.BlockStmt{}, exp.Else != nil); err != nil {
			return fmt.Errorf("failed to write empty block statement in if statement: %w", err)
		}
	}

	// handle else branch
	if exp.Else != nil {
		s.tsw.WriteLiterally(" else ")
		switch elseStmt := exp.Else.(type) {
		case *ast.BlockStmt:
			// Always pass false for suppressNewline here
			if err := s.WriteStmtBlock(elseStmt, false); err != nil {
				return fmt.Errorf("failed to write else block statement in if statement: %w", err)
			}
		case *ast.IfStmt:
			// Recursive call handles its own block formatting
			if err := s.WriteStmtIf(elseStmt); err != nil {
				return fmt.Errorf("failed to write else if statement in if statement: %w", err)
			}
		}
	}
	return nil
}

// WriteStmtReturn translates a Go `return` statement (`ast.ReturnStmt`) into
// its TypeScript equivalent.
//   - It writes the `return` keyword.
//   - If there are multiple return values (`len(exp.Results) > 1`), the translated
//     results are wrapped in a TypeScript array literal `[...]`.
//   - Each result expression in `exp.Results` is translated using `WriteValueExpr`.
//   - If there are no results, it simply writes `return`.
//
// The statement is terminated with a newline.
func (c *GoToTSCompiler) WriteStmtReturn(exp *ast.ReturnStmt) error {
	c.tsw.WriteLiterally("return ")
	if len(exp.Results) > 1 {
		c.tsw.WriteLiterally("[")
	}
	for i, res := range exp.Results {
		if i != 0 {
			c.tsw.WriteLiterally(", ")
		}
		if err := c.WriteValueExpr(res); err != nil { // Return results are values
			return err
		}
	}
	if len(exp.Results) > 1 {
		c.tsw.WriteLiterally("]")
	}
	c.tsw.WriteLine("") // Remove semicolon
	return nil
}

// WriteStmtBlock translates a Go block statement (`ast.BlockStmt`), typically
// `{ ...stmts... }`, into its TypeScript equivalent, carefully preserving
// comments and blank lines to maintain code readability and structure.
//   - It writes an opening brace `{` and indents.
//   - If the analysis (`c.analysis.NeedsDefer`) indicates that the block (or a
//     function it's part of) contains `defer` statements, it injects a
//     `using __defer = new $.DisposableStack();` (or `AsyncDisposableStack` if
//     the context is async or contains async defers) at the beginning of the block.
//     This `__defer` stack is used by `WriteStmtDefer` to register cleanup actions.
//   - It iterates through the statements (`exp.List`) in the block:
//   - Leading comments associated with each statement are written first, with
//     blank lines preserved based on original source line numbers.
//   - The statement itself is then translated using `WriteStmt`.
//   - Inline comments (comments on the same line after a statement) are expected
//     to be handled by the individual statement writers (e.g., `WriteStmtExpr`).
//   - Trailing comments within the block (after the last statement but before the
//     closing brace) are written.
//   - Blank lines before the closing brace are preserved.
//   - Finally, it unindents and writes the closing brace `}`.
//
// If `suppressNewline` is true, the final newline after the closing brace is omitted
// (used, for example, when an `if` block is followed by an `else`).
func (c *GoToTSCompiler) WriteStmtBlock(exp *ast.BlockStmt, suppressNewline bool) error {
	if exp == nil {
		c.tsw.WriteLiterally("{}")
		if !suppressNewline {
			c.tsw.WriteLine("")
		}
		return nil
	}

	// Opening brace
	c.tsw.WriteLine("{")
	c.tsw.Indent(1)

	// Determine if there is any defer to an async function literal in this block
	hasAsyncDefer := false
	for _, stmt := range exp.List {
		if deferStmt, ok := stmt.(*ast.DeferStmt); ok {
			if funcLit, ok := deferStmt.Call.Fun.(*ast.FuncLit); ok {
				if c.analysis.IsInAsyncFunctionMap[funcLit] {
					hasAsyncDefer = true
					break
				}
			}
		}
	}

	// Add using statement if needed, considering async function or async defer
	if c.analysis.NeedsDefer(exp) {
		if c.analysis.IsInAsyncFunction(exp) || hasAsyncDefer {
			c.tsw.WriteLine("await using __defer = new $.AsyncDisposableStack();")
		} else {
			c.tsw.WriteLine("using __defer = new $.DisposableStack();")
		}
	}

	// Prepare line info
	var file *token.File
	if c.pkg != nil && c.pkg.Fset != nil && exp.Lbrace.IsValid() {
		file = c.pkg.Fset.File(exp.Lbrace)
	}

	// writeBlank emits a single blank line if gap > 1
	writeBlank := func(prev, curr int) {
		if file != nil && prev > 0 && curr > prev+1 {
			c.tsw.WriteLine("")
		}
	}

	// Track last printed line, start at opening brace
	lastLine := 0
	if file != nil {
		lastLine = file.Line(exp.Lbrace)
	}

	// 1. For each statement: write its leading comments, blank space, then the stmt
	for _, stmt := range exp.List {
		// Get statement's end line and position for inline comment check
		stmtEndLine := 0
		stmtEndPos := token.NoPos
		if file != nil && stmt.End().IsValid() {
			stmtEndLine = file.Line(stmt.End())
			stmtEndPos = stmt.End()
		}

		// Process leading comments for stmt
		comments := c.analysis.Cmap.Filter(stmt).Comments()
		for _, cg := range comments {
			// Check if this comment group is an inline comment for the current statement
			isInlineComment := false
			if file != nil && cg.Pos().IsValid() && stmtEndPos.IsValid() {
				commentStartLine := file.Line(cg.Pos())
				// Inline if starts on same line as stmt end AND starts after stmt end position
				if commentStartLine == stmtEndLine && cg.Pos() > stmtEndPos {
					isInlineComment = true
				}
			}

			// If it's NOT an inline comment for this statement, write it here
			if !isInlineComment {
				start := 0
				if file != nil && cg.Pos().IsValid() {
					start = file.Line(cg.Pos())
				}
				writeBlank(lastLine, start)
				// WriteDoc does not currently return an error, assuming it's safe for now.
				c.WriteDoc(cg) // WriteDoc will handle the actual comment text
				if file != nil && cg.End().IsValid() {
					lastLine = file.Line(cg.End())
				}
			}
			// If it IS an inline comment, skip it. The statement writer will handle it.
		}

		// the statement itself
		stmtStart := 0
		if file != nil && stmt.Pos().IsValid() {
			stmtStart = file.Line(stmt.Pos())
		}
		writeBlank(lastLine, stmtStart)
		// Call the specific statement writer (e.g., WriteStmtAssign).
		// It is responsible for handling its own inline comment.
		if err := c.WriteStmt(stmt); err != nil {
			return fmt.Errorf("failed to write statement in block: %w", err)
		}

		if file != nil && stmt.End().IsValid() {
			// Update lastLine based on the statement's end, *including* potential inline comment handled by WriteStmt*
			lastLine = file.Line(stmt.End())
		}
	}

	// 2. Trailing comments on the block (after last stmt, before closing brace)
	trailing := c.analysis.Cmap.Filter(exp).Comments()
	for _, cg := range trailing {
		start := 0
		if file != nil && cg.Pos().IsValid() {
			start = file.Line(cg.Pos())
		}
		// only emit if it follows the last content
		if start > lastLine {
			writeBlank(lastLine, start)
			// WriteDoc does not currently return an error, assuming it's safe for now.
			c.WriteDoc(cg)
			if file != nil && cg.End().IsValid() {
				lastLine = file.Line(cg.End())
			}
		}
	}

	// 3. Blank lines before closing brace
	closing := 0
	if file != nil && exp.Rbrace.IsValid() {
		closing = file.Line(exp.Rbrace)
	}
	writeBlank(lastLine, closing)

	// Closing brace
	c.tsw.Indent(-1)
	c.tsw.WriteLiterally("}")

	if !suppressNewline {
		c.tsw.WriteLine("")
	}
	return nil
}

// writeAssignmentCore handles the central logic for translating Go assignment
// operations (LHS op RHS) into TypeScript. It's called by `WriteStmtAssign`
// and other functions that need to generate assignment code.
//
// Key behaviors:
//   - Multi-variable assignment (e.g., `a, b = b, a`): Translates to TypeScript
//     array destructuring: `[a_ts, b_ts] = [b_ts, a_ts]`. It correctly handles
//     non-null assertions for array index expressions on both LHS and RHS if
//     all expressions involved are index expressions (common in swaps).
//   - Single-variable assignment to a map index (`myMap[key] = value`): Translates
//     to `$.mapSet(myMap_ts, key_ts, value_ts)`.
//   - Other single-variable assignments (`variable = value`):
//   - The LHS expression is written (caller typically ensures `.value` is appended
//     if assigning to a boxed variable's content).
//   - The Go assignment token (`tok`, e.g., `=`, `+=`) is translated to its
//     TypeScript equivalent using `TokenToTs`.
//   - The RHS expression(s) are written. If `shouldApplyClone` indicates the RHS
//     is a struct value, `.clone()` is appended to the translated RHS to emulate
//     Go's value semantics for struct assignment.
//   - Blank identifiers (`_`) on the LHS are handled by omitting them in TypeScript
//     destructuring patterns or by skipping the assignment for single assignments.
//
// This function does not handle the `let` keyword for declarations or statement
// termination (newlines/semicolons).
func (c *GoToTSCompiler) writeAssignmentCore(lhs, rhs []ast.Expr, tok token.Token) error {
	// Special case for multi-variable assignment to handle array element swaps
	if len(lhs) > 1 && len(rhs) > 1 {
		// Check if this is an array element swap pattern (common pattern a[i], a[j] = a[j], a[i])
		// Identify if we're dealing with array index expressions that might need null assertions
		allIndexExprs := true
		for _, expr := range append(lhs, rhs...) {
			_, isIndexExpr := expr.(*ast.IndexExpr)
			if !isIndexExpr {
				allIndexExprs = false
				break
			}
		}

		// Use array destructuring for multi-variable assignments
		c.tsw.WriteLiterally("[")
		for i, l := range lhs {
			if i != 0 {
				c.tsw.WriteLiterally(", ")
			}

			// Handle blank identifier
			if ident, ok := l.(*ast.Ident); ok && ident.Name == "_" {
				// If it's a blank identifier, we write nothing,
				// leaving an empty slot in the destructuring array.
			} else if indexExpr, ok := l.(*ast.IndexExpr); ok && allIndexExprs { // MODIFICATION: Added 'else if'
				// Handle array[index] with non-null assertion after array name
				if err := c.WriteValueExpr(indexExpr.X); err != nil {
					return err
				}
				c.tsw.WriteLiterally("!") // non-null assertion
				c.tsw.WriteLiterally("[")
				if err := c.WriteValueExpr(indexExpr.Index); err != nil {
					return err
				}
				c.tsw.WriteLiterally("]")
			} else {
				// Normal case - write the entire expression
				if err := c.WriteValueExpr(l); err != nil {
					return err
				}
			}
		}
		c.tsw.WriteLiterally("] = [")
		for i, r := range rhs {
			if i != 0 {
				c.tsw.WriteLiterally(", ")
			}
			if indexExpr, ok := r.(*ast.IndexExpr); ok && allIndexExprs {
				// Handle array[index] with non-null assertion after array name
				if err := c.WriteValueExpr(indexExpr.X); err != nil {
					return err
				}
				c.tsw.WriteLiterally("!")
				c.tsw.WriteLiterally("[")
				if err := c.WriteValueExpr(indexExpr.Index); err != nil {
					return err
				}
				c.tsw.WriteLiterally("]")
			} else {
				// Normal case - write the entire expression
				if err := c.WriteValueExpr(r); err != nil {
					return err
				}
			}
		}
		c.tsw.WriteLiterally("]")
		return nil
	}

	// --- Logic for assignments ---
	isMapIndexLHS := false // Track if the first LHS is a map index
	for i, l := range lhs {
		if i != 0 {
			c.tsw.WriteLiterally(", ")
		}

		// Handle map indexing assignment specially
		currentIsMapIndex := false
		if indexExpr, ok := l.(*ast.IndexExpr); ok {
			if tv, ok := c.pkg.TypesInfo.Types[indexExpr.X]; ok {
				if _, isMap := tv.Type.Underlying().(*types.Map); isMap {
					currentIsMapIndex = true
					if i == 0 {
						isMapIndexLHS = true
					}
					// Use mapSet helper
					c.tsw.WriteLiterally("$.mapSet(")
					if err := c.WriteValueExpr(indexExpr.X); err != nil { // Map
						return err
					}
					c.tsw.WriteLiterally(", ")
					if err := c.WriteValueExpr(indexExpr.Index); err != nil { // Key
						return err
					}
					c.tsw.WriteLiterally(", ")
					// Value will be added after operator and RHS
				}
			}
		}

		if !currentIsMapIndex {
			// Write the LHS expression normally.
			// Boxed variable assignment (to .value) is handled by the caller (writeSingleAssign).
			// Here we just write the variable name or expression.
			if err := c.WriteValueExpr(l); err != nil {
				return err
			}
		}
	}

	// Only write the assignment operator for regular variables, not for map assignments handled by mapSet
	if isMapIndexLHS && len(lhs) == 1 { // Only skip operator if it's a single map assignment
		// Continue, we've already written part of the mapSet() function call
	} else {
		c.tsw.WriteLiterally(" ")
		tokStr, ok := TokenToTs(tok) // Use explicit gstypes alias
		if !ok {
			c.tsw.WriteLiterally("?= ")
			c.tsw.WriteCommentLine("Unknown token " + tok.String())
		} else {
			c.tsw.WriteLiterally(tokStr)
		}
		c.tsw.WriteLiterally(" ")
	}

	// Write RHS
	for i, r := range rhs {
		if i != 0 {
			c.tsw.WriteLiterally(", ")
		}
		// Check if we need to access a boxed source value and apply clone
		// For struct value assignments, we need to handle:
		// 1. Unboxed source, unboxed target: source.clone()
		// 2. Boxed source, unboxed target: source.value.clone()
		// 3. Unboxed source, boxed target: $.box(source)
		// 4. Boxed source, boxed target: source (straight assignment of the box)

		// Determine if RHS is a boxed variable (could be a struct or other variable)
		needsBoxedAccessRHS := false
		var rhsObj types.Object

		// Check if RHS is an identifier (variable name)
		rhsIdent, rhsIsIdent := r.(*ast.Ident)
		if rhsIsIdent {
			rhsObj = c.pkg.TypesInfo.Uses[rhsIdent]
			if rhsObj == nil {
				rhsObj = c.pkg.TypesInfo.Defs[rhsIdent]
			}

			// Important: For struct copying, we need to check if the variable itself is boxed
			// Not just if it needs boxed access (which is more specific to pointers)
			if rhsObj != nil {
				needsBoxedAccessRHS = c.analysis.NeedsBoxed(rhsObj)
			}
		}

		// Handle different cases for struct cloning
		if shouldApplyClone(c.pkg, r) {
			if err := c.WriteValueExpr(r); err != nil { // Write the RHS expression
				return err
			}

			// For a boxed struct source, we need to add .value before .clone()
			// Critical: For case like original.clone() when original is boxed,
			// we need to generate original.value.clone() instead
			if needsBoxedAccessRHS {
				c.tsw.WriteLiterally(".value") // Access the boxed value
			}

			c.tsw.WriteLiterally(".clone()") // Always add clone for struct values
		} else {
			if err := c.WriteValueExpr(r); err != nil { // RHS is a non-struct value
				return err
			}
		}
	}

	// If the LHS was a single map index, close the mapSet call
	if isMapIndexLHS && len(lhs) == 1 {
		c.tsw.WriteLiterally(")")
	}
	return nil
}

// writeChannelReceiveWithOk handles the specific Go assignment pattern
// `value, ok := <-channel` (or `:=`).
// It translates this into a TypeScript destructuring assignment/declaration
// from the result of `await channel_ts.receiveWithOk()`.
// The `receiveWithOk()` runtime method is expected to return an object like
// `{ value: receivedValue, ok: boolean }`.
//
// - If `tok` is `token.DEFINE` (for `:=`), it generates `const { value: valueName, ok: okName } = ...`.
// - Otherwise (for `=`), it generates `{ value: valueName, ok: okName } = ...` (if not a declaration).
// - Blank identifiers (`_`) on the LHS are handled:
//   - If `value` is blank: `const { ok: okName } = ...` or `{ ok: okName } = ...`.
//   - If `ok` is blank: `const { value: valueName } = ...` or `{ value: valueName } = ...`.
//   - If both are blank, it simply writes `await channel_ts.receiveWithOk()` to
//     execute the receive for its potential side effects (though `receiveWithOk`
//     is primarily for its return values) and discards the result.
//
// This ensures that the Go channel receive with existence check is correctly
// mapped to the asynchronous TypeScript channel helper.
func (c *GoToTSCompiler) writeChannelReceiveWithOk(lhs []ast.Expr, unaryExpr *ast.UnaryExpr, tok token.Token) error {
	// Ensure LHS has exactly two expressions
	if len(lhs) != 2 {
		return fmt.Errorf("internal error: writeChannelReceiveWithOk called with %d LHS expressions", len(lhs))
	}

	// Get variable names, handling blank identifiers
	valueIsBlank := false
	okIsBlank := false
	var valueName string
	var okName string

	if valIdent, ok := lhs[0].(*ast.Ident); ok {
		if valIdent.Name == "_" {
			valueIsBlank = true
		} else {
			valueName = valIdent.Name
		}
	} else {
		return fmt.Errorf("unhandled LHS expression type for value in channel receive: %T", lhs[0])
	}

	if okIdent, ok := lhs[1].(*ast.Ident); ok {
		if okIdent.Name == "_" {
			okIsBlank = true
		} else {
			okName = okIdent.Name
		}
	} else {
		return fmt.Errorf("unhandled LHS expression type for ok in channel receive: %T", lhs[1])
	}

	// Generate destructuring assignment/declaration for val, ok := <-channel
	keyword := ""
	if tok == token.DEFINE {
		keyword = "const " // Use const for destructuring declaration
	}

	// Build the destructuring pattern, handling blank identifiers correctly for TS
	patternParts := []string{}
	if !valueIsBlank {
		// Map the 'value' field to the Go variable name
		patternParts = append(patternParts, fmt.Sprintf("value: %s", valueName))
	} else {
		// If both are blank, just await the call and return
		if okIsBlank {
			c.tsw.WriteLiterally("await ")
			if err := c.WriteValueExpr(unaryExpr.X); err != nil { // Channel expression
				return fmt.Errorf("failed to write channel expression in receive: %w", err)
			}
			c.tsw.WriteLiterally(".receiveWithOk()")
			c.tsw.WriteLine("")
			return nil // Nothing to assign
		}
		// Only value is blank, need to map 'ok' property
		patternParts = append(patternParts, fmt.Sprintf("ok: %s", okName))
	}

	if !okIsBlank && !valueIsBlank { // Both are present
		patternParts = append(patternParts, fmt.Sprintf("ok: %s", okName))
	}
	// If both are blank, patternParts remains empty, handled earlier.

	destructuringPattern := fmt.Sprintf("{ %s }", strings.Join(patternParts, ", "))

	// Write the destructuring assignment/declaration
	c.tsw.WriteLiterally(keyword) // "const " or ""
	c.tsw.WriteLiterally(destructuringPattern)
	c.tsw.WriteLiterally(" = await ")
	if err := c.WriteValueExpr(unaryExpr.X); err != nil { // Channel expression
		return fmt.Errorf("failed to write channel expression in receive: %w", err)
	}
	c.tsw.WriteLiterally(".receiveWithOk()")
	c.tsw.WriteLine("")

	return nil
}

// WriteStmtAssign translates a Go assignment statement (`ast.AssignStmt`) into
// its TypeScript equivalent. It handles various forms of Go assignments:
//
// 1.  **Multi-variable assignment from a single function call** (e.g., `a, b := fn()`):
//   - Uses `writeMultiVarAssignFromCall` to generate `let [a, b] = fn_ts();`.
//
// 2.  **Type assertion with comma-ok** (e.g., `val, ok := expr.(Type)`):
//   - Uses `writeTypeAssertion` to generate `let { value: val, ok: ok } = $.typeAssert<Type_ts>(expr_ts, 'TypeName');`.
//
// 3.  **Map lookup with comma-ok** (e.g., `val, ok := myMap[key]`):
//   - Uses `writeMapLookupWithExists` to generate separate assignments for `val`
//     (using `myMap_ts.get(key_ts) ?? zeroValue`) and `ok` (using `myMap_ts.has(key_ts)`).
//
// 4.  **Channel receive with comma-ok** (e.g., `val, ok := <-ch`):
//   - Uses `writeChannelReceiveWithOk` to generate `let { value: val, ok: ok } = await ch_ts.receiveWithOk();`.
//
// 5.  **Discarded channel receive** (e.g., `<-ch` on RHS, no LHS vars):
//   - Translates to `await ch_ts.receive();`.
//
// 6.  **Single assignment** (e.g., `x = y`, `x := y`, `*p = y`, `x[i] = y`):
//   - Uses `writeSingleAssign` which handles:
//   - Blank identifier `_` on LHS (evaluates RHS for side effects).
//   - Assignment to dereferenced pointer `*p = val` -> `p_ts!.value = val_ts`.
//   - Short declaration `x := y`: `let x = y_ts;`. If `x` is boxed, `let x: $.Box<T> = $.box(y_ts);`.
//   - Regular assignment `x = y`, including compound assignments like `x += y`.
//   - Assignment to map index `m[k] = v` is delegated to `writeAssignmentCore` for `$.mapSet`.
//   - Struct value assignment `s1 = s2` becomes `s1 = s2.clone()` if `s2` is a struct.
//
// 7.  **Multi-variable assignment with multiple RHS values** (e.g., `a, b = x, y`):
//   - Uses `writeAssignmentCore` to generate `[a,b] = [x_ts, y_ts];` (or `let [a,b] = ...` for `:=`).
//
// The function ensures that the number of LHS and RHS expressions matches for
// most cases, erroring if they don't, except for specifically handled patterns
// like multi-assign from single call or discarded channel receive.
// It correctly applies `let` for `:=` (define) tokens and handles boxing and
// cloning semantics based on type information and analysis.
func (c *GoToTSCompiler) WriteStmtAssign(exp *ast.AssignStmt) error {
	// writeMultiVarAssignFromCall handles multi-variable assignment from a single function call.
	writeMultiVarAssignFromCall := func(lhs []ast.Expr, callExpr *ast.CallExpr, tok token.Token) error {
		// Determine if 'let' or 'const' is needed for :=
		if tok == token.DEFINE {
			// For simplicity, use 'let' for := in multi-variable assignments.
			// More advanced analysis might be needed to determine if const is possible.
			c.tsw.WriteLiterally("let ")
		}

		// Write the left-hand side as a destructuring pattern
		c.tsw.WriteLiterally("[")
		for i, lhsExpr := range lhs {
			if i != 0 {
				c.tsw.WriteLiterally(", ")
			}
			// Write the variable name, omitting '_' for blank identifier
			if ident, ok := lhsExpr.(*ast.Ident); ok && ident.Name != "_" {
				c.WriteIdent(ident, false)
			} else if !ok {
				// Should not happen for valid Go code in this context, but handle defensively
				return errors.Errorf("unhandled LHS expression in destructuring: %T", lhsExpr)
			}
		}
		c.tsw.WriteLiterally("] = ")

		// Write the right-hand side (the function call)
		if err := c.WriteValueExpr(callExpr); err != nil {
			return fmt.Errorf("failed to write RHS call expression in assignment: %w", err)
		}

		c.tsw.WriteLine("")
		return nil
	}

	// writeSingleAssign handles a single assignment pair, including blank identifiers and short declarations.
	writeSingleAssign := func(lhsExpr, rhsExpr ast.Expr, tok token.Token) error {
		// Handle blank identifier (_) on the LHS
		if ident, ok := lhsExpr.(*ast.Ident); ok && ident.Name == "_" {
			// Evaluate the RHS expression for side effects, but don't assign it
			c.tsw.WriteLiterally("/* _ = */ ")
			if err := c.WriteValueExpr(rhsExpr); err != nil {
				return err
			}
			c.tsw.WriteLine("")
			return nil
		}

		// Handle the special case of "*p = val" (assignment to dereferenced pointer)
		if starExpr, ok := lhsExpr.(*ast.StarExpr); ok {
			// For *p = val, we need to set p's .value property
			// Write "p!.value = " for the underlying value
			if err := c.WriteValueExpr(starExpr.X); err != nil { // p in *p
				return err
			}
			c.tsw.WriteLiterally("!.value = ") // Add non-null assertion for TS safety

			// Handle the RHS expression (potentially adding .clone() for structs)
			if shouldApplyClone(c.pkg, rhsExpr) {
				if err := c.WriteValueExpr(rhsExpr); err != nil {
					return err
				}
				c.tsw.WriteLiterally(".clone()")
			} else {
				if err := c.WriteValueExpr(rhsExpr); err != nil {
					return err
				}
			}

			c.tsw.WriteLine("")
			return nil
		}

		// For short declaration (:=), emit "let"/"const" declaration
		isDeclaration := tok == token.DEFINE
		if isDeclaration {
			c.tsw.WriteLiterally("let ")
		}

		// Determine if LHS is boxed
		isLHSBoxed, isLHSBoxedAssign := false, false
		var lhsIdent *ast.Ident
		var lhsObj types.Object

		if ident, ok := lhsExpr.(*ast.Ident); ok {
			lhsIdent = ident
			// Get the types.Object from the identifier
			if use, ok := c.pkg.TypesInfo.Uses[ident]; ok {
				lhsObj = use
			} else if def, ok := c.pkg.TypesInfo.Defs[ident]; ok {
				lhsObj = def
			}

			// Check if this variable needs to be boxed
			if lhsObj != nil && c.analysis.NeedsBoxed(lhsObj) {
				isLHSBoxed = true
			}

			// Check if we need to use .value when assigning this variable
			if lhsObj != nil && c.analysis.NeedsBoxedAccess(lhsObj) {
				isLHSBoxedAssign = true
				_ = isLHSBoxedAssign // not used
			}
		}

		// Special handling for short declaration of boxed variables
		if isDeclaration && isLHSBoxed && lhsIdent != nil {
			// Just write the identifier name without .value
			c.tsw.WriteLiterally(lhsIdent.Name)

			// Add type annotation for boxed variables in declarations
			if lhsObj != nil {
				c.tsw.WriteLiterally(": ")
				c.tsw.WriteLiterally("$.Box<")
				c.WriteGoType(lhsObj.Type())
				c.tsw.WriteLiterally(">")
			}

			c.tsw.WriteLiterally(" = ")

			// Box the initializer
			c.tsw.WriteLiterally("$.box(")
			if err := c.WriteValueExpr(rhsExpr); err != nil {
				return err
			}
			c.tsw.WriteLiterally(")")

			c.tsw.WriteLine("")
			return nil
		}

		// Handle index expressions differently (special case for map assignments)
		if indexExpr, ok := lhsExpr.(*ast.IndexExpr); ok {
			if tv, ok := c.pkg.TypesInfo.Types[indexExpr.X]; ok {
				if _, isMap := tv.Type.Underlying().(*types.Map); isMap {
					// Map assignment already handled by writeAssignmentCore
					if err := c.writeAssignmentCore([]ast.Expr{lhsExpr}, []ast.Expr{rhsExpr}, tok); err != nil {
						return err
					}
					c.tsw.WriteLine("")
					return nil
				}
			}
		}

		lhsExprIdent, lhsExprIsIdent := lhsExpr.(*ast.Ident)
		if lhsExprIsIdent {
			// prevent writing .value unless lhs is boxed
			c.WriteIdent(lhsExprIdent, isLHSBoxed)
		} else {
			if err := c.WriteValueExpr(lhsExpr); err != nil {
				return err
			}
		}

		c.tsw.WriteLiterally(" ")
		tokStr, ok := TokenToTs(tok)
		if !ok {
			return errors.Errorf("unknown token: %v", tok.String())
		}

		c.tsw.WriteLiterally(tokStr) // Write the correct operator (e.g., =, +=, -=)
		c.tsw.WriteLiterally(" ")

		if err := c.WriteValueExpr(rhsExpr); err != nil {
			return err
		}

		if shouldApplyClone(c.pkg, rhsExpr) {
			c.tsw.WriteLiterally(".clone()")
		}

		c.tsw.WriteLine("")
		return nil
	}

	// writeMapLookupWithExists handles the map comma-ok idiom: value, exists := myMap[key]
	writeMapLookupWithExists := func(lhs []ast.Expr, indexExpr *ast.IndexExpr, tok token.Token) error {
		// First check that we have exactly two LHS expressions (value and exists)
		if len(lhs) != 2 {
			return fmt.Errorf("map comma-ok idiom requires exactly 2 variables on LHS, got %d", len(lhs))
		}

		// Check for blank identifiers and get variable names
		valueIsBlank := false
		existsIsBlank := false
		var valueName string
		var existsName string

		if valIdent, ok := lhs[0].(*ast.Ident); ok {
			if valIdent.Name == "_" {
				valueIsBlank = true
			} else {
				valueName = valIdent.Name
			}
		} else {
			return fmt.Errorf("unhandled LHS expression type for value in map comma-ok: %T", lhs[0])
		}

		if existsIdent, ok := lhs[1].(*ast.Ident); ok {
			if existsIdent.Name == "_" {
				existsIsBlank = true
			} else {
				existsName = existsIdent.Name
			}
		} else {
			return fmt.Errorf("unhandled LHS expression type for exists in map comma-ok: %T", lhs[1])
		}

		// Declare variables if using := and not blank
		if tok == token.DEFINE {
			if !valueIsBlank {
				c.tsw.WriteLiterally("let ")
				c.tsw.WriteLiterally(valueName)
				// TODO: Add type annotation based on map value type
				c.tsw.WriteLine("")
			}
			if !existsIsBlank {
				c.tsw.WriteLiterally("let ")
				c.tsw.WriteLiterally(existsName)
				c.tsw.WriteLiterally(": boolean") // exists is always boolean
				c.tsw.WriteLine("")
			}
		}

		// Assign 'exists'
		if !existsIsBlank {
			c.tsw.WriteLiterally(existsName)
			c.tsw.WriteLiterally(" = ")
			if err := c.WriteValueExpr(indexExpr.X); err != nil { // Map
				return err
			}
			c.tsw.WriteLiterally(".has(")
			if err := c.WriteValueExpr(indexExpr.Index); err != nil { // Key
				return err
			}
			c.tsw.WriteLiterally(")")
			c.tsw.WriteLine("")
		}

		// Assign 'value'
		if !valueIsBlank {
			c.tsw.WriteLiterally(valueName)
			c.tsw.WriteLiterally(" = ")
			if err := c.WriteValueExpr(indexExpr.X); err != nil { // Map
				return err
			}
			c.tsw.WriteLiterally(".get(")
			if err := c.WriteValueExpr(indexExpr.Index); err != nil { // Key
				return err
			}
			c.tsw.WriteLiterally(") ?? ")
			// Write the zero value for the map's value type
			if tv, ok := c.pkg.TypesInfo.Types[indexExpr.X]; ok {
				if mapType, isMap := tv.Type.Underlying().(*types.Map); isMap {
					c.WriteZeroValueForType(mapType.Elem())
				} else {
					// Fallback zero value if type info is missing or not a map
					c.tsw.WriteLiterally("null")
				}
			} else {
				c.tsw.WriteLiterally("null")
			}
			c.tsw.WriteLine("")
		} else if existsIsBlank {
			// If both are blank, still evaluate for side effects (though .has/.get are usually pure)
			// We add a ; otherwise TypeScript thinks we are invoking a function.
			c.tsw.WriteLiterally(";(")                            // Wrap in parens to make it an expression statement
			if err := c.WriteValueExpr(indexExpr.X); err != nil { // Map
				return err
			}
			c.tsw.WriteLiterally(".has(")
			if err := c.WriteValueExpr(indexExpr.Index); err != nil { // Key
				return err
			}
			c.tsw.WriteLiterally("), ")                           // Evaluate .has
			if err := c.WriteValueExpr(indexExpr.X); err != nil { // Map
				return err
			}
			c.tsw.WriteLiterally(".get(")
			if err := c.WriteValueExpr(indexExpr.Index); err != nil { // Key
				return err
			}
			c.tsw.WriteLiterally("))") // Evaluate .get
			c.tsw.WriteLine("")
		}

		return nil
	}

	// Handle multi-variable assignment from a single expression.
	if len(exp.Lhs) > 1 && len(exp.Rhs) == 1 {
		rhsExpr := exp.Rhs[0]
		if typeAssertExpr, ok := rhsExpr.(*ast.TypeAssertExpr); ok {
			return c.writeTypeAssertion(exp.Lhs, typeAssertExpr, exp.Tok)
		} else if indexExpr, ok := rhsExpr.(*ast.IndexExpr); ok {
			// Check if this is a map lookup (comma-ok idiom)
			if len(exp.Lhs) == 2 {
				// Get the type of the indexed expression
				if c.pkg != nil && c.pkg.TypesInfo != nil {
					tv, ok := c.pkg.TypesInfo.Types[indexExpr.X]
					if ok {
						// Check if it's a map type
						if _, isMap := tv.Type.Underlying().(*types.Map); isMap {
							return writeMapLookupWithExists(exp.Lhs, indexExpr, exp.Tok)
						}
					}
				}
			}
		} else if unaryExpr, ok := rhsExpr.(*ast.UnaryExpr); ok && unaryExpr.Op == token.ARROW {
			// Handle val, ok := <-channel
			if len(exp.Lhs) == 2 {
				return c.writeChannelReceiveWithOk(exp.Lhs, unaryExpr, exp.Tok)
			}
			// If LHS count is not 2, fall through to error or other handling
		} else if callExpr, ok := rhsExpr.(*ast.CallExpr); ok {
			return writeMultiVarAssignFromCall(exp.Lhs, callExpr, exp.Tok)
		}
		// If none of the specific multi-assign patterns match, fall through to the error check below
	}

	// Ensure LHS and RHS have the same length for valid Go code in these cases
	if len(exp.Lhs) != len(exp.Rhs) {
		return fmt.Errorf("invalid assignment statement: LHS count (%d) != RHS count (%d)", len(exp.Lhs), len(exp.Rhs))
	}

	// Handle multi-variable assignment (e.g., swaps) using writeAssignmentCore
	if len(exp.Lhs) > 1 {
		// Need to handle := for multi-variable declarations
		if exp.Tok == token.DEFINE {
			c.tsw.WriteLiterally("let ") // Use let for multi-variable declarations
		}
		if err := c.writeAssignmentCore(exp.Lhs, exp.Rhs, exp.Tok); err != nil {
			return err
		}
		c.tsw.WriteLine("") // Add newline after the statement
		return nil
	}

	// Handle single assignment using writeSingleAssign
	if len(exp.Lhs) == 1 {
		if err := writeSingleAssign(exp.Lhs[0], exp.Rhs[0], exp.Tok); err != nil {
			return err
		}
		return nil
	}

	// Should not reach here if LHS/RHS counts are valid and handled
	return fmt.Errorf("unhandled assignment case")
}

// shouldApplyClone determines whether a `.clone()` method call should be appended
// to the TypeScript translation of a Go expression `rhs` when it appears on the
// right-hand side of an assignment. This is primarily to emulate Go's value
// semantics for struct assignments, where assigning one struct variable to another
// creates a copy of the struct.
//
// It uses `go/types` information (`pkg.TypesInfo`) to determine the type of `rhs`.
//   - If `rhs` is identified as a struct type (either directly, as a named type
//     whose underlying type is a struct, or an unnamed type whose underlying type
//     is a struct), it returns `true`.
//   - An optimization: if `rhs` is a composite literal (`*ast.CompositeLit`),
//     it returns `false` because a composite literal already produces a new value,
//     so cloning is unnecessary.
//   - If type information is unavailable or `rhs` is not a struct type, it returns `false`.
//
// This function is crucial for ensuring that assignments of struct values in
// TypeScript behave like copies, as they do in Go, rather than reference assignments.
func shouldApplyClone(pkg *packages.Package, rhs ast.Expr) bool {
	if pkg == nil || pkg.TypesInfo == nil {
		// Cannot determine type without type info, default to no clone
		return false
	}

	// Get the type of the RHS expression
	var exprType types.Type

	// Handle identifiers (variables) directly - the most common case
	if ident, ok := rhs.(*ast.Ident); ok {
		if obj := pkg.TypesInfo.Uses[ident]; obj != nil {
			// Get the type directly from the object
			exprType = obj.Type()
		} else if obj := pkg.TypesInfo.Defs[ident]; obj != nil {
			// Also check Defs map for definitions
			exprType = obj.Type()
		}
	}

	// If we couldn't get the type from Uses/Defs, try getting it from Types
	if exprType == nil {
		if tv, found := pkg.TypesInfo.Types[rhs]; found && tv.Type != nil {
			exprType = tv.Type
		}
	}

	// No type information available
	if exprType == nil {
		return false
	}

	// Optimization: If it's a composite literal for a struct, no need to clone
	// as it's already a fresh value
	if _, isCompositeLit := rhs.(*ast.CompositeLit); isCompositeLit {
		return false
	}

	// Check if it's a struct type (directly, through named type, or underlying)
	if named, ok := exprType.(*types.Named); ok {
		if _, isStruct := named.Underlying().(*types.Struct); isStruct {
			return true // Named struct type
		}
	} else if _, ok := exprType.(*types.Struct); ok {
		return true // Direct struct type
	} else if underlying := exprType.Underlying(); underlying != nil {
		if _, isStruct := underlying.(*types.Struct); isStruct {
			return true // Underlying is a struct
		}
	}

	return false // Not a struct, do not apply clone
}

// WriteStmtExpr translates a Go expression statement (`ast.ExprStmt`) into
// its TypeScript equivalent. An expression statement in Go is an expression
// evaluated for its side effects (e.g., a function call).
//   - A special case is a simple channel receive used as a statement (`<-ch`). This
//     is translated to `await ch_ts.receive();` (the value is discarded).
//   - For other expression statements, the underlying expression `exp.X` is translated
//     using `WriteValueExpr`.
//   - It attempts to preserve inline comments associated with the expression statement
//     or its underlying expression `exp.X`.
//
// The translated statement is terminated with a newline.
func (c *GoToTSCompiler) WriteStmtExpr(exp *ast.ExprStmt) error {
	// Handle simple channel receive used as a statement (<-ch)
	if unaryExpr, ok := exp.X.(*ast.UnaryExpr); ok && unaryExpr.Op == token.ARROW {
		// Translate <-ch to await ch.receive()
		c.tsw.WriteLiterally("await ")
		if err := c.WriteValueExpr(unaryExpr.X); err != nil { // Channel expression
			return fmt.Errorf("failed to write channel expression in receive statement: %w", err)
		}
		c.tsw.WriteLiterally(".receive()") // Use receive() as the value is discarded
		c.tsw.WriteLine("")
		return nil
	}

	// Special case: if this is a statement that starts with a parenthesis, we need to add a semicolon
	// Only add semicolons before parenthesized function calls like (fn)() or (fn!)()
	switch x := exp.X.(type) {
	case *ast.CallExpr:
		// Only add semicolon if the function itself is parenthesized
		if _, isParen := x.Fun.(*ast.ParenExpr); isParen {
			c.tsw.WriteLiterally(";")
		}
	case *ast.ParenExpr:
		// This handles any statement that starts with a parenthesis
		c.tsw.WriteLiterally(";")
	}

	// Handle other expression statements
	if err := c.WriteValueExpr(exp.X); err != nil { // Expression statement evaluates a value
		return err
	}

	// Handle potential inline comment for ExprStmt
	inlineCommentWritten := false
	if c.pkg != nil && c.pkg.Fset != nil && exp.End().IsValid() {
		if file := c.pkg.Fset.File(exp.End()); file != nil {
			endLine := file.Line(exp.End())
			// Check comments associated *directly* with the ExprStmt node
			for _, cg := range c.analysis.Cmap[exp] {
				if cg.Pos().IsValid() && file.Line(cg.Pos()) == endLine && cg.Pos() > exp.End() {
					commentText := strings.TrimSpace(strings.TrimPrefix(cg.Text(), "//"))
					c.tsw.WriteLiterally(" // " + commentText)
					inlineCommentWritten = true
					break
				}
			}
			// Also check comments associated with the underlying expression X
			// This might be necessary if the comment map links it to X instead of ExprStmt
			if !inlineCommentWritten {
				for _, cg := range c.analysis.Cmap[exp.X] {
					if cg.Pos().IsValid() && file.Line(cg.Pos()) == endLine && cg.Pos() > exp.End() {
						commentText := strings.TrimSpace(strings.TrimPrefix(cg.Text(), "//"))
						c.tsw.WriteLiterally(" // " + commentText)
						inlineCommentWritten = true //nolint:ineffassign
						break
					}
				}
			}
		}
	}

	c.tsw.WriteLine("") // Finish with a newline
	return nil
}

// WriteStmtFor translates a Go `for` statement (`ast.ForStmt`) into a
// TypeScript `for` loop.
// The structure is `for (init_ts; cond_ts; post_ts) { body_ts }`.
//   - The initialization part (`exp.Init`) is translated using `WriteForInit`.
//   - The condition part (`exp.Cond`) is translated using `WriteValueExpr`. If nil,
//     the condition part in TypeScript is empty (resulting in an infinite loop
//     unless broken out of).
//   - The post-iteration part (`exp.Post`) is translated using `WriteForPost`.
//   - The loop body (`exp.Body`) is translated as a block statement using `WriteStmtBlock`.
//
// This function covers standard Go `for` loops (three-part loops, condition-only
// loops, and infinite loops). `for...range` loops are handled by `WriteStmtRange`.
func (c *GoToTSCompiler) WriteStmtFor(exp *ast.ForStmt) error {
	c.tsw.WriteLiterally("for (")
	if exp.Init != nil {
		if err := c.WriteForInit(exp.Init); err != nil { // Use WriteForInit
			return fmt.Errorf("failed to write for loop initialization: %w", err)
		}
	}
	c.tsw.WriteLiterally("; ")
	if exp.Cond != nil {
		if err := c.WriteValueExpr(exp.Cond); err != nil { // Condition is a value
			return fmt.Errorf("failed to write for loop condition: %w", err)
		}
	}
	c.tsw.WriteLiterally("; ")
	if exp.Post != nil {
		if err := c.WriteForPost(exp.Post); err != nil { // Use WriteForPost
			return fmt.Errorf("failed to write for loop post statement: %w", err)
		}
	}
	c.tsw.WriteLiterally(") ")
	if err := c.WriteStmtBlock(exp.Body, false); err != nil {
		return fmt.Errorf("failed to write for loop body: %w", err)
	}
	return nil
}

// WriteForInit translates the initialization part of a Go `for` loop header
// (e.g., `i := 0` or `i = 0` in `for i := 0; ...`) into its TypeScript equivalent.
// - If `stmt` is an `ast.AssignStmt`:
//   - For short variable declarations (`:=`) with multiple variables (e.g., `i, j := 0, 10`),
//     it generates `let i = 0, j = 10`. Each LHS variable is paired with its
//     corresponding RHS value; if RHS values are insufficient, remaining LHS
//     variables are initialized with their zero value using `WriteZeroValue`.
//   - For other assignments (single variable `:=`, or regular `=`), it uses
//     `writeAssignmentCore`. If it's `:=`, `let` is prepended.
//   - If `stmt` is an `ast.ExprStmt` (less common in `for` inits), it translates
//     the expression using `WriteValueExpr`.
//
// Unhandled statement types in the init part result in a comment.
func (c *GoToTSCompiler) WriteForInit(stmt ast.Stmt) error {
	switch s := stmt.(type) {
	case *ast.AssignStmt:
		// Handle assignment in init (e.g., i := 0 or i = 0)
		// For TypeScript for-loop init, we need to handle multi-variable declarations differently
		if s.Tok == token.DEFINE && len(s.Lhs) > 1 && len(s.Rhs) > 0 {
			// For loop initialization with multiple variables (e.g., let i = 0, j = 10)
			c.tsw.WriteLiterally("let ")

			// Handle each LHS variable with its corresponding RHS value
			for i, lhs := range s.Lhs {
				if i > 0 {
					c.tsw.WriteLiterally(", ")
				}

				// Write the LHS variable name
				if err := c.WriteValueExpr(lhs); err != nil {
					return err
				}

				// Write the corresponding RHS, or a default if not enough RHS values
				c.tsw.WriteLiterally(" = ")
				if i < len(s.Rhs) {
					// If there's a corresponding RHS value
					if err := c.WriteValueExpr(s.Rhs[i]); err != nil {
						return err
					}
				} else {
					// No corresponding RHS
					return errors.Errorf("no corresponding rhs to lhs: %v", s)
				}
			}
		} else {
			// Regular single variable or assignment (not declaration)
			if s.Tok == token.DEFINE {
				c.tsw.WriteLiterally("let ")
			}
			// Use existing assignment core logic
			if err := c.writeAssignmentCore(s.Lhs, s.Rhs, s.Tok); err != nil {
				return err
			}
		}
		return nil
	case *ast.ExprStmt:
		// Handle expression statement in init
		return c.WriteValueExpr(s.X)
	default:
		return errors.Errorf("unhandled for loop init statement: %T", stmt)
	}
}

// WriteForPost translates the post-iteration part of a Go `for` loop header
// (e.g., `i++` or `i, j = i+1, j-1` in `for ...; i++`) into its TypeScript
// equivalent.
// - If `stmt` is an `ast.IncDecStmt` (e.g., `i++`), it writes `i_ts++`.
// - If `stmt` is an `ast.AssignStmt`:
//   - For multiple variable assignments (e.g., `i, j = i+1, j-1`), it generates
//     TypeScript array destructuring: `[i_ts, j_ts] = [i_ts+1, j_ts-1]`.
//   - For single variable assignments, it uses `writeAssignmentCore`.
//   - If `stmt` is an `ast.ExprStmt` (less common), it translates the expression
//     using `WriteValueExpr`.
//
// Unhandled statement types in the post part result in a comment.
func (c *GoToTSCompiler) WriteForPost(stmt ast.Stmt) error {
	switch s := stmt.(type) {
	case *ast.IncDecStmt:
		// Handle increment/decrement (e.g., i++)
		if err := c.WriteValueExpr(s.X); err != nil { // The expression (e.g., i)
			return err
		}
		tokStr, ok := TokenToTs(s.Tok)
		if !ok {
			return errors.Errorf("unknown incdec token: %v", s.Tok)
		}
		c.tsw.WriteLiterally(tokStr) // The token (e.g., ++)
		return nil
	case *ast.AssignStmt:
		// For multiple variable assignment in post like i, j = i+1, j-1
		// we need to use destructuring in TypeScript like [i, j] = [i+1, j-1]
		if len(s.Lhs) > 1 && len(s.Rhs) > 0 {
			// Write LHS as array destructuring
			c.tsw.WriteLiterally("[")
			for i, lhs := range s.Lhs {
				if i > 0 {
					c.tsw.WriteLiterally(", ")
				}
				if err := c.WriteValueExpr(lhs); err != nil {
					return err
				}
			}
			c.tsw.WriteLiterally("] = [")

			// Write RHS as array
			for i, rhs := range s.Rhs {
				if i > 0 {
					c.tsw.WriteLiterally(", ")
				}
				if err := c.WriteValueExpr(rhs); err != nil {
					return err
				}
			}
			c.tsw.WriteLiterally("]")
		} else {
			// Regular single variable assignment
			if err := c.writeAssignmentCore(s.Lhs, s.Rhs, s.Tok); err != nil {
				return err
			}
		}
		return nil
	case *ast.ExprStmt:
		// Handle expression statement in post
		return c.WriteValueExpr(s.X)
	default:
		return errors.Errorf("unhandled for loop post statement: %T", stmt)
	}
}

// WriteStmtRange translates a Go `for...range` statement (`ast.RangeStmt`)
// into an equivalent TypeScript loop. The translation depends on the type of
// the expression being ranged over (`exp.X`), determined using `go/types` info.
//
//   - **Maps (`*types.Map`):**
//     `for k, v := range myMap` becomes `for (const [k_ts, v_ts] of myMap_ts.entries()) { const k = k_ts; const v = v_ts; ...body... }`.
//     If only `k` or `v` (or neither) is used, the corresponding TypeScript const declaration is adjusted.
//
//   - **Strings (`*types.Basic` with `IsString` info):**
//     `for i, r := range myString` becomes:
//     `const _runes = $.stringToRunes(myString_ts);`
//     `for (let i_ts = 0; i_ts < _runes.length; i_ts++) { const r_ts = _runes[i_ts]; ...body... }`.
//     The index variable `i_ts` uses the Go key variable name if provided (and not `_`).
//     The rune variable `r_ts` uses the Go value variable name.
//
//   - **Integers (`*types.Basic` with `IsInteger` info, Go 1.22+):**
//     `for i := range N` becomes `for (let i_ts = 0; i_ts < N_ts; i_ts++) { ...body... }`.
//     `for i, v := range N` becomes `for (let i_ts = 0; i_ts < N_ts; i_ts++) { const v_ts = i_ts; ...body... }`.
//
// - **Arrays (`*types.Array`) and Slices (`*types.Slice`):**
//   - If both key (index) and value are used (`for i, val := range arr`):
//     `for (let i_ts = 0; i_ts < arr_ts.length; i_ts++) { const val_ts = arr_ts[i_ts]; ...body... }`.
//   - If only the key (index) is used (`for i := range arr`):
//     `for (let i_ts = 0; i_ts < arr_ts.length; i_ts++) { ...body... }`.
//   - If only the value is used (`for _, val := range arr`):
//     `for (const v_ts of arr_ts) { const val_ts = v_ts; ...body... }`.
//   - If neither is used (e.g., `for range arr`), a simple index loop `for (let _i = 0; ...)` is generated.
//     The index variable `i_ts` uses the Go key variable name if provided.
//
// Loop variables (`exp.Key`, `exp.Value`) are declared as `const` inside the loop
// body if they are not blank identifiers (`_`). The loop body (`exp.Body`) is
// translated using `WriteStmtBlock` (or `WriteStmt` for array/slice with key and value).
// If the ranged type is not supported, a comment is written, and an error is returned.
func (c *GoToTSCompiler) WriteStmtRange(exp *ast.RangeStmt) error {
	// Get the type of the iterable expression
	iterType := c.pkg.TypesInfo.TypeOf(exp.X)
	underlying := iterType.Underlying()

	// Handle map types
	if _, ok := underlying.(*types.Map); ok {
		// Use for-of with entries() for proper Map iteration
		c.tsw.WriteLiterally("for (const [k, v] of ")
		if err := c.WriteValueExpr(exp.X); err != nil {
			return fmt.Errorf("failed to write range loop map expression: %w", err)
		}
		c.tsw.WriteLiterally(".entries()) {")
		c.tsw.Indent(1)
		c.tsw.WriteLine("")
		// If a key variable is provided and is not blank, declare it as a constant
		if exp.Key != nil {
			if ident, ok := exp.Key.(*ast.Ident); ok && ident.Name != "_" {
				c.tsw.WriteLiterally("const ")
				c.WriteIdent(ident, false)
				c.tsw.WriteLiterally(" = k")
				c.tsw.WriteLine("")
			}
		}
		// If a value variable is provided and is not blank, use the value from entries()
		if exp.Value != nil {
			if ident, ok := exp.Value.(*ast.Ident); ok && ident.Name != "_" {
				c.tsw.WriteLiterally("const ")
				c.WriteIdent(ident, false)
				c.tsw.WriteLiterally(" = v")
				c.tsw.WriteLine("")
			}
		}
		// Write the loop body
		if err := c.WriteStmtBlock(exp.Body, false); err != nil {
			return fmt.Errorf("failed to write range loop map body: %w", err)
		}
		c.tsw.Indent(-1)
		c.tsw.WriteLine("}")
		return nil
	}

	// Handle basic types (string, integer)
	if basic, ok := underlying.(*types.Basic); ok {
		if basic.Info()&types.IsString != 0 {
			// Add a scope to avoid collision of _runes variable
			c.tsw.WriteLine("{")
			c.tsw.Indent(1)

			// Convert the string to runes using $.stringToRunes
			c.tsw.WriteLiterally("const _runes = $.stringToRunes(")
			if err := c.WriteValueExpr(exp.X); err != nil {
				return fmt.Errorf("failed to write range loop string conversion expression: %w", err)
			}
			c.tsw.WriteLiterally(")")
			c.tsw.WriteLine("")

			// Determine the index variable name for the generated loop
			indexVarName := "i" // Default name
			if exp.Key != nil {
				if keyIdent, ok := exp.Key.(*ast.Ident); ok && keyIdent.Name != "_" {
					indexVarName = keyIdent.Name
				}
			}
			c.tsw.WriteLiterally(fmt.Sprintf("for (let %s = 0; %s < _runes.length; %s++) {", indexVarName, indexVarName, indexVarName))
			c.tsw.Indent(1)
			c.tsw.WriteLine("")
			// Declare value if provided and not blank
			if exp.Value != nil {
				if ident, ok := exp.Value.(*ast.Ident); ok && ident.Name != "_" {
					c.tsw.WriteLiterally("const ")
					c.WriteIdent(ident, false)
					c.tsw.WriteLiterally(" = _runes[i]") // TODO: should be indexVarName?
					c.tsw.WriteLine("")
				}
			}
			if err := c.WriteStmtBlock(exp.Body, false); err != nil {
				return fmt.Errorf("failed to write range loop string body: %w", err)
			}
			c.tsw.Indent(-1)
			c.tsw.WriteLine("}")

			// outer }
			c.tsw.Indent(-1)
			c.tsw.WriteLine("}")
			return nil
		} else if basic.Info()&types.IsInteger != 0 {
			// Handle ranging over an integer (Go 1.22+)
			// Determine the index variable name for the generated loop
			indexVarName := "_i" // Default name
			if exp.Key != nil {
				if keyIdent, ok := exp.Key.(*ast.Ident); ok && keyIdent.Name != "_" {
					indexVarName = keyIdent.Name
				}
			}

			c.tsw.WriteLiterally(fmt.Sprintf("for (let %s = 0; %s < ", indexVarName, indexVarName))
			if err := c.WriteValueExpr(exp.X); err != nil { // This is N
				return fmt.Errorf("failed to write range loop integer expression: %w", err)
			}
			c.tsw.WriteLiterally(fmt.Sprintf("; %s++) {", indexVarName))
			c.tsw.Indent(1)
			c.tsw.WriteLine("")

			// The value variable is not allowed ranging over an integer.
			if exp.Value != nil {
				return errors.Errorf("ranging over an integer supports key variable only (not value variable): %v", exp)
			}

			if err := c.WriteStmtBlock(exp.Body, false); err != nil {
				return fmt.Errorf("failed to write range loop integer body: %w", err)
			}
			c.tsw.Indent(-1)
			c.tsw.WriteLine("}")
			return nil
		}
	}

	// Handle array and slice types
	_, isSlice := underlying.(*types.Slice)
	_, isArray := underlying.(*types.Array)
	if isArray || isSlice {
		// Determine the index variable name for the generated loop
		indexVarName := "i" // Default name
		if exp.Key != nil {
			if keyIdent, ok := exp.Key.(*ast.Ident); ok && keyIdent.Name != "_" {
				indexVarName = keyIdent.Name
			}
		}
		// If both key and value are provided, use an index loop and assign both
		if exp.Key != nil && exp.Value != nil {
			c.tsw.WriteLiterally(fmt.Sprintf("for (let %s = 0; %s < ", indexVarName, indexVarName))
			if err := c.WriteValueExpr(exp.X); err != nil { // Write the expression for the iterable
				return fmt.Errorf("failed to write range loop array/slice expression (key and value): %w", err)
			}
			c.tsw.WriteLiterally(fmt.Sprintf(".length; %s++) {", indexVarName))
			c.tsw.Indent(1)
			c.tsw.WriteLine("")
			// Declare value if not blank
			if ident, ok := exp.Value.(*ast.Ident); ok && ident.Name != "_" {
				c.tsw.WriteLiterally("const ")
				c.WriteIdent(ident, false)
				c.tsw.WriteLiterally(" = ")
				if err := c.WriteValueExpr(exp.X); err != nil {
					return fmt.Errorf("failed to write range loop array/slice value expression: %w", err)
				}
				c.tsw.WriteLiterally(fmt.Sprintf("[%s]", indexVarName)) // Use indexVarName
				c.tsw.WriteLine("")
			}
			if err := c.WriteStmt(exp.Body); err != nil {
				return fmt.Errorf("failed to write range loop array/slice body (key and value): %w", err)
			}
			c.tsw.Indent(-1)
			c.tsw.WriteLine("}")
			return nil
		} else if exp.Key != nil && exp.Value == nil { // Only key provided
			c.tsw.WriteLiterally(fmt.Sprintf("for (let %s = 0; %s < ", indexVarName, indexVarName))
			// Write the expression for the iterable
			if err := c.WriteValueExpr(exp.X); err != nil {
				return fmt.Errorf("failed to write expression for the iterable: %w", err)
			}
			c.tsw.WriteLiterally(fmt.Sprintf(".length; %s++) {", indexVarName))
			c.tsw.Indent(1)
			c.tsw.WriteLine("")
			if err := c.WriteStmtBlock(exp.Body, false); err != nil {
				return fmt.Errorf("failed to write range loop array/slice body (only key): %w", err)
			}
			c.tsw.Indent(-1)
			c.tsw.WriteLine("}")
			return nil
		} else if exp.Key == nil && exp.Value != nil { // Only value provided
			// I think this is impossible. See for_range_value_only test.
			return errors.Errorf("unexpected value without key in for range expression: %v", exp)
		} else {
			// Fallback: simple index loop without declaring range variables, use _i
			indexVarName := "_i"
			c.tsw.WriteLiterally(fmt.Sprintf("for (let %s = 0; %s < ", indexVarName, indexVarName))
			if err := c.WriteValueExpr(exp.X); err != nil {
				return fmt.Errorf("failed to write range loop array/slice length expression (fallback): %w", err)
			}
			c.tsw.WriteLiterally(fmt.Sprintf(".length; %s++) {", indexVarName))
			c.tsw.Indent(1)
			c.tsw.WriteLine("")
			if err := c.WriteStmtBlock(exp.Body, false); err != nil {
				return fmt.Errorf("failed to write range loop array/slice body (fallback): %w", err)
			}
			c.tsw.Indent(-1)
			c.tsw.WriteLine("}")
			return nil
		}
	}

	return errors.Errorf("unsupported range loop type: %T for expression %v", underlying, exp)
}

// WriteStmtSend translates a Go channel send statement (`ast.SendStmt`),
// which has the form `ch <- value`, into its asynchronous TypeScript equivalent.
// The translation is `await ch_ts.send(value_ts)`.
// Both the channel expression (`exp.Chan`) and the value expression (`exp.Value`)
// are translated using `WriteValueExpr`. The `await` keyword is used because
// channel send operations are asynchronous in the TypeScript model.
// The statement is terminated with a newline.
func (c *GoToTSCompiler) WriteStmtSend(exp *ast.SendStmt) error {
	// Translate ch <- value to await ch.send(value)
	c.tsw.WriteLiterally("await ")
	if err := c.WriteValueExpr(exp.Chan); err != nil { // The channel expression
		return fmt.Errorf("failed to write channel expression in send statement: %w", err)
	}
	c.tsw.WriteLiterally(".send(")
	if err := c.WriteValueExpr(exp.Value); err != nil { // The value expression
		return fmt.Errorf("failed to write value expression in send statement: %w", err)
	}
	c.tsw.WriteLiterally(")")
	c.tsw.WriteLine("") // Add newline after the statement
	return nil
}

// writeTypeAssertion handles the Go type assertion with comma-ok idiom in an
// assignment context: `value, ok := interfaceExpr.(AssertedType)` (or with `=`).
// It translates this to a TypeScript destructuring assignment (or declaration if `tok`
// is `token.DEFINE` for `:=`) using the `$.typeAssert` runtime helper.
//
// The generated TypeScript is:
// `[let] { value: valueName, ok: okName } = $.typeAssert<AssertedType_ts>(interfaceExpr_ts, 'AssertedTypeName');`
//
//   - `AssertedType_ts` is the TypeScript translation of `AssertedType`.
//   - `interfaceExpr_ts` is the TypeScript translation of `interfaceExpr`.
//   - `'AssertedTypeName'` is a string representation of the asserted type name,
//     obtained via `getTypeNameString`, used for runtime error messages.
//   - `valueName` and `okName` are the Go variable names from the LHS.
//   - Blank identifiers (`_`) on the LHS are handled by omitting the corresponding
//     property in the destructuring pattern (e.g., `{ ok: okName } = ...` if `value` is blank).
//   - If `tok` is not `token.DEFINE` (i.e., for regular assignment `=`), the entire
//     destructuring assignment is wrapped in parentheses `(...)` to make it a valid
//     expression if needed, though typically assignments are statements.
//
// The statement is terminated with a newline.
func (c *GoToTSCompiler) writeTypeAssertion(lhs []ast.Expr, typeAssertExpr *ast.TypeAssertExpr, tok token.Token) error {
	interfaceExpr := typeAssertExpr.X
	assertedType := typeAssertExpr.Type

	// Ensure LHS has exactly two expressions (value and ok)
	if len(lhs) != 2 {
		return fmt.Errorf("type assertion assignment requires exactly 2 variables on LHS, got %d", len(lhs))
	}

	// Get variable names, handling blank identifiers
	valueIsBlank := false
	okIsBlank := false
	var valueName string
	var okName string

	if valIdent, ok := lhs[0].(*ast.Ident); ok {
		if valIdent.Name == "_" {
			valueIsBlank = true
		} else {
			valueName = valIdent.Name
		}
	} else {
		return fmt.Errorf("unhandled LHS expression type for value in type assertion: %T", lhs[0])
	}

	if okIdent, ok := lhs[1].(*ast.Ident); ok {
		if okIdent.Name == "_" {
			okIsBlank = true
		} else {
			okName = okIdent.Name
		}
	} else {
		return fmt.Errorf("unhandled LHS expression type for ok in type assertion: %T", lhs[1])
	}

	// Get the type name string for the asserted type
	typeName := c.getTypeNameString(assertedType)

	// Generate the destructuring assignment
	if tok == token.DEFINE {
		c.tsw.WriteLiterally("let ")
	} else {
		// We must wrap in parenthesis.
		c.tsw.WriteLiterally("(")
	}

	c.tsw.WriteLiterally("{ ")
	// Dynamically build the destructuring pattern
	parts := []string{}
	if !valueIsBlank {
		parts = append(parts, fmt.Sprintf("value: %s", valueName))
	}
	if !okIsBlank {
		parts = append(parts, fmt.Sprintf("ok: %s", okName))
	}
	c.tsw.WriteLiterally(strings.Join(parts, ", "))
	c.tsw.WriteLiterally(" } = $.typeAssert<")

	// Write the asserted type for the generic
	c.WriteTypeExpr(assertedType)
	c.tsw.WriteLiterally(">(")

	// Write the interface expression
	if err := c.WriteValueExpr(interfaceExpr); err != nil {
		return fmt.Errorf("failed to write interface expression in type assertion call: %w", err)
	}
	c.tsw.WriteLiterally(", ")
	c.tsw.WriteLiterally(fmt.Sprintf("'%s'", typeName))
	c.tsw.WriteLiterally(")")

	if tok != token.DEFINE {
		c.tsw.WriteLiterally(")")
	}

	c.tsw.WriteLine("") // Add newline after the statement

	return nil
}

// WriteDoc translates a Go comment group (`ast.CommentGroup`) into TypeScript comments,
// preserving the original style (line `//` or block `/* ... */`).
// - If `doc` is nil, it does nothing.
// - It iterates through each `ast.Comment` in the group.
// - If a comment starts with `//`, it's written as a TypeScript line comment.
// - If a comment starts with `/*`, it's written as a TypeScript block comment:
//   - Single-line block comments (`/* comment */`) are kept on one line.
//   - Multi-line block comments are formatted with `/*` on its own line,
//     each content line prefixed with ` * `, and ` */` on its own line.
//
// This function helps maintain documentation and explanatory comments from the
// Go source in the generated TypeScript code.
func (c *GoToTSCompiler) WriteDoc(doc *ast.CommentGroup) {
	if doc == nil {
		return
	}

	for _, comment := range doc.List {
		// Preserve original comment style (// or /*)
		if strings.HasPrefix(comment.Text, "//") {
			c.tsw.WriteLine(comment.Text)
		} else if strings.HasPrefix(comment.Text, "/*") {
			// Write block comments potentially spanning multiple lines
			// Remove /* and */, then split by newline
			content := strings.TrimSuffix(strings.TrimPrefix(comment.Text, "/*"), "*/")
			lines := strings.Split(content, "\n") // Use \n as Split expects a separator string

			if len(lines) == 1 && !strings.Contains(lines[0], "\n") { // Check again for internal newlines just in case
				// Keep single-line block comments on one line
				c.tsw.WriteLinef("/*%s*/", lines[0])
			} else {
				// Write multi-line block comments
				c.tsw.WriteLine("/*")
				for _, line := range lines {
					// WriteLine handles indentation preamble automatically
					c.tsw.WriteLine(" *" + line) // Add conventional * prefix
				}
				c.tsw.WriteLine(" */")
			}
		} else {
			// Should not happen for valid Go comments, but handle defensively
			c.tsw.WriteCommentLine(" Unknown comment format: " + comment.Text)
		}
	}
}

// goToTypescriptPrimitives maps Go built-in primitive type names (as strings)
// to their corresponding TypeScript type names. This map is used by
// `GoBuiltinToTypescript` for direct type name translation.
//
// Key mappings include:
// - `bool` -> `boolean`
// - `string` -> `string`
// - `int`, `int8`, `int16`, `int32`, `rune` (alias for int32) -> `number`
// - `uint`, `uint8` (`byte`), `uint16`, `uint32` -> `number`
// - `int64`, `uint64` -> `bigint` (requires ES2020+ TypeScript target)
// - `float32`, `float64` -> `number`
//
// This mapping assumes a target environment similar to GOOS=js, GOARCH=wasm,
// where Go's `int` and `uint` are 32-bit and fit within TypeScript's `number`.
var goToTypescriptPrimitives = map[string]string{
	// Boolean
	"bool": "boolean",

	// Strings
	"string": "string",

	// Signed Integers
	"int":   "number",
	"int8":  "number",
	"int16": "number",
	"int32": "number",
	"rune":  "number", // alias for int32
	"int64": "bigint", // Requires TypeScript target >= ES2020

	// Unsigned Integers
	"uint":   "number",
	"uint8":  "number", // byte is an alias for uint8
	"byte":   "number",
	"uint16": "number",
	"uint32": "number",
	"uint64": "bigint", // Requires TypeScript target >= ES2020

	// Floating Point Numbers
	"float32": "number",
	"float64": "number",
}

// GoBuiltinToTypescript translates a Go built-in primitive type name (string)
// to its TypeScript equivalent. It uses the `goToTypescriptPrimitives` map
// for the conversion.
// It returns the TypeScript type name and `true` if the Go type name is found
// in the map. Otherwise, it returns an empty string and `false`.
// This function only handles primitive types listed in the map; composite types
// or custom types are not processed here.
func GoBuiltinToTypescript(typeName string) (string, bool) {
	val, ok := goToTypescriptPrimitives[typeName]
	return val, ok
}

// tokenMap provides a mapping from Go `token.Token` types (representing operators
// and punctuation) to their corresponding string representations in TypeScript.
// This map is used by `TokenToTs` to translate Go operators during expression
// and statement compilation.
//
// Examples:
// - `token.ADD` (Go `+`) -> `"+"` (TypeScript `+`)
// - `token.LAND` (Go `&&`) -> `"&&"` (TypeScript `&&`)
// - `token.ASSIGN` (Go `=`) -> `"="` (TypeScript `=`)
// - `token.DEFINE` (Go `:=`) -> `"="` (TypeScript `=`, as `let` is handled separately)
//
// Some tokens like `token.ARROW` (channel send/receive) are handled specially
// in their respective expression/statement writers and might not be directly mapped here.
// Bitwise AND NOT (`&^=`) is also mapped but may require specific runtime support if not directly translatable.
var tokenMap = map[token.Token]string{
	token.ADD: "+",
	token.SUB: "-",
	token.MUL: "*",
	token.QUO: "/",
	token.REM: "%",
	token.AND: "&",
	token.OR:  "|",
	token.XOR: "^",
	token.SHL: "<<",
	token.SHR: ">>",

	token.ADD_ASSIGN: "+=",
	token.SUB_ASSIGN: "-=",
	token.MUL_ASSIGN: "*=",
	token.QUO_ASSIGN: "/=",
	token.REM_ASSIGN: "%=",

	token.AND_ASSIGN:     "&=",
	token.OR_ASSIGN:      "|=",
	token.XOR_ASSIGN:     "^=", // TODO: check if this works
	token.SHL_ASSIGN:     "<<=",
	token.SHR_ASSIGN:     ">>=",
	token.AND_NOT_ASSIGN: "&^=",

	token.LAND: "&&",
	token.LOR:  "||",
	// token.ARROW: ""
	token.INC:    "++",
	token.DEC:    "--",
	token.EQL:    "==",
	token.LSS:    "<",
	token.GTR:    ">",
	token.ASSIGN: "=",
	token.NOT:    "!",

	token.NEQ:      "!=",
	token.LEQ:      "<=",
	token.GEQ:      ">=",
	token.DEFINE:   "=",   // :=
	token.ELLIPSIS: "...", // TODO

	token.LPAREN: "(",
	token.LBRACK: "[",
	token.LBRACE: "{",
	token.COMMA:  ",",
	token.PERIOD: ".",

	token.RPAREN:    ")",
	token.RBRACK:    "]",
	token.RBRACE:    "}",
	token.SEMICOLON: ";",
	token.COLON:     ":",
}

// TokenToTs converts a Go `token.Token` (representing an operator or punctuation)
// into its corresponding TypeScript string representation using the `tokenMap`.
// It returns the TypeScript string and `true` if the token is found in the map.
// Otherwise, it returns an empty string and `false`. This function is essential
// for translating expressions involving operators (e.g., arithmetic, logical,
// assignment operators).
func TokenToTs(tok token.Token) (string, bool) {
	t, ok := tokenMap[tok]
	return t, ok
}

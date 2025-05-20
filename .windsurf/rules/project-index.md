---
trigger: always_on
---

The following is an overview of the functions within the `compiler` package.

## analysis.go
- `NewAnalysis`
- `NeedsDefer`
- `IsInAsyncFunction`
- `IsAsyncFunc`
- `IsFuncLitAsync`
- `NeedsBoxed`
- `NeedsBoxedAccess`
- `NeedsBoxedDeref`
- `NeedsBoxedFieldAccess`
- `getOrCreateUsageInfo`
- `Visit`
- `containsAsyncOperations`
- `containsDefer`
- `AnalyzeFile`

## assignment.go
- `writeAssignmentCore`
- `shouldApplyClone`

## code-writer.go
- `NewTSCodeWriter`
- `WriteLinePreamble`
- `WriteLine`
- `WriteLinef`
- `Indent`
- `WriteImport`
- `WriteCommentLine`
- `WriteCommentLinef`
- `WriteCommentInline`
- `WriteCommentInlinef`
- `WriteLiterally`
- `WriteLiterallyf`
- `WriteSectionTail`

## compiler.go
- `NewCompiler`
- `CompilePackages`
- `NewPackageCompiler`
- `Compile`
- `generateIndexFile`
- `CompileFile`
- `NewFileCompiler`
- `Compile`
- `NewGoToTSCompiler`
- `WriteIdent`
- `WriteCaseClause`
- `writeChannelReceiveWithOk`
- `WriteDoc`

## compiler_test.go
- `TestCompliance`

## composite-lit.go
- `WriteCompositeLit`
- `WriteBoxedValue`

## config.go
- `Validate`

## config_test.go
- `TestConfigValidate`
- `TestConfigFields`

## decl.go
- `WriteDecls`
- `WriteFuncDeclAsFunction`
- `WriteFuncDeclAsMethod`

## expr.go
- `WriteIndexExpr`
- `WriteTypeAssertExpr`
- `isPointerComparison`
- `getTypeNameString`
- `WriteBinaryExpr`
- `WriteUnaryExpr`
- `WriteSliceExpr`
- `WriteKeyValueExpr`

## expr-call.go
- `WriteCallExpr`

## expr-selector.go
- `WriteSelectorExpr`

## expr-star.go
- `WriteStarExpr`

## expr-type.go
- `WriteTypeExpr`
- `writeTypeDescription`

## expr-value.go
- `WriteValueExpr`

## field.go
- `WriteFieldList`
- `WriteField`

## lit.go
- `WriteBasicLit`
- `WriteFuncLitValue`

## output.go
- `ComputeModulePath`
- `translateGoPathToTypescriptPath`
- `packageNameFromGoPath`
- `TranslateGoFilePathToTypescriptFilePath`

## primitive.go
- `isPrimitiveType`
- `GoBuiltinToTypescript`
- `TokenToTs`

## spec.go
- `WriteSpec`
- `getEmbeddedFieldKeyName`
- `writeGetterSetter`
- `writeBoxedFieldInitializer`
- `writeClonedFieldInitializer`
- `WriteTypeSpec`
- `WriteInterfaceTypeSpec`
- `WriteImportSpec`

## spec-struct.go
- `WriteStructTypeSpec`
- `generateFlattenedInitTypeString`

## spec-value.go
- `WriteValueSpec`

## stmt.go
- `WriteStmt`
- `WriteStmtDecl`
- `WriteStmtIncDec`
- `WriteStmtBranch`
- `WriteStmtGo`
- `WriteStmtExpr`
- `WriteStmtSend`
- `WriteStmtIf`
- `WriteStmtReturn`
- `WriteStmtBlock`
- `WriteStmtSwitch`
- `WriteStmtDefer`

## stmt-assign.go
- `WriteStmtAssign`

## stmt-for.go
- `WriteStmtFor`
- `WriteStmtForInit`
- `WriteStmtForPost`

## stmt-range.go
- `WriteStmtRange`

## stmt-select.go
- `WriteStmtSelect`

## stmt-type-switch.go
- `WriteStmtTypeSwitch`

## type.go
- `WriteGoType`
- `WriteZeroValueForType`
- `WriteBasicType`
- `WriteNamedType`
- `WritePointerType`
- `WriteSliceType`
- `WriteArrayType`
- `WriteMapType`
- `WriteChannelType`
- `WriteFuncType`
- `WriteInterfaceType`
- `WriteSignatureType`
- `writeInterfaceStructure`
- `getTypeString`
- `WriteStructType`

## type-assert.go
- `writeTypeAssert`

## type-info.go
- `writeTypeInfoObject`
- `writeMethodSignatures`

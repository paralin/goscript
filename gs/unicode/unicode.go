package unicode

import "github.com/aperturerobotics/goscript/compiler"

// Metadata for unicode package functions
// Most unicode functions are synchronous character operations

// Character classification functions
var (
	IsControlInfo = compiler.FunctionInfo{IsAsync: false}
	IsDigitInfo   = compiler.FunctionInfo{IsAsync: false}
	IsGraphicInfo = compiler.FunctionInfo{IsAsync: false}
	IsLetterInfo  = compiler.FunctionInfo{IsAsync: false}
	IsLowerInfo   = compiler.FunctionInfo{IsAsync: false}
	IsMarkInfo    = compiler.FunctionInfo{IsAsync: false}
	IsNumberInfo  = compiler.FunctionInfo{IsAsync: false}
	IsPrintInfo   = compiler.FunctionInfo{IsAsync: false}
	IsPunctInfo   = compiler.FunctionInfo{IsAsync: false}
	IsSpaceInfo   = compiler.FunctionInfo{IsAsync: false}
	IsSymbolInfo  = compiler.FunctionInfo{IsAsync: false}
	IsTitleInfo   = compiler.FunctionInfo{IsAsync: false}
	IsUpperInfo   = compiler.FunctionInfo{IsAsync: false}
)

// Case conversion functions
var (
	ToLowerInfo    = compiler.FunctionInfo{IsAsync: false}
	ToTitleInfo    = compiler.FunctionInfo{IsAsync: false}
	ToUpperInfo    = compiler.FunctionInfo{IsAsync: false}
	SimpleFoldInfo = compiler.FunctionInfo{IsAsync: false}
)

// Category functions
var (
	InInfo      = compiler.FunctionInfo{IsAsync: false}
	IsInfo      = compiler.FunctionInfo{IsAsync: false}
	IsOneOfInfo = compiler.FunctionInfo{IsAsync: false}
)

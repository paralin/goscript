package unicode

import "github.com/aperturerobotics/goscript/compiler"

// Metadata for unicode package functions
// Most unicode functions are synchronous character operations

// Character classification functions
var IsControlInfo = compiler.FunctionInfo{IsAsync: false}
var IsDigitInfo = compiler.FunctionInfo{IsAsync: false}
var IsGraphicInfo = compiler.FunctionInfo{IsAsync: false}
var IsLetterInfo = compiler.FunctionInfo{IsAsync: false}
var IsLowerInfo = compiler.FunctionInfo{IsAsync: false}
var IsMarkInfo = compiler.FunctionInfo{IsAsync: false}
var IsNumberInfo = compiler.FunctionInfo{IsAsync: false}
var IsPrintInfo = compiler.FunctionInfo{IsAsync: false}
var IsPunctInfo = compiler.FunctionInfo{IsAsync: false}
var IsSpaceInfo = compiler.FunctionInfo{IsAsync: false}
var IsSymbolInfo = compiler.FunctionInfo{IsAsync: false}
var IsTitleInfo = compiler.FunctionInfo{IsAsync: false}
var IsUpperInfo = compiler.FunctionInfo{IsAsync: false}

// Case conversion functions
var ToLowerInfo = compiler.FunctionInfo{IsAsync: false}
var ToTitleInfo = compiler.FunctionInfo{IsAsync: false}
var ToUpperInfo = compiler.FunctionInfo{IsAsync: false}
var SimpleFoldInfo = compiler.FunctionInfo{IsAsync: false}

// Category functions
var InInfo = compiler.FunctionInfo{IsAsync: false}
var IsInfo = compiler.FunctionInfo{IsAsync: false}
var IsOneOfInfo = compiler.FunctionInfo{IsAsync: false}

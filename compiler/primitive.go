package compiler

import "go/token"

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

	// TODO: add bigint support
	// "int64": "bigint", // Requires TypeScript target >= ES2020
	"int64": "number",

	// Unsigned Integers
	"uint":   "number",
	"uint8":  "number", // byte is an alias for uint8
	"byte":   "number",
	"uint16": "number",
	"uint32": "number",

	// TODO: add bigint support
	// "uint64": "bigint", // Requires TypeScript target >= ES2020
	"uint64": "number",

	// Floating Point Numbers
	"float32": "number",
	"float64": "number",
}

func isPrimitiveType(name string) bool {
	_, ok := goToTypescriptPrimitives[name]
	return ok
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
	token.ADD:     "+",
	token.SUB:     "-",
	token.MUL:     "*",
	token.QUO:     "/",
	token.REM:     "%",
	token.AND:     "&",
	token.OR:      "|",
	token.XOR:     "^",
	token.SHL:     "<<",
	token.SHR:     ">>",
	token.AND_NOT: "& ~", // &^ operator: bitwise AND NOT

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

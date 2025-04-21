package types

// goToTypescriptPrimitives maps Go primitive types to their TypeScript equivalents.
//
// Assumptions:
//   - Target environment is similar to GOOS=js GOARCH=wasm, where `int` and `uint` are 32 bits.
//   - 32-bit Go integers fit safely within the JS/TypeScript `number` type.
//   - 64-bit integers (`int64`, `uint64`) require TypeScript `bigint` (ES2020+).
//   - Only primitive types are handled here. Composite types (pointers, slices, maps, structs, etc.)
//     are not handled by this mapping.
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

// GoBuiltinToTypescript returns the TypeScript equivalent of a Go primitive type name.
// Returns the TypeScript type and true if found, or an empty string and false otherwise.
//
// Only primitive types listed in goToTypescriptPrimitives are handled.
func GoBuiltinToTypescript(typeName string) (string, bool) {
	val, ok := goToTypescriptPrimitives[typeName]
	return val, ok
}

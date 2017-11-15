package types

// GoBuiltinToTypescript returns the equivilent of the Go primitive in TS, and found true/false
func GoBuiltinToTypescript(typeName string) (string, bool) {
	val, ok := goToTypescriptPrimitives[typeName]
	return val, ok
}

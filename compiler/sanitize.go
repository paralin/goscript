package compiler

// sanitizeIdentifier checks if an identifier is a JavaScript/TypeScript reserved word
// or conflicts with built-in types, and transforms it if needed. This prevents
// compilation errors when Go identifiers conflict with JS/TS keywords or built-ins.
func sanitizeIdentifier(name string) string {
	// Don't sanitize boolean literals - they are valid in both Go and JS/TS
	if name == "true" || name == "false" {
		return name
	}

	// Handle TypeScript built-in types that conflict with Go type parameter names
	builtinTypes := map[string]string{
		"Promise": "PromiseType",
	}

	if replacement, exists := builtinTypes[name]; exists {
		return replacement
	}

	// List of JavaScript/TypeScript reserved words that could conflict
	reservedWords := map[string]bool{
		"abstract":    true,
		"any":         true,
		"as":          true,
		"asserts":     true,
		"async":       true,
		"await":       true,
		"boolean":     true,
		"break":       true,
		"case":        true,
		"catch":       true,
		"class":       true,
		"const":       true,
		"constructor": true,
		"continue":    true,
		"debugger":    true,
		"declare":     true,
		"default":     true,
		"delete":      true,
		"do":          true,
		"else":        true,
		"enum":        true,
		"export":      true,
		"extends":     true,
		"finally":     true,
		"for":         true,
		"from":        true,
		"function":    true,
		"get":         true,
		"if":          true,
		"implements":  true,
		"import":      true,
		"in":          true,
		"instanceof":  true,
		"interface":   true,
		"is":          true,
		"keyof":       true,
		"let":         true,
		"module":      true,
		"namespace":   true,
		"never":       true,
		"new":         true,
		"null":        true,
		"number":      true,
		"object":      true,
		"of":          true,
		"package":     true,
		"private":     true,
		"protected":   true,
		"public":      true,
		"readonly":    true,
		"require":     true,
		"return":      true,
		"set":         true,
		"static":      true,
		"string":      true,
		"super":       true,
		"switch":      true,
		"symbol":      true,
		"this":        true,
		"throw":       true,
		"try":         true,
		"type":        true,
		"typeof":      true,
		"undefined":   true,
		"unique":      true,
		"unknown":     true,
		"var":         true,
		"void":        true,
		"while":       true,
		"with":        true,
		"yield":       true,
	}

	if reservedWords[name] {
		return "_" + name
	}
	return name
}

import * as $ from "@goscript/builtin/index.js";
import { NewSyscallError } from "./error.gs.js";

import * as syscall from "@goscript/syscall/index.js"

// Expand replaces ${var} or $var in the string based on the mapping function.
// For example, [os.ExpandEnv](s) is equivalent to [os.Expand](s, [os.Getenv]).
export function Expand(s: string, mapping: ((p0: string) => string) | null): string {
	let buf: $.Bytes = new Uint8Array(0)
	// ${} is all ASCII, so bytes are fine for this operation.
	let i = 0

	// Encountered invalid syntax; eat the
	// characters.

	// Valid syntax, but $ was not followed by a
	// name. Leave the dollar character untouched.
	for (let j = 0; j < $.len(s); j++) {

		// Encountered invalid syntax; eat the
		// characters.

		// Valid syntax, but $ was not followed by a
		// name. Leave the dollar character untouched.
		if ($.indexString(s, j) == 36 && j + 1 < $.len(s)) {
			if (buf == null) {
				buf = $.makeSlice<number>(0, 2 * $.len(s), 'byte')
			}
			buf = $.append(buf, ...$.stringToBytes($.sliceString(s, i, j)))
			let [name, w] = getShellName($.sliceString(s, j + 1, undefined))

			// Encountered invalid syntax; eat the
			// characters.

			// Valid syntax, but $ was not followed by a
			// name. Leave the dollar character untouched.
			if (name == "" && w > 0) {

			} else if (name == "") {
				// Valid syntax, but $ was not followed by a
				// name. Leave the dollar character untouched.
				buf = $.append(buf, $.indexString(s, j))
			} else {
				buf = $.append(buf, ...$.stringToBytes(mapping!(name)))
			}
			j += w
			i = j + 1
		}
	}
	if (buf == null) {
		return s
	}
	return $.bytesToString(buf) + $.sliceString(s, i, undefined)
}

// ExpandEnv replaces ${var} or $var in the string according to the values
// of the current environment variables. References to undefined
// variables are replaced by the empty string.
export function ExpandEnv(s: string): string {
	return Expand(s, Getenv)
}

// isShellSpecialVar reports whether the character identifies a special
// shell variable such as $*.
export function isShellSpecialVar(c: number): boolean {
	switch (c) {
		case 42:
		case 35:
		case 36:
		case 64:
		case 33:
		case 63:
		case 45:
		case 48:
		case 49:
		case 50:
		case 51:
		case 52:
		case 53:
		case 54:
		case 55:
		case 56:
		case 57:
			return true
			break
	}
	return false
}

// isAlphaNum reports whether the byte is an ASCII letter, number, or underscore.
export function isAlphaNum(c: number): boolean {
	return c == 95 || 48 <= c && c <= 57 || 97 <= c && c <= 122 || 65 <= c && c <= 90
}

// getShellName returns the name that begins the string and the number of bytes
// consumed to extract it. If the name is enclosed in {}, it's part of a ${}
// expansion and two more bytes are needed than the length of the name.
export function getShellName(s: string): [string, number] {

	// Scan to closing brace

	// Bad syntax; eat "${}"

	// Bad syntax; eat "${"
	switch (true) {
		case $.indexString(s, 0) == 123:
			if ($.len(s) > 2 && isShellSpecialVar($.indexString(s, 1)) && $.indexString(s, 2) == 125) {
				return [$.sliceString(s, 1, 2), 3]
			}
			for (let i = 1; i < $.len(s); i++) {

				// Bad syntax; eat "${}"
				if ($.indexString(s, i) == 125) {

					// Bad syntax; eat "${}"
					if (i == 1) {
						return ["", 2]
					}
					return [$.sliceString(s, 1, i), i + 1]
				}
			}
			return ["", 1]
			break
		case isShellSpecialVar($.indexString(s, 0)):
			return [$.sliceString(s, 0, 1), 1]
			break
	}
	// Scan alphanumerics.
	let i: number = 0
	for (i = 0; i < $.len(s) && isAlphaNum($.indexString(s, i)); i++) {
	}
	return [$.sliceString(s, undefined, i), i]
}

// Getenv retrieves the value of the environment variable named by the key.
// It returns the value, which will be empty if the variable is not present.
// To distinguish between an empty value and an unset value, use [LookupEnv].
export function Getenv(key: string): string {
	// testlog.Getenv(key) // Testlog not available in JavaScript
	let [v, ] = syscall.Getenv(key)
	return v
}

// LookupEnv retrieves the value of the environment variable named
// by the key. If the variable is present in the environment the
// value (which may be empty) is returned and the boolean is true.
// Otherwise the returned value will be empty and the boolean will
// be false.
export function LookupEnv(key: string): [string, boolean] {
	// testlog.Getenv(key) // Testlog not available in JavaScript
	return syscall.Getenv(key)
}

// Setenv sets the value of the environment variable named by the key.
// It returns an error, if any.
export function Setenv(key: string, value: string): $.GoError {
	let err = syscall.Setenv(key, value)
	if (err != null) {
		return NewSyscallError("setenv", err)
	}
	return null
}

// Unsetenv unsets a single environment variable.
export function Unsetenv(key: string): $.GoError {
	return syscall.Unsetenv(key)
}

// Clearenv deletes all environment variables.
export function Clearenv(): void {
	syscall.Clearenv()
}

// Environ returns a copy of strings representing the environment,
// in the form "key=value".
export function Environ(): $.Slice<string> {
	return syscall.Environ()
}


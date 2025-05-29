import * as $ from "@goscript/builtin/index.js";

// OS-specific path separator
export let PathSeparator: number = 47

// OS-specific path list separator
export let PathListSeparator: number = 58

// IsPathSeparator reports whether c is a directory separator character.
export function IsPathSeparator(c: number): boolean {
	return 47 == c
}

// splitPath returns the base name and parent directory.
export function splitPath(path: string): [string, string] {
	// if no better parent is found, the path is relative from "here"
	let dirname = "."

	// Remove all but one leading slash.
	for (; $.len(path) > 1 && $.indexString(path, 0) == 47 && $.indexString(path, 1) == 47; ) {
		path = $.sliceString(path, 1, undefined)
	}

	let i = $.len(path) - 1

	// Remove trailing slashes.
	for (; i > 0 && $.indexString(path, i) == 47; i--) {
		path = $.sliceString(path, undefined, i)
	}

	// if no slashes in path, base is path
	let basename = path

	// Remove leading directory path
	for (i--; i >= 0; i--) {
		if ($.indexString(path, i) == 47) {
			if (i == 0) {
				dirname = $.sliceString(path, undefined, 1)
			} else {
				dirname = $.sliceString(path, undefined, i)
			}
			basename = $.sliceString(path, i + 1, undefined)
			break
		}
	}

	return [dirname, basename]
}


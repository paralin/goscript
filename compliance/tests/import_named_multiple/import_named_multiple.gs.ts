// Generated file based on import_named_multiple.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as $ from "@goscript/builtin/builtin.js";

import * as strings from "@goscript/strings/index.js"

import * as foo_bar from "@goscript/strings/index.js"

import * as baz from "@goscript/strings/index.js"

export async function main(): Promise<void> {
	// Test named imports with same package name
	let result1 = foo_bar.ToUpper("hello")
	let result2 = strings.ToLower("WORLD")
	let result3 = baz.Split("a,b,c", ",")

	console.log("foo_bar.ToUpper:", result1)
	console.log("strings.ToLower:", result2)
	console.log("baz.Split length:", $.len(result3))
	console.log("baz.Count:", baz.Count("a,b,c", ","))
	for (let i = 0; i < $.len(result3); i++) {
		const v = result3![i]
		{
			console.log("baz.Split[", i, "]:", v)
		}
	}

	// Test the rest of the "strings" package
	console.log("strings.Count:", strings.Count("a,b,c", ","))
	console.log("strings.Split:", strings.Split("a,b,c", ","))
	console.log("strings.Join:", strings.Join($.arrayToSlice<string>(["a", "b", "c"]), ","))
	console.log("strings.Replace:", strings.Replace("a,b,c", "b", "d", 1))
	console.log("strings.ReplaceAll:", strings.ReplaceAll("a,b,c", "b", "d"))
	console.log("strings.ToLower:", strings.ToLower("HELLO"))
	console.log("strings.ToUpper:", strings.ToUpper("hello"))
	console.log("strings.Trim:", strings.Trim("  hello  ", " "))
	console.log("strings.TrimSpace:", strings.TrimSpace("  hello  "))
	console.log("strings.TrimPrefix:", strings.TrimPrefix("hello", "he"))
	console.log("strings.TrimSuffix:", strings.TrimSuffix("hello", "lo"))
	console.log("strings.TrimLeft:", strings.TrimLeft("hello", "he"))
	console.log("strings.TrimRight:", strings.TrimRight("hello", "lo"))
	console.log("strings.Contains:", strings.Contains("hello", "lo"))
	console.log("strings.ContainsAny:", strings.ContainsAny("hello", "lo"))
	console.log("strings.EqualFold:", strings.EqualFold("hello", "HELLO"))
	console.log("strings.Fields:", strings.Fields("hello world"))
	console.log("strings.FieldsFunc:", strings.FieldsFunc("hello world", (r: number): boolean => {
		return r == 32
	}))
	console.log("strings.HasPrefix:", strings.HasPrefix("hello", "he"))
	console.log("strings.HasSuffix:", strings.HasSuffix("hello", "lo"))
}


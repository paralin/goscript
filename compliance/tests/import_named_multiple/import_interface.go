package main

import (
	"strings"
	foo_bar "strings"

	baz "strings"
)

func main() {
	// Test named imports with same package name
	result1 := foo_bar.ToUpper("hello")
	result2 := strings.ToLower("WORLD")
	result3 := baz.Split("a,b,c", ",")

	println("foo_bar.ToUpper:", result1)
	println("strings.ToLower:", result2)
	println("baz.Split length:", len(result3))
	println("baz.Count:", baz.Count("a,b,c", ","))
	for i, v := range result3 {
		println("baz.Split[", i, "]:", v)
	}

	// Test the rest of the "strings" package
	println("strings.Count:", strings.Count("a,b,c", ","))
	println("strings.Split:", strings.Split("a,b,c", ","))
	println("strings.Join:", strings.Join([]string{"a", "b", "c"}, ","))
	println("strings.Replace:", strings.Replace("a,b,c", "b", "d", 1))
	println("strings.ReplaceAll:", strings.ReplaceAll("a,b,c", "b", "d"))
	println("strings.ToLower:", strings.ToLower("HELLO"))
	println("strings.ToUpper:", strings.ToUpper("hello"))
	println("strings.Trim:", strings.Trim("  hello  ", " "))
	println("strings.TrimSpace:", strings.TrimSpace("  hello  "))
	println("strings.TrimPrefix:", strings.TrimPrefix("hello", "he"))
	println("strings.TrimSuffix:", strings.TrimSuffix("hello", "lo"))
	println("strings.TrimLeft:", strings.TrimLeft("hello", "he"))
	println("strings.TrimRight:", strings.TrimRight("hello", "lo"))
	println("strings.Contains:", strings.Contains("hello", "lo"))
	println("strings.ContainsAny:", strings.ContainsAny("hello", "lo"))
	println("strings.EqualFold:", strings.EqualFold("hello", "HELLO"))
	println("strings.Fields:", strings.Fields("hello world"))
	println("strings.FieldsFunc:", strings.FieldsFunc("hello world", func(r rune) bool {
		return r == ' '
	}))
	println("strings.HasPrefix:", strings.HasPrefix("hello", "he"))
	println("strings.HasSuffix:", strings.HasSuffix("hello", "lo"))
}

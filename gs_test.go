package goscript

import (
	"io/fs"
	"slices"
	"testing"
)

func TestGsOverrides(t *testing.T) {
	ents, err := GsOverrides.ReadDir("gs/builtin")
	if err != nil {
		t.Fatal(err.Error())
	}

	idx := slices.IndexFunc(ents, func(e fs.DirEntry) bool {
		return e.Name() == "builtin.ts"
	})
	if idx == -1 {
		t.FailNow()
	}

	builtinContents, err := fs.ReadFile(GsOverrides, "gs/builtin/builtin.ts")
	if err != nil {
		t.Fatal(err.Error())
	}
	t.Logf("Loaded builtin.ts successfully with %d bytes", len(builtinContents))
}

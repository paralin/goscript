// Generated file based on path_error_constructor.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as $ from "@goscript/builtin/index.js";

import * as fmt from "@goscript/fmt/index.js"

import * as os from "@goscript/os/index.js"

export async function main(): Promise<void> {
	// Test creating a PathError using composite literal syntax
	let err = new os.PathError({Err: fmt.Errorf("not a symlink"), Op: "readlink", Path: "/some/path"})

	console.log(err!.Op)
	console.log(err!.Path)
	console.log(err!.Err!.Error())
}


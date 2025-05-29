import * as $ from "@goscript/builtin/index.js";
import { executable } from "./executable_js.gs.js";

// Executable returns the path name for the executable that started
// the current process. There is no guarantee that the path is still
// pointing to the correct executable. If a symlink was used to start
// the process, depending on the operating system, the result might
// be the symlink or the path it pointed to. If a stable result is
// needed, [path/filepath.EvalSymlinks] might help.
//
// Executable returns an absolute path unless an error occurred.
//
// The main use case is finding resources located relative to an
// executable.
export function Executable(): [string, $.GoError] {
	return executable()
}


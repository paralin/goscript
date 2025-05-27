import * as $ from "@goscript/builtin/builtin.js";
import { ErrUnimplemented } from "./error.gs.js";

import * as syscall from "@goscript/syscall/index.js"

// Stub SysFile for JavaScript environment
class SysFile {
	constructor(init?: any) {}
}

export function open(path: string, flag: number, perm: number): [number, SysFile, $.GoError] {
	let [fd, err] = syscall.Open(path, flag, perm)
	return [fd, new SysFile({}), err]
}


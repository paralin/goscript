import * as $ from "@goscript/builtin/builtin.js";
import { NewSyscallError } from "./error.gs.js";

import * as syscall from "@goscript/syscall/index.js"

export function hostname(): [string, $.GoError] {
	let name: string = ""
	let err: $.GoError = null
	{
		;[name, err] = syscall.Sysctl("kern.hostname")
		if (err != null) {
			return ["", NewSyscallError("sysctl kern.hostname", err)]
		}
		return [name, null]
	}
}


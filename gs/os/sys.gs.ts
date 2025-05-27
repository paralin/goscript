import * as $ from "@goscript/builtin/builtin.js";
import { hostname } from "./sys_js.gs.js";

// Hostname returns the host name reported by the kernel.
export function Hostname(): [string, $.GoError] {
	let name: string = ""
	let err: $.GoError = null
	{
		return hostname()
	}
}


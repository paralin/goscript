import * as $ from "@goscript/builtin/index.js";
import { ErrUnimplemented } from "./error.gs.js";

export function executable(): [string, $.GoError] {
	return ["", ErrUnimplemented]
} 
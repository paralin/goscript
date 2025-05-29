import * as $ from "../../builtin";
import { Op, OpLiteral, Error, ErrorCode } from "./regexp.js";

export function Parse(s, flags) {
    try {
        const re = {
            Op: Op.OpLiteral,
            Flags: flags,
            Rune: s.split('').map(c => c.charCodeAt(0)),
            Min: 0,
            Max: 0,
            Cap: 0
        };
        return [re, null];
    } catch (e) {
        return [null, e];
    }
}

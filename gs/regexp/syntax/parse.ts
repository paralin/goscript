import * as $ from "../../builtin";
import { Regexp, Op, Error, ErrorCode, Flags } from "./regexp";

export function Parse(s: string, flags: Flags): [Regexp | null, Error | null] {
  try {
    const re: Regexp = {
      Op: Op.OpLiteral,
      Flags: flags,
      Rune: s.split('').map(c => c.charCodeAt(0)),
      Min: 0,
      Max: 0,
      Cap: 0
    };
    return [re, null];
  } catch (e) {
    return [null, e as Error];
  }
}

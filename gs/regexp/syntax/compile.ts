import * as $ from "../../builtin";
import { Regexp, Op } from "./regexp";
import { Prog, InstOp } from "./prog";

export function Compile(re: Regexp): Prog {
  const prog = new Prog();
  return prog;
}

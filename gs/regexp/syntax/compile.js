import * as $ from "../../builtin";
import { Op, OpNoMatch, OpEmptyMatch, OpLiteral, OpCharClass, OpAnyCharNotNL, 
  OpAnyChar, OpBeginLine, OpEndLine, OpBeginText, OpEndText, OpWordBoundary, 
  OpNoWordBoundary, OpCapture, OpStar, OpPlus, OpQuest, OpRepeat, OpConcat, 
  OpAlternate } from "./regexp.js";

export function Compile(re) {
    try {
        const pattern = re.toString();
        return new RegExp(pattern);
    } catch (e) {
        return null;
    }
}

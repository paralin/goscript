import * as $ from "../../builtin";

export var Op;
(function (Op) {
    Op[Op["OpNoMatch"] = 0] = "OpNoMatch";
    Op[Op["OpEmptyMatch"] = 1] = "OpEmptyMatch";
    Op[Op["OpLiteral"] = 2] = "OpLiteral";
    Op[Op["OpCharClass"] = 3] = "OpCharClass";
    Op[Op["OpAnyCharNotNL"] = 4] = "OpAnyCharNotNL";
    Op[Op["OpAnyChar"] = 5] = "OpAnyChar";
    Op[Op["OpBeginLine"] = 6] = "OpBeginLine";
    Op[Op["OpEndLine"] = 7] = "OpEndLine";
    Op[Op["OpBeginText"] = 8] = "OpBeginText";
    Op[Op["OpEndText"] = 9] = "OpEndText";
    Op[Op["OpWordBoundary"] = 10] = "OpWordBoundary";
    Op[Op["OpNoWordBoundary"] = 11] = "OpNoWordBoundary";
    Op[Op["OpCapture"] = 12] = "OpCapture";
    Op[Op["OpStar"] = 13] = "OpStar";
    Op[Op["OpPlus"] = 14] = "OpPlus";
    Op[Op["OpQuest"] = 15] = "OpQuest";
    Op[Op["OpRepeat"] = 16] = "OpRepeat";
    Op[Op["OpConcat"] = 17] = "OpConcat";
    Op[Op["OpAlternate"] = 18] = "OpAlternate";
})(Op || (Op = {}));

export const OpNoMatch = Op.OpNoMatch;
export const OpEmptyMatch = Op.OpEmptyMatch;
export const OpLiteral = Op.OpLiteral;
export const OpCharClass = Op.OpCharClass;
export const OpAnyCharNotNL = Op.OpAnyCharNotNL;
export const OpAnyChar = Op.OpAnyChar;
export const OpBeginLine = Op.OpBeginLine;
export const OpEndLine = Op.OpEndLine;
export const OpBeginText = Op.OpBeginText;
export const OpEndText = Op.OpEndText;
export const OpWordBoundary = Op.OpWordBoundary;
export const OpNoWordBoundary = Op.OpNoWordBoundary;
export const OpCapture = Op.OpCapture;
export const OpStar = Op.OpStar;
export const OpPlus = Op.OpPlus;
export const OpQuest = Op.OpQuest;
export const OpRepeat = Op.OpRepeat;
export const OpConcat = Op.OpConcat;
export const OpAlternate = Op.OpAlternate;

export class Error {
    constructor(code, expr) {
        this.Code = code;
        this.Expr = expr;
        this.message = `${code}: ${expr}`;
    }
    
    Error() {
        return this.message;
    }
}

export var ErrorCode;
(function (ErrorCode) {
    ErrorCode[ErrorCode["ErrInternalError"] = 0] = "ErrInternalError";
    ErrorCode[ErrorCode["ErrInvalidCharClass"] = 1] = "ErrInvalidCharClass";
    ErrorCode[ErrorCode["ErrInvalidCharRange"] = 2] = "ErrInvalidCharRange";
    ErrorCode[ErrorCode["ErrInvalidEscape"] = 3] = "ErrInvalidEscape";
    ErrorCode[ErrorCode["ErrInvalidNamedCapture"] = 4] = "ErrInvalidNamedCapture";
    ErrorCode[ErrorCode["ErrInvalidPerlOp"] = 5] = "ErrInvalidPerlOp";
    ErrorCode[ErrorCode["ErrInvalidRepeatOp"] = 6] = "ErrInvalidRepeatOp";
    ErrorCode[ErrorCode["ErrInvalidRepeatSize"] = 7] = "ErrInvalidRepeatSize";
    ErrorCode[ErrorCode["ErrInvalidUTF8"] = 8] = "ErrInvalidUTF8";
    ErrorCode[ErrorCode["ErrLarge"] = 9] = "ErrLarge";
    ErrorCode[ErrorCode["ErrMissingBracket"] = 10] = "ErrMissingBracket";
    ErrorCode[ErrorCode["ErrMissingParen"] = 11] = "ErrMissingParen";
    ErrorCode[ErrorCode["ErrMissingRepeatArgument"] = 12] = "ErrMissingRepeatArgument";
    ErrorCode[ErrorCode["ErrNestingDepth"] = 13] = "ErrNestingDepth";
    ErrorCode[ErrorCode["ErrTrailingBackslash"] = 14] = "ErrTrailingBackslash";
    ErrorCode[ErrorCode["ErrUnexpectedParen"] = 15] = "ErrUnexpectedParen";
})(ErrorCode || (ErrorCode = {}));

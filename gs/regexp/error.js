import * as $ from "../builtin";

export class RegexpError extends Error {
  constructor(message) {
    super(message);
    this.name = "RegexpError";
  }
  
  Error() {
    return this.message;
  }
}

export const ErrInvalidRepeatSize = new RegexpError("invalid repeat size");
export const ErrInvalidUTF8 = new RegexpError("invalid UTF-8");
export const ErrInvalidEscape = new RegexpError("invalid escape sequence");
export const ErrInvalidPerlOp = new RegexpError("invalid perl operator");
export const ErrMissingBracket = new RegexpError("missing closing ]");
export const ErrMissingParen = new RegexpError("missing closing )");
export const ErrMissingBrace = new RegexpError("missing closing }");
export const ErrTrailingBackslash = new RegexpError("trailing backslash at end of expression");
export const ErrInvalidCharRange = new RegexpError("invalid character class range");
export const ErrInvalidCharClass = new RegexpError("invalid character class");
export const ErrInvalidNamedCapture = new RegexpError("invalid named capture");
export const ErrInvalidPerlName = new RegexpError("invalid perl name");
export const ErrInvalidStdName = new RegexpError("invalid std name");
export const ErrMissingRepeatArgument = new RegexpError("missing argument to repetition operator");
export const ErrInvalidRepeatOp = new RegexpError("invalid repetition operator");
export const ErrInvalidStdOp = new RegexpError("invalid std operator");
export const ErrNestingDepth = new RegexpError("expression nests too deeply");
export const ErrLarge = new RegexpError("expression too large");
export const ErrUnexpectedParen = new RegexpError("unexpected )");
export const ErrInternalError = new RegexpError("internal error");

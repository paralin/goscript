import * as $ from "../builtin";

export interface GoError {
  Error(): string;
}

export class RegexpError extends Error implements GoError {
  constructor(message: string);
  Error(): string;
}

export const ErrInvalidRepeatSize: RegexpError;
export const ErrInvalidUTF8: RegexpError;
export const ErrInvalidEscape: RegexpError;
export const ErrInvalidPerlOp: RegexpError;
export const ErrMissingBracket: RegexpError;
export const ErrMissingParen: RegexpError;
export const ErrMissingBrace: RegexpError;
export const ErrTrailingBackslash: RegexpError;
export const ErrInvalidCharRange: RegexpError;
export const ErrInvalidCharClass: RegexpError;
export const ErrInvalidNamedCapture: RegexpError;
export const ErrInvalidPerlName: RegexpError;
export const ErrInvalidStdName: RegexpError;
export const ErrMissingRepeatArgument: RegexpError;
export const ErrInvalidRepeatOp: RegexpError;
export const ErrInvalidStdOp: RegexpError;
export const ErrNestingDepth: RegexpError;
export const ErrLarge: RegexpError;
export const ErrUnexpectedParen: RegexpError;
export const ErrInternalError: RegexpError;

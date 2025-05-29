import * as $ from "../../builtin";

export enum Op {
  OpNoMatch = 0,        // matches no strings
  OpEmptyMatch = 1,     // matches empty string
  OpLiteral = 2,        // matches Runes sequence
  OpCharClass = 3,      // matches Runes interpreted as range pair list
  OpAnyCharNotNL = 4,   // matches any character except newline
  OpAnyChar = 5,        // matches any character
  OpBeginLine = 6,      // matches empty string at beginning of line
  OpEndLine = 7,        // matches empty string at end of line
  OpBeginText = 8,      // matches empty string at beginning of text
  OpEndText = 9,        // matches empty string at end of text
  OpWordBoundary = 10,  // matches word boundary `\b`
  OpNoWordBoundary = 11, // matches word non-boundary `\B`
  OpCapture = 12,       // capturing subexpression with index Cap, optional name Name
  OpStar = 13,          // matches Sub[0] zero or more times
  OpPlus = 14,          // matches Sub[0] one or more times
  OpQuest = 15,         // matches Sub[0] zero or one times
  OpRepeat = 16,        // matches Sub[0] at least Min times, at most Max (Max == -1 is no limit)
  OpConcat = 17,        // matches concatenation of Subs
  OpAlternate = 18      // matches alternation of Subs
}

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

export type EmptyOp = number;

export const EmptyBeginLine: EmptyOp = 1 << 0;
export const EmptyEndLine: EmptyOp = 1 << 1;
export const EmptyBeginText: EmptyOp = 1 << 2;
export const EmptyEndText: EmptyOp = 1 << 3;
export const EmptyWordBoundary: EmptyOp = 1 << 4;
export const EmptyNoWordBoundary: EmptyOp = 1 << 5;

export type Flags = number;

export const NonGreedy: Flags = 1 << 0;
export const PerlX: Flags = 1 << 1;
export const UnicodeGroups: Flags = 1 << 2;
export const WasDollar: Flags = 1 << 3;
export const Simple: Flags = 1 << 4;
export const MatchNL: Flags = 1 << 5;
export const Literal: Flags = 1 << 6;
export const ClassNL: Flags = 1 << 7;
export const OneLine: Flags = 1 << 8;
export const POSIX: Flags = 1 << 9;
export const FoldCase: Flags = 1 << 10;

export const Perl: Flags = PerlX | UnicodeGroups;
export const DotNL: Flags = 0;

export interface Regexp {
  Op: Op;
  Flags: Flags;
  Sub?: Regexp[] | null;
  Sub0?: Regexp[] | null;
  Rune?: number[] | null;
  Rune0?: number[] | null;
  Min: number;
  Max: number;
  Cap: number;
  Name?: string | null;
}

export class Error {
  Code: ErrorCode;
  Expr: string;
  message: string;

  constructor(code: ErrorCode, expr: string) {
    this.Code = code;
    this.Expr = expr;
    this.message = `${code}: ${expr}`;
  }
}

export enum ErrorCode {
  ErrInternalError = 0,
  ErrInvalidCharClass = 1,
  ErrInvalidCharRange = 2,
  ErrInvalidEscape = 3,
  ErrInvalidNamedCapture = 4,
  ErrInvalidPerlOp = 5,
  ErrInvalidRepeatOp = 6,
  ErrInvalidRepeatSize = 7,
  ErrInvalidUTF8 = 8,
  ErrLarge = 9,
  ErrMissingBracket = 10,
  ErrMissingParen = 11,
  ErrMissingRepeatArgument = 12,
  ErrNestingDepth = 13,
  ErrTrailingBackslash = 14,
  ErrUnexpectedParen = 15
}

export const ErrInternalError = ErrorCode.ErrInternalError;
export const ErrInvalidCharClass = ErrorCode.ErrInvalidCharClass;
export const ErrInvalidCharRange = ErrorCode.ErrInvalidCharRange;
export const ErrInvalidEscape = ErrorCode.ErrInvalidEscape;
export const ErrInvalidNamedCapture = ErrorCode.ErrInvalidNamedCapture;
export const ErrInvalidPerlOp = ErrorCode.ErrInvalidPerlOp;
export const ErrInvalidRepeatOp = ErrorCode.ErrInvalidRepeatOp;
export const ErrInvalidRepeatSize = ErrorCode.ErrInvalidRepeatSize;
export const ErrInvalidUTF8 = ErrorCode.ErrInvalidUTF8;
export const ErrLarge = ErrorCode.ErrLarge;
export const ErrMissingBracket = ErrorCode.ErrMissingBracket;
export const ErrMissingParen = ErrorCode.ErrMissingParen;
export const ErrMissingRepeatArgument = ErrorCode.ErrMissingRepeatArgument;
export const ErrNestingDepth = ErrorCode.ErrNestingDepth;
export const ErrTrailingBackslash = ErrorCode.ErrTrailingBackslash;
export const ErrUnexpectedParen = ErrorCode.ErrUnexpectedParen;

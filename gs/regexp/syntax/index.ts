import * as $ from "../../builtin";

export function Compile(re: any): any {
  try {
    const pattern = re.toString();
    return new RegExp(pattern);
  } catch (e) {
    return null;
  }
}

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

  Error(): string {
    return this.message;
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

export type EmptyOp = number;
export const EmptyBeginLine: EmptyOp = 1 << 0;
export const EmptyEndLine: EmptyOp = 1 << 1;
export const EmptyBeginText: EmptyOp = 1 << 2;
export const EmptyEndText: EmptyOp = 1 << 3;
export const EmptyWordBoundary: EmptyOp = 1 << 4;
export const EmptyNoWordBoundary: EmptyOp = 1 << 5;

export enum InstOp {
  InstAlt = 1,
  InstAltMatch = 2,
  InstCapture = 3,
  InstEmptyWidth = 4,
  InstMatch = 5,
  InstFail = 6,
  InstNop = 7,
  InstRune = 8,
  InstRune1 = 9,
  InstRuneAny = 10,
  InstRuneAnyNotNL = 11
}

export const InstAlt = InstOp.InstAlt;
export const InstAltMatch = InstOp.InstAltMatch;
export const InstCapture = InstOp.InstCapture;
export const InstEmptyWidth = InstOp.InstEmptyWidth;
export const InstMatch = InstOp.InstMatch;
export const InstFail = InstOp.InstFail;
export const InstNop = InstOp.InstNop;
export const InstRune = InstOp.InstRune;
export const InstRune1 = InstOp.InstRune1;
export const InstRuneAny = InstOp.InstRuneAny;
export const InstRuneAnyNotNL = InstOp.InstRuneAnyNotNL;

export interface Inst {
  Op: InstOp;
  Out: number;
  Arg: number;
  Rune?: number[] | null;
}

export class Prog {
  Inst: Inst[];
  Start: number;
  NumCap: number;

  constructor() {
    this.Inst = [];
    this.Start = 0;
    this.NumCap = 0;
  }
}

export function IsWordChar(r: number): boolean {
  return (r >= '0'.charCodeAt(0) && r <= '9'.charCodeAt(0)) ||
         (r >= 'A'.charCodeAt(0) && r <= 'Z'.charCodeAt(0)) ||
         (r >= 'a'.charCodeAt(0) && r <= 'z'.charCodeAt(0)) ||
         r === '_'.charCodeAt(0);
}

export function EmptyOpContext(r1: number, r2: number): EmptyOp {
  let op: EmptyOp = 0;
  
  if (r1 < 0) {
    op |= EmptyBeginText | EmptyBeginLine;
  } else if (r1 === '\n'.charCodeAt(0)) {
    op |= EmptyBeginLine;
  }
  
  if (r2 < 0) {
    op |= EmptyEndText | EmptyEndLine;
  } else if (r2 === '\n'.charCodeAt(0)) {
    op |= EmptyEndLine;
  }
  
  const r1IsWord = r1 >= 0 && IsWordChar(r1);
  const r2IsWord = r2 >= 0 && IsWordChar(r2);
  
  if (r1IsWord !== r2IsWord) {
    op |= EmptyWordBoundary;
  } else {
    op |= EmptyNoWordBoundary;
  }
  
  return op;
}

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

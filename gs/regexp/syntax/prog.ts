import * as $ from "../../builtin";
import { EmptyOp, EmptyBeginLine, EmptyEndLine, EmptyBeginText, EmptyEndText, EmptyWordBoundary, EmptyNoWordBoundary } from "./index";


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

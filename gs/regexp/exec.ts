import * as $ from "@goscript/builtin";
import * as syntax from "./syntax";

export class lazyFlag {
  private _r: number;
  private _r1: number;
  private _flag: number;
  private _computed: boolean;

  constructor(r: number = 0, r1: number = 0) {
    this._r = r;
    this._r1 = r1;
    this._flag = 0;
    this._computed = false;
  }

  public match(op: number): boolean {
    if (!this._computed) {
      this._compute();
    }
    return (this._flag & op) !== 0;
  }

  private _compute() {
    let flag = 0;
    
    const EmptyBeginText = 1;
    const EmptyEndText = 2;
    const EmptyBeginLine = 4;
    const EmptyEndLine = 8;
    const EmptyWordBoundary = 16;
    const EmptyNoWordBoundary = 32;
    
    if (this._r < 0) {
      flag |= EmptyBeginText;
    } else if (this._r === '\n'.charCodeAt(0)) {
      flag |= EmptyBeginLine;
    }
    
    if (this._r1 < 0) {
      flag |= EmptyEndText;
    } else if (this._r1 === '\n'.charCodeAt(0)) {
      flag |= EmptyEndLine;
    }
    
    const isWordChar = (r: number): boolean => {
      return (r >= 'a'.charCodeAt(0) && r <= 'z'.charCodeAt(0)) || 
             (r >= 'A'.charCodeAt(0) && r <= 'Z'.charCodeAt(0)) || 
             (r >= '0'.charCodeAt(0) && r <= '9'.charCodeAt(0)) || 
             r === '_'.charCodeAt(0);
    };
    
    const rIsWord = isWordChar(this._r);
    const r1IsWord = isWordChar(this._r1);
    
    if (rIsWord && !r1IsWord) {
      flag |= EmptyWordBoundary;
    } else if (!rIsWord && r1IsWord) {
      flag |= EmptyWordBoundary;
    }
    
    if (!(flag & EmptyWordBoundary)) {
      flag |= EmptyNoWordBoundary;
    }
    
    this._flag = flag;
    this._computed = true;
  }
}

export function newLazyFlag(r: number, r1: number): lazyFlag {
  return new lazyFlag(r, r1);
}

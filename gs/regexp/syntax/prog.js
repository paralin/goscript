import * as $ from "../../builtin";

export var InstOp;
(function (InstOp) {
    InstOp[InstOp["InstAlt"] = 1] = "InstAlt";
    InstOp[InstOp["InstAltMatch"] = 2] = "InstAltMatch";
    InstOp[InstOp["InstCapture"] = 3] = "InstCapture";
    InstOp[InstOp["InstEmptyWidth"] = 4] = "InstEmptyWidth";
    InstOp[InstOp["InstMatch"] = 5] = "InstMatch";
    InstOp[InstOp["InstFail"] = 6] = "InstFail";
    InstOp[InstOp["InstNop"] = 7] = "InstNop";
    InstOp[InstOp["InstRune"] = 8] = "InstRune";
    InstOp[InstOp["InstRune1"] = 9] = "InstRune1";
    InstOp[InstOp["InstRuneAny"] = 10] = "InstRuneAny";
    InstOp[InstOp["InstRuneAnyNotNL"] = 11] = "InstRuneAnyNotNL";
})(InstOp || (InstOp = {}));

export const Inst = {
    Op: 0,
    Out: 0,
    Arg: 0,
    Rune: null
};

export class Prog {
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

export function IsWordChar(r) {
    return (r >= '0'.charCodeAt(0) && r <= '9'.charCodeAt(0)) ||
        (r >= 'A'.charCodeAt(0) && r <= 'Z'.charCodeAt(0)) ||
        (r >= 'a'.charCodeAt(0) && r <= 'z'.charCodeAt(0)) ||
        r === '_'.charCodeAt(0);
}

export function EmptyOpContext(r1, r2) {
    const EmptyBeginLine = 1 << 0;
    const EmptyEndLine = 1 << 1;
    const EmptyBeginText = 1 << 2;
    const EmptyEndText = 1 << 3;
    const EmptyWordBoundary = 1 << 4;
    const EmptyNoWordBoundary = 1 << 5;
    
    let op = 0;
    
    if (r1 < 0) {
        op |= EmptyBeginText | EmptyBeginLine;
    }
    else if (r1 === '\n'.charCodeAt(0)) {
        op |= EmptyBeginLine;
    }
    
    if (r2 < 0) {
        op |= EmptyEndText | EmptyEndLine;
    }
    else if (r2 === '\n'.charCodeAt(0)) {
        op |= EmptyEndLine;
    }
    
    const r1IsWord = r1 >= 0 && IsWordChar(r1);
    const r2IsWord = r2 >= 0 && IsWordChar(r2);
    
    if (r1IsWord !== r2IsWord) {
        op |= EmptyWordBoundary;
    }
    else {
        op |= EmptyNoWordBoundary;
    }
    
    return op;
}

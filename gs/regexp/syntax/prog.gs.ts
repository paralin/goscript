import * as $ from "@goscript/builtin/builtin.js";

import * as strconv from "@goscript/strconv/index.js"

import * as strings from "@goscript/strings/index.js"

import * as unicode from "@goscript/unicode/index.js"

import * as utf8 from "@goscript/unicode/utf8/index.js"

export class Prog {
	public get Inst(): $.Slice<Inst> {
		return this._fields.Inst.value
	}
	public set Inst(value: $.Slice<Inst>) {
		this._fields.Inst.value = value
	}

	// index of start instruction
	public get Start(): number {
		return this._fields.Start.value
	}
	public set Start(value: number) {
		this._fields.Start.value = value
	}

	// number of InstCapture insts in re
	public get NumCap(): number {
		return this._fields.NumCap.value
	}
	public set NumCap(value: number) {
		this._fields.NumCap.value = value
	}

	public _fields: {
		Inst: $.VarRef<$.Slice<Inst>>;
		Start: $.VarRef<number>;
		NumCap: $.VarRef<number>;
	}

	constructor(init?: Partial<{Inst?: $.Slice<Inst>, NumCap?: number, Start?: number}>) {
		this._fields = {
			Inst: $.varRef(init?.Inst ?? null),
			Start: $.varRef(init?.Start ?? 0),
			NumCap: $.varRef(init?.NumCap ?? 0)
		}
	}

	public clone(): Prog {
		const cloned = new Prog()
		cloned._fields = {
			Inst: $.varRef(this._fields.Inst.value),
			Start: $.varRef(this._fields.Start.value),
			NumCap: $.varRef(this._fields.NumCap.value)
		}
		return cloned
	}

	public String(): string {
		const p = this
		let b: strings.Builder = new strings.Builder()
		dumpProg(b, p)
		return b.String()
	}

	// skipNop follows any no-op or capturing instructions.
	public skipNop(pc: number): Inst | null {
		const p = this
		let i = p.Inst![pc]
		for (; i.Op == 6 || i.Op == 2; ) {
			i = p.Inst![i.Out]
		}
		return i
	}

	// Prefix returns a literal string that all matches for the
	// regexp must start with. Complete is true if the prefix
	// is the entire match.
	public Prefix(): [string, boolean] {
		const p = this
		let i = p.skipNop((p.Start as number))
		if (i.op() != 7 || $.len(i.Rune) != 1) {
			return ["", i.Op == 4]
		}
		let buf: strings.Builder = new strings.Builder()
		for (; i.op() == 7 && $.len(i.Rune) == 1 && ((i.Arg as Flags) & 1) == 0 && i.Rune![0] != utf8.RuneError; ) {
			buf.WriteRune(i.Rune![0])
			i = p.skipNop(i.Out)
		}
		return [buf.String(), i.Op == 4]
	}

	// StartCond returns the leading empty-width conditions that must
	// be true in any match. It returns ^EmptyOp(0) if no matches are possible.
	public StartCond(): EmptyOp {
		const p = this
		let flag: EmptyOp = 0
		let pc = (p.Start as number)
		let i = p.Inst![pc]
		Loop: for (; ; ) {

			// skip
			switch (i.Op) {
				case 3:
					flag |= (i.Arg as EmptyOp)
					break
				case 5:
					return ~(0 as EmptyOp)
					break
				case 2:
				case 6:
					break
				default:
					break
					break
			}
			pc = i.Out
			i = p.Inst![pc]
		}
		return flag
	}

	// Register this type with the runtime type system
	static __typeInfo = $.registerStructType(
	  'Prog',
	  new Prog(),
	  [{ name: "String", args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: "string" } }] }, { name: "skipNop", args: [{ name: "pc", type: { kind: $.TypeKind.Basic, name: "number" } }], returns: [{ type: { kind: $.TypeKind.Pointer, elemType: "Inst" } }] }, { name: "Prefix", args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: "string" } }, { type: { kind: $.TypeKind.Basic, name: "boolean" } }] }, { name: "StartCond", args: [], returns: [{ type: "EmptyOp" }] }],
	  Prog,
	  {"Inst": { kind: $.TypeKind.Slice, elemType: "Inst" }, "Start": { kind: $.TypeKind.Basic, name: "number" }, "NumCap": { kind: $.TypeKind.Basic, name: "number" }}
	);
}

export class InstOp {
	constructor(private _value: number) {}

	valueOf(): number {
		return this._value
	}

	toString(): string {
		return String(this._value)
	}

	static from(value: number): InstOp {
		return new InstOp(value)
	}

	public String(): string {
		const i = this._value
		if ((i as number) >= ($.len(instOpNames) as number)) {
			return ""
		}
		return instOpNames![i]
	}
}

export let InstAlt: InstOp = 0

export let InstAltMatch: InstOp = new InstOp(0)

export let InstCapture: InstOp = new InstOp(0)

export let InstEmptyWidth: InstOp = new InstOp(0)

export let InstMatch: InstOp = new InstOp(0)

export let InstFail: InstOp = new InstOp(0)

export let InstNop: InstOp = new InstOp(0)

export let InstRune: InstOp = new InstOp(0)

export let InstRune1: InstOp = new InstOp(0)

export let InstRuneAny: InstOp = new InstOp(0)

export let InstRuneAnyNotNL: InstOp = new InstOp(0)

let instOpNames = $.arrayToSlice<string>(["InstAlt", "InstAltMatch", "InstCapture", "InstEmptyWidth", "InstMatch", "InstFail", "InstNop", "InstRune", "InstRune1", "InstRuneAny", "InstRuneAnyNotNL"])

export type EmptyOp = number;

export let EmptyBeginLine: EmptyOp = (1 << 0)

export let EmptyEndLine: EmptyOp = 0

export let EmptyBeginText: EmptyOp = 0

export let EmptyEndText: EmptyOp = 0

export let EmptyWordBoundary: EmptyOp = 0

export let EmptyNoWordBoundary: EmptyOp = 0

// EmptyOpContext returns the zero-width assertions
// satisfied at the position between the runes r1 and r2.
// Passing r1 == -1 indicates that the position is
// at the beginning of the text.
// Passing r2 == -1 indicates that the position is
// at the end of the text.
export function EmptyOpContext(r1: number, r2: number): EmptyOp {
	let op: EmptyOp = 32
	let boundary: number = 0
	switch (true) {
		case IsWordChar(r1):
			boundary = 1
			break
		case r1 == 10:
			op |= 1
			break
		case r1 < 0:
			op |= (4 | 1)
			break
	}
	switch (true) {
		case IsWordChar(r2):
			boundary ^= 1
			break
		case r2 == 10:
			op |= 2
			break
		case r2 < 0:
			op |= (8 | 2)
			break
	}
	// IsWordChar(r1) != IsWordChar(r2)
	if (boundary != 0) {
		// IsWordChar(r1) != IsWordChar(r2)
		op ^= ((16 | 32))
	}
	return op
}

// IsWordChar reports whether r is considered a “word character”
// during the evaluation of the \b and \B zero-width assertions.
// These assertions are ASCII-only: the word characters are [A-Za-z0-9_].
export function IsWordChar(r: number): boolean {
	// Test for lowercase letters first, as these occur more
	// frequently than uppercase letters in common cases.
	return 97 <= r && r <= 122 || 65 <= r && r <= 90 || 48 <= r && r <= 57 || r == 95
}

export class Inst {
	public get Op(): InstOp {
		return this._fields.Op.value
	}
	public set Op(value: InstOp) {
		this._fields.Op.value = value
	}

	// all but InstMatch, InstFail
	public get Out(): number {
		return this._fields.Out.value
	}
	public set Out(value: number) {
		this._fields.Out.value = value
	}

	// InstAlt, InstAltMatch, InstCapture, InstEmptyWidth
	public get Arg(): number {
		return this._fields.Arg.value
	}
	public set Arg(value: number) {
		this._fields.Arg.value = value
	}

	public get Rune(): $.Slice<number> {
		return this._fields.Rune.value
	}
	public set Rune(value: $.Slice<number>) {
		this._fields.Rune.value = value
	}

	public _fields: {
		Op: $.VarRef<InstOp>;
		Out: $.VarRef<number>;
		Arg: $.VarRef<number>;
		Rune: $.VarRef<$.Slice<number>>;
	}

	constructor(init?: Partial<{Arg?: number, Op?: InstOp, Out?: number, Rune?: $.Slice<number>}>) {
		this._fields = {
			Op: $.varRef(init?.Op ?? 0),
			Out: $.varRef(init?.Out ?? 0),
			Arg: $.varRef(init?.Arg ?? 0),
			Rune: $.varRef(init?.Rune ?? null)
		}
	}

	public clone(): Inst {
		const cloned = new Inst()
		cloned._fields = {
			Op: $.varRef(this._fields.Op.value),
			Out: $.varRef(this._fields.Out.value),
			Arg: $.varRef(this._fields.Arg.value),
			Rune: $.varRef(this._fields.Rune.value)
		}
		return cloned
	}

	// op returns i.Op but merges all the Rune special cases into InstRune
	public op(): InstOp {
		const i = this
		let op = i.Op
		switch (op) {
			case 8:
			case 9:
			case 10:
				op = 7
				break
		}
		return op
	}

	// MatchRune reports whether the instruction matches (and consumes) r.
	// It should only be called when i.Op == [InstRune].
	public MatchRune(r: number): boolean {
		const i = this
		return i.MatchRunePos(r) != -1
	}

	// MatchRunePos checks whether the instruction matches (and consumes) r.
	// If so, MatchRunePos returns the index of the matching rune pair
	// (or, when len(i.Rune) == 1, rune singleton).
	// If not, MatchRunePos returns -1.
	// MatchRunePos should only be called when i.Op == [InstRune].
	public MatchRunePos(r: number): number {
		const i = this
		let rune = i.Rune
		switch ($.len(rune)) {
			case 0:
				return -1
				break
			case 1:
				let r0 = rune![0]
				if (r == r0) {
					return 0
				}
				if (((i.Arg as Flags) & 1) != 0) {
					for (let r1 = unicode.SimpleFold(r0); r1 != r0; r1 = unicode.SimpleFold(r1)) {
						if (r == r1) {
							return 0
						}
					}
				}
				return -1
				break
			case 2:
				if (r >= rune![0] && r <= rune![1]) {
					return 0
				}
				return -1
				break
			case 4:
			case 6:
			case 8:
				for (let j = 0; j < $.len(rune); j += 2) {
					if (r < rune![j]) {
						return -1
					}
					if (r <= rune![j + 1]) {
						return j / 2
					}
				}
				return -1
				break
		}
		let lo = 0
		let hi = $.len(rune) / 2
		for (; lo < hi; ) {
			let m = $.int(((lo + hi as number) >> 1))
			{
				let c = rune![2 * m]
				if (c <= r) {
					if (r <= rune![2 * m + 1]) {
						return m
					}
					lo = m + 1
				} else {
					hi = m
				}
			}
		}
		return -1
	}

	// MatchEmptyWidth reports whether the instruction matches
	// an empty string between the runes before and after.
	// It should only be called when i.Op == [InstEmptyWidth].
	public MatchEmptyWidth(before: number, after: number): boolean {
		const i = this
		switch ((i.Arg as EmptyOp)) {
			case 1:
				return before == 10 || before == -1
				break
			case 2:
				return after == 10 || after == -1
				break
			case 4:
				return before == -1
				break
			case 8:
				return after == -1
				break
			case 16:
				return IsWordChar(before) != IsWordChar(after)
				break
			case 32:
				return IsWordChar(before) == IsWordChar(after)
				break
		}
		$.panic("unknown empty width arg")
	}

	public String(): string {
		const i = this
		let b: strings.Builder = new strings.Builder()
		dumpInst(b, i)
		return b.String()
	}

	// Register this type with the runtime type system
	static __typeInfo = $.registerStructType(
	  'Inst',
	  new Inst(),
	  [{ name: "op", args: [], returns: [{ type: "InstOp" }] }, { name: "MatchRune", args: [{ name: "r", type: { kind: $.TypeKind.Basic, name: "number" } }], returns: [{ type: { kind: $.TypeKind.Basic, name: "boolean" } }] }, { name: "MatchRunePos", args: [{ name: "r", type: { kind: $.TypeKind.Basic, name: "number" } }], returns: [{ type: { kind: $.TypeKind.Basic, name: "number" } }] }, { name: "MatchEmptyWidth", args: [{ name: "before", type: { kind: $.TypeKind.Basic, name: "number" } }, { name: "after", type: { kind: $.TypeKind.Basic, name: "number" } }], returns: [{ type: { kind: $.TypeKind.Basic, name: "boolean" } }] }, { name: "String", args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: "string" } }] }],
	  Inst,
	  {"Op": "InstOp", "Out": { kind: $.TypeKind.Basic, name: "number" }, "Arg": { kind: $.TypeKind.Basic, name: "number" }, "Rune": { kind: $.TypeKind.Slice, elemType: { kind: $.TypeKind.Basic, name: "number" } }}
	);
}

let noMatch: number = -1

export function bw(b: strings.Builder | null, ...args: string[]): void {
	for (let _i = 0; _i < $.len(args); _i++) {
		const s = args![_i]
		{
			b.WriteString(s)
		}
	}
}

export function dumpProg(b: strings.Builder | null, p: Prog | null): void {
	for (let j = 0; j < $.len(p.Inst); j++) {
		{
			let i = p.Inst![j]
			let pc = strconv.Itoa(j)
			if ($.len(pc) < 3) {
				b.WriteString($.sliceString("   ", $.len(pc), undefined))
			}
			if (j == p.Start) {
				pc += "*"
			}
			bw(b, pc, "\t")
			dumpInst(b, i)
			bw(b, "\n")
		}
	}
}

export function u32(i: number): string {
	return strconv.FormatUint((i as number), 10)
}

export function dumpInst(b: strings.Builder | null, i: Inst | null): void {

	// shouldn't happen
	switch (i.Op) {
		case 0:
			bw(b, "alt -> ", u32(i.Out), ", ", u32(i.Arg))
			break
		case 1:
			bw(b, "altmatch -> ", u32(i.Out), ", ", u32(i.Arg))
			break
		case 2:
			bw(b, "cap ", u32(i.Arg), " -> ", u32(i.Out))
			break
		case 3:
			bw(b, "empty ", u32(i.Arg), " -> ", u32(i.Out))
			break
		case 4:
			bw(b, "match")
			break
		case 5:
			bw(b, "fail")
			break
		case 6:
			bw(b, "nop -> ", u32(i.Out))
			break
		case 7:
			if (i.Rune == null) {
				// shouldn't happen
				bw(b, "rune <nil>")
			}
			bw(b, "rune ", strconv.QuoteToASCII($.runesToString(i.Rune)))
			if (((i.Arg as Flags) & 1) != 0) {
				bw(b, "/i")
			}
			bw(b, " -> ", u32(i.Out))
			break
		case 8:
			bw(b, "rune1 ", strconv.QuoteToASCII($.runesToString(i.Rune)), " -> ", u32(i.Out))
			break
		case 9:
			bw(b, "any -> ", u32(i.Out))
			break
		case 10:
			bw(b, "anynotnl -> ", u32(i.Out))
			break
	}
}


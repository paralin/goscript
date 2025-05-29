import * as $ from "@goscript/builtin/builtin.js";

import * as sort from "@goscript/sort/index.js"

import * as strings from "@goscript/strings/index.js"

import * as unicode from "@goscript/unicode/index.js"

import * as utf8 from "@goscript/unicode/utf8/index.js"

export class Error {
	public get Code(): ErrorCode {
		return this._fields.Code.value
	}
	public set Code(value: ErrorCode) {
		this._fields.Code.value = value
	}

	public get Expr(): string {
		return this._fields.Expr.value
	}
	public set Expr(value: string) {
		this._fields.Expr.value = value
	}

	public _fields: {
		Code: $.VarRef<ErrorCode>;
		Expr: $.VarRef<string>;
	}

	constructor(init?: Partial<{Code?: ErrorCode, Expr?: string}>) {
		this._fields = {
			Code: $.varRef(init?.Code ?? ""),
			Expr: $.varRef(init?.Expr ?? "")
		}
	}

	public clone(): Error {
		const cloned = new Error()
		cloned._fields = {
			Code: $.varRef(this._fields.Code.value),
			Expr: $.varRef(this._fields.Expr.value)
		}
		return cloned
	}

	public Error(): string {
		const e = this
		return "error parsing regexp: " + e.Code.String() + ": `" + e.Expr + "`"
	}

	// Register this type with the runtime type system
	static __typeInfo = $.registerStructType(
	  'Error',
	  new Error(),
	  [{ name: "Error", args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: "string" } }] }],
	  Error,
	  {"Code": "ErrorCode", "Expr": { kind: $.TypeKind.Basic, name: "string" }}
	);
}

export class ErrorCode {
	constructor(private _value: string) {}

	valueOf(): string {
		return this._value
	}

	toString(): string {
		return String(this._value)
	}

	static from(value: string): ErrorCode {
		return new ErrorCode(value)
	}

	public String(): string {
		const e = this._value
		return e
	}
}

// Unexpected error
export let ErrInternalError: ErrorCode = new ErrorCode("regexp/syntax: internal error")

// Parse errors
export let ErrInvalidCharClass: ErrorCode = new ErrorCode("invalid character class")

export let ErrInvalidCharRange: ErrorCode = new ErrorCode("invalid character class range")

export let ErrInvalidEscape: ErrorCode = new ErrorCode("invalid escape sequence")

export let ErrInvalidNamedCapture: ErrorCode = new ErrorCode("invalid named capture")

export let ErrInvalidPerlOp: ErrorCode = new ErrorCode("invalid or unsupported Perl syntax")

export let ErrInvalidRepeatOp: ErrorCode = new ErrorCode("invalid nested repetition operator")

export let ErrInvalidRepeatSize: ErrorCode = new ErrorCode("invalid repeat count")

export let ErrInvalidUTF8: ErrorCode = new ErrorCode("invalid UTF-8")

export let ErrMissingBracket: ErrorCode = new ErrorCode("missing closing ]")

export let ErrMissingParen: ErrorCode = new ErrorCode("missing closing )")

export let ErrMissingRepeatArgument: ErrorCode = new ErrorCode("missing argument to repetition operator")

export let ErrTrailingBackslash: ErrorCode = new ErrorCode("trailing backslash at end of expression")

export let ErrUnexpectedParen: ErrorCode = new ErrorCode("unexpected )")

export let ErrNestingDepth: ErrorCode = new ErrorCode("expression nests too deeply")

export let ErrLarge: ErrorCode = new ErrorCode("expression too large")

export type Flags = number;

// case-insensitive match
export let FoldCase: Flags = (1 << 0)

// treat pattern as literal string
export let Literal: Flags = 0

// allow character classes like [^a-z] and [[:space:]] to match newline
export let ClassNL: Flags = 0

// allow . to match newline
export let DotNL: Flags = 0

// treat ^ and $ as only matching at beginning and end of text
export let OneLine: Flags = 0

// make repetition operators default to non-greedy
export let NonGreedy: Flags = 0

// allow Perl extensions
export let PerlX: Flags = 0

// allow \p{Han}, \P{Han} for Unicode group and negation
export let UnicodeGroups: Flags = 0

// regexp OpEndText was $, not \z
export let WasDollar: Flags = 0

// regexp contains no counted repetition
export let Simple: Flags = 0

export let MatchNL: Flags = (4 | 8)

// as close to Perl as possible
export let Perl: Flags = (((4 | 16) | 64) | 128)

// POSIX syntax
export let POSIX: Flags = 0

let opLeftParen: Op = 128 + 0

let opVerticalBar: Op = new Op(0)

let maxHeight: number = 1000

let maxSize: number = (128 << 20) / 40

// byte, 2 uint32, slice is 5 64-bit words
let instSize: number = 5 * 8

let maxRunes: number = (128 << 20) / 4

// rune is int32
let runeSize: number = 4

class parser {
	// parse mode flags
	public get flags(): Flags {
		return this._fields.flags.value
	}
	public set flags(value: Flags) {
		this._fields.flags.value = value
	}

	// stack of parsed expressions
	public get stack(): $.Slice<Regexp | null> {
		return this._fields.stack.value
	}
	public set stack(value: $.Slice<Regexp | null>) {
		this._fields.stack.value = value
	}

	public get free(): Regexp | null {
		return this._fields.free.value
	}
	public set free(value: Regexp | null) {
		this._fields.free.value = value
	}

	// number of capturing groups seen
	public get numCap(): number {
		return this._fields.numCap.value
	}
	public set numCap(value: number) {
		this._fields.numCap.value = value
	}

	public get wholeRegexp(): string {
		return this._fields.wholeRegexp.value
	}
	public set wholeRegexp(value: string) {
		this._fields.wholeRegexp.value = value
	}

	// temporary char class work space
	public get tmpClass(): $.Slice<number> {
		return this._fields.tmpClass.value
	}
	public set tmpClass(value: $.Slice<number>) {
		this._fields.tmpClass.value = value
	}

	// number of regexps allocated
	public get numRegexp(): number {
		return this._fields.numRegexp.value
	}
	public set numRegexp(value: number) {
		this._fields.numRegexp.value = value
	}

	// number of runes in char classes
	public get numRunes(): number {
		return this._fields.numRunes.value
	}
	public set numRunes(value: number) {
		this._fields.numRunes.value = value
	}

	// product of all repetitions seen
	public get repeats(): number {
		return this._fields.repeats.value
	}
	public set repeats(value: number) {
		this._fields.repeats.value = value
	}

	// regexp height, for height limit check
	public get height(): Map<Regexp | null, number> {
		return this._fields.height.value
	}
	public set height(value: Map<Regexp | null, number>) {
		this._fields.height.value = value
	}

	// regexp compiled size, for size limit check
	public get size(): Map<Regexp | null, number> {
		return this._fields.size.value
	}
	public set size(value: Map<Regexp | null, number>) {
		this._fields.size.value = value
	}

	public _fields: {
		flags: $.VarRef<Flags>;
		stack: $.VarRef<$.Slice<Regexp | null>>;
		free: $.VarRef<Regexp | null>;
		numCap: $.VarRef<number>;
		wholeRegexp: $.VarRef<string>;
		tmpClass: $.VarRef<$.Slice<number>>;
		numRegexp: $.VarRef<number>;
		numRunes: $.VarRef<number>;
		repeats: $.VarRef<number>;
		height: $.VarRef<Map<Regexp | null, number>>;
		size: $.VarRef<Map<Regexp | null, number>>;
	}

	constructor(init?: Partial<{flags?: Flags, free?: Regexp | null, height?: Map<Regexp | null, number>, numCap?: number, numRegexp?: number, numRunes?: number, repeats?: number, size?: Map<Regexp | null, number>, stack?: $.Slice<Regexp | null>, tmpClass?: $.Slice<number>, wholeRegexp?: string}>) {
		this._fields = {
			flags: $.varRef(init?.flags ?? 0),
			stack: $.varRef(init?.stack ?? null),
			free: $.varRef(init?.free ?? null),
			numCap: $.varRef(init?.numCap ?? 0),
			wholeRegexp: $.varRef(init?.wholeRegexp ?? ""),
			tmpClass: $.varRef(init?.tmpClass ?? null),
			numRegexp: $.varRef(init?.numRegexp ?? 0),
			numRunes: $.varRef(init?.numRunes ?? 0),
			repeats: $.varRef(init?.repeats ?? 0),
			height: $.varRef(init?.height ?? null),
			size: $.varRef(init?.size ?? null)
		}
	}

	public clone(): parser {
		const cloned = new parser()
		cloned._fields = {
			flags: $.varRef(this._fields.flags.value),
			stack: $.varRef(this._fields.stack.value),
			free: $.varRef(this._fields.free.value),
			numCap: $.varRef(this._fields.numCap.value),
			wholeRegexp: $.varRef(this._fields.wholeRegexp.value),
			tmpClass: $.varRef(this._fields.tmpClass.value),
			numRegexp: $.varRef(this._fields.numRegexp.value),
			numRunes: $.varRef(this._fields.numRunes.value),
			repeats: $.varRef(this._fields.repeats.value),
			height: $.varRef(this._fields.height.value),
			size: $.varRef(this._fields.size.value)
		}
		return cloned
	}

	public newRegexp(op: Op): Regexp | null {
		const p = this
		let re = p.free
		if (re != null) {
			p.free = re!.Sub0![0]
			re!.value = new Regexp({})
		} else {
			re = new Regexp()
			p.numRegexp++
		}
		re!.Op = op
		return re
	}

	public reuse(re: Regexp | null): void {
		const p = this
		if (p.height != null) {
			$.deleteMapEntry(p.height, re)
		}
		re!.Sub0![0] = p.free
		p.free = re
	}

	public checkLimits(re: Regexp | null): void {
		const p = this
		if (p.numRunes > 33554432) {
			$.panic("expression too large")
		}
		p.checkSize(re)
		p.checkHeight(re)
	}

	public checkSize(re: Regexp | null): void {
		const p = this
		if (p.size == null) {
			// We haven't started tracking size yet.
			// Do a relatively cheap check to see if we need to start.
			// Maintain the product of all the repeats we've seen
			// and don't track if the total number of regexp nodes
			// we've seen times the repeat product is in budget.
			if (p.repeats == 0) {
				p.repeats = 1
			}
			if (re!.Op == 17) {
				let n = re!.Max
				if (n == -1) {
					n = re!.Min
				}
				if (n <= 0) {
					n = 1
				}
				if ((n as number) > 3355443 / p.repeats) {
					p.repeats = 3355443
				} else {
					p.repeats *= (n as number)
				}
			}
			if ((p.numRegexp as number) < 3355443 / p.repeats) {
				return 
			}

			// We need to start tracking size.
			// Make the map and belatedly populate it
			// with info about everything we've constructed so far.
			p.size = $.makeMap<Regexp | null, number>()
			for (let _i = 0; _i < $.len(p.stack); _i++) {
				const re = p.stack![_i]
				{
					p.checkSize(re)
				}
			}
		}
		if (p.calcSize(re, true) > 3355443) {
			$.panic("expression too large")
		}
	}

	public calcSize(re: Regexp | null, force: boolean): number {
		const p = this
		if (!force) {
			{
				let [size, ok] = $.mapGet(p.size, re, 0)
				if (ok) {
					return size
				}
			}
		}
		let size: number = 0
		switch (re!.Op) {
			case 3:
				size = ($.len(re!.Rune) as number)
				break
			case 13:
			case 14:
				size = 2 + p.calcSize(re!.Sub![0], false)
				break
			case 15:
			case 16:
				size = 1 + p.calcSize(re!.Sub![0], false)
				break
			case 18:
				for (let _i = 0; _i < $.len(re!.Sub); _i++) {
					const sub = re!.Sub![_i]
					{
						size += p.calcSize(sub, false)
					}
				}
				break
			case 19:
				for (let _i = 0; _i < $.len(re!.Sub); _i++) {
					const sub = re!.Sub![_i]
					{
						size += p.calcSize(sub, false)
					}
				}
				if ($.len(re!.Sub) > 1) {
					size += ($.len(re!.Sub) as number) - 1
				}
				break
			case 17:
				let sub = p.calcSize(re!.Sub![0], false)
				if (re!.Max == -1) {

					// x*

					// xxx+
					if (re!.Min == 0) {
						size = 2 + sub // x*
					} else {
						size = 1 + (re!.Min as number) * sub // xxx+
					}
					break
				}
				size = (re!.Max as number) * sub + (re!.Max - re!.Min as number)
				break
		}
		size = max(1, size)
		$.mapSet(p.size, re, size)
		return size
	}

	public checkHeight(re: Regexp | null): void {
		const p = this
		if (p.numRegexp < 1000) {
			return 
		}
		if (p.height == null) {
			p.height = $.makeMap<Regexp | null, number>()
			for (let _i = 0; _i < $.len(p.stack); _i++) {
				const re = p.stack![_i]
				{
					p.checkHeight(re)
				}
			}
		}
		if (p.calcHeight(re, true) > 1000) {
			$.panic("expression nests too deeply")
		}
	}

	public calcHeight(re: Regexp | null, force: boolean): number {
		const p = this
		if (!force) {
			{
				let [h, ok] = $.mapGet(p.height, re, 0)
				if (ok) {
					return h
				}
			}
		}
		let h = 1
		for (let _i = 0; _i < $.len(re!.Sub); _i++) {
			const sub = re!.Sub![_i]
			{
				let hsub = p.calcHeight(sub, false)
				if (h < 1 + hsub) {
					h = 1 + hsub
				}
			}
		}
		$.mapSet(p.height, re, h)
		return h
	}

	// push pushes the regexp re onto the parse stack and returns the regexp.
	public push(re: Regexp | null): Regexp | null {
		const p = this
		p.numRunes += $.len(re!.Rune)
		if (re!.Op == 4 && $.len(re!.Rune) == 2 && re!.Rune![0] == re!.Rune![1]) {
			// Single rune.
			if (p.maybeConcat(re!.Rune![0], (p.flags & ~ 1))) {
				return null
			}
			re!.Op = 3
			re!.Rune = $.goSlice(re!.Rune, undefined, 1)
			re!.Flags = (p.flags & ~ 1)
		} else if (re!.Op == 4 && $.len(re!.Rune) == 4 && re!.Rune![0] == re!.Rune![1] && re!.Rune![2] == re!.Rune![3] && unicode.SimpleFold(re!.Rune![0]) == re!.Rune![2] && unicode.SimpleFold(re!.Rune![2]) == re!.Rune![0] || re!.Op == 4 && $.len(re!.Rune) == 2 && re!.Rune![0] + 1 == re!.Rune![1] && unicode.SimpleFold(re!.Rune![0]) == re!.Rune![1] && unicode.SimpleFold(re!.Rune![1]) == re!.Rune![0]) {
			// Case-insensitive rune like [Aa] or [Δδ].
			if (p.maybeConcat(re!.Rune![0], (p.flags | 1))) {
				return null
			}

			// Rewrite as (case-insensitive) literal.
			re!.Op = 3
			re!.Rune = $.goSlice(re!.Rune, undefined, 1)
			re!.Flags = (p.flags | 1)
		} else {
			// Incremental concatenation.
			p.maybeConcat(-1, 0)
		}
		p.stack = $.append(p.stack, re)
		p.checkLimits(re)
		return re
	}

	// maybeConcat implements incremental concatenation
	// of literal runes into string nodes. The parser calls this
	// before each push, so only the top fragment of the stack
	// might need processing. Since this is called before a push,
	// the topmost literal is no longer subject to operators like *
	// (Otherwise ab* would turn into (ab)*.)
	// If r >= 0 and there's a node left over, maybeConcat uses it
	// to push r with the given flags.
	// maybeConcat reports whether r was pushed.
	public maybeConcat(r: number, flags: Flags): boolean {
		const p = this
		let n = $.len(p.stack)
		if (n < 2) {
			return false
		}
		let re1 = p.stack![n - 1]
		let re2 = p.stack![n - 2]
		if (re1!.Op != 3 || re2!.Op != 3 || (re1!.Flags & 1) != (re2!.Flags & 1)) {
			return false
		}
		re2!.Rune = $.append(re2!.Rune, re1!.Rune)
		if (r >= 0) {
			re1!.Rune = $.goSlice(re1!.Rune0, undefined, 1)
			re1!.Rune![0] = r
			re1!.Flags = flags
			return true
		}
		p.stack = $.goSlice(p.stack, undefined, n - 1)
		p.reuse(re1)
		return false
	}

	// literal pushes a literal regexp for the rune r on the stack.
	public literal(r: number): void {
		const p = this
		let re = p.newRegexp(3)
		re!.Flags = p.flags
		if ((p.flags & 1) != 0) {
			r = minFoldRune(r)
		}
		re!.Rune0![0] = r
		re!.Rune = $.goSlice(re!.Rune0, undefined, 1)
		p.push(re)
	}

	// op pushes a regexp with the given op onto the stack
	// and returns that regexp.
	public op(op: Op): Regexp | null {
		const p = this
		let re = p.newRegexp(op)
		re!.Flags = p.flags
		return p.push(re)
	}

	// repeat replaces the top stack element with itself repeated according to op, min, max.
	// before is the regexp suffix starting at the repetition operator.
	// after is the regexp suffix following after the repetition operator.
	// repeat returns an updated 'after' and an error, if any.
	public repeat(op: Op, min: number, max: number, before: string, after: string, lastRepeat: string): [string, $.GoError] {
		const p = this
		let flags = p.flags
		if ((p.flags & 64) != 0) {
			if ($.len(after) > 0 && $.indexString(after, 0) == 63) {
				after = $.sliceString(after, 1, undefined)
				flags ^= 32
			}

			// In Perl it is not allowed to stack repetition operators:
			// a** is a syntax error, not a doubled star, and a++ means
			// something else entirely, which we don't support!
			if (lastRepeat != "") {
				// In Perl it is not allowed to stack repetition operators:
				// a** is a syntax error, not a doubled star, and a++ means
				// something else entirely, which we don't support!
				return ["", new Error({})]
			}
		}
		let n = $.len(p.stack)
		if (n == 0) {
			return ["", new Error({})]
		}
		let sub = p.stack![n - 1]
		if (sub!.Op >= 128) {
			return ["", new Error({})]
		}
		let re = p.newRegexp(op)
		re!.Min = min
		re!.Max = max
		re!.Flags = flags
		re!.Sub = $.goSlice(re!.Sub0, undefined, 1)
		re!.Sub![0] = sub
		p.stack![n - 1] = re
		p.checkLimits(re)
		if (op == 17 && (min >= 2 || max >= 2) && !repeatIsValid(re, 1000)) {
			return ["", new Error({})]
		}
		return [after, null]
	}

	// concat replaces the top of the stack (above the topmost '|' or '(') with its concatenation.
	public concat(): Regexp | null {
		const p = this
		p.maybeConcat(-1, 0)
		let i = $.len(p.stack)
		for (; i > 0 && p.stack![i - 1]!.Op < 128; ) {
			i--
		}
		let subs = $.goSlice(p.stack, i, undefined)
		p.stack = $.goSlice(p.stack, undefined, i)
		if ($.len(subs) == 0) {
			return p.push(p.newRegexp(2))
		}
		return p.push(p.collapse(subs, 18))
	}

	// alternate replaces the top of the stack (above the topmost '(') with its alternation.
	public alternate(): Regexp | null {
		const p = this
		let i = $.len(p.stack)
		for (; i > 0 && p.stack![i - 1]!.Op < 128; ) {
			i--
		}
		let subs = $.goSlice(p.stack, i, undefined)
		p.stack = $.goSlice(p.stack, undefined, i)
		if ($.len(subs) > 0) {
			cleanAlt(subs![$.len(subs) - 1])
		}
		if ($.len(subs) == 0) {
			return p.push(p.newRegexp(1))
		}
		return p.push(p.collapse(subs, 19))
	}

	// collapse returns the result of applying op to sub.
	// If sub contains op nodes, they all get hoisted up
	// so that there is never a concat of a concat or an
	// alternate of an alternate.
	public collapse(subs: $.Slice<Regexp | null>, op: Op): Regexp | null {
		const p = this
		if ($.len(subs) == 1) {
			return subs![0]
		}
		let re = p.newRegexp(op)
		re!.Sub = $.goSlice(re!.Sub0, undefined, 0)
		for (let _i = 0; _i < $.len(subs); _i++) {
			const sub = subs![_i]
			{
				if (sub!.Op == op) {
					re!.Sub = $.append(re!.Sub, sub!.Sub)
					p.reuse(sub)
				} else {
					re!.Sub = $.append(re!.Sub, sub)
				}
			}
		}
		if (op == 19) {
			re!.Sub = p.factor(re!.Sub)
			if ($.len(re!.Sub) == 1) {
				let old = re
				re = re!.Sub![0]
				p.reuse(old)
			}
		}
		return re
	}

	// factor factors common prefixes from the alternation list sub.
	// It returns a replacement list that reuses the same storage and
	// frees (passes to p.reuse) any removed *Regexps.
	//
	// For example,
	//
	//	ABC|ABD|AEF|BCX|BCY
	//
	// simplifies by literal prefix extraction to
	//
	//	A(B(C|D)|EF)|BC(X|Y)
	//
	// which simplifies by character class introduction to
	//
	//	A(B[CD]|EF)|BC[XY]
	public factor(sub: $.Slice<Regexp | null>): $.Slice<Regexp | null> {
		const p = this
		if ($.len(sub) < 2) {
			return sub
		}
		let str: $.Slice<number> = null
		let strflags: Flags = 0
		let start = 0
		let out = $.goSlice(sub, undefined, 0)
		for (let i = 0; i <= $.len(sub); i++) {
			// Invariant: the Regexps that were in sub[0:start] have been
			// used or marked for reuse, and the slice space has been reused
			// for out (len(out) <= start).
			//
			// Invariant: sub[start:i] consists of regexps that all begin
			// with str as modified by strflags.
			let istr: $.Slice<number> = null
			let iflags: Flags = 0

			// Matches at least one rune in current range.
			// Keep going around.
			if (i < $.len(sub)) {
				;[istr, iflags] = p.leadingString(sub![i])

				// Matches at least one rune in current range.
				// Keep going around.
				if (iflags == strflags) {
					let same = 0
					for (; same < $.len(str) && same < $.len(istr) && str![same] == istr![same]; ) {
						same++
					}

					// Matches at least one rune in current range.
					// Keep going around.
					if (same > 0) {
						// Matches at least one rune in current range.
						// Keep going around.
						str = $.goSlice(str, undefined, same)
						continue
					}
				}
			}

			// Found end of a run with common leading literal string:
			// sub[start:i] all begin with str[:len(str)], but sub[i]
			// does not even begin with str[0].
			//
			// Factor out common string and append factored expression to out.

			// Nothing to do - run of length 0.

			// Just one: don't bother factoring.

			// Construct factored form: prefix(suffix1|suffix2|...)

			// recurse
			if (i == start) {

			} else if (i == start + 1) {
				// Just one: don't bother factoring.
				out = $.append(out, sub![start])
			} else {
				// Construct factored form: prefix(suffix1|suffix2|...)
				let prefix = p.newRegexp(3)
				prefix!.Flags = strflags
				prefix!.Rune = $.append($.goSlice(prefix!.Rune, undefined, 0), str)

				for (let j = start; j < i; j++) {
					sub![j] = p.removeLeadingString(sub![j], $.len(str))
					p.checkLimits(sub![j])
				}
				let suffix = p.collapse($.goSlice(sub, start, i), 19) // recurse

				let re = p.newRegexp(18)
				re!.Sub = $.append($.goSlice(re!.Sub, undefined, 0), prefix, suffix)
				out = $.append(out, re)
			}

			// Prepare for next iteration.
			start = i
			str = istr
			strflags = iflags
		}
		sub = out
		start = 0
		out = $.goSlice(sub, undefined, 0)
		let first: Regexp | null = null
		for (let i = 0; i <= $.len(sub); i++) {
			// Invariant: the Regexps that were in sub[0:start] have been
			// used or marked for reuse, and the slice space has been reused
			// for out (len(out) <= start).
			//
			// Invariant: sub[start:i] consists of regexps that all begin with ifirst.
			let ifirst: Regexp | null = null

			// first must be a character class OR a fixed repeat of a character class.
			if (i < $.len(sub)) {
				ifirst = p.leadingRegexp(sub![i])

				// first must be a character class OR a fixed repeat of a character class.
				if (first != null && first!.Equal(ifirst) && (isCharClass(first) || (first!.Op == 17 && first!.Min == first!.Max && isCharClass(first!.Sub![0])))) {
					continue
				}
			}

			// Found end of a run with common leading regexp:
			// sub[start:i] all begin with first but sub[i] does not.
			//
			// Factor out common regexp and append factored expression to out.

			// Nothing to do - run of length 0.

			// Just one: don't bother factoring.

			// Construct factored form: prefix(suffix1|suffix2|...)

			// prefix came from sub[start]

			// recurse
			if (i == start) {

			} else if (i == start + 1) {
				// Just one: don't bother factoring.
				out = $.append(out, sub![start])
			} else {
				// Construct factored form: prefix(suffix1|suffix2|...)
				let prefix = first

				// prefix came from sub[start]
				for (let j = start; j < i; j++) {
					let reuse = j != start // prefix came from sub[start]
					sub![j] = p.removeLeadingRegexp(sub![j], reuse)
					p.checkLimits(sub![j])
				}
				let suffix = p.collapse($.goSlice(sub, start, i), 19) // recurse

				let re = p.newRegexp(18)
				re!.Sub = $.append($.goSlice(re!.Sub, undefined, 0), prefix, suffix)
				out = $.append(out, re)
			}

			// Prepare for next iteration.
			start = i
			first = ifirst
		}
		sub = out
		start = 0
		out = $.goSlice(sub, undefined, 0)
		for (let i = 0; i <= $.len(sub); i++) {
			// Invariant: the Regexps that were in sub[0:start] have been
			// used or marked for reuse, and the slice space has been reused
			// for out (len(out) <= start).
			//
			// Invariant: sub[start:i] consists of regexps that are either
			// literal runes or character classes.
			if (i < $.len(sub) && isCharClass(sub![i])) {
				continue
			}

			// sub[i] is not a char or char class;
			// emit char class for sub[start:i]...

			// Nothing to do - run of length 0.

			// Make new char class.
			// Start with most complex regexp in sub[start].
			if (i == start) {

			} else if (i == start + 1) {
				out = $.append(out, sub![start])
			} else {
				// Make new char class.
				// Start with most complex regexp in sub[start].
				let max = start
				for (let j = start + 1; j < i; j++) {
					if (sub![max]!.Op < sub![j]!.Op || sub![max]!.Op == sub![j]!.Op && $.len(sub![max]!.Rune) < $.len(sub![j]!.Rune)) {
						max = j
					}
				}
				[sub![start], sub![max]] = [sub![max], sub![start]]

				for (let j = start + 1; j < i; j++) {
					mergeCharClass(sub![start], sub![j])
					p.reuse(sub![j])
				}
				cleanAlt(sub![start])
				out = $.append(out, sub![start])
			}

			// ... and then emit sub[i].
			if (i < $.len(sub)) {
				out = $.append(out, sub![i])
			}
			start = i + 1
		}
		sub = out
		start = 0
		out = $.goSlice(sub, undefined, 0)
		for (let i = 0; i < $.len(sub); i++) {
			{
				if (i + 1 < $.len(sub) && sub![i]!.Op == 2 && sub![i + 1]!.Op == 2) {
					continue
				}
				out = $.append(out, sub![i])
			}
		}
		sub = out
		return sub
	}

	// leadingString returns the leading literal string that re begins with.
	// The string refers to storage in re or its children.
	public leadingString(re: Regexp | null): [$.Slice<number>, Flags] {
		const p = this
		if (re!.Op == 18 && $.len(re!.Sub) > 0) {
			re = re!.Sub![0]
		}
		if (re!.Op != 3) {
			return [null, 0]
		}
		return [re!.Rune, (re!.Flags & 1)]
	}

	// removeLeadingString removes the first n leading runes
	// from the beginning of re. It returns the replacement for re.
	public removeLeadingString(re: Regexp | null, n: number): Regexp | null {
		const p = this
		if (re!.Op == 18 && $.len(re!.Sub) > 0) {
			// Removing a leading string in a concatenation
			// might simplify the concatenation.
			let sub = re!.Sub![0]
			sub = p.removeLeadingString(sub, n)
			re!.Sub![0] = sub

			// Impossible but handle.
			if (sub!.Op == 2) {
				p.reuse(sub)

				// Impossible but handle.
				switch ($.len(re!.Sub)) {
					case 0:
					case 1:
						re!.Op = 2
						re!.Sub = null
						break
					case 2:
						let old = re
						re = re!.Sub![1]
						p.reuse(old)
						break
					default:
						$.copy(re!.Sub, $.goSlice(re!.Sub, 1, undefined))
						re!.Sub = $.goSlice(re!.Sub, undefined, $.len(re!.Sub) - 1)
						break
				}
			}
			return re
		}
		if (re!.Op == 3) {
			re!.Rune = $.goSlice(re!.Rune, undefined, $.copy(re!.Rune, $.goSlice(re!.Rune, n, undefined)))
			if ($.len(re!.Rune) == 0) {
				re!.Op = 2
			}
		}
		return re
	}

	// leadingRegexp returns the leading regexp that re begins with.
	// The regexp refers to storage in re or its children.
	public leadingRegexp(re: Regexp | null): Regexp | null {
		const p = this
		if (re!.Op == 2) {
			return null
		}
		if (re!.Op == 18 && $.len(re!.Sub) > 0) {
			let sub = re!.Sub![0]
			if (sub!.Op == 2) {
				return null
			}
			return sub
		}
		return re
	}

	// removeLeadingRegexp removes the leading regexp in re.
	// It returns the replacement for re.
	// If reuse is true, it passes the removed regexp (if no longer needed) to p.reuse.
	public removeLeadingRegexp(re: Regexp | null, reuse: boolean): Regexp | null {
		const p = this
		if (re!.Op == 18 && $.len(re!.Sub) > 0) {
			if (reuse) {
				p.reuse(re!.Sub![0])
			}
			re!.Sub = $.goSlice(re!.Sub, undefined, $.copy(re!.Sub, $.goSlice(re!.Sub, 1, undefined)))
			switch ($.len(re!.Sub)) {
				case 0:
					re!.Op = 2
					re!.Sub = null
					break
				case 1:
					let old = re
					re = re!.Sub![0]
					p.reuse(old)
					break
			}
			return re
		}
		if (reuse) {
			p.reuse(re)
		}
		return p.newRegexp(2)
	}

	// parseRepeat parses {min} (max=min) or {min,} (max=-1) or {min,max}.
	// If s is not of that form, it returns ok == false.
	// If s has the right form but the values are too big, it returns min == -1, ok == true.
	public parseRepeat(s: string): [number, string, boolean] {
		const p = this
		if (s == "" || $.indexString(s, 0) != 123) {
			return [min, max, rest, ok]
		}
		s = $.sliceString(s, 1, undefined)
		let ok1: boolean = false
		{
			;[min, s, ok1] = p.parseInt(s)
			if (!ok1) {
				return [min, max, rest, ok]
			}
		}
		if (s == "") {
			return [min, max, rest, ok]
		}
		if ($.indexString(s, 0) != 44) {
			max = min
		} else {
			s = $.sliceString(s, 1, undefined)
			if (s == "") {
				return [min, max, rest, ok]
			}

			// parseInt found too big a number
			if ($.indexString(s, 0) == 125) {
				max = -1
			} else {
				;[max, s, ok1] = p.parseInt(s)
				if (!ok1) {
					return [min, max, rest, ok]
				} else if (max < 0) {
					// parseInt found too big a number
					min = -1
				}
			}
		}
		if (s == "" || $.indexString(s, 0) != 125) {
			return [min, max, rest, ok]
		}
		rest = $.sliceString(s, 1, undefined)
		ok = true
		return [min, max, rest, ok]
	}

	// parsePerlFlags parses a Perl flag setting or non-capturing group or both,
	// like (?i) or (?: or (?i:.  It removes the prefix from s and updates the parse state.
	// The caller must have ensured that s begins with "(?".
	public parsePerlFlags(s: string): [string, $.GoError] {
		const p = this
		let t = s
		let startsWithP = $.len(t) > 4 && $.indexString(t, 2) == 80 && $.indexString(t, 3) == 60
		let startsWithName = $.len(t) > 3 && $.indexString(t, 2) == 60
		if (startsWithP || startsWithName) {
			// position of expr start
			let exprStartPos = 4
			if (startsWithName) {
				exprStartPos = 3
			}

			// Pull out name.
			let end = strings.IndexRune(t, 62)
			if (end < 0) {
				{
					err = checkUTF8(t)
					if (err != null) {
						return ["", err]
					}
				}
				return ["", new Error({})]
			}

			let capture = $.sliceString(t, undefined, end + 1) // "(?P<name>" or "(?<name>"
			let name = $.sliceString(t, exprStartPos, end) // "name"
			{
				err = checkUTF8(name)
				if (err != null) {
					return ["", err]
				}
			}
			if (!isValidCaptureName(name)) {
				return ["", new Error({})]
			}

			// Like ordinary capture, but named.
			p.numCap++
			let re = p.op(128)
			re!.Cap = p.numCap
			re!.Name = name
			return [$.sliceString(t, end + 1, undefined), null]
		}
		let c: number = 0
		t = $.sliceString(t, 2, undefined) // skip (?
		let flags = p.flags
		let sign = +1
		let sawFlag = false
		Loop: for (; t != ""; ) {
			{
				;[c, t, err] = nextRune(t)
				if (err != null) {
					return ["", err]
				}
			}

			// Flags.

			// Switch to negation.

			// Invert flags so that | above turn into &^ and vice versa.
			// We'll invert flags again before using it below.

			// End of flags, starting group or not.

			// Open new group
			switch (c) {
				default:
					break
					break
				case 105:
					flags |= 1
					sawFlag = true
					break
				case 109:
					flags &= ~(16)
					sawFlag = true
					break
				case 115:
					flags |= 8
					sawFlag = true
					break
				case 85:
					flags |= 32
					sawFlag = true
					break
				case 45:
					if (sign < 0) {
						break
					}
					sign = -1
					flags = ~flags
					sawFlag = false
					break
				case 58:
				case 41:
					if (sign < 0) {
						if (!sawFlag) {
							break
						}
						flags = ~flags
					}
					if (c == 58) {
						// Open new group
						p.op(128)
					}
					p.flags = flags
					return [t, null]
					break
			}
		}
		return ["", new Error({})]
	}

	// parseInt parses a decimal integer.
	public parseInt(s: string): [number, string, boolean] {
		const p = this
		if (s == "" || $.indexString(s, 0) < 48 || 57 < $.indexString(s, 0)) {
			return [n, rest, ok]
		}
		if ($.len(s) >= 2 && $.indexString(s, 0) == 48 && 48 <= $.indexString(s, 1) && $.indexString(s, 1) <= 57) {
			return [n, rest, ok]
		}
		let t = s
		for (; s != "" && 48 <= $.indexString(s, 0) && $.indexString(s, 0) <= 57; ) {
			s = $.sliceString(s, 1, undefined)
		}
		rest = s
		ok = true
		t = $.sliceString(t, undefined, $.len(t) - $.len(s))
		for (let i = 0; i < $.len(t); i++) {
			// Avoid overflow.
			if (n >= 1e8) {
				n = -1
				break
			}
			n = n * 10 + $.int($.indexString(t, i)) - 48
		}
		return [n, rest, ok]
	}

	// parseVerticalBar handles a | in the input.
	public parseVerticalBar(): void {
		const p = this
		p.concat()
		if (!p.swapVerticalBar()) {
			p.op(129)
		}
	}

	// If the top of the stack is an element followed by an opVerticalBar
	// swapVerticalBar swaps the two and returns true.
	// Otherwise it returns false.
	public swapVerticalBar(): boolean {
		const p = this
		let n = $.len(p.stack)
		if (n >= 3 && p.stack![n - 2]!.Op == 129 && isCharClass(p.stack![n - 1]) && isCharClass(p.stack![n - 3])) {
			let re1 = p.stack![n - 1]
			let re3 = p.stack![n - 3]
			// Make re3 the more complex of the two.
			if (re1!.Op > re3!.Op) {
				[re1, re3] = [re3, re1]
				p.stack![n - 3] = re3
			}
			mergeCharClass(re3, re1)
			p.reuse(re1)
			p.stack = $.goSlice(p.stack, undefined, n - 1)
			return true
		}
		if (n >= 2) {
			let re1 = p.stack![n - 1]
			let re2 = p.stack![n - 2]

			// Now out of reach.
			// Clean opportunistically.
			if (re2!.Op == 129) {

				// Now out of reach.
				// Clean opportunistically.
				if (n >= 3) {
					// Now out of reach.
					// Clean opportunistically.
					cleanAlt(p.stack![n - 3])
				}
				p.stack![n - 2] = re1
				p.stack![n - 1] = re2
				return true
			}
		}
		return false
	}

	// parseRightParen handles a ) in the input.
	public parseRightParen(): $.GoError {
		const p = this
		p.concat()
		if (p.swapVerticalBar()) {
			// pop vertical bar
			p.stack = $.goSlice(p.stack, undefined, $.len(p.stack) - 1)
		}
		p.alternate()
		let n = $.len(p.stack)
		if (n < 2) {
			return new Error({})
		}
		let re1 = p.stack![n - 1]
		let re2 = p.stack![n - 2]
		p.stack = $.goSlice(p.stack, undefined, n - 2)
		if (re2!.Op != 128) {
			return new Error({})
		}
		p.flags = re2!.Flags
		if (re2!.Cap == 0) {
			// Just for grouping.
			p.push(re1)
		} else {
			re2!.Op = 13
			re2!.Sub = $.goSlice(re2!.Sub0, undefined, 1)
			re2!.Sub![0] = re1
			p.push(re2)
		}
		return null
	}

	// parseEscape parses an escape sequence at the beginning of s
	// and returns the rune.
	public parseEscape(s: string): [number, string, $.GoError] {
		const p = this
		let t = $.sliceString(s, 1, undefined)
		if (t == "") {
			return [0, "", new Error({})]
		}
		let c: number
		[c, t, err] = nextRune(t)
		if (err != null) {
			return [0, "", err]
		}
		Switch: switch (c) {
			default:
				if (c < utf8.RuneSelf && !isalnum(c)) {
					// Escaped non-word characters are always themselves.
					// PCRE is not quite so rigorous: it accepts things like
					// \q, but we don't. We once rejected \_, but too many
					// programs and people insist on using it, so allow \_.
					return [c, t, null]
				}
				break
			case 49:
			case 50:
			case 51:
			case 52:
			case 53:
			case 54:
			case 55:
				if (t == "" || $.indexString(t, 0) < 48 || $.indexString(t, 0) > 55) {
					break
				}
				// fallthrough // fallthrough statement skipped
				break
			case 48:
				r = c - 48
				for (let i = 1; i < 3; i++) {
					if (t == "" || $.indexString(t, 0) < 48 || $.indexString(t, 0) > 55) {
						break
					}
					r = r * 8 + ($.indexString(t, 0) as number) - 48
					t = $.sliceString(t, 1, undefined)
				}
				return [r, t, null]
				break
			case 120:
				if (t == "") {
					break
				}
				{
					;[c, t, err] = nextRune(t)
					if (err != null) {
						return [0, "", err]
					}
				}
				if (c == 123) {
					// Any number of digits in braces.
					// Perl accepts any text at all; it ignores all text
					// after the first non-hex digit. We require only hex digits,
					// and at least one.
					let nhex = 0
					r = 0
					for (; ; ) {
						if (t == "") {
							break
						}
						{
							;[c, t, err] = nextRune(t)
							if (err != null) {
								return [0, "", err]
							}
						}
						if (c == 125) {
							break
						}
						let v = unhex(c)
						if (v < 0) {
							break
						}
						r = r * 16 + v
						if (r > unicode.MaxRune) {
							break
						}
						nhex++
					}
					if (nhex == 0) {
						break
					}
					return [r, t, null]
				}
				let x = unhex(c)
				{
					;[c, t, err] = nextRune(t)
					if (err != null) {
						return [0, "", err]
					}
				}
				let y = unhex(c)
				if (x < 0 || y < 0) {
					break
				}
				return [x * 16 + y, t, null]
				break
			case 97:
				return [7, t, err]
				break
			case 102:
				return [12, t, err]
				break
			case 110:
				return [10, t, err]
				break
			case 114:
				return [13, t, err]
				break
			case 116:
				return [9, t, err]
				break
			case 118:
				return [11, t, err]
				break
		}
		return [0, "", new Error({})]
	}

	// parseClassChar parses a character class character at the beginning of s
	// and returns it.
	public parseClassChar(s: string, wholeClass: string): [number, string, $.GoError] {
		const p = this
		if (s == "") {
			return [0, "", new Error({Code: "missing closing ]", Expr: wholeClass})]
		}
		if ($.indexString(s, 0) == 92) {
			return p.parseEscape(s)
		}
		return nextRune(s)
	}

	// parsePerlClassEscape parses a leading Perl character class escape like \d
	// from the beginning of s. If one is present, it appends the characters to r
	// and returns the new slice r and the remainder of the string.
	public parsePerlClassEscape(s: string, r: $.Slice<number>): [$.Slice<number>, string] {
		const p = this
		if ((p.flags & 64) == 0 || $.len(s) < 2 || $.indexString(s, 0) != 92) {
			return [out, rest]
		}
		let g = $.mapGet(perlGroup, $.sliceString(s, 0, 2), new charGroup())[0].clone()
		if (g.sign == 0) {
			return [out, rest]
		}
		return [p.appendGroup(r, g), $.sliceString(s, 2, undefined)]
	}

	// parseNamedClass parses a leading POSIX named character class like [:alnum:]
	// from the beginning of s. If one is present, it appends the characters to r
	// and returns the new slice r and the remainder of the string.
	public parseNamedClass(s: string, r: $.Slice<number>): [$.Slice<number>, string, $.GoError] {
		const p = this
		if ($.len(s) < 2 || $.indexString(s, 0) != 91 || $.indexString(s, 1) != 58) {
			return [out, rest, err]
		}
		let i = strings.Index($.sliceString(s, 2, undefined), ":]")
		if (i < 0) {
			return [out, rest, err]
		}
		i += 2
		let [name, s] = [$.sliceString(s, 0, i + 2), $.sliceString(s, i + 2, undefined)]
		let g = $.mapGet(posixGroup, name, new charGroup())[0].clone()
		if (g.sign == 0) {
			return [null, "", new Error({})]
		}
		return [p.appendGroup(r, g), s, null]
	}

	public appendGroup(r: $.Slice<number>, g: charGroup): $.Slice<number> {
		const p = this
		if ((p.flags & 1) == 0) {
			if (g.sign < 0) {
				r = appendNegatedClass(r, g._class)
			} else {
				r = appendClass(r, g._class)
			}
		} else {
			let tmp = $.goSlice(p.tmpClass, undefined, 0)
			tmp = appendFoldedClass(tmp, g._class)
			p.tmpClass = tmp
			tmp = cleanClass(p.tmpClass)
			if (g.sign < 0) {
				r = appendNegatedClass(r, tmp)
			} else {
				r = appendClass(r, tmp)
			}
		}
		return r
	}

	// parseUnicodeClass parses a leading Unicode character class like \p{Han}
	// from the beginning of s. If one is present, it appends the characters to r
	// and returns the new slice r and the remainder of the string.
	public parseUnicodeClass(s: string, r: $.Slice<number>): [$.Slice<number>, string, $.GoError] {
		const p = this
		if ((p.flags & 128) == 0 || $.len(s) < 2 || $.indexString(s, 0) != 92 || $.indexString(s, 1) != 112 && $.indexString(s, 1) != 80) {
			return [out, rest, err]
		}
		let sign = +1
		if ($.indexString(s, 1) == 80) {
			sign = -1
		}
		let t = $.sliceString(s, 2, undefined)
		let c: number
		[c, t, err] = nextRune(t)
		if (err != null) {
			return [out, rest, err]
		}
		let [seq, name] = []
		if (c != 123) {
			// Single-letter name.
			seq = $.sliceString(s, undefined, $.len(s) - $.len(t))
			name = $.sliceString(seq, 2, undefined)
		} else {
			// Name is in braces.
			let end = strings.IndexRune(s, 125)
			if (end < 0) {
				{
					err = checkUTF8(s)
					if (err != null) {
						return [out, rest, err]
					}
				}
				return [null, "", new Error({})]
			}
			[seq, t] = [$.sliceString(s, undefined, end + 1), $.sliceString(s, end + 1, undefined)]
			name = $.sliceString(s, 3, end)
			{
				err = checkUTF8(name)
				if (err != null) {
					return [out, rest, err]
				}
			}
		}
		if (name != "" && $.indexString(name, 0) == 94) {
			sign = -sign
			name = $.sliceString(name, 1, undefined)
		}
		let [tab, fold] = unicodeTable(name)
		if (tab == null) {
			return [null, "", new Error({})]
		}
		if ((p.flags & 1) == 0 || fold == null) {
			if (sign > 0) {
				r = appendTable(r, tab)
			} else {
				r = appendNegatedTable(r, tab)
			}
		} else {
			// Merge and clean tab and fold in a temporary buffer.
			// This is necessary for the negative case and just tidy
			// for the positive case.
			let tmp = $.goSlice(p.tmpClass, undefined, 0)
			tmp = appendTable(tmp, tab)
			tmp = appendTable(tmp, fold)
			p.tmpClass = tmp
			tmp = cleanClass(p.tmpClass)
			if (sign > 0) {
				r = appendClass(r, tmp)
			} else {
				r = appendNegatedClass(r, tmp)
			}
		}
		return [r, t, null]
	}

	// parseClass parses a character class at the beginning of s
	// and pushes it onto the parse stack.
	public parseClass(s: string): [string, $.GoError] {
		const p = this
		let t = $.sliceString(s, 1, undefined) // chop [
		let re = p.newRegexp(4)
		re!.Flags = p.flags
		re!.Rune = $.goSlice(re!.Rune0, undefined, 0)
		let sign = +1
		if (t != "" && $.indexString(t, 0) == 94) {
			sign = -1
			t = $.sliceString(t, 1, undefined)

			// If character class does not match \n, add it here,
			// so that negation later will do the right thing.
			if ((p.flags & 4) == 0) {
				re!.Rune = $.append(re!.Rune, 10, 10)
			}
		}
		let _class = re!.Rune
		let first = true // ] and - are okay as first char in class
		for (; t == "" || $.indexString(t, 0) != 93 || first; ) {
			// POSIX: - is only okay unescaped as first or last in class.
			// Perl: - is okay anywhere.
			if (t != "" && $.indexString(t, 0) == 45 && (p.flags & 64) == 0 && !first && ($.len(t) == 1 || $.indexString(t, 1) != 93)) {
				let [, size] = utf8.DecodeRuneInString($.sliceString(t, 1, undefined))
				return ["", new Error({Code: "invalid character class range", Expr: $.sliceString(t, undefined, 1 + size)})]
			}
			first = false

			// Look for POSIX [:alnum:] etc.
			if ($.len(t) > 2 && $.indexString(t, 0) == 91 && $.indexString(t, 1) == 58) {
				let [nclass, nt, err] = p.parseNamedClass(t, _class)
				if (err != null) {
					return ["", err]
				}
				if (nclass != null) {
					[_class, t] = [nclass, nt]
					continue
				}
			}

			// Look for Unicode character group like \p{Han}.
			let [nclass, nt, err] = p.parseUnicodeClass(t, _class)
			if (err != null) {
				return ["", err]
			}
			if (nclass != null) {
				[_class, t] = [nclass, nt]
				continue
			}

			// Look for Perl character class symbols (extension).
			{
				let [nclass, nt] = p.parsePerlClassEscape(t, _class)
				if (nclass != null) {
					[_class, t] = [nclass, nt]
					continue
				}
			}

			// Single character or simple range.
			let rng = t
			let [lo, hi] = []
			{
				;[lo, t, err] = p.parseClassChar(t, s)
				if (err != null) {
					return ["", err]
				}
			}
			hi = lo
			// [a-] means (a|-) so check for final ].
			if ($.len(t) >= 2 && $.indexString(t, 0) == 45 && $.indexString(t, 1) != 93) {
				t = $.sliceString(t, 1, undefined)
				{
					;[hi, t, err] = p.parseClassChar(t, s)
					if (err != null) {
						return ["", err]
					}
				}
				if (hi < lo) {
					rng = $.sliceString(rng, undefined, $.len(rng) - $.len(t))
					return ["", new Error({Code: "invalid character class range", Expr: rng})]
				}
			}
			if ((p.flags & 1) == 0) {
				_class = appendRange(_class, lo, hi)
			} else {
				_class = appendFoldedRange(_class, lo, hi)
			}
		}
		t = $.sliceString(t, 1, undefined) // chop ]
		re!.Rune = _class
		_class = cleanClass(re!.Rune)
		if (sign < 0) {
			_class = negateClass(_class)
		}
		re!.Rune = _class
		p.push(re)
		return [t, null]
	}

	// Register this type with the runtime type system
	static __typeInfo = $.registerStructType(
	  'parser',
	  new parser(),
	  [{ name: "newRegexp", args: [{ name: "op", type: "Op" }], returns: [{ type: { kind: $.TypeKind.Pointer, elemType: "Regexp" } }] }, { name: "reuse", args: [{ name: "re", type: { kind: $.TypeKind.Pointer, elemType: "Regexp" } }], returns: [] }, { name: "checkLimits", args: [{ name: "re", type: { kind: $.TypeKind.Pointer, elemType: "Regexp" } }], returns: [] }, { name: "checkSize", args: [{ name: "re", type: { kind: $.TypeKind.Pointer, elemType: "Regexp" } }], returns: [] }, { name: "calcSize", args: [{ name: "re", type: { kind: $.TypeKind.Pointer, elemType: "Regexp" } }, { name: "force", type: { kind: $.TypeKind.Basic, name: "boolean" } }], returns: [{ type: { kind: $.TypeKind.Basic, name: "number" } }] }, { name: "checkHeight", args: [{ name: "re", type: { kind: $.TypeKind.Pointer, elemType: "Regexp" } }], returns: [] }, { name: "calcHeight", args: [{ name: "re", type: { kind: $.TypeKind.Pointer, elemType: "Regexp" } }, { name: "force", type: { kind: $.TypeKind.Basic, name: "boolean" } }], returns: [{ type: { kind: $.TypeKind.Basic, name: "number" } }] }, { name: "push", args: [{ name: "re", type: { kind: $.TypeKind.Pointer, elemType: "Regexp" } }], returns: [{ type: { kind: $.TypeKind.Pointer, elemType: "Regexp" } }] }, { name: "maybeConcat", args: [{ name: "r", type: { kind: $.TypeKind.Basic, name: "number" } }, { name: "flags", type: "Flags" }], returns: [{ type: { kind: $.TypeKind.Basic, name: "boolean" } }] }, { name: "literal", args: [{ name: "r", type: { kind: $.TypeKind.Basic, name: "number" } }], returns: [] }, { name: "op", args: [{ name: "op", type: "Op" }], returns: [{ type: { kind: $.TypeKind.Pointer, elemType: "Regexp" } }] }, { name: "repeat", args: [{ name: "op", type: "Op" }, { name: "min", type: { kind: $.TypeKind.Basic, name: "number" } }, { name: "max", type: { kind: $.TypeKind.Basic, name: "number" } }, { name: "before", type: { kind: $.TypeKind.Basic, name: "string" } }, { name: "after", type: { kind: $.TypeKind.Basic, name: "string" } }, { name: "lastRepeat", type: { kind: $.TypeKind.Basic, name: "string" } }], returns: [{ type: { kind: $.TypeKind.Basic, name: "string" } }, { type: { kind: $.TypeKind.Interface, name: 'GoError', methods: [{ name: 'Error', args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: 'string' } }] }] } }] }, { name: "concat", args: [], returns: [{ type: { kind: $.TypeKind.Pointer, elemType: "Regexp" } }] }, { name: "alternate", args: [], returns: [{ type: { kind: $.TypeKind.Pointer, elemType: "Regexp" } }] }, { name: "collapse", args: [{ name: "subs", type: { kind: $.TypeKind.Slice, elemType: { kind: $.TypeKind.Pointer, elemType: "Regexp" } } }, { name: "op", type: "Op" }], returns: [{ type: { kind: $.TypeKind.Pointer, elemType: "Regexp" } }] }, { name: "factor", args: [{ name: "sub", type: { kind: $.TypeKind.Slice, elemType: { kind: $.TypeKind.Pointer, elemType: "Regexp" } } }], returns: [{ type: { kind: $.TypeKind.Slice, elemType: { kind: $.TypeKind.Pointer, elemType: "Regexp" } } }] }, { name: "leadingString", args: [{ name: "re", type: { kind: $.TypeKind.Pointer, elemType: "Regexp" } }], returns: [{ type: { kind: $.TypeKind.Slice, elemType: { kind: $.TypeKind.Basic, name: "number" } } }, { type: "Flags" }] }, { name: "removeLeadingString", args: [{ name: "re", type: { kind: $.TypeKind.Pointer, elemType: "Regexp" } }, { name: "n", type: { kind: $.TypeKind.Basic, name: "number" } }], returns: [{ type: { kind: $.TypeKind.Pointer, elemType: "Regexp" } }] }, { name: "leadingRegexp", args: [{ name: "re", type: { kind: $.TypeKind.Pointer, elemType: "Regexp" } }], returns: [{ type: { kind: $.TypeKind.Pointer, elemType: "Regexp" } }] }, { name: "removeLeadingRegexp", args: [{ name: "re", type: { kind: $.TypeKind.Pointer, elemType: "Regexp" } }, { name: "reuse", type: { kind: $.TypeKind.Basic, name: "boolean" } }], returns: [{ type: { kind: $.TypeKind.Pointer, elemType: "Regexp" } }] }, { name: "parseRepeat", args: [{ name: "s", type: { kind: $.TypeKind.Basic, name: "string" } }], returns: [{ type: { kind: $.TypeKind.Basic, name: "number" } }, { type: { kind: $.TypeKind.Basic, name: "number" } }, { type: { kind: $.TypeKind.Basic, name: "string" } }, { type: { kind: $.TypeKind.Basic, name: "boolean" } }] }, { name: "parsePerlFlags", args: [{ name: "s", type: { kind: $.TypeKind.Basic, name: "string" } }], returns: [{ type: { kind: $.TypeKind.Basic, name: "string" } }, { type: { kind: $.TypeKind.Interface, name: 'GoError', methods: [{ name: 'Error', args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: 'string' } }] }] } }] }, { name: "parseInt", args: [{ name: "s", type: { kind: $.TypeKind.Basic, name: "string" } }], returns: [{ type: { kind: $.TypeKind.Basic, name: "number" } }, { type: { kind: $.TypeKind.Basic, name: "string" } }, { type: { kind: $.TypeKind.Basic, name: "boolean" } }] }, { name: "parseVerticalBar", args: [], returns: [] }, { name: "swapVerticalBar", args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: "boolean" } }] }, { name: "parseRightParen", args: [], returns: [{ type: { kind: $.TypeKind.Interface, name: 'GoError', methods: [{ name: 'Error', args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: 'string' } }] }] } }] }, { name: "parseEscape", args: [{ name: "s", type: { kind: $.TypeKind.Basic, name: "string" } }], returns: [{ type: { kind: $.TypeKind.Basic, name: "number" } }, { type: { kind: $.TypeKind.Basic, name: "string" } }, { type: { kind: $.TypeKind.Interface, name: 'GoError', methods: [{ name: 'Error', args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: 'string' } }] }] } }] }, { name: "parseClassChar", args: [{ name: "s", type: { kind: $.TypeKind.Basic, name: "string" } }, { name: "wholeClass", type: { kind: $.TypeKind.Basic, name: "string" } }], returns: [{ type: { kind: $.TypeKind.Basic, name: "number" } }, { type: { kind: $.TypeKind.Basic, name: "string" } }, { type: { kind: $.TypeKind.Interface, name: 'GoError', methods: [{ name: 'Error', args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: 'string' } }] }] } }] }, { name: "parsePerlClassEscape", args: [{ name: "s", type: { kind: $.TypeKind.Basic, name: "string" } }, { name: "r", type: { kind: $.TypeKind.Slice, elemType: { kind: $.TypeKind.Basic, name: "number" } } }], returns: [{ type: { kind: $.TypeKind.Slice, elemType: { kind: $.TypeKind.Basic, name: "number" } } }, { type: { kind: $.TypeKind.Basic, name: "string" } }] }, { name: "parseNamedClass", args: [{ name: "s", type: { kind: $.TypeKind.Basic, name: "string" } }, { name: "r", type: { kind: $.TypeKind.Slice, elemType: { kind: $.TypeKind.Basic, name: "number" } } }], returns: [{ type: { kind: $.TypeKind.Slice, elemType: { kind: $.TypeKind.Basic, name: "number" } } }, { type: { kind: $.TypeKind.Basic, name: "string" } }, { type: { kind: $.TypeKind.Interface, name: 'GoError', methods: [{ name: 'Error', args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: 'string' } }] }] } }] }, { name: "appendGroup", args: [{ name: "r", type: { kind: $.TypeKind.Slice, elemType: { kind: $.TypeKind.Basic, name: "number" } } }, { name: "g", type: "charGroup" }], returns: [{ type: { kind: $.TypeKind.Slice, elemType: { kind: $.TypeKind.Basic, name: "number" } } }] }, { name: "parseUnicodeClass", args: [{ name: "s", type: { kind: $.TypeKind.Basic, name: "string" } }, { name: "r", type: { kind: $.TypeKind.Slice, elemType: { kind: $.TypeKind.Basic, name: "number" } } }], returns: [{ type: { kind: $.TypeKind.Slice, elemType: { kind: $.TypeKind.Basic, name: "number" } } }, { type: { kind: $.TypeKind.Basic, name: "string" } }, { type: { kind: $.TypeKind.Interface, name: 'GoError', methods: [{ name: 'Error', args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: 'string' } }] }] } }] }, { name: "parseClass", args: [{ name: "s", type: { kind: $.TypeKind.Basic, name: "string" } }], returns: [{ type: { kind: $.TypeKind.Basic, name: "string" } }, { type: { kind: $.TypeKind.Interface, name: 'GoError', methods: [{ name: 'Error', args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: 'string' } }] }] } }] }],
	  parser,
	  {"flags": "Flags", "stack": { kind: $.TypeKind.Slice, elemType: { kind: $.TypeKind.Pointer, elemType: "Regexp" } }, "free": { kind: $.TypeKind.Pointer, elemType: "Regexp" }, "numCap": { kind: $.TypeKind.Basic, name: "number" }, "wholeRegexp": { kind: $.TypeKind.Basic, name: "string" }, "tmpClass": { kind: $.TypeKind.Slice, elemType: { kind: $.TypeKind.Basic, name: "number" } }, "numRegexp": { kind: $.TypeKind.Basic, name: "number" }, "numRunes": { kind: $.TypeKind.Basic, name: "number" }, "repeats": { kind: $.TypeKind.Basic, name: "number" }, "height": { kind: $.TypeKind.Map, keyType: { kind: $.TypeKind.Pointer, elemType: "Regexp" }, elemType: { kind: $.TypeKind.Basic, name: "number" } }, "size": { kind: $.TypeKind.Map, keyType: { kind: $.TypeKind.Pointer, elemType: "Regexp" }, elemType: { kind: $.TypeKind.Basic, name: "number" } }}
	);
}

// minFoldRune returns the minimum rune fold-equivalent to r.
export function minFoldRune(r: number): number {
	if (r < 65 || r > 125251) {
		return r
	}
	let m = r
	let r0 = r
	for (r = unicode.SimpleFold(r); r != r0; r = unicode.SimpleFold(r)) {
		m = min(m, r)
	}
	return m
}

// repeatIsValid reports whether the repetition re is valid.
// Valid means that the combination of the top-level repetition
// and any inner repetitions does not exceed n copies of the
// innermost thing.
// This function rewalks the regexp tree and is called for every repetition,
// so we have to worry about inducing quadratic behavior in the parser.
// We avoid this by only calling repeatIsValid when min or max >= 2.
// In that case the depth of any >= 2 nesting can only get to 9 without
// triggering a parse error, so each subtree can only be rewalked 9 times.
export function repeatIsValid(re: Regexp | null, n: number): boolean {
	if (re!.Op == 17) {
		let m = re!.Max
		if (m == 0) {
			return true
		}
		if (m < 0) {
			m = re!.Min
		}
		if (m > n) {
			return false
		}
		if (m > 0) {
			n /= m
		}
	}
	for (let _i = 0; _i < $.len(re!.Sub); _i++) {
		const sub = re!.Sub![_i]
		{
			if (!repeatIsValid(sub, n)) {
				return false
			}
		}
	}
	return true
}

// cleanAlt cleans re for eventual inclusion in an alternation.
export function cleanAlt(re: Regexp | null): void {

	// re.Rune will not grow any more.
	// Make a copy or inline to reclaim storage.
	switch (re!.Op) {
		case 4:
			re!.Rune = cleanClass(re!.Rune)
			if ($.len(re!.Rune) == 2 && re!.Rune![0] == 0 && re!.Rune![1] == unicode.MaxRune) {
				re!.Rune = null
				re!.Op = 6
				return 
			}
			if ($.len(re!.Rune) == 4 && re!.Rune![0] == 0 && re!.Rune![1] == 10 - 1 && re!.Rune![2] == 10 + 1 && re!.Rune![3] == unicode.MaxRune) {
				re!.Rune = null
				re!.Op = 5
				return 
			}
			if ($.cap(re!.Rune) - $.len(re!.Rune) > 100) {
				// re.Rune will not grow any more.
				// Make a copy or inline to reclaim storage.
				re!.Rune = $.append($.goSlice(re!.Rune0, undefined, 0), re!.Rune)
			}
			break
	}
}

export function literalRegexp(s: string, flags: Flags): Regexp | null {
	let re = new Regexp({Op: 3})
	re!.Flags = flags
	re!.Rune = $.goSlice(re!.Rune0, undefined, 0) // use local storage for small strings

	// string is too long to fit in Rune0.  let Go handle it
	{
		const _runes = $.stringToRunes(s)
		for (let i = 0; i < _runes.length; i++) {
			const c = _runes[i]
			{

				// string is too long to fit in Rune0.  let Go handle it
				if ($.len(re!.Rune) >= $.cap(re!.Rune)) {
					// string is too long to fit in Rune0.  let Go handle it
					re!.Rune = $.stringToRunes(s)
					break
				}
				re!.Rune = $.append(re!.Rune, c)
			}
		}
	}
	return re
}

// Parse parses a regular expression string s, controlled by the specified
// Flags, and returns a regular expression parse tree. The syntax is
// described in the top-level comment.
export function Parse(s: string, flags: Flags): [Regexp | null, $.GoError] {
	return parse(s, flags)
}

export function parse(s: string, flags: Flags): [Regexp | null, $.GoError] {
	let _: Regexp | null = null
	let err: $.GoError = null
	{
		using __defer = new $.DisposableStack();

		// ok
		// too big
		__defer.defer(() => {
			{let r = $.recover()
				switch (r) {
					default:
						$.panic(r)
						break
					case null:
						break
					case "expression too large":
						err = new Error({Code: "expression too large", Expr: s})
						break
					case "expression nests too deeply":
						err = new Error({Code: "expression nests too deeply", Expr: s})
						break
				}
			}});

		// Trivial parser for literal string.
		if ((flags & 2) != 0) {
			// Trivial parser for literal string.
			{
				let err = checkUTF8(s)
				if (err != null) {
					return [null, err]
				}
			}
			return [literalRegexp(s, flags), null]
		}

		// Otherwise, must do real work.
		let p: parser = new parser({})
		let c: number = 0
		let op: Op = new Op(0)
		let lastRepeat: string = ""
		p.flags = flags
		p.wholeRegexp = s
		let t = s

		// Flag changes and non-capturing groups.

		// If the repeat cannot be parsed, { is a literal.

		// Numbers were too big, or max is present and min > max.

		// any byte; not supported

		// \Q ... \E: the ... is always literals

		// Look for Unicode character group like \p{Han}

		// Perl character class escape.

		// Ordinary single-character escape.
		for (; t != ""; ) {
			let repeat = ""

			// Flag changes and non-capturing groups.

			// If the repeat cannot be parsed, { is a literal.

			// Numbers were too big, or max is present and min > max.

			// any byte; not supported

			// \Q ... \E: the ... is always literals

			// Look for Unicode character group like \p{Han}

			// Perl character class escape.

			// Ordinary single-character escape.
			BigSwitch: switch ($.indexString(t, 0)) {
				default:
					{
						;[c, t, err] = nextRune(t)
						if (err != null) {
							return [null, err]
						}
					}
					p.literal(c)
					break
				case 40:
					if ((p.flags & 64) != 0 && $.len(t) >= 2 && $.indexString(t, 1) == 63) {
						// Flag changes and non-capturing groups.
						{
							;[t, err] = p.parsePerlFlags(t)
							if (err != null) {
								return [null, err]
							}
						}
						break
					}
					p.numCap++
					p.op(128)!.Cap = p.numCap
					t = $.sliceString(t, 1, undefined)
					break
				case 124:
					p.parseVerticalBar()
					t = $.sliceString(t, 1, undefined)
					break
				case 41:
					{
						err = p.parseRightParen()
						if (err != null) {
							return [null, err]
						}
					}
					t = $.sliceString(t, 1, undefined)
					break
				case 94:
					if ((p.flags & 16) != 0) {
						p.op(9)
					} else {
						p.op(7)
					}
					t = $.sliceString(t, 1, undefined)
					break
				case 36:
					if ((p.flags & 16) != 0) {
						p.op(10)!.Flags |= 256
					} else {
						p.op(8)
					}
					t = $.sliceString(t, 1, undefined)
					break
				case 46:
					if ((p.flags & 8) != 0) {
						p.op(6)
					} else {
						p.op(5)
					}
					t = $.sliceString(t, 1, undefined)
					break
				case 91:
					{
						;[t, err] = p.parseClass(t)
						if (err != null) {
							return [null, err]
						}
					}
					break
				case 42:
				case 43:
				case 63:
					let before = t
					switch ($.indexString(t, 0)) {
						case 42:
							op = 14
							break
						case 43:
							op = 15
							break
						case 63:
							op = 16
							break
					}
					let after = $.sliceString(t, 1, undefined)
					{
						;[after, err] = p.repeat(op, 0, 0, before, after, lastRepeat)
						if (err != null) {
							return [null, err]
						}
					}
					repeat = before
					t = after
					break
				case 123:
					op = 17
					let before = t
					let [min, max, after, ok] = p.parseRepeat(t)
					if (!ok) {
						// If the repeat cannot be parsed, { is a literal.
						p.literal(123)
						t = $.sliceString(t, 1, undefined)
						break
					}
					if (min < 0 || min > 1000 || max > 1000 || max >= 0 && min > max) {
						// Numbers were too big, or max is present and min > max.
						return [null, new Error({})]
					}
					{
						;[after, err] = p.repeat(op, min, max, before, after, lastRepeat)
						if (err != null) {
							return [null, err]
						}
					}
					repeat = before
					t = after
					break
				case 92:
					if ((p.flags & 64) != 0 && $.len(t) >= 2) {

						// any byte; not supported

						// \Q ... \E: the ... is always literals
						switch ($.indexString(t, 1)) {
							case 65:
								p.op(9)
								t = $.sliceString(t, 2, undefined)
								break
								break
							case 98:
								p.op(11)
								t = $.sliceString(t, 2, undefined)
								break
								break
							case 66:
								p.op(12)
								t = $.sliceString(t, 2, undefined)
								break
								break
							case 67:
								return [null, new Error({})]
								break
							case 81:
								let lit: string = ""
								;[lit, t] = strings.Cut($.sliceString(t, 2, undefined), "\\E")
								for (; lit != ""; ) {
									let [c, rest, err] = nextRune(lit)
									if (err != null) {
										return [null, err]
									}
									p.literal(c)
									lit = rest
								}
								break
								break
							case 122:
								p.op(10)
								t = $.sliceString(t, 2, undefined)
								break
								break
						}
					}
					let re = p.newRegexp(4)
					re!.Flags = p.flags
					if ($.len(t) >= 2 && ($.indexString(t, 1) == 112 || $.indexString(t, 1) == 80)) {
						let [r, rest, err] = p.parseUnicodeClass(t, $.goSlice(re!.Rune0, undefined, 0))
						if (err != null) {
							return [null, err]
						}
						if (r != null) {
							re!.Rune = r
							t = rest
							p.push(re)
							break
						}
					}
					{
						let [r, rest] = p.parsePerlClassEscape(t, $.goSlice(re!.Rune0, undefined, 0))
						if (r != null) {
							re!.Rune = r
							t = rest
							p.push(re)
							break
						}
					}
					p.reuse(re)
					{
						;[c, t, err] = p.parseEscape(t)
						if (err != null) {
							return [null, err]
						}
					}
					p.literal(c)
					break
			}
			lastRepeat = repeat
		}

		p.concat()

		// pop vertical bar
		if (p.swapVerticalBar()) {
			// pop vertical bar
			p.stack = $.goSlice(p.stack, undefined, $.len(p.stack) - 1)
		}
		p.alternate()

		let n = $.len(p.stack)
		if (n != 1) {
			return [null, new Error({})]
		}
		return [p.stack![0], null]
	}
}

// isValidCaptureName reports whether name
// is a valid capture name: [A-Za-z0-9_]+.
// PCRE limits names to 32 bytes.
// Python rejects names starting with digits.
// We don't enforce either of those.
export function isValidCaptureName(name: string): boolean {
	if (name == "") {
		return false
	}
	{
		const _runes = $.stringToRunes(name)
		for (let i = 0; i < _runes.length; i++) {
			const c = _runes[i]
			{
				if (c != 95 && !isalnum(c)) {
					return false
				}
			}
		}
	}
	return true
}

// can this be represented as a character class?
// single-rune literal string, char class, ., and .|\n.
export function isCharClass(re: Regexp | null): boolean {
	return re!.Op == 3 && $.len(re!.Rune) == 1 || re!.Op == 4 || re!.Op == 5 || re!.Op == 6
}

// does re match r?
export function matchRune(re: Regexp | null, r: number): boolean {
	switch (re!.Op) {
		case 3:
			return $.len(re!.Rune) == 1 && re!.Rune![0] == r
			break
		case 4:
			for (let i = 0; i < $.len(re!.Rune); i += 2) {
				if (re!.Rune![i] <= r && r <= re!.Rune![i + 1]) {
					return true
				}
			}
			return false
			break
		case 5:
			return r != 10
			break
		case 6:
			return true
			break
	}
	return false
}

// mergeCharClass makes dst = dst|src.
// The caller must ensure that dst.Op >= src.Op,
// to reduce the amount of copying.
export function mergeCharClass(dst: Regexp | null, src: Regexp | null): void {

	// src doesn't add anything.

	// src might add \n

	// src is simpler, so either literal or char class

	// both literal
	switch (dst!.Op) {
		case 6:
			break
		case 5:
			if (matchRune(src, 10)) {
				dst!.Op = 6
			}
			break
		case 4:
			if (src!.Op == 3) {
				dst!.Rune = appendLiteral(dst!.Rune, src!.Rune![0], src!.Flags)
			} else {
				dst!.Rune = appendClass(dst!.Rune, src!.Rune)
			}
			break
		case 3:
			if (src!.Rune![0] == dst!.Rune![0] && src!.Flags == dst!.Flags) {
				break
			}
			dst!.Op = 4
			dst!.Rune = appendLiteral($.goSlice(dst!.Rune, undefined, 0), dst!.Rune![0], dst!.Flags)
			dst!.Rune = appendLiteral(dst!.Rune, src!.Rune![0], src!.Flags)
			break
	}
}

class charGroup {
	public get sign(): number {
		return this._fields.sign.value
	}
	public set sign(value: number) {
		this._fields.sign.value = value
	}

	public get class(): $.Slice<number> {
		return this._fields.class.value
	}
	public set class(value: $.Slice<number>) {
		this._fields.class.value = value
	}

	public _fields: {
		sign: $.VarRef<number>;
		class: $.VarRef<$.Slice<number>>;
	}

	constructor(init?: Partial<{class?: $.Slice<number>, sign?: number}>) {
		this._fields = {
			sign: $.varRef(init?.sign ?? 0),
			class: $.varRef(init?.class ?? null)
		}
	}

	public clone(): charGroup {
		const cloned = new charGroup()
		cloned._fields = {
			sign: $.varRef(this._fields.sign.value),
			class: $.varRef(this._fields.class.value)
		}
		return cloned
	}

	// Register this type with the runtime type system
	static __typeInfo = $.registerStructType(
	  'charGroup',
	  new charGroup(),
	  [],
	  charGroup,
	  {"sign": { kind: $.TypeKind.Basic, name: "number" }, "class": { kind: $.TypeKind.Slice, elemType: { kind: $.TypeKind.Basic, name: "number" } }}
	);
}

let anyTable: unicode.RangeTable | null = new unicode.RangeTable({R16: $.arrayToSlice<unicode.Range16>([{Hi: (1 << 16) - 1, Lo: 0, Stride: 1}]), R32: $.arrayToSlice<unicode.Range32>([{Hi: unicode.MaxRune, Lo: (1 << 16), Stride: 1}])})

// unicodeTable returns the unicode.RangeTable identified by name
// and the table of additional fold-equivalent code points.
export function unicodeTable(name: string): [unicode.RangeTable | null, unicode.RangeTable | null] {
	// Special case: "Any" means any.
	if (name == "Any") {
		return [anyTable, anyTable]
	}
	{
		let t = $.mapGet(unicode.Categories, name, null)[0]
		if (t != null) {
			return [t, $.mapGet(unicode.FoldCategory, name, null)[0]]
		}
	}
	{
		let t = $.mapGet(unicode.Scripts, name, null)[0]
		if (t != null) {
			return [t, $.mapGet(unicode.FoldScript, name, null)[0]]
		}
	}
	return [null, null]
}

// cleanClass sorts the ranges (pairs of elements of r),
// merges them, and eliminates duplicates.
export function cleanClass(rp: $.VarRef<$.Slice<number>> | null): $.Slice<number> {

	// Sort by lo increasing, hi decreasing to break ties.
	sort.Sort(new ranges({}))

	let r = rp!.value
	if ($.len(r) < 2) {
		return r
	}

	// Merge abutting, overlapping.
	let w = 2 // write index

	// merge with previous range

	// new disjoint range
	for (let i = 2; i < $.len(r); i += 2) {
		let [lo, hi] = [r![i], r![i + 1]]

		// merge with previous range
		if (lo <= r![w - 1] + 1) {
			// merge with previous range
			if (hi > r![w - 1]) {
				r![w - 1] = hi
			}
			continue
		}
		// new disjoint range
		r![w] = lo
		r![w + 1] = hi
		w += 2
	}

	return $.goSlice(r, undefined, w)
}

// inCharClass reports whether r is in the class.
// It assumes the class has been cleaned by cleanClass.
export function inCharClass(r: number, _class: $.Slice<number>): boolean {
	let [, ok] = sort.Find($.len(_class) / 2, (i: number): number => {
		let [lo, hi] = [_class![2 * i], _class![2 * i + 1]]
		if (r > hi) {
			return +1
		}
		if (r < lo) {
			return -1
		}
		return 0
	})
	return ok
}

// appendLiteral returns the result of appending the literal x to the class r.
export function appendLiteral(r: $.Slice<number>, x: number, flags: Flags): $.Slice<number> {
	if ((flags & 1) != 0) {
		return appendFoldedRange(r, x, x)
	}
	return appendRange(r, x, x)
}

// appendRange returns the result of appending the range lo-hi to the class r.
export function appendRange(r: $.Slice<number>, lo: number, hi: number): $.Slice<number> {
	// Expand last range or next to last range if it overlaps or abuts.
	// Checking two ranges helps when appending case-folded
	// alphabets, so that one range can be expanding A-Z and the
	// other expanding a-z.
	let n = $.len(r)
	// twice, using i=2, i=4
	for (let i = 2; i <= 4; i += 2) {
		// twice, using i=2, i=4
		if (n >= i) {
			let [rlo, rhi] = [r![n - i], r![n - i + 1]]
			if (lo <= rhi + 1 && rlo <= hi + 1) {
				if (lo < rlo) {
					r![n - i] = lo
				}
				if (hi > rhi) {
					r![n - i + 1] = hi
				}
				return r
			}
		}
	}

	return $.append(r, lo, hi)
}

// minimum and maximum runes involved in folding.
// checked during test.
let minFold: number = 0x0041

let maxFold: number = 0x1e943

// appendFoldedRange returns the result of appending the range lo-hi
// and its case folding-equivalent runes to the class r.
export function appendFoldedRange(r: $.Slice<number>, lo: number, hi: number): $.Slice<number> {
	// Optimizations.

	// Range is full: folding can't add more.
	if (lo <= 65 && hi >= 125251) {
		// Range is full: folding can't add more.
		return appendRange(r, lo, hi)
	}

	// Range is outside folding possibilities.
	if (hi < 65 || lo > 125251) {
		// Range is outside folding possibilities.
		return appendRange(r, lo, hi)
	}

	// [lo, minFold-1] needs no folding.
	if (lo < 65) {
		// [lo, minFold-1] needs no folding.
		r = appendRange(r, lo, 65 - 1)
		lo = 65
	}

	// [maxFold+1, hi] needs no folding.
	if (hi > 125251) {
		// [maxFold+1, hi] needs no folding.
		r = appendRange(r, 125251 + 1, hi)
		hi = 125251
	}

	// Brute force. Depend on appendRange to coalesce ranges on the fly.
	for (let c = lo; c <= hi; c++) {
		r = appendRange(r, c, c)
		let f = unicode.SimpleFold(c)
		for (; f != c; ) {
			r = appendRange(r, f, f)
			f = unicode.SimpleFold(f)
		}
	}
	return r
}

// appendClass returns the result of appending the class x to the class r.
// It assume x is clean.
export function appendClass(r: $.Slice<number>, x: $.Slice<number>): $.Slice<number> {
	for (let i = 0; i < $.len(x); i += 2) {
		r = appendRange(r, x![i], x![i + 1])
	}
	return r
}

// appendFoldedClass returns the result of appending the case folding of the class x to the class r.
export function appendFoldedClass(r: $.Slice<number>, x: $.Slice<number>): $.Slice<number> {
	for (let i = 0; i < $.len(x); i += 2) {
		r = appendFoldedRange(r, x![i], x![i + 1])
	}
	return r
}

// appendNegatedClass returns the result of appending the negation of the class x to the class r.
// It assumes x is clean.
export function appendNegatedClass(r: $.Slice<number>, x: $.Slice<number>): $.Slice<number> {
	let nextLo = 0
	for (let i = 0; i < $.len(x); i += 2) {
		let [lo, hi] = [x![i], x![i + 1]]
		if (nextLo <= lo - 1) {
			r = appendRange(r, nextLo, lo - 1)
		}
		nextLo = hi + 1
	}
	if (nextLo <= unicode.MaxRune) {
		r = appendRange(r, nextLo, unicode.MaxRune)
	}
	return r
}

// appendTable returns the result of appending x to the class r.
export function appendTable(r: $.Slice<number>, x: unicode.RangeTable | null): $.Slice<number> {
	for (let _i = 0; _i < $.len(x.R16); _i++) {
		const xr = x.R16![_i]
		{
			let [lo, hi, stride] = [(xr.Lo as number), (xr.Hi as number), (xr.Stride as number)]
			if (stride == 1) {
				r = appendRange(r, lo, hi)
				continue
			}
			for (let c = lo; c <= hi; c += stride) {
				r = appendRange(r, c, c)
			}
		}
	}
	for (let _i = 0; _i < $.len(x.R32); _i++) {
		const xr = x.R32![_i]
		{
			let [lo, hi, stride] = [(xr.Lo as number), (xr.Hi as number), (xr.Stride as number)]
			if (stride == 1) {
				r = appendRange(r, lo, hi)
				continue
			}
			for (let c = lo; c <= hi; c += stride) {
				r = appendRange(r, c, c)
			}
		}
	}
	return r
}

// appendNegatedTable returns the result of appending the negation of x to the class r.
export function appendNegatedTable(r: $.Slice<number>, x: unicode.RangeTable | null): $.Slice<number> {
	let nextLo = 0 // lo end of next class to add
	for (let _i = 0; _i < $.len(x.R16); _i++) {
		const xr = x.R16![_i]
		{
			let [lo, hi, stride] = [(xr.Lo as number), (xr.Hi as number), (xr.Stride as number)]
			if (stride == 1) {
				if (nextLo <= lo - 1) {
					r = appendRange(r, nextLo, lo - 1)
				}
				nextLo = hi + 1
				continue
			}
			for (let c = lo; c <= hi; c += stride) {
				if (nextLo <= c - 1) {
					r = appendRange(r, nextLo, c - 1)
				}
				nextLo = c + 1
			}
		}
	}
	for (let _i = 0; _i < $.len(x.R32); _i++) {
		const xr = x.R32![_i]
		{
			let [lo, hi, stride] = [(xr.Lo as number), (xr.Hi as number), (xr.Stride as number)]
			if (stride == 1) {
				if (nextLo <= lo - 1) {
					r = appendRange(r, nextLo, lo - 1)
				}
				nextLo = hi + 1
				continue
			}
			for (let c = lo; c <= hi; c += stride) {
				if (nextLo <= c - 1) {
					r = appendRange(r, nextLo, c - 1)
				}
				nextLo = c + 1
			}
		}
	}
	if (nextLo <= unicode.MaxRune) {
		r = appendRange(r, nextLo, unicode.MaxRune)
	}
	return r
}

// negateClass overwrites r and returns r's negation.
// It assumes the class r is already clean.
export function negateClass(r: $.Slice<number>): $.Slice<number> {
	let nextLo = 0 // lo end of next class to add
	let w = 0 // write index
	for (let i = 0; i < $.len(r); i += 2) {
		let [lo, hi] = [r![i], r![i + 1]]
		if (nextLo <= lo - 1) {
			r![w] = nextLo
			r![w + 1] = lo - 1
			w += 2
		}
		nextLo = hi + 1
	}
	r = $.goSlice(r, undefined, w)

	// It's possible for the negation to have one more
	// range - this one - than the original class, so use append.
	if (nextLo <= unicode.MaxRune) {
		// It's possible for the negation to have one more
		// range - this one - than the original class, so use append.
		r = $.append(r, nextLo, unicode.MaxRune)
	}
	return r
}

class ranges {
	public get p(): $.VarRef<$.Slice<number>> | null {
		return this._fields.p.value
	}
	public set p(value: $.VarRef<$.Slice<number>> | null) {
		this._fields.p.value = value
	}

	public _fields: {
		p: $.VarRef<$.VarRef<$.Slice<number>> | null>;
	}

	constructor(init?: Partial<{p?: $.VarRef<$.Slice<number>> | null}>) {
		this._fields = {
			p: $.varRef(init?.p ?? null)
		}
	}

	public clone(): ranges {
		const cloned = new ranges()
		cloned._fields = {
			p: $.varRef(this._fields.p.value)
		}
		return cloned
	}

	public Less(i: number, j: number): boolean {
		const ra = this
		let p = ra.p!.value
		i *= 2
		j *= 2
		return p![i] < p![j] || p![i] == p![j] && p![i + 1] > p![j + 1]
	}

	public Len(): number {
		const ra = this
		return $.len(ra.p!.value) / 2
	}

	public Swap(i: number, j: number): void {
		const ra = this
		let p = ra.p!.value
		i *= 2
		j *= 2
		[p![i], p![i + 1], p![j], p![j + 1]] = [p![j], p![j + 1], p![i], p![i + 1]]
	}

	// Register this type with the runtime type system
	static __typeInfo = $.registerStructType(
	  'ranges',
	  new ranges(),
	  [{ name: "Less", args: [{ name: "i", type: { kind: $.TypeKind.Basic, name: "number" } }, { name: "j", type: { kind: $.TypeKind.Basic, name: "number" } }], returns: [{ type: { kind: $.TypeKind.Basic, name: "boolean" } }] }, { name: "Len", args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: "number" } }] }, { name: "Swap", args: [{ name: "i", type: { kind: $.TypeKind.Basic, name: "number" } }, { name: "j", type: { kind: $.TypeKind.Basic, name: "number" } }], returns: [] }],
	  ranges,
	  {"p": { kind: $.TypeKind.Pointer, elemType: { kind: $.TypeKind.Slice, elemType: { kind: $.TypeKind.Basic, name: "number" } } }}
	);
}

export function checkUTF8(s: string): $.GoError {
	for (; s != ""; ) {
		let [rune, size] = utf8.DecodeRuneInString(s)
		if (rune == utf8.RuneError && size == 1) {
			return new Error({Code: "invalid UTF-8", Expr: s})
		}
		s = $.sliceString(s, size, undefined)
	}
	return null
}

export function nextRune(s: string): [number, string, $.GoError] {
	let c: number = 0
	let t: string = ""
	let err: $.GoError = null
	{
		let size: number
		[c, size] = utf8.DecodeRuneInString(s)
		if (c == utf8.RuneError && size == 1) {
			return [0, "", new Error({Code: "invalid UTF-8", Expr: s})]
		}
		return [c, $.sliceString(s, size, undefined), null]
	}
}

export function isalnum(c: number): boolean {
	return 48 <= c && c <= 57 || 65 <= c && c <= 90 || 97 <= c && c <= 122
}

export function unhex(c: number): number {
	if (48 <= c && c <= 57) {
		return c - 48
	}
	if (97 <= c && c <= 102) {
		return c - 97 + 10
	}
	if (65 <= c && c <= 70) {
		return c - 65 + 10
	}
	return -1
}


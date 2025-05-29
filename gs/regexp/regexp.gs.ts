import * as $ from "@goscript/builtin/builtin.js";
import { maxBitStateLen } from "./backtrack.gs.js";
import { newLazyFlag } from "./exec.gs.js";
import { compileOnePass, onePassPrefix } from "./onepass.gs.js";

import * as bytes from "@goscript/bytes/index.js"

import * as io from "@goscript/io/index.js"

import * as syntax from "@goscript/regexp/syntax/index.js"

import * as strconv from "@goscript/strconv/index.js"

import * as strings from "@goscript/strings/index.js"

import * as sync from "@goscript/sync/index.js"

import * as unicode from "@goscript/unicode/index.js"

import * as utf8 from "@goscript/unicode/utf8/index.js"

export class Regexp {
	// as passed to Compile
	public get expr(): string {
		return this._fields.expr.value
	}
	public set expr(value: string) {
		this._fields.expr.value = value
	}

	// compiled program
	public get prog(): syntax.Prog | null {
		return this._fields.prog.value
	}
	public set prog(value: syntax.Prog | null) {
		this._fields.prog.value = value
	}

	// onepass program or nil
	public get onepass(): onePassProg | null {
		return this._fields.onepass.value
	}
	public set onepass(value: onePassProg | null) {
		this._fields.onepass.value = value
	}

	public get numSubexp(): number {
		return this._fields.numSubexp.value
	}
	public set numSubexp(value: number) {
		this._fields.numSubexp.value = value
	}

	public get maxBitStateLen(): number {
		return this._fields.maxBitStateLen.value
	}
	public set maxBitStateLen(value: number) {
		this._fields.maxBitStateLen.value = value
	}

	public get subexpNames(): $.Slice<string> {
		return this._fields.subexpNames.value
	}
	public set subexpNames(value: $.Slice<string>) {
		this._fields.subexpNames.value = value
	}

	// required prefix in unanchored matches
	public get prefix(): string {
		return this._fields.prefix.value
	}
	public set prefix(value: string) {
		this._fields.prefix.value = value
	}

	// prefix, as a []byte
	public get prefixBytes(): $.Bytes {
		return this._fields.prefixBytes.value
	}
	public set prefixBytes(value: $.Bytes) {
		this._fields.prefixBytes.value = value
	}

	// first rune in prefix
	public get prefixRune(): number {
		return this._fields.prefixRune.value
	}
	public set prefixRune(value: number) {
		this._fields.prefixRune.value = value
	}

	// pc for last rune in prefix
	public get prefixEnd(): number {
		return this._fields.prefixEnd.value
	}
	public set prefixEnd(value: number) {
		this._fields.prefixEnd.value = value
	}

	// pool for machines
	public get mpool(): number {
		return this._fields.mpool.value
	}
	public set mpool(value: number) {
		this._fields.mpool.value = value
	}

	// size of recorded match lengths
	public get matchcap(): number {
		return this._fields.matchcap.value
	}
	public set matchcap(value: number) {
		this._fields.matchcap.value = value
	}

	// prefix is the entire regexp
	public get prefixComplete(): boolean {
		return this._fields.prefixComplete.value
	}
	public set prefixComplete(value: boolean) {
		this._fields.prefixComplete.value = value
	}

	// empty-width conditions required at start of match
	public get cond(): syntax.EmptyOp {
		return this._fields.cond.value
	}
	public set cond(value: syntax.EmptyOp) {
		this._fields.cond.value = value
	}

	// minimum length of the input in bytes
	public get minInputLen(): number {
		return this._fields.minInputLen.value
	}
	public set minInputLen(value: number) {
		this._fields.minInputLen.value = value
	}

	// This field can be modified by the Longest method,
	// but it is otherwise read-only.
	// whether regexp prefers leftmost-longest match
	public get longest(): boolean {
		return this._fields.longest.value
	}
	public set longest(value: boolean) {
		this._fields.longest.value = value
	}

	public _fields: {
		expr: $.VarRef<string>;
		prog: $.VarRef<syntax.Prog | null>;
		onepass: $.VarRef<onePassProg | null>;
		numSubexp: $.VarRef<number>;
		maxBitStateLen: $.VarRef<number>;
		subexpNames: $.VarRef<$.Slice<string>>;
		prefix: $.VarRef<string>;
		prefixBytes: $.VarRef<$.Bytes>;
		prefixRune: $.VarRef<number>;
		prefixEnd: $.VarRef<number>;
		mpool: $.VarRef<number>;
		matchcap: $.VarRef<number>;
		prefixComplete: $.VarRef<boolean>;
		cond: $.VarRef<syntax.EmptyOp>;
		minInputLen: $.VarRef<number>;
		longest: $.VarRef<boolean>;
	}

	constructor(init?: Partial<{cond?: syntax.EmptyOp, expr?: string, longest?: boolean, matchcap?: number, maxBitStateLen?: number, minInputLen?: number, mpool?: number, numSubexp?: number, onepass?: onePassProg | null, prefix?: string, prefixBytes?: $.Bytes, prefixComplete?: boolean, prefixEnd?: number, prefixRune?: number, prog?: syntax.Prog | null, subexpNames?: $.Slice<string>}>) {
		this._fields = {
			expr: $.varRef(init?.expr ?? ""),
			prog: $.varRef(init?.prog ?? null),
			onepass: $.varRef(init?.onepass ?? null),
			numSubexp: $.varRef(init?.numSubexp ?? 0),
			maxBitStateLen: $.varRef(init?.maxBitStateLen ?? 0),
			subexpNames: $.varRef(init?.subexpNames ?? null),
			prefix: $.varRef(init?.prefix ?? ""),
			prefixBytes: $.varRef(init?.prefixBytes ?? new Uint8Array(0)),
			prefixRune: $.varRef(init?.prefixRune ?? 0),
			prefixEnd: $.varRef(init?.prefixEnd ?? 0),
			mpool: $.varRef(init?.mpool ?? 0),
			matchcap: $.varRef(init?.matchcap ?? 0),
			prefixComplete: $.varRef(init?.prefixComplete ?? false),
			cond: $.varRef(init?.cond ?? 0),
			minInputLen: $.varRef(init?.minInputLen ?? 0),
			longest: $.varRef(init?.longest ?? false)
		}
	}

	public clone(): Regexp {
		const cloned = new Regexp()
		cloned._fields = {
			expr: $.varRef(this._fields.expr.value),
			prog: $.varRef(this._fields.prog.value),
			onepass: $.varRef(this._fields.onepass.value),
			numSubexp: $.varRef(this._fields.numSubexp.value),
			maxBitStateLen: $.varRef(this._fields.maxBitStateLen.value),
			subexpNames: $.varRef(this._fields.subexpNames.value),
			prefix: $.varRef(this._fields.prefix.value),
			prefixBytes: $.varRef(this._fields.prefixBytes.value),
			prefixRune: $.varRef(this._fields.prefixRune.value),
			prefixEnd: $.varRef(this._fields.prefixEnd.value),
			mpool: $.varRef(this._fields.mpool.value),
			matchcap: $.varRef(this._fields.matchcap.value),
			prefixComplete: $.varRef(this._fields.prefixComplete.value),
			cond: $.varRef(this._fields.cond.value),
			minInputLen: $.varRef(this._fields.minInputLen.value),
			longest: $.varRef(this._fields.longest.value)
		}
		return cloned
	}

	// tryBacktrack runs a backtracking search starting at pos.
	public tryBacktrack(b: bitState | null, i: input, pc: number, pos: number): boolean {
		const re = this
		let longest = re!.longest
		b.push(re, pc, pos, false)
		for (; $.len(b.jobs) > 0; ) {
			let l = $.len(b.jobs) - 1

			let pc = b.jobs![l].pc
			let pos = b.jobs![l].pos
			let arg = b.jobs![l].arg
			b.jobs = $.goSlice(b.jobs, undefined, l)

			// goto Skip // goto statement skipped
			CheckAndLoop: if (!b.shouldVisit(pc, pos)) {
				continue
			}
			Skip: {
				let inst = re!.prog!.Inst![pc]
			}

			switch (inst!.Op) {
				default:
					$.panic("bad inst")
					break
				case syntax.InstFail:
					$.panic("unexpected InstFail")
					break
				case syntax.InstAlt:
					if (arg) {

						arg = false
						pc = inst!.Arg
						// goto CheckAndLoop // goto statement skipped
					} else {
						b.push(re, pc, pos, true)
						pc = inst!.Out
						// goto CheckAndLoop // goto statement skipped
					}
					break
				case syntax.InstAltMatch:
					switch (re!.prog!.Inst![inst!.Out].Op) {
						case syntax.InstRune:
						case syntax.InstRune1:
						case syntax.InstRuneAny:
						case syntax.InstRuneAnyNotNL:
							b.push(re, inst!.Arg, pos, false)
							pc = inst!.Arg
							pos = b.end
							// goto CheckAndLoop // goto statement skipped
							break
					}
					b.push(re, inst!.Out, b.end, false)
					pc = inst!.Out
					// goto CheckAndLoop // goto statement skipped
					break
				case syntax.InstRune:
					let [r, width] = i!.step(pos)
					if (!inst!.MatchRune(r)) {
						continue
					}
					pos += width
					pc = inst!.Out
					// goto CheckAndLoop // goto statement skipped
					break
				case syntax.InstRune1:
					let [r, width] = i!.step(pos)
					if (r != inst!.Rune![0]) {
						continue
					}
					pos += width
					pc = inst!.Out
					// goto CheckAndLoop // goto statement skipped
					break
				case syntax.InstRuneAnyNotNL:
					let [r, width] = i!.step(pos)
					if (r == 10 || r == -1) {
						continue
					}
					pos += width
					pc = inst!.Out
					// goto CheckAndLoop // goto statement skipped
					break
				case syntax.InstRuneAny:
					let [r, width] = i!.step(pos)
					if (r == -1) {
						continue
					}
					pos += width
					pc = inst!.Out
					// goto CheckAndLoop // goto statement skipped
					break
				case syntax.InstCapture:
					if (arg) {

						b.cap![inst!.Arg] = pos
						continue
					} else {
						if (inst!.Arg < ($.len(b.cap) as number)) {

							b.push(re, pc, b.cap![inst!.Arg], true)
							b.cap![inst!.Arg] = pos
						}
						pc = inst!.Out
						// goto CheckAndLoop // goto statement skipped
					}
					break
				case syntax.InstEmptyWidth:
					let flag = i!.context(pos)
					if (!flag.match(syntax.EmptyOp(inst!.Arg))) {
						continue
					}
					pc = inst!.Out
					// goto CheckAndLoop // goto statement skipped
					break
				case syntax.InstNop:
					pc = inst!.Out
					// goto CheckAndLoop // goto statement skipped
					break
				case syntax.InstMatch:
					if ($.len(b.cap) == 0) {
						return true
					}
					if ($.len(b.cap) > 1) {
						b.cap![1] = pos
					}
					{
						let old = b.matchcap![1]
						if (old == -1 || (longest && pos > 0 && pos > old)) {
							$.copy(b.matchcap, b.cap)
						}
					}
					if (!longest) {
						return true
					}
					if (pos == b.end) {
						return true
					}
					continue
					break
			}
		}
		return longest && $.len(b.matchcap) > 1 && b.matchcap![1] >= 0
	}

	// backtrack runs a backtracking search of prog on the input starting at pos.
	public backtrack(ib: $.Bytes, _is: string, pos: number, ncap: number, dstCap: $.Slice<number>): $.Slice<number> {
		const re = this
		let startCond = re!.cond
		if (startCond == ~syntax.EmptyOp(0)) {
			return null
		}
		if ((startCond & syntax.EmptyBeginText) != 0 && pos != 0) {

			return null
		}
		let b = newBitState()
		let [i, end] = b.inputs.init(null, ib, _is)
		b.reset(re!.prog, end, ncap)
		if ((startCond & syntax.EmptyBeginText) != 0) {
			if ($.len(b.cap) > 0) {
				b.cap![0] = pos
			}
			if (!re!.tryBacktrack(b, i, (re!.prog!.Start as number), pos)) {
				freeBitState(b)
				return null
			}
		} else {

			let width = -1
			for (; pos <= end && width != 0; pos += width) {
				if ($.len(re!.prefix) > 0) {

					let advance = i!.index(re, pos)
					if (advance < 0) {
						freeBitState(b)
						return null
					}
					pos += advance
				}

				if ($.len(b.cap) > 0) {
					b.cap![0] = pos
				}
				if (re!.tryBacktrack(b, i, (re!.prog!.Start as number), pos)) {

					// goto Match // goto statement skipped
				}
				;[, width] = i!.step(pos)
			}
			freeBitState(b)
			return null
		}
		Match: dstCap = $.append(dstCap, b.matchcap)
		freeBitState(b)
		return dstCap
	}

	// doOnePass implements r.doExecute using the one-pass execution engine.
	public doOnePass(ir: io.RuneReader, ib: $.Bytes, _is: string, pos: number, ncap: number, dstCap: $.Slice<number>): $.Slice<number> {
		const re = this
		let startCond = re!.cond
		if (startCond == ~syntax.EmptyOp(0)) {
			return null
		}
		let m = newOnePassMachine()
		if ($.cap(m.matchcap) < ncap) {
			m.matchcap = $.makeSlice<number>(ncap, undefined, 'number')
		} else {
			m.matchcap = $.goSlice(m.matchcap, undefined, ncap)
		}
		let matched = false
		for (let i = 0; i < $.len(m.matchcap); i++) {
			{
				m.matchcap![i] = -1
			}
		}
		let [i, ] = m.inputs.init(ir, ib, _is)
		let [r, r1] = [-1, -1]
		let [width, width1] = [0, 0]
		;[r, width] = i!.step(pos)
		if (r != -1) {
			;[r1, width1] = i!.step(pos + width)
		}
		let flag: lazyFlag = new lazyFlag(0)
		if (pos == 0) {
			flag = newLazyFlag(-1, r)
		} else {
			flag = i!.context(pos)
		}
		let pc = re!.onepass!.Start
		let inst = re!.onepass!.Inst![pc]
		if (pos == 0 && flag.match(syntax.EmptyOp(inst!.Arg)) && $.len(re!.prefix) > 0 && i!.canCheckPrefix()) {

			if (!i!.hasPrefix(re)) {
				// goto Return // goto statement skipped
			}
			pos += $.len(re!.prefix)
			;[r, width] = i!.step(pos)
			;[r1, width1] = i!.step(pos + width)
			flag = i!.context(pos)
			pc = $.int(re!.prefixEnd)
		}
		for (; ; ) {
			inst = re!.onepass!.Inst![pc]
			pc = $.int(inst!.Out)
			switch (inst!.Op) {
				default:
					$.panic("bad inst")
					break
				case syntax.InstMatch:
					matched = true
					if ($.len(m.matchcap) > 0) {
						m.matchcap![0] = 0
						m.matchcap![1] = pos
					}
					// goto Return // goto statement skipped
					break
				case syntax.InstRune:
					if (!inst!.MatchRune(r)) {
						// goto Return // goto statement skipped
					}
					break
				case syntax.InstRune1:
					if (r != inst!.Rune![0]) {
						// goto Return // goto statement skipped
					}
					break
				case syntax.InstRuneAny:
					break
				case syntax.InstRuneAnyNotNL:
					if (r == 10) {
						// goto Return // goto statement skipped
					}
					break
				case syntax.InstAlt:
				case syntax.InstAltMatch:
					pc = $.int(onePassNext(inst, r))
					continue
					break
				case syntax.InstFail:
					// goto Return // goto statement skipped
					break
				case syntax.InstNop:
					continue
					break
				case syntax.InstEmptyWidth:
					if (!flag.match(syntax.EmptyOp(inst!.Arg))) {
						// goto Return // goto statement skipped
					}
					continue
					break
				case syntax.InstCapture:
					if ($.int(inst!.Arg) < $.len(m.matchcap)) {
						m.matchcap![inst!.Arg] = pos
					}
					continue
					break
			}
			if (width == 0) {
				break
			}
			flag = newLazyFlag(r, r1)
			pos += width
			[r, width] = [r1, width1]
			if (r != -1) {
				;[r1, width1] = i!.step(pos + width)
			}
		}
		Return: if (!matched) {
			freeOnePassMachine(m)
			return null
		}
		dstCap = $.append(dstCap, m.matchcap)
		freeOnePassMachine(m)
		return dstCap
	}

	// doMatch reports whether either r, b or s match the regexp.
	public doMatch(r: io.RuneReader, b: $.Bytes, s: string): boolean {
		const re = this
		return re!.doExecute(r, b, s, 0, 0, null) != null
	}

	// doExecute finds the leftmost match in the input, appends the position
	// of its subexpressions to dstCap and returns dstCap.
	//
	// nil is returned if no matches are found and non-nil if matches are found.
	public doExecute(r: io.RuneReader, b: $.Bytes, s: string, pos: number, ncap: number, dstCap: $.Slice<number>): $.Slice<number> {
		const re = this
		if (dstCap == null) {

			dstCap = $.goSlice(arrayNoInts, undefined, 0, 0)
		}
		if (r == null && $.len(b) + $.len(s) < re!.minInputLen) {
			return null
		}
		if (re!.onepass != null) {
			return re!.doOnePass(r, b, s, pos, ncap, dstCap)
		}
		if (r == null && $.len(b) + $.len(s) < re!.maxBitStateLen) {
			return re!.backtrack(b, s, pos, ncap, dstCap)
		}
		let m = re!._get()
		let [i, ] = m.inputs.init(r, b, s)
		m.init(ncap)
		if (!m.match(i, pos)) {
			re!.put(m)
			return null
		}
		dstCap = $.append(dstCap, m.matchcap)
		re!.put(m)
		return dstCap
	}

	// String returns the source text used to compile the regular expression.
	public String(): string {
		const re = this
		return re!.expr
	}

	// Copy returns a new [Regexp] object copied from re.
	// Calling [Regexp.Longest] on one copy does not affect another.
	//
	// Deprecated: In earlier releases, when using a [Regexp] in multiple goroutines,
	// giving each goroutine its own copy helped to avoid lock contention.
	// As of Go 1.12, using Copy is no longer necessary to avoid lock contention.
	// Copy may still be appropriate if the reason for its use is to make
	// two copies with different [Regexp.Longest] settings.
	public Copy(): Regexp | null {
		const re = this
		let re2 = re!.clone()
		return re2
	}

	// Longest makes future searches prefer the leftmost-longest match.
	// That is, when matching against text, the regexp returns a match that
	// begins as early as possible in the input (leftmost), and among those
	// it chooses a match that is as long as possible.
	// This method modifies the [Regexp] and may not be called concurrently
	// with any other methods.
	public Longest(): void {
		const re = this
		re!.longest = true
	}

	// get returns a machine to use for matching re.
	// It uses the re's machine cache if possible, to avoid
	// unnecessary allocation.
	public _get(): machine | null {
		const re = this
		let { value: m, ok: ok } = $.typeAssert<machine | null>(matchPool![re!.mpool].Get(), {kind: $.TypeKind.Pointer, elemType: 'machine'})
		if (!ok) {
			m = new machine()
		}
		m.re = re
		m.p = re!.prog
		if ($.cap(m.matchcap) < re!.matchcap) {
			m.matchcap = $.makeSlice<number>(re!.matchcap, undefined, 'number')
			for (let _i = 0; _i < $.len(m.pool); _i++) {
				const t = m.pool![_i]
				{
					t.cap = $.makeSlice<number>(re!.matchcap, undefined, 'number')
				}
			}
		}
		let n = matchSize![re!.mpool]
		if (n == 0) {
			// large pool
			n = $.len(re!.prog!.Inst)
		}
		if ($.len(m.q0.sparse) < n) {
			m.q0 = new queue({})
			m.q1 = new queue({})
		}
		return m
	}

	// put returns a machine to the correct machine pool.
	public put(m: machine | null): void {
		const re = this
		m.re = null
		m.p = null
		m.inputs.clear()
		matchPool![re!.mpool].Put(m)
	}

	// NumSubexp returns the number of parenthesized subexpressions in this [Regexp].
	public NumSubexp(): number {
		const re = this
		return re!.numSubexp
	}

	// SubexpNames returns the names of the parenthesized subexpressions
	// in this [Regexp]. The name for the first sub-expression is names[1],
	// so that if m is a match slice, the name for m[i] is SubexpNames()[i].
	// Since the Regexp as a whole cannot be named, names[0] is always
	// the empty string. The slice should not be modified.
	public SubexpNames(): $.Slice<string> {
		const re = this
		return re!.subexpNames
	}

	// SubexpIndex returns the index of the first subexpression with the given name,
	// or -1 if there is no subexpression with that name.
	//
	// Note that multiple subexpressions can be written using the same name, as in
	// (?P<bob>a+)(?P<bob>b+), which declares two subexpressions named "bob".
	// In this case, SubexpIndex returns the index of the leftmost such subexpression
	// in the regular expression.
	public SubexpIndex(name: string): number {
		const re = this
		if (name != "") {
			for (let i = 0; i < $.len(re!.subexpNames); i++) {
				const s = re!.subexpNames![i]
				{
					if (name == s) {
						return i
					}
				}
			}
		}
		return -1
	}

	// LiteralPrefix returns a literal string that must begin any match
	// of the regular expression re. It returns the boolean true if the
	// literal string comprises the entire regular expression.
	public LiteralPrefix(): [string, boolean] {
		const re = this
		return [re!.prefix, re!.prefixComplete]
	}

	// MatchReader reports whether the text returned by the [io.RuneReader]
	// contains any match of the regular expression re.
	public MatchReader(r: io.RuneReader): boolean {
		const re = this
		return re!.doMatch(r, null, "")
	}

	// MatchString reports whether the string s
	// contains any match of the regular expression re.
	public MatchString(s: string): boolean {
		const re = this
		return re!.doMatch(null, null, s)
	}

	// Match reports whether the byte slice b
	// contains any match of the regular expression re.
	public Match(b: $.Bytes): boolean {
		const re = this
		return re!.doMatch(null, b, "")
	}

	// ReplaceAllString returns a copy of src, replacing matches of the [Regexp]
	// with the replacement string repl.
	// Inside repl, $ signs are interpreted as in [Regexp.Expand].
	public ReplaceAllString(src: string, repl: string): string {
		const re = this
		let n = 2
		if (strings.Contains(repl, "$")) {
			n = 2 * (re!.numSubexp + 1)
		}
		let b = re!.replaceAll(null, src, n, (dst: $.Bytes, match: $.Slice<number>): $.Bytes => {
			return re!.expand(dst, repl, null, src, match)
		})
		return $.bytesToString(b)
	}

	// ReplaceAllLiteralString returns a copy of src, replacing matches of the [Regexp]
	// with the replacement string repl. The replacement repl is substituted directly,
	// without using [Regexp.Expand].
	public ReplaceAllLiteralString(src: string, repl: string): string {
		const re = this
		return $.bytesToString(re!.replaceAll(null, src, 2, (dst: $.Bytes, match: $.Slice<number>): $.Bytes => {
			return $.append(dst, ...$.stringToBytes(repl))
		}))
	}

	// ReplaceAllStringFunc returns a copy of src in which all matches of the
	// [Regexp] have been replaced by the return value of function repl applied
	// to the matched substring. The replacement returned by repl is substituted
	// directly, without using [Regexp.Expand].
	public ReplaceAllStringFunc(src: string, repl: ((p0: string) => string) | null): string {
		const re = this
		let b = re!.replaceAll(null, src, 2, (dst: $.Bytes, match: $.Slice<number>): $.Bytes => {
			return $.append(dst, ...$.stringToBytes(repl!($.sliceString(src, match![0], match![1]))))
		})
		return $.bytesToString(b)
	}

	public replaceAll(bsrc: $.Bytes, src: string, nmatch: number, repl: ((dst: $.Bytes, m: $.Slice<number>) => $.Bytes) | null): $.Bytes {
		const re = this
		let lastMatchEnd = 0 // end position of the most recent match
		let searchPos = 0 // position where we next look for a match
		let buf: $.Bytes = new Uint8Array(0)
		let endPos: number = 0
		if (bsrc != null) {
			endPos = $.len(bsrc)
		} else {
			endPos = $.len(src)
		}
		if (nmatch > re!.prog!.NumCap) {
			nmatch = re!.prog!.NumCap
		}
		let dstCap: number[] = [0, 0]
		for (; searchPos <= endPos; ) {
			let a = re!.doExecute(null, bsrc, src, searchPos, nmatch, $.goSlice(dstCap, undefined, 0))

			// no more matches
			if ($.len(a) == 0) {
				break
			}

			// Copy the unmatched characters before this match.
			if (bsrc != null) {
				buf = $.append(buf, $.goSlice(bsrc, lastMatchEnd, a![0]))
			} else {
				buf = $.append(buf, ...$.stringToBytes($.sliceString(src, lastMatchEnd, a![0])))
			}

			// Now insert a copy of the replacement string, but not for a
			// match of the empty string immediately after another match.
			// (Otherwise, we get double replacement for patterns that
			// match both empty and nonempty strings.)
			if (a![1] > lastMatchEnd || a![0] == 0) {
				buf = repl!(buf, a)
			}
			lastMatchEnd = a![1]

			// Advance past this match; always advance at least one character.
			let width: number = 0
			if (bsrc != null) {
				;[, width] = utf8.DecodeRune($.goSlice(bsrc, searchPos, undefined))
			} else {
				;[, width] = utf8.DecodeRuneInString($.sliceString(src, searchPos, undefined))
			}

			// This clause is only needed at the end of the input
			// string. In that case, DecodeRuneInString returns width=0.
			if (searchPos + width > a![1]) {
				searchPos += width
			} else if (searchPos + 1 > a![1]) {
				// This clause is only needed at the end of the input
				// string. In that case, DecodeRuneInString returns width=0.
				searchPos++
			} else {
				searchPos = a![1]
			}
		}
		if (bsrc != null) {
			buf = $.append(buf, $.goSlice(bsrc, lastMatchEnd, undefined))
		} else {
			buf = $.append(buf, ...$.stringToBytes($.sliceString(src, lastMatchEnd, undefined)))
		}
		return buf
	}

	// ReplaceAll returns a copy of src, replacing matches of the [Regexp]
	// with the replacement text repl.
	// Inside repl, $ signs are interpreted as in [Regexp.Expand].
	public ReplaceAll(src: $.Bytes, repl: $.Bytes): $.Bytes {
		const re = this
		let n = 2
		if (bytes.IndexByte(repl, 36) >= 0) {
			n = 2 * (re!.numSubexp + 1)
		}
		let srepl = ""
		let b = re!.replaceAll(src, "", n, (dst: $.Bytes, match: $.Slice<number>): $.Bytes => {
			if ($.len(srepl) != $.len(repl)) {
				srepl = $.bytesToString(repl)
			}
			return re!.expand(dst, srepl, src, "", match)
		})
		return b
	}

	// ReplaceAllLiteral returns a copy of src, replacing matches of the [Regexp]
	// with the replacement bytes repl. The replacement repl is substituted directly,
	// without using [Regexp.Expand].
	public ReplaceAllLiteral(src: $.Bytes, repl: $.Bytes): $.Bytes {
		const re = this
		return re!.replaceAll(src, "", 2, (dst: $.Bytes, match: $.Slice<number>): $.Bytes => {
			return $.append(dst, repl)
		})
	}

	// ReplaceAllFunc returns a copy of src in which all matches of the
	// [Regexp] have been replaced by the return value of function repl applied
	// to the matched byte slice. The replacement returned by repl is substituted
	// directly, without using [Regexp.Expand].
	public ReplaceAllFunc(src: $.Bytes, repl: ((p0: $.Bytes) => $.Bytes) | null): $.Bytes {
		const re = this
		return re!.replaceAll(src, "", 2, (dst: $.Bytes, match: $.Slice<number>): $.Bytes => {
			return $.append(dst, repl!($.goSlice(src, match![0], match![1])))
		})
	}

	// The number of capture values in the program may correspond
	// to fewer capturing expressions than are in the regexp.
	// For example, "(a){0}" turns into an empty program, so the
	// maximum capture in the program is 0 but we need to return
	// an expression for \1.  Pad appends -1s to the slice a as needed.
	public pad(a: $.Slice<number>): $.Slice<number> {
		const re = this
		if (a == null) {
			// No match.
			return null
		}
		let n = (1 + re!.numSubexp) * 2
		for (; $.len(a) < n; ) {
			a = $.append(a, -1)
		}
		return a
	}

	// allMatches calls deliver at most n times
	// with the location of successive matches in the input text.
	// The input text is b if non-nil, otherwise s.
	public allMatches(s: string, b: $.Bytes, n: number, deliver: ((p0: $.Slice<number>) => void) | null): void {
		const re = this
		let end: number = 0
		if (b == null) {
			end = $.len(s)
		} else {
			end = $.len(b)
		}
		for (let pos = 0, i = 0, prevMatchEnd = -1; i < n && pos <= end; ) {
			let matches = re!.doExecute(null, b, s, pos, re!.prog!.NumCap, null)
			if ($.len(matches) == 0) {
				break
			}

			let accept = true

			// We've found an empty match.

			// We don't allow an empty match right
			// after a previous match, so ignore it.
			if (matches![1] == pos) {
				// We've found an empty match.

				// We don't allow an empty match right
				// after a previous match, so ignore it.
				if (matches![0] == prevMatchEnd) {
					// We don't allow an empty match right
					// after a previous match, so ignore it.
					accept = false
				}
				let width: number = 0
				if (b == null) {
					let _is = new inputString({str: s})
					;[, width] = _is.step(pos)
				} else {
					let ib = new inputBytes({str: b})
					;[, width] = ib.step(pos)
				}
				if (width > 0) {
					pos += width
				} else {
					pos = end + 1
				}
			} else {
				pos = matches![1]
			}
			prevMatchEnd = matches![1]

			if (accept) {
				deliver!(re!.pad(matches))
				i++
			}
		}
	}

	// Find returns a slice holding the text of the leftmost match in b of the regular expression.
	// A return value of nil indicates no match.
	public Find(b: $.Bytes): $.Bytes {
		const re = this
		let dstCap: number[] = [0, 0]
		let a = re!.doExecute(null, b, "", 0, 2, $.goSlice(dstCap, undefined, 0))
		if (a == null) {
			return null
		}
		return $.goSlice(b, a![0], a![1], a![1])
	}

	// FindIndex returns a two-element slice of integers defining the location of
	// the leftmost match in b of the regular expression. The match itself is at
	// b[loc[0]:loc[1]].
	// A return value of nil indicates no match.
	public FindIndex(b: $.Bytes): $.Slice<number> {
		const re = this
		let a = re!.doExecute(null, b, "", 0, 2, null)
		if (a == null) {
			return null
		}
		return $.goSlice(a, 0, 2)
	}

	// FindString returns a string holding the text of the leftmost match in s of the regular
	// expression. If there is no match, the return value is an empty string,
	// but it will also be empty if the regular expression successfully matches
	// an empty string. Use [Regexp.FindStringIndex] or [Regexp.FindStringSubmatch] if it is
	// necessary to distinguish these cases.
	public FindString(s: string): string {
		const re = this
		let dstCap: number[] = [0, 0]
		let a = re!.doExecute(null, null, s, 0, 2, $.goSlice(dstCap, undefined, 0))
		if (a == null) {
			return ""
		}
		return $.sliceString(s, a![0], a![1])
	}

	// FindStringIndex returns a two-element slice of integers defining the
	// location of the leftmost match in s of the regular expression. The match
	// itself is at s[loc[0]:loc[1]].
	// A return value of nil indicates no match.
	public FindStringIndex(s: string): $.Slice<number> {
		const re = this
		let a = re!.doExecute(null, null, s, 0, 2, null)
		if (a == null) {
			return null
		}
		return $.goSlice(a, 0, 2)
	}

	// FindReaderIndex returns a two-element slice of integers defining the
	// location of the leftmost match of the regular expression in text read from
	// the [io.RuneReader]. The match text was found in the input stream at
	// byte offset loc[0] through loc[1]-1.
	// A return value of nil indicates no match.
	public FindReaderIndex(r: io.RuneReader): $.Slice<number> {
		const re = this
		let a = re!.doExecute(r, null, "", 0, 2, null)
		if (a == null) {
			return null
		}
		return $.goSlice(a, 0, 2)
	}

	// FindSubmatch returns a slice of slices holding the text of the leftmost
	// match of the regular expression in b and the matches, if any, of its
	// subexpressions, as defined by the 'Submatch' descriptions in the package
	// comment.
	// A return value of nil indicates no match.
	public FindSubmatch(b: $.Bytes): $.Slice<$.Bytes> {
		const re = this
		let dstCap: number[] = [0, 0, 0, 0]
		let a = re!.doExecute(null, b, "", 0, re!.prog!.NumCap, $.goSlice(dstCap, undefined, 0))
		if (a == null) {
			return null
		}
		let ret = $.makeSlice<$.Bytes>(1 + re!.numSubexp)
		for (let i = 0; i < $.len(ret); i++) {
			{
				if (2 * i < $.len(a) && a![2 * i] >= 0) {
					ret![i] = $.goSlice(b, a![2 * i], a![2 * i + 1], a![2 * i + 1])
				}
			}
		}
		return ret
	}

	// Expand appends template to dst and returns the result; during the
	// append, Expand replaces variables in the template with corresponding
	// matches drawn from src. The match slice should have been returned by
	// [Regexp.FindSubmatchIndex].
	//
	// In the template, a variable is denoted by a substring of the form
	// $name or ${name}, where name is a non-empty sequence of letters,
	// digits, and underscores. A purely numeric name like $1 refers to
	// the submatch with the corresponding index; other names refer to
	// capturing parentheses named with the (?P<name>...) syntax. A
	// reference to an out of range or unmatched index or a name that is not
	// present in the regular expression is replaced with an empty slice.
	//
	// In the $name form, name is taken to be as long as possible: $1x is
	// equivalent to ${1x}, not ${1}x, and, $10 is equivalent to ${10}, not ${1}0.
	//
	// To insert a literal $ in the output, use $$ in the template.
	public Expand(dst: $.Bytes, template: $.Bytes, src: $.Bytes, match: $.Slice<number>): $.Bytes {
		const re = this
		return re!.expand(dst, $.bytesToString(template), src, "", match)
	}

	// ExpandString is like [Regexp.Expand] but the template and source are strings.
	// It appends to and returns a byte slice in order to give the calling
	// code control over allocation.
	public ExpandString(dst: $.Bytes, template: string, src: string, match: $.Slice<number>): $.Bytes {
		const re = this
		return re!.expand(dst, template, null, src, match)
	}

	public expand(dst: $.Bytes, template: string, bsrc: $.Bytes, src: string, match: $.Slice<number>): $.Bytes {
		const re = this
		for (; $.len(template) > 0; ) {
			let [before, after, ok] = strings.Cut(template, "$")
			if (!ok) {
				break
			}
			dst = $.append(dst, ...$.stringToBytes(before))
			template = after

			// Treat $$ as $.
			if (template != "" && $.indexString(template, 0) == 36) {
				// Treat $$ as $.
				dst = $.append(dst, 36)
				template = $.sliceString(template, 1, undefined)
				continue
			}
			let name: string
			let num: number
			let rest: string
			[name, num, rest, ok] = extract(template)

			// Malformed; treat $ as raw text.
			if (!ok) {
				// Malformed; treat $ as raw text.
				dst = $.append(dst, 36)
				continue
			}
			template = rest
			if (num >= 0) {
				if (2 * num + 1 < $.len(match) && match![2 * num] >= 0) {
					if (bsrc != null) {
						dst = $.append(dst, $.goSlice(bsrc, match![2 * num], match![2 * num + 1]))
					} else {
						dst = $.append(dst, ...$.stringToBytes($.sliceString(src, match![2 * num], match![2 * num + 1])))
					}
				}
			} else {
				for (let i = 0; i < $.len(re!.subexpNames); i++) {
					const namei = re!.subexpNames![i]
					{
						if (name == namei && 2 * i + 1 < $.len(match) && match![2 * i] >= 0) {
							if (bsrc != null) {
								dst = $.append(dst, $.goSlice(bsrc, match![2 * i], match![2 * i + 1]))
							} else {
								dst = $.append(dst, ...$.stringToBytes($.sliceString(src, match![2 * i], match![2 * i + 1])))
							}
							break
						}
					}
				}
			}
		}
		dst = $.append(dst, ...$.stringToBytes(template))
		return dst
	}

	// FindSubmatchIndex returns a slice holding the index pairs identifying the
	// leftmost match of the regular expression in b and the matches, if any, of
	// its subexpressions, as defined by the 'Submatch' and 'Index' descriptions
	// in the package comment.
	// A return value of nil indicates no match.
	public FindSubmatchIndex(b: $.Bytes): $.Slice<number> {
		const re = this
		return re!.pad(re!.doExecute(null, b, "", 0, re!.prog!.NumCap, null))
	}

	// FindStringSubmatch returns a slice of strings holding the text of the
	// leftmost match of the regular expression in s and the matches, if any, of
	// its subexpressions, as defined by the 'Submatch' description in the
	// package comment.
	// A return value of nil indicates no match.
	public FindStringSubmatch(s: string): $.Slice<string> {
		const re = this
		let dstCap: number[] = [0, 0, 0, 0]
		let a = re!.doExecute(null, null, s, 0, re!.prog!.NumCap, $.goSlice(dstCap, undefined, 0))
		if (a == null) {
			return null
		}
		let ret = $.makeSlice<string>(1 + re!.numSubexp, undefined, 'string')
		for (let i = 0; i < $.len(ret); i++) {
			{
				if (2 * i < $.len(a) && a![2 * i] >= 0) {
					ret![i] = $.sliceString(s, a![2 * i], a![2 * i + 1])
				}
			}
		}
		return ret
	}

	// FindStringSubmatchIndex returns a slice holding the index pairs
	// identifying the leftmost match of the regular expression in s and the
	// matches, if any, of its subexpressions, as defined by the 'Submatch' and
	// 'Index' descriptions in the package comment.
	// A return value of nil indicates no match.
	public FindStringSubmatchIndex(s: string): $.Slice<number> {
		const re = this
		return re!.pad(re!.doExecute(null, null, s, 0, re!.prog!.NumCap, null))
	}

	// FindReaderSubmatchIndex returns a slice holding the index pairs
	// identifying the leftmost match of the regular expression of text read by
	// the [io.RuneReader], and the matches, if any, of its subexpressions, as defined
	// by the 'Submatch' and 'Index' descriptions in the package comment. A
	// return value of nil indicates no match.
	public FindReaderSubmatchIndex(r: io.RuneReader): $.Slice<number> {
		const re = this
		return re!.pad(re!.doExecute(r, null, "", 0, re!.prog!.NumCap, null))
	}

	// FindAll is the 'All' version of [Regexp.Find]; it returns a slice of all successive
	// matches of the expression, as defined by the 'All' description in the
	// package comment.
	// A return value of nil indicates no match.
	public FindAll(b: $.Bytes, n: number): $.Slice<$.Bytes> {
		const re = this
		if (n < 0) {
			n = $.len(b) + 1
		}
		let result: $.Slice<$.Bytes> = null
		re!.allMatches("", b, n, (match: $.Slice<number>): void => {
			if (result == null) {
				result = $.makeSlice<$.Bytes>(0, 10)
			}
			result = $.append(result, $.goSlice(b, match![0], match![1], match![1]))
		})
		return result
	}

	// FindAllIndex is the 'All' version of [Regexp.FindIndex]; it returns a slice of all
	// successive matches of the expression, as defined by the 'All' description
	// in the package comment.
	// A return value of nil indicates no match.
	public FindAllIndex(b: $.Bytes, n: number): $.Slice<$.Slice<number>> {
		const re = this
		if (n < 0) {
			n = $.len(b) + 1
		}
		let result: $.Slice<$.Slice<number>> = null
		re!.allMatches("", b, n, (match: $.Slice<number>): void => {
			if (result == null) {
				result = $.makeSlice<$.Slice<number>>(0, 10)
			}
			result = $.append(result, $.goSlice(match, 0, 2))
		})
		return result
	}

	// FindAllString is the 'All' version of [Regexp.FindString]; it returns a slice of all
	// successive matches of the expression, as defined by the 'All' description
	// in the package comment.
	// A return value of nil indicates no match.
	public FindAllString(s: string, n: number): $.Slice<string> {
		const re = this
		if (n < 0) {
			n = $.len(s) + 1
		}
		let result: $.Slice<string> = null
		re!.allMatches(s, null, n, (match: $.Slice<number>): void => {
			if (result == null) {
				result = $.makeSlice<string>(0, 10, 'string')
			}
			result = $.append(result, $.sliceString(s, match![0], match![1]))
		})
		return result
	}

	// FindAllStringIndex is the 'All' version of [Regexp.FindStringIndex]; it returns a
	// slice of all successive matches of the expression, as defined by the 'All'
	// description in the package comment.
	// A return value of nil indicates no match.
	public FindAllStringIndex(s: string, n: number): $.Slice<$.Slice<number>> {
		const re = this
		if (n < 0) {
			n = $.len(s) + 1
		}
		let result: $.Slice<$.Slice<number>> = null
		re!.allMatches(s, null, n, (match: $.Slice<number>): void => {
			if (result == null) {
				result = $.makeSlice<$.Slice<number>>(0, 10)
			}
			result = $.append(result, $.goSlice(match, 0, 2))
		})
		return result
	}

	// FindAllSubmatch is the 'All' version of [Regexp.FindSubmatch]; it returns a slice
	// of all successive matches of the expression, as defined by the 'All'
	// description in the package comment.
	// A return value of nil indicates no match.
	public FindAllSubmatch(b: $.Bytes, n: number): $.Slice<$.Slice<$.Bytes>> {
		const re = this
		if (n < 0) {
			n = $.len(b) + 1
		}
		let result: $.Slice<$.Slice<$.Bytes>> = null
		re!.allMatches("", b, n, (match: $.Slice<number>): void => {
			if (result == null) {
				result = $.makeSlice<$.Slice<$.Bytes>>(0, 10)
			}
			let slice = $.makeSlice<$.Bytes>($.len(match) / 2)
			for (let j = 0; j < $.len(slice); j++) {
				{
					if (match![2 * j] >= 0) {
						slice![j] = $.goSlice(b, match![2 * j], match![2 * j + 1], match![2 * j + 1])
					}
				}
			}
			result = $.append(result, slice)
		})
		return result
	}

	// FindAllSubmatchIndex is the 'All' version of [Regexp.FindSubmatchIndex]; it returns
	// a slice of all successive matches of the expression, as defined by the
	// 'All' description in the package comment.
	// A return value of nil indicates no match.
	public FindAllSubmatchIndex(b: $.Bytes, n: number): $.Slice<$.Slice<number>> {
		const re = this
		if (n < 0) {
			n = $.len(b) + 1
		}
		let result: $.Slice<$.Slice<number>> = null
		re!.allMatches("", b, n, (match: $.Slice<number>): void => {
			if (result == null) {
				result = $.makeSlice<$.Slice<number>>(0, 10)
			}
			result = $.append(result, match)
		})
		return result
	}

	// FindAllStringSubmatch is the 'All' version of [Regexp.FindStringSubmatch]; it
	// returns a slice of all successive matches of the expression, as defined by
	// the 'All' description in the package comment.
	// A return value of nil indicates no match.
	public FindAllStringSubmatch(s: string, n: number): $.Slice<$.Slice<string>> {
		const re = this
		if (n < 0) {
			n = $.len(s) + 1
		}
		let result: $.Slice<$.Slice<string>> = null
		re!.allMatches(s, null, n, (match: $.Slice<number>): void => {
			if (result == null) {
				result = $.makeSlice<$.Slice<string>>(0, 10)
			}
			let slice = $.makeSlice<string>($.len(match) / 2, undefined, 'string')
			for (let j = 0; j < $.len(slice); j++) {
				{
					if (match![2 * j] >= 0) {
						slice![j] = $.sliceString(s, match![2 * j], match![2 * j + 1])
					}
				}
			}
			result = $.append(result, slice)
		})
		return result
	}

	// FindAllStringSubmatchIndex is the 'All' version of
	// [Regexp.FindStringSubmatchIndex]; it returns a slice of all successive matches of
	// the expression, as defined by the 'All' description in the package
	// comment.
	// A return value of nil indicates no match.
	public FindAllStringSubmatchIndex(s: string, n: number): $.Slice<$.Slice<number>> {
		const re = this
		if (n < 0) {
			n = $.len(s) + 1
		}
		let result: $.Slice<$.Slice<number>> = null
		re!.allMatches(s, null, n, (match: $.Slice<number>): void => {
			if (result == null) {
				result = $.makeSlice<$.Slice<number>>(0, 10)
			}
			result = $.append(result, match)
		})
		return result
	}

	// Split slices s into substrings separated by the expression and returns a slice of
	// the substrings between those expression matches.
	//
	// The slice returned by this method consists of all the substrings of s
	// not contained in the slice returned by [Regexp.FindAllString]. When called on an expression
	// that contains no metacharacters, it is equivalent to [strings.SplitN].
	//
	// Example:
	//
	//	s := regexp.MustCompile("a*").Split("abaabaccadaaae", 5)
	//	// s: ["", "b", "b", "c", "cadaaae"]
	//
	// The count determines the number of substrings to return:
	//   - n > 0: at most n substrings; the last substring will be the unsplit remainder;
	//   - n == 0: the result is nil (zero substrings);
	//   - n < 0: all substrings.
	public Split(s: string, n: number): $.Slice<string> {
		const re = this
		if (n == 0) {
			return null
		}
		if ($.len(re!.expr) > 0 && $.len(s) == 0) {
			return $.arrayToSlice<string>([""])
		}
		let matches = re!.FindAllStringIndex(s, n)
		let strings = $.makeSlice<string>(0, $.len(matches), 'string')
		let beg = 0
		let end = 0
		for (let _i = 0; _i < $.len(matches); _i++) {
			const match = matches![_i]
			{
				if (n > 0 && $.len(strings) >= n - 1) {
					break
				}

				end = match![0]
				if (match![1] != 0) {
					strings = $.append(strings, $.sliceString(s, beg, end))
				}
				beg = match![1]
			}
		}
		if (end != $.len(s)) {
			strings = $.append(strings, $.sliceString(s, beg, undefined))
		}
		return strings
	}

	// AppendText implements [encoding.TextAppender]. The output
	// matches that of calling the [Regexp.String] method.
	//
	// Note that the output is lossy in some cases: This method does not indicate
	// POSIX regular expressions (i.e. those compiled by calling [CompilePOSIX]), or
	// those for which the [Regexp.Longest] method has been called.
	public AppendText(b: $.Bytes): [$.Bytes, $.GoError] {
		const re = this
		return [$.append(b, ...$.stringToBytes(re!.String())), null]
	}

	// MarshalText implements [encoding.TextMarshaler]. The output
	// matches that of calling the [Regexp.AppendText] method.
	//
	// See [Regexp.AppendText] for more information.
	public MarshalText(): [$.Bytes, $.GoError] {
		const re = this
		return null
	}

	// UnmarshalText implements [encoding.TextUnmarshaler] by calling
	// [Compile] on the encoded value.
	public UnmarshalText(text: $.Bytes): $.GoError {
		const re = this
		let [newRE, err] = Compile($.bytesToString(text))
		if (err != null) {
			return err
		}
		re!.value = newRE!.clone()
		return null
	}

	// Register this type with the runtime type system
	static __typeInfo = $.registerStructType(
	  'Regexp',
	  new Regexp(),
	  [{ name: "tryBacktrack", args: [{ name: "b", type: { kind: $.TypeKind.Pointer, elemType: "bitState" } }, { name: "i", type: "input" }, { name: "pc", type: { kind: $.TypeKind.Basic, name: "number" } }, { name: "pos", type: { kind: $.TypeKind.Basic, name: "number" } }], returns: [{ type: { kind: $.TypeKind.Basic, name: "boolean" } }] }, { name: "backtrack", args: [{ name: "ib", type: { kind: $.TypeKind.Slice, elemType: { kind: $.TypeKind.Basic, name: "number" } } }, { name: "is", type: { kind: $.TypeKind.Basic, name: "string" } }, { name: "pos", type: { kind: $.TypeKind.Basic, name: "number" } }, { name: "ncap", type: { kind: $.TypeKind.Basic, name: "number" } }, { name: "dstCap", type: { kind: $.TypeKind.Slice, elemType: { kind: $.TypeKind.Basic, name: "number" } } }], returns: [{ type: { kind: $.TypeKind.Slice, elemType: { kind: $.TypeKind.Basic, name: "number" } } }] }, { name: "doOnePass", args: [{ name: "ir", type: "RuneReader" }, { name: "ib", type: { kind: $.TypeKind.Slice, elemType: { kind: $.TypeKind.Basic, name: "number" } } }, { name: "is", type: { kind: $.TypeKind.Basic, name: "string" } }, { name: "pos", type: { kind: $.TypeKind.Basic, name: "number" } }, { name: "ncap", type: { kind: $.TypeKind.Basic, name: "number" } }, { name: "dstCap", type: { kind: $.TypeKind.Slice, elemType: { kind: $.TypeKind.Basic, name: "number" } } }], returns: [{ type: { kind: $.TypeKind.Slice, elemType: { kind: $.TypeKind.Basic, name: "number" } } }] }, { name: "doMatch", args: [{ name: "r", type: "RuneReader" }, { name: "b", type: { kind: $.TypeKind.Slice, elemType: { kind: $.TypeKind.Basic, name: "number" } } }, { name: "s", type: { kind: $.TypeKind.Basic, name: "string" } }], returns: [{ type: { kind: $.TypeKind.Basic, name: "boolean" } }] }, { name: "doExecute", args: [{ name: "r", type: "RuneReader" }, { name: "b", type: { kind: $.TypeKind.Slice, elemType: { kind: $.TypeKind.Basic, name: "number" } } }, { name: "s", type: { kind: $.TypeKind.Basic, name: "string" } }, { name: "pos", type: { kind: $.TypeKind.Basic, name: "number" } }, { name: "ncap", type: { kind: $.TypeKind.Basic, name: "number" } }, { name: "dstCap", type: { kind: $.TypeKind.Slice, elemType: { kind: $.TypeKind.Basic, name: "number" } } }], returns: [{ type: { kind: $.TypeKind.Slice, elemType: { kind: $.TypeKind.Basic, name: "number" } } }] }, { name: "String", args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: "string" } }] }, { name: "Copy", args: [], returns: [{ type: { kind: $.TypeKind.Pointer, elemType: "Regexp" } }] }, { name: "Longest", args: [], returns: [] }, { name: "get", args: [], returns: [{ type: { kind: $.TypeKind.Pointer, elemType: "machine" } }] }, { name: "put", args: [{ name: "m", type: { kind: $.TypeKind.Pointer, elemType: "machine" } }], returns: [] }, { name: "NumSubexp", args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: "number" } }] }, { name: "SubexpNames", args: [], returns: [{ type: { kind: $.TypeKind.Slice, elemType: { kind: $.TypeKind.Basic, name: "string" } } }] }, { name: "SubexpIndex", args: [{ name: "name", type: { kind: $.TypeKind.Basic, name: "string" } }], returns: [{ type: { kind: $.TypeKind.Basic, name: "number" } }] }, { name: "LiteralPrefix", args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: "string" } }, { type: { kind: $.TypeKind.Basic, name: "boolean" } }] }, { name: "MatchReader", args: [{ name: "r", type: "RuneReader" }], returns: [{ type: { kind: $.TypeKind.Basic, name: "boolean" } }] }, { name: "MatchString", args: [{ name: "s", type: { kind: $.TypeKind.Basic, name: "string" } }], returns: [{ type: { kind: $.TypeKind.Basic, name: "boolean" } }] }, { name: "Match", args: [{ name: "b", type: { kind: $.TypeKind.Slice, elemType: { kind: $.TypeKind.Basic, name: "number" } } }], returns: [{ type: { kind: $.TypeKind.Basic, name: "boolean" } }] }, { name: "ReplaceAllString", args: [{ name: "src", type: { kind: $.TypeKind.Basic, name: "string" } }, { name: "repl", type: { kind: $.TypeKind.Basic, name: "string" } }], returns: [{ type: { kind: $.TypeKind.Basic, name: "string" } }] }, { name: "ReplaceAllLiteralString", args: [{ name: "src", type: { kind: $.TypeKind.Basic, name: "string" } }, { name: "repl", type: { kind: $.TypeKind.Basic, name: "string" } }], returns: [{ type: { kind: $.TypeKind.Basic, name: "string" } }] }, { name: "ReplaceAllStringFunc", args: [{ name: "src", type: { kind: $.TypeKind.Basic, name: "string" } }, { name: "repl", type: { kind: $.TypeKind.Function, params: [{ kind: $.TypeKind.Basic, name: "string" }], results: [{ kind: $.TypeKind.Basic, name: "string" }] } }], returns: [{ type: { kind: $.TypeKind.Basic, name: "string" } }] }, { name: "replaceAll", args: [{ name: "bsrc", type: { kind: $.TypeKind.Slice, elemType: { kind: $.TypeKind.Basic, name: "number" } } }, { name: "src", type: { kind: $.TypeKind.Basic, name: "string" } }, { name: "nmatch", type: { kind: $.TypeKind.Basic, name: "number" } }, { name: "repl", type: { kind: $.TypeKind.Function, params: [{ kind: $.TypeKind.Slice, elemType: { kind: $.TypeKind.Basic, name: "number" } }, { kind: $.TypeKind.Slice, elemType: { kind: $.TypeKind.Basic, name: "number" } }], results: [{ kind: $.TypeKind.Slice, elemType: { kind: $.TypeKind.Basic, name: "number" } }] } }], returns: [{ type: { kind: $.TypeKind.Slice, elemType: { kind: $.TypeKind.Basic, name: "number" } } }] }, { name: "ReplaceAll", args: [{ name: "src", type: { kind: $.TypeKind.Slice, elemType: { kind: $.TypeKind.Basic, name: "number" } } }, { name: "repl", type: { kind: $.TypeKind.Slice, elemType: { kind: $.TypeKind.Basic, name: "number" } } }], returns: [{ type: { kind: $.TypeKind.Slice, elemType: { kind: $.TypeKind.Basic, name: "number" } } }] }, { name: "ReplaceAllLiteral", args: [{ name: "src", type: { kind: $.TypeKind.Slice, elemType: { kind: $.TypeKind.Basic, name: "number" } } }, { name: "repl", type: { kind: $.TypeKind.Slice, elemType: { kind: $.TypeKind.Basic, name: "number" } } }], returns: [{ type: { kind: $.TypeKind.Slice, elemType: { kind: $.TypeKind.Basic, name: "number" } } }] }, { name: "ReplaceAllFunc", args: [{ name: "src", type: { kind: $.TypeKind.Slice, elemType: { kind: $.TypeKind.Basic, name: "number" } } }, { name: "repl", type: { kind: $.TypeKind.Function, params: [{ kind: $.TypeKind.Slice, elemType: { kind: $.TypeKind.Basic, name: "number" } }], results: [{ kind: $.TypeKind.Slice, elemType: { kind: $.TypeKind.Basic, name: "number" } }] } }], returns: [{ type: { kind: $.TypeKind.Slice, elemType: { kind: $.TypeKind.Basic, name: "number" } } }] }, { name: "pad", args: [{ name: "a", type: { kind: $.TypeKind.Slice, elemType: { kind: $.TypeKind.Basic, name: "number" } } }], returns: [{ type: { kind: $.TypeKind.Slice, elemType: { kind: $.TypeKind.Basic, name: "number" } } }] }, { name: "allMatches", args: [{ name: "s", type: { kind: $.TypeKind.Basic, name: "string" } }, { name: "b", type: { kind: $.TypeKind.Slice, elemType: { kind: $.TypeKind.Basic, name: "number" } } }, { name: "n", type: { kind: $.TypeKind.Basic, name: "number" } }, { name: "deliver", type: { kind: $.TypeKind.Function, params: [{ kind: $.TypeKind.Slice, elemType: { kind: $.TypeKind.Basic, name: "number" } }], results: [] } }], returns: [] }, { name: "Find", args: [{ name: "b", type: { kind: $.TypeKind.Slice, elemType: { kind: $.TypeKind.Basic, name: "number" } } }], returns: [{ type: { kind: $.TypeKind.Slice, elemType: { kind: $.TypeKind.Basic, name: "number" } } }] }, { name: "FindIndex", args: [{ name: "b", type: { kind: $.TypeKind.Slice, elemType: { kind: $.TypeKind.Basic, name: "number" } } }], returns: [{ type: { kind: $.TypeKind.Slice, elemType: { kind: $.TypeKind.Basic, name: "number" } } }] }, { name: "FindString", args: [{ name: "s", type: { kind: $.TypeKind.Basic, name: "string" } }], returns: [{ type: { kind: $.TypeKind.Basic, name: "string" } }] }, { name: "FindStringIndex", args: [{ name: "s", type: { kind: $.TypeKind.Basic, name: "string" } }], returns: [{ type: { kind: $.TypeKind.Slice, elemType: { kind: $.TypeKind.Basic, name: "number" } } }] }, { name: "FindReaderIndex", args: [{ name: "r", type: "RuneReader" }], returns: [{ type: { kind: $.TypeKind.Slice, elemType: { kind: $.TypeKind.Basic, name: "number" } } }] }, { name: "FindSubmatch", args: [{ name: "b", type: { kind: $.TypeKind.Slice, elemType: { kind: $.TypeKind.Basic, name: "number" } } }], returns: [{ type: { kind: $.TypeKind.Slice, elemType: { kind: $.TypeKind.Slice, elemType: { kind: $.TypeKind.Basic, name: "number" } } } }] }, { name: "Expand", args: [{ name: "dst", type: { kind: $.TypeKind.Slice, elemType: { kind: $.TypeKind.Basic, name: "number" } } }, { name: "template", type: { kind: $.TypeKind.Slice, elemType: { kind: $.TypeKind.Basic, name: "number" } } }, { name: "src", type: { kind: $.TypeKind.Slice, elemType: { kind: $.TypeKind.Basic, name: "number" } } }, { name: "match", type: { kind: $.TypeKind.Slice, elemType: { kind: $.TypeKind.Basic, name: "number" } } }], returns: [{ type: { kind: $.TypeKind.Slice, elemType: { kind: $.TypeKind.Basic, name: "number" } } }] }, { name: "ExpandString", args: [{ name: "dst", type: { kind: $.TypeKind.Slice, elemType: { kind: $.TypeKind.Basic, name: "number" } } }, { name: "template", type: { kind: $.TypeKind.Basic, name: "string" } }, { name: "src", type: { kind: $.TypeKind.Basic, name: "string" } }, { name: "match", type: { kind: $.TypeKind.Slice, elemType: { kind: $.TypeKind.Basic, name: "number" } } }], returns: [{ type: { kind: $.TypeKind.Slice, elemType: { kind: $.TypeKind.Basic, name: "number" } } }] }, { name: "expand", args: [{ name: "dst", type: { kind: $.TypeKind.Slice, elemType: { kind: $.TypeKind.Basic, name: "number" } } }, { name: "template", type: { kind: $.TypeKind.Basic, name: "string" } }, { name: "bsrc", type: { kind: $.TypeKind.Slice, elemType: { kind: $.TypeKind.Basic, name: "number" } } }, { name: "src", type: { kind: $.TypeKind.Basic, name: "string" } }, { name: "match", type: { kind: $.TypeKind.Slice, elemType: { kind: $.TypeKind.Basic, name: "number" } } }], returns: [{ type: { kind: $.TypeKind.Slice, elemType: { kind: $.TypeKind.Basic, name: "number" } } }] }, { name: "FindSubmatchIndex", args: [{ name: "b", type: { kind: $.TypeKind.Slice, elemType: { kind: $.TypeKind.Basic, name: "number" } } }], returns: [{ type: { kind: $.TypeKind.Slice, elemType: { kind: $.TypeKind.Basic, name: "number" } } }] }, { name: "FindStringSubmatch", args: [{ name: "s", type: { kind: $.TypeKind.Basic, name: "string" } }], returns: [{ type: { kind: $.TypeKind.Slice, elemType: { kind: $.TypeKind.Basic, name: "string" } } }] }, { name: "FindStringSubmatchIndex", args: [{ name: "s", type: { kind: $.TypeKind.Basic, name: "string" } }], returns: [{ type: { kind: $.TypeKind.Slice, elemType: { kind: $.TypeKind.Basic, name: "number" } } }] }, { name: "FindReaderSubmatchIndex", args: [{ name: "r", type: "RuneReader" }], returns: [{ type: { kind: $.TypeKind.Slice, elemType: { kind: $.TypeKind.Basic, name: "number" } } }] }, { name: "FindAll", args: [{ name: "b", type: { kind: $.TypeKind.Slice, elemType: { kind: $.TypeKind.Basic, name: "number" } } }, { name: "n", type: { kind: $.TypeKind.Basic, name: "number" } }], returns: [{ type: { kind: $.TypeKind.Slice, elemType: { kind: $.TypeKind.Slice, elemType: { kind: $.TypeKind.Basic, name: "number" } } } }] }, { name: "FindAllIndex", args: [{ name: "b", type: { kind: $.TypeKind.Slice, elemType: { kind: $.TypeKind.Basic, name: "number" } } }, { name: "n", type: { kind: $.TypeKind.Basic, name: "number" } }], returns: [{ type: { kind: $.TypeKind.Slice, elemType: { kind: $.TypeKind.Slice, elemType: { kind: $.TypeKind.Basic, name: "number" } } } }] }, { name: "FindAllString", args: [{ name: "s", type: { kind: $.TypeKind.Basic, name: "string" } }, { name: "n", type: { kind: $.TypeKind.Basic, name: "number" } }], returns: [{ type: { kind: $.TypeKind.Slice, elemType: { kind: $.TypeKind.Basic, name: "string" } } }] }, { name: "FindAllStringIndex", args: [{ name: "s", type: { kind: $.TypeKind.Basic, name: "string" } }, { name: "n", type: { kind: $.TypeKind.Basic, name: "number" } }], returns: [{ type: { kind: $.TypeKind.Slice, elemType: { kind: $.TypeKind.Slice, elemType: { kind: $.TypeKind.Basic, name: "number" } } } }] }, { name: "FindAllSubmatch", args: [{ name: "b", type: { kind: $.TypeKind.Slice, elemType: { kind: $.TypeKind.Basic, name: "number" } } }, { name: "n", type: { kind: $.TypeKind.Basic, name: "number" } }], returns: [{ type: { kind: $.TypeKind.Slice, elemType: { kind: $.TypeKind.Slice, elemType: { kind: $.TypeKind.Slice, elemType: { kind: $.TypeKind.Basic, name: "number" } } } } }] }, { name: "FindAllSubmatchIndex", args: [{ name: "b", type: { kind: $.TypeKind.Slice, elemType: { kind: $.TypeKind.Basic, name: "number" } } }, { name: "n", type: { kind: $.TypeKind.Basic, name: "number" } }], returns: [{ type: { kind: $.TypeKind.Slice, elemType: { kind: $.TypeKind.Slice, elemType: { kind: $.TypeKind.Basic, name: "number" } } } }] }, { name: "FindAllStringSubmatch", args: [{ name: "s", type: { kind: $.TypeKind.Basic, name: "string" } }, { name: "n", type: { kind: $.TypeKind.Basic, name: "number" } }], returns: [{ type: { kind: $.TypeKind.Slice, elemType: { kind: $.TypeKind.Slice, elemType: { kind: $.TypeKind.Basic, name: "string" } } } }] }, { name: "FindAllStringSubmatchIndex", args: [{ name: "s", type: { kind: $.TypeKind.Basic, name: "string" } }, { name: "n", type: { kind: $.TypeKind.Basic, name: "number" } }], returns: [{ type: { kind: $.TypeKind.Slice, elemType: { kind: $.TypeKind.Slice, elemType: { kind: $.TypeKind.Basic, name: "number" } } } }] }, { name: "Split", args: [{ name: "s", type: { kind: $.TypeKind.Basic, name: "string" } }, { name: "n", type: { kind: $.TypeKind.Basic, name: "number" } }], returns: [{ type: { kind: $.TypeKind.Slice, elemType: { kind: $.TypeKind.Basic, name: "string" } } }] }, { name: "AppendText", args: [{ name: "b", type: { kind: $.TypeKind.Slice, elemType: { kind: $.TypeKind.Basic, name: "number" } } }], returns: [{ type: { kind: $.TypeKind.Slice, elemType: { kind: $.TypeKind.Basic, name: "number" } } }, { type: { kind: $.TypeKind.Interface, name: 'GoError', methods: [{ name: 'Error', args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: 'string' } }] }] } }] }, { name: "MarshalText", args: [], returns: [{ type: { kind: $.TypeKind.Slice, elemType: { kind: $.TypeKind.Basic, name: "number" } } }, { type: { kind: $.TypeKind.Interface, name: 'GoError', methods: [{ name: 'Error', args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: 'string' } }] }] } }] }, { name: "UnmarshalText", args: [{ name: "text", type: { kind: $.TypeKind.Slice, elemType: { kind: $.TypeKind.Basic, name: "number" } } }], returns: [{ type: { kind: $.TypeKind.Interface, name: 'GoError', methods: [{ name: 'Error', args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: 'string' } }] }] } }] }],
	  Regexp,
	  {"expr": { kind: $.TypeKind.Basic, name: "string" }, "prog": { kind: $.TypeKind.Pointer, elemType: "Prog" }, "onepass": { kind: $.TypeKind.Pointer, elemType: "onePassProg" }, "numSubexp": { kind: $.TypeKind.Basic, name: "number" }, "maxBitStateLen": { kind: $.TypeKind.Basic, name: "number" }, "subexpNames": { kind: $.TypeKind.Slice, elemType: { kind: $.TypeKind.Basic, name: "string" } }, "prefix": { kind: $.TypeKind.Basic, name: "string" }, "prefixBytes": { kind: $.TypeKind.Slice, elemType: { kind: $.TypeKind.Basic, name: "number" } }, "prefixRune": { kind: $.TypeKind.Basic, name: "number" }, "prefixEnd": { kind: $.TypeKind.Basic, name: "number" }, "mpool": { kind: $.TypeKind.Basic, name: "number" }, "matchcap": { kind: $.TypeKind.Basic, name: "number" }, "prefixComplete": { kind: $.TypeKind.Basic, name: "boolean" }, "cond": "EmptyOp", "minInputLen": { kind: $.TypeKind.Basic, name: "number" }, "longest": { kind: $.TypeKind.Basic, name: "boolean" }}
	);
}

// Compile parses a regular expression and returns, if successful,
// a [Regexp] object that can be used to match against text.
//
// When matching against text, the regexp returns a match that
// begins as early as possible in the input (leftmost), and among those
// it chooses the one that a backtracking search would have found first.
// This so-called leftmost-first matching is the same semantics
// that Perl, Python, and other implementations use, although this
// package implements it without the expense of backtracking.
// For POSIX leftmost-longest matching, see [CompilePOSIX].
export function Compile(expr: string): [Regexp | null, $.GoError] {
	return compile(expr, syntax.Perl, false)
}

// CompilePOSIX is like [Compile] but restricts the regular expression
// to POSIX ERE (egrep) syntax and changes the match semantics to
// leftmost-longest.
//
// That is, when matching against text, the regexp returns a match that
// begins as early as possible in the input (leftmost), and among those
// it chooses a match that is as long as possible.
// This so-called leftmost-longest matching is the same semantics
// that early regular expression implementations used and that POSIX
// specifies.
//
// However, there can be multiple leftmost-longest matches, with different
// submatch choices, and here this package diverges from POSIX.
// Among the possible leftmost-longest matches, this package chooses
// the one that a backtracking search would have found first, while POSIX
// specifies that the match be chosen to maximize the length of the first
// subexpression, then the second, and so on from left to right.
// The POSIX rule is computationally prohibitive and not even well-defined.
// See https://swtch.com/~rsc/regexp/regexp2.html#posix for details.
export function CompilePOSIX(expr: string): [Regexp | null, $.GoError] {
	return compile(expr, syntax.POSIX, true)
}

export function compile(expr: string, mode: syntax.Flags, longest: boolean): [Regexp | null, $.GoError] {
	let [re, err] = syntax.Parse(expr, mode)
	if (err != null) {
		return [null, err]
	}
	let maxCap = re!.MaxCap()
	let capNames = re!.CapNames()

	re = re!.Simplify()
	let prog: syntax.Prog | null
	[prog, err] = syntax.Compile(re)
	if (err != null) {
		return [null, err]
	}
	let matchcap = prog!.NumCap
	if (matchcap < 2) {
		matchcap = 2
	}
	let regexp = new Regexp({cond: prog!.StartCond(), expr: expr, longest: longest, matchcap: matchcap, minInputLen: minInputLen(re), numSubexp: maxCap, onepass: compileOnePass(prog), prog: prog, subexpNames: capNames})
	if (regexp!.onepass == null) {
		{
		  const _tmp = prog!.Prefix()
		  regexp!.prefix = _tmp[0]
		  regexp!.prefixComplete = _tmp[1]
		}
		regexp!.maxBitStateLen = maxBitStateLen(prog)
	} else {
		{
		  const _tmp = onePassPrefix(prog)
		  regexp!.prefix = _tmp[0]
		  regexp!.prefixComplete = _tmp[1]
		  regexp!.prefixEnd = _tmp[2]
		}
	}

	// TODO(rsc): Remove this allocation by adding
	// IndexString to package bytes.
	if (regexp!.prefix != "") {
		// TODO(rsc): Remove this allocation by adding
		// IndexString to package bytes.
		regexp!.prefixBytes = $.stringToBytes(regexp!.prefix)
		{
		  const _tmp = utf8.DecodeRuneInString(regexp!.prefix)
		  regexp!.prefixRune = _tmp[0]
		}
	}

	let n = $.len(prog!.Inst)
	let i = 0
	for (; matchSize![i] != 0 && matchSize![i] < n; ) {
		i++
	}
	regexp!.mpool = i

	return [regexp, null]
}

let matchSize = $.arrayToSlice<number>([128, 512, 2048, 16384, 0])

let matchPool: sync.Pool[] = [new sync.Pool(), new sync.Pool(), new sync.Pool(), new sync.Pool(), new sync.Pool()]

// minInputLen walks the regexp to find the minimum length of any matchable input.
export function minInputLen(re: syntax.Regexp | null): number {
	switch (re!.Op) {
		default:
			return 0
			break
		case syntax.OpAnyChar:
		case syntax.OpAnyCharNotNL:
		case syntax.OpCharClass:
			return 1
			break
		case syntax.OpLiteral:
			let l = 0
			for (let _i = 0; _i < $.len(re!.Rune); _i++) {
				const r = re!.Rune![_i]
				{
					if (r == utf8.RuneError) {
						l++
					} else {
						l += utf8.RuneLen(r)
					}
				}
			}
			return l
			break
		case syntax.OpCapture:
		case syntax.OpPlus:
			return minInputLen(re!.Sub![0])
			break
		case syntax.OpRepeat:
			return re!.Min * minInputLen(re!.Sub![0])
			break
		case syntax.OpConcat:
			let l = 0
			for (let _i = 0; _i < $.len(re!.Sub); _i++) {
				const sub = re!.Sub![_i]
				{
					l += minInputLen(sub)
				}
			}
			return l
			break
		case syntax.OpAlternate:
			let l = minInputLen(re!.Sub![0])
			let lnext: number = 0
			for (let _i = 0; _i < $.len($.goSlice(re!.Sub, 1, undefined)); _i++) {
				const sub = $.goSlice(re!.Sub, 1, undefined)![_i]
				{
					lnext = minInputLen(sub)
					if (lnext < l) {
						l = lnext
					}
				}
			}
			return l
			break
	}
}

// MustCompile is like [Compile] but panics if the expression cannot be parsed.
// It simplifies safe initialization of global variables holding compiled regular
// expressions.
export function MustCompile(str: string): Regexp | null {
	let [regexp, err] = Compile(str)
	if (err != null) {
		$.panic(`regexp: Compile(` + quote(str) + `): ` + err!.Error())
	}
	return regexp
}

// MustCompilePOSIX is like [CompilePOSIX] but panics if the expression cannot be parsed.
// It simplifies safe initialization of global variables holding compiled regular
// expressions.
export function MustCompilePOSIX(str: string): Regexp | null {
	let [regexp, err] = CompilePOSIX(str)
	if (err != null) {
		$.panic(`regexp: CompilePOSIX(` + quote(str) + `): ` + err!.Error())
	}
	return regexp
}

export function quote(s: string): string {
	if (strconv.CanBackquote(s)) {
		return "`" + s + "`"
	}
	return strconv.Quote(s)
}

let endOfText: number = -1

type input = null | {
	// can we look ahead without losing info?
	canCheckPrefix(): boolean
	context(pos: number): lazyFlag
	hasPrefix(re: Regexp | null): boolean
	index(re: Regexp | null, pos: number): number
	// advance one rune
	step(pos: number): [number, number]
}

$.registerInterfaceType(
  'input',
  null, // Zero value for interface is null
  [{ name: "canCheckPrefix", args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: "boolean" } }] }, { name: "context", args: [{ name: "pos", type: { kind: $.TypeKind.Basic, name: "number" } }], returns: [{ type: "lazyFlag" }] }, { name: "hasPrefix", args: [{ name: "re", type: { kind: $.TypeKind.Pointer, elemType: "Regexp" } }], returns: [{ type: { kind: $.TypeKind.Basic, name: "boolean" } }] }, { name: "index", args: [{ name: "re", type: { kind: $.TypeKind.Pointer, elemType: "Regexp" } }, { name: "pos", type: { kind: $.TypeKind.Basic, name: "number" } }], returns: [{ type: { kind: $.TypeKind.Basic, name: "number" } }] }, { name: "step", args: [{ name: "pos", type: { kind: $.TypeKind.Basic, name: "number" } }], returns: [{ type: { kind: $.TypeKind.Basic, name: "number" } }, { type: { kind: $.TypeKind.Basic, name: "number" } }] }]
);

class inputString {
	public get str(): string {
		return this._fields.str.value
	}
	public set str(value: string) {
		this._fields.str.value = value
	}

	public _fields: {
		str: $.VarRef<string>;
	}

	constructor(init?: Partial<{str?: string}>) {
		this._fields = {
			str: $.varRef(init?.str ?? "")
		}
	}

	public clone(): inputString {
		const cloned = new inputString()
		cloned._fields = {
			str: $.varRef(this._fields.str.value)
		}
		return cloned
	}

	public step(pos: number): [number, number] {
		const i = this
		if (pos < $.len(i.str)) {
			let c = $.indexString(i.str, pos)
			if (c < utf8.RuneSelf) {
				return [(c as number), 1]
			}
			return utf8.DecodeRuneInString($.sliceString(i.str, pos, undefined))
		}
		return [-1, 0]
	}

	public canCheckPrefix(): boolean {
		const i = this
		return true
	}

	public hasPrefix(re: Regexp | null): boolean {
		const i = this
		return strings.HasPrefix(i.str, re!.prefix)
	}

	public index(re: Regexp | null, pos: number): number {
		const i = this
		return strings.Index($.sliceString(i.str, pos, undefined), re!.prefix)
	}

	public context(pos: number): lazyFlag {
		const i = this
		let [r1, r2] = [-1, -1]
		if ((pos - 1 as number) < ($.len(i.str) as number)) {
			r1 = ($.indexString(i.str, pos - 1) as number)
			if (r1 >= utf8.RuneSelf) {
				;[r1] = utf8.DecodeLastRuneInString($.sliceString(i.str, undefined, pos))
			}
		}
		if ((pos as number) < ($.len(i.str) as number)) {
			r2 = ($.indexString(i.str, pos) as number)
			if (r2 >= utf8.RuneSelf) {
				;[r2] = utf8.DecodeRuneInString($.sliceString(i.str, pos, undefined))
			}
		}
		return newLazyFlag(r1, r2)
	}

	// Register this type with the runtime type system
	static __typeInfo = $.registerStructType(
	  'inputString',
	  new inputString(),
	  [{ name: "step", args: [{ name: "pos", type: { kind: $.TypeKind.Basic, name: "number" } }], returns: [{ type: { kind: $.TypeKind.Basic, name: "number" } }, { type: { kind: $.TypeKind.Basic, name: "number" } }] }, { name: "canCheckPrefix", args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: "boolean" } }] }, { name: "hasPrefix", args: [{ name: "re", type: { kind: $.TypeKind.Pointer, elemType: "Regexp" } }], returns: [{ type: { kind: $.TypeKind.Basic, name: "boolean" } }] }, { name: "index", args: [{ name: "re", type: { kind: $.TypeKind.Pointer, elemType: "Regexp" } }, { name: "pos", type: { kind: $.TypeKind.Basic, name: "number" } }], returns: [{ type: { kind: $.TypeKind.Basic, name: "number" } }] }, { name: "context", args: [{ name: "pos", type: { kind: $.TypeKind.Basic, name: "number" } }], returns: [{ type: "lazyFlag" }] }],
	  inputString,
	  {"str": { kind: $.TypeKind.Basic, name: "string" }}
	);
}

class inputBytes {
	public get str(): $.Bytes {
		return this._fields.str.value
	}
	public set str(value: $.Bytes) {
		this._fields.str.value = value
	}

	public _fields: {
		str: $.VarRef<$.Bytes>;
	}

	constructor(init?: Partial<{str?: $.Bytes}>) {
		this._fields = {
			str: $.varRef(init?.str ?? new Uint8Array(0))
		}
	}

	public clone(): inputBytes {
		const cloned = new inputBytes()
		cloned._fields = {
			str: $.varRef(this._fields.str.value)
		}
		return cloned
	}

	public step(pos: number): [number, number] {
		const i = this
		if (pos < $.len(i.str)) {
			let c = i.str![pos]
			if (c < utf8.RuneSelf) {
				return [(c as number), 1]
			}
			return utf8.DecodeRune($.goSlice(i.str, pos, undefined))
		}
		return [-1, 0]
	}

	public canCheckPrefix(): boolean {
		const i = this
		return true
	}

	public hasPrefix(re: Regexp | null): boolean {
		const i = this
		return bytes.HasPrefix(i.str, re!.prefixBytes)
	}

	public index(re: Regexp | null, pos: number): number {
		const i = this
		return bytes.Index($.goSlice(i.str, pos, undefined), re!.prefixBytes)
	}

	public context(pos: number): lazyFlag {
		const i = this
		let [r1, r2] = [-1, -1]
		if ((pos - 1 as number) < ($.len(i.str) as number)) {
			r1 = (i.str![pos - 1] as number)
			if (r1 >= utf8.RuneSelf) {
				;[r1] = utf8.DecodeLastRune($.goSlice(i.str, undefined, pos))
			}
		}
		if ((pos as number) < ($.len(i.str) as number)) {
			r2 = (i.str![pos] as number)
			if (r2 >= utf8.RuneSelf) {
				;[r2] = utf8.DecodeRune($.goSlice(i.str, pos, undefined))
			}
		}
		return newLazyFlag(r1, r2)
	}

	// Register this type with the runtime type system
	static __typeInfo = $.registerStructType(
	  'inputBytes',
	  new inputBytes(),
	  [{ name: "step", args: [{ name: "pos", type: { kind: $.TypeKind.Basic, name: "number" } }], returns: [{ type: { kind: $.TypeKind.Basic, name: "number" } }, { type: { kind: $.TypeKind.Basic, name: "number" } }] }, { name: "canCheckPrefix", args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: "boolean" } }] }, { name: "hasPrefix", args: [{ name: "re", type: { kind: $.TypeKind.Pointer, elemType: "Regexp" } }], returns: [{ type: { kind: $.TypeKind.Basic, name: "boolean" } }] }, { name: "index", args: [{ name: "re", type: { kind: $.TypeKind.Pointer, elemType: "Regexp" } }, { name: "pos", type: { kind: $.TypeKind.Basic, name: "number" } }], returns: [{ type: { kind: $.TypeKind.Basic, name: "number" } }] }, { name: "context", args: [{ name: "pos", type: { kind: $.TypeKind.Basic, name: "number" } }], returns: [{ type: "lazyFlag" }] }],
	  inputBytes,
	  {"str": { kind: $.TypeKind.Slice, elemType: { kind: $.TypeKind.Basic, name: "number" } }}
	);
}

class inputReader {
	public get r(): io.RuneReader {
		return this._fields.r.value
	}
	public set r(value: io.RuneReader) {
		this._fields.r.value = value
	}

	public get atEOT(): boolean {
		return this._fields.atEOT.value
	}
	public set atEOT(value: boolean) {
		this._fields.atEOT.value = value
	}

	public get pos(): number {
		return this._fields.pos.value
	}
	public set pos(value: number) {
		this._fields.pos.value = value
	}

	public _fields: {
		r: $.VarRef<io.RuneReader>;
		atEOT: $.VarRef<boolean>;
		pos: $.VarRef<number>;
	}

	constructor(init?: Partial<{atEOT?: boolean, pos?: number, r?: io.RuneReader}>) {
		this._fields = {
			r: $.varRef(init?.r ?? null),
			atEOT: $.varRef(init?.atEOT ?? false),
			pos: $.varRef(init?.pos ?? 0)
		}
	}

	public clone(): inputReader {
		const cloned = new inputReader()
		cloned._fields = {
			r: $.varRef(this._fields.r.value),
			atEOT: $.varRef(this._fields.atEOT.value),
			pos: $.varRef(this._fields.pos.value)
		}
		return cloned
	}

	public step(pos: number): [number, number] {
		const i = this
		if (!i.atEOT && pos != i.pos) {
			return [-1, 0]

		}
		let [r, w, err] = i.r!.ReadRune()
		if (err != null) {
			i.atEOT = true
			return [-1, 0]
		}
		i.pos += w
		return [r, w]
	}

	public canCheckPrefix(): boolean {
		const i = this
		return false
	}

	public hasPrefix(re: Regexp | null): boolean {
		const i = this
		return false
	}

	public index(re: Regexp | null, pos: number): number {
		const i = this
		return -1
	}

	public context(pos: number): lazyFlag {
		const i = this
		return 0
	}

	// Register this type with the runtime type system
	static __typeInfo = $.registerStructType(
	  'inputReader',
	  new inputReader(),
	  [{ name: "step", args: [{ name: "pos", type: { kind: $.TypeKind.Basic, name: "number" } }], returns: [{ type: { kind: $.TypeKind.Basic, name: "number" } }, { type: { kind: $.TypeKind.Basic, name: "number" } }] }, { name: "canCheckPrefix", args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: "boolean" } }] }, { name: "hasPrefix", args: [{ name: "re", type: { kind: $.TypeKind.Pointer, elemType: "Regexp" } }], returns: [{ type: { kind: $.TypeKind.Basic, name: "boolean" } }] }, { name: "index", args: [{ name: "re", type: { kind: $.TypeKind.Pointer, elemType: "Regexp" } }, { name: "pos", type: { kind: $.TypeKind.Basic, name: "number" } }], returns: [{ type: { kind: $.TypeKind.Basic, name: "number" } }] }, { name: "context", args: [{ name: "pos", type: { kind: $.TypeKind.Basic, name: "number" } }], returns: [{ type: "lazyFlag" }] }],
	  inputReader,
	  {"r": "RuneReader", "atEOT": { kind: $.TypeKind.Basic, name: "boolean" }, "pos": { kind: $.TypeKind.Basic, name: "number" }}
	);
}

// MatchReader reports whether the text returned by the [io.RuneReader]
// contains any match of the regular expression pattern.
// More complicated queries need to use [Compile] and the full [Regexp] interface.
export function MatchReader(pattern: string, r: io.RuneReader): [boolean, $.GoError] {
	let matched: boolean = false
	let err: $.GoError = null
	{
		let re: Regexp | null
		[re, err] = Compile(pattern)
		if (err != null) {
			return [false, err]
		}
		return [re!.MatchReader(r), null]
	}
}

// MatchString reports whether the string s
// contains any match of the regular expression pattern.
// More complicated queries need to use [Compile] and the full [Regexp] interface.
export function MatchString(pattern: string, s: string): [boolean, $.GoError] {
	let matched: boolean = false
	let err: $.GoError = null
	{
		let re: Regexp | null
		[re, err] = Compile(pattern)
		if (err != null) {
			return [false, err]
		}
		return [re!.MatchString(s), null]
	}
}

// Match reports whether the byte slice b
// contains any match of the regular expression pattern.
// More complicated queries need to use [Compile] and the full [Regexp] interface.
export function Match(pattern: string, b: $.Bytes): [boolean, $.GoError] {
	let matched: boolean = false
	let err: $.GoError = null
	{
		let re: Regexp | null
		[re, err] = Compile(pattern)
		if (err != null) {
			return [false, err]
		}
		return [re!.Match(b), null]
	}
}

let specialBytes: number[] = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]

// special reports whether byte b needs to be escaped by QuoteMeta.
export function special(b: number): boolean {
	return b < utf8.RuneSelf && (specialBytes![b % 16] & ((1 << (b / 16)))) != 0
}

export function init(): void {
	for (let _i = 0; _i < $.len($.stringToBytes("\\.+*?()|[]{}^$")); _i++) {
		const b = $.stringToBytes("\\.+*?()|[]{}^$")![_i]
		{
			specialBytes![b % 16] |= (1 << (b / 16))
		}
	}
}

// QuoteMeta returns a string that escapes all regular expression metacharacters
// inside the argument text; the returned string is a regular expression matching
// the literal text.
export function QuoteMeta(s: string): string {
	// A byte loop is correct because all metacharacters are ASCII.
	let i: number = 0
	for (i = 0; i < $.len(s); i++) {
		if (special($.indexString(s, i))) {
			break
		}
	}
	// No meta characters found, so return original string.
	if (i >= $.len(s)) {
		return s
	}

	let b = new Uint8Array(2 * $.len(s) - i)
	$.copy(b, $.sliceString(s, undefined, i))
	let j = i
	for (; i < $.len(s); i++) {
		if (special($.indexString(s, i))) {
			b![j] = 92
			j++
		}
		b![j] = $.indexString(s, i)
		j++
	}
	return $.bytesToString($.goSlice(b, undefined, j))
}

// extract returns the name from a leading "name" or "{name}" in str.
// (The $ has already been removed by the caller.)
// If it is a number, extract returns num set to that number; otherwise num = -1.
export function extract(str: string): [string, number, string, boolean] {
	let name: string = ""
	let num: number = 0
	let rest: string = ""
	let ok: boolean = false
	{
		if (str == "") {
			return [name, num, rest, ok]
		}
		let brace = false
		if ($.indexString(str, 0) == 123) {
			brace = true
			str = $.sliceString(str, 1, undefined)
		}
		let i = 0
		for (; i < $.len(str); ) {
			let [rune, size] = utf8.DecodeRuneInString($.sliceString(str, i, undefined))
			if (!unicode.IsLetter(rune) && !unicode.IsDigit(rune) && rune != 95) {
				break
			}
			i += size
		}

		// empty name is not okay
		if (i == 0) {
			// empty name is not okay
			return [name, num, rest, ok]
		}
		name = $.sliceString(str, undefined, i)

		// missing closing brace
		if (brace) {

			// missing closing brace
			if (i >= $.len(str) || $.indexString(str, i) != 125) {
				// missing closing brace
				return [name, num, rest, ok]
			}
			i++
		}

		// Parse number.
		num = 0
		for (let i = 0; i < $.len(name); i++) {
			if ($.indexString(name, i) < 48 || 57 < $.indexString(name, i) || num >= 1e8) {
				num = -1
				break
			}
			num = num * 10 + $.int($.indexString(name, i)) - 48
		}
		// Disallow leading zeros.
		if ($.indexString(name, 0) == 48 && $.len(name) > 1) {
			num = -1
		}

		rest = $.sliceString(str, i, undefined)
		ok = true
		return [name, num, rest, ok]
	}
}

// The size at which to start a slice in the 'All' routines.
let startSize: number = 10


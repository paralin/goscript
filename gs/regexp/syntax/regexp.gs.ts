import * as $ from "@goscript/builtin/builtin.js";
import { inCharClass } from "./parse.gs.js";

import * as slices from "@goscript/slices/index.js"

import * as strconv from "@goscript/strconv/index.js"

import * as strings from "@goscript/strings/index.js"

import * as unicode from "@goscript/unicode/index.js"

export class Regexp {
	// operator
	public get Op(): Op {
		return this._fields.Op.value
	}
	public set Op(value: Op) {
		this._fields.Op.value = value
	}

	public get Flags(): Flags {
		return this._fields.Flags.value
	}
	public set Flags(value: Flags) {
		this._fields.Flags.value = value
	}

	// subexpressions, if any
	public get Sub(): $.Slice<Regexp | null> {
		return this._fields.Sub.value
	}
	public set Sub(value: $.Slice<Regexp | null>) {
		this._fields.Sub.value = value
	}

	// storage for short Sub
	public get Sub0(): Regexp | null[] {
		return this._fields.Sub0.value
	}
	public set Sub0(value: Regexp | null[]) {
		this._fields.Sub0.value = value
	}

	// matched runes, for OpLiteral, OpCharClass
	public get Rune(): $.Slice<number> {
		return this._fields.Rune.value
	}
	public set Rune(value: $.Slice<number>) {
		this._fields.Rune.value = value
	}

	// storage for short Rune
	public get Rune0(): number[] {
		return this._fields.Rune0.value
	}
	public set Rune0(value: number[]) {
		this._fields.Rune0.value = value
	}

	// min, max for OpRepeat
	public get Min(): number {
		return this._fields.Min.value
	}
	public set Min(value: number) {
		this._fields.Min.value = value
	}

	// min, max for OpRepeat
	public get Max(): number {
		return this._fields.Max.value
	}
	public set Max(value: number) {
		this._fields.Max.value = value
	}

	// capturing index, for OpCapture
	public get Cap(): number {
		return this._fields.Cap.value
	}
	public set Cap(value: number) {
		this._fields.Cap.value = value
	}

	// capturing name, for OpCapture
	public get Name(): string {
		return this._fields.Name.value
	}
	public set Name(value: string) {
		this._fields.Name.value = value
	}

	public _fields: {
		Op: $.VarRef<Op>;
		Flags: $.VarRef<Flags>;
		Sub: $.VarRef<$.Slice<Regexp | null>>;
		Sub0: $.VarRef<Regexp | null[]>;
		Rune: $.VarRef<$.Slice<number>>;
		Rune0: $.VarRef<number[]>;
		Min: $.VarRef<number>;
		Max: $.VarRef<number>;
		Cap: $.VarRef<number>;
		Name: $.VarRef<string>;
	}

	constructor(init?: Partial<{Cap?: number, Flags?: Flags, Max?: number, Min?: number, Name?: string, Op?: Op, Rune?: $.Slice<number>, Rune0?: number[], Sub?: $.Slice<Regexp | null>, Sub0?: Regexp | null[]}>) {
		this._fields = {
			Op: $.varRef(init?.Op ?? 0),
			Flags: $.varRef(init?.Flags ?? 0),
			Sub: $.varRef(init?.Sub ?? null),
			Sub0: $.varRef(init?.Sub0 ?? [null]),
			Rune: $.varRef(init?.Rune ?? null),
			Rune0: $.varRef(init?.Rune0 ?? [0, 0]),
			Min: $.varRef(init?.Min ?? 0),
			Max: $.varRef(init?.Max ?? 0),
			Cap: $.varRef(init?.Cap ?? 0),
			Name: $.varRef(init?.Name ?? "")
		}
	}

	public clone(): Regexp {
		const cloned = new Regexp()
		cloned._fields = {
			Op: $.varRef(this._fields.Op.value),
			Flags: $.varRef(this._fields.Flags.value),
			Sub: $.varRef(this._fields.Sub.value),
			Sub0: $.varRef(this._fields.Sub0.value),
			Rune: $.varRef(this._fields.Rune.value),
			Rune0: $.varRef(this._fields.Rune0.value),
			Min: $.varRef(this._fields.Min.value),
			Max: $.varRef(this._fields.Max.value),
			Cap: $.varRef(this._fields.Cap.value),
			Name: $.varRef(this._fields.Name.value)
		}
		return cloned
	}

	// Equal reports whether x and y have identical structure.
	public Equal(y: Regexp | null): boolean {
		const x = this
		if (x == null || y == null) {
			return (x === y)
		}
		if (x.Op != y.Op) {
			return false
		}
		switch (x.Op) {
			case 10:
				if ((x.Flags & 256) != (y.Flags & 256)) {
					return false
				}
				break
			case 3:
			case 4:
				return slices.Equal(x.Rune, y.Rune)
				break
			case 19:
			case 18:
				return slices.EqualFunc(x.Sub, y.Sub, Regexp!.Equal)
				break
			case 14:
			case 15:
			case 16:
				if ((x.Flags & 32) != (y.Flags & 32) || !x.Sub![0]!.Equal(y.Sub![0])) {
					return false
				}
				break
			case 17:
				if ((x.Flags & 32) != (y.Flags & 32) || x.Min != y.Min || x.Max != y.Max || !x.Sub![0]!.Equal(y.Sub![0])) {
					return false
				}
				break
			case 13:
				if (x.Cap != y.Cap || x.Name != y.Name || !x.Sub![0]!.Equal(y.Sub![0])) {
					return false
				}
				break
		}
		return true
	}

	public String(): string {
		const re = this
		let b: strings.Builder = new strings.Builder()
		let flags: Map<Regexp | null, printFlags> = null
		let [must, cant] = calcFlags(re, flags)
		must |= (((cant & ~ 1)) << 5)
		if (must != 0) {
			must |= 8
		}
		writeRegexp(b, re, must, flags)
		return b.String()
	}

	// MaxCap walks the regexp to find the maximum capture index.
	public MaxCap(): number {
		const re = this
		let m = 0
		if (re!.Op == 13) {
			m = re!.Cap
		}
		for (let _i = 0; _i < $.len(re!.Sub); _i++) {
			const sub = re!.Sub![_i]
			{
				{
					let n = sub!.MaxCap()
					if (m < n) {
						m = n
					}
				}
			}
		}
		return m
	}

	// CapNames walks the regexp to find the names of capturing groups.
	public CapNames(): $.Slice<string> {
		const re = this
		let names = $.makeSlice<string>(re!.MaxCap() + 1, undefined, 'string')
		re!.capNames(names)
		return names
	}

	public capNames(names: $.Slice<string>): void {
		const re = this
		if (re!.Op == 13) {
			names![re!.Cap] = re!.Name
		}
		for (let _i = 0; _i < $.len(re!.Sub); _i++) {
			const sub = re!.Sub![_i]
			{
				sub!.capNames(names)
			}
		}
	}

	// Simplify returns a regexp equivalent to re but without counted repetitions
	// and with various other simplifications, such as rewriting /(?:a+)+/ to /a+/.
	// The resulting regexp will execute correctly but its string representation
	// will not produce the same parse tree, because capturing parentheses
	// may have been duplicated or removed. For example, the simplified form
	// for /(x){1,2}/ is /(x)(x)?/ but both parentheses capture as $1.
	// The returned regexp may share structure with or be the original.
	public Simplify(): Regexp | null {
		const re = this
		if (re == null) {
			return null
		}
		switch (re!.Op) {
			case 13:
			case 18:
			case 19:
				let nre = re
				for (let i = 0; i < $.len(re!.Sub); i++) {
					const sub = re!.Sub![i]
					{
						let nsub = sub!.Simplify()
						if ((nre === re) && (nsub !== sub)) {

							nre = new Regexp()
							nre!.value = re!.clone()
							nre!.Rune = null
							nre!.Sub = $.append($.goSlice(nre!.Sub0, undefined, 0), $.goSlice(re!.Sub, undefined, i))
						}
						if ((nre !== re)) {
							nre!.Sub = $.append(nre!.Sub, nsub)
						}
					}
				}
				return nre
				break
			case 14:
			case 15:
			case 16:
				let sub = re!.Sub![0]!.Simplify()
				return simplify1(re!.Op, re!.Flags, sub, re)
				break
			case 17:
				if (re!.Min == 0 && re!.Max == 0) {
					return new Regexp({Op: 2})
				}
				let sub = re!.Sub![0]!.Simplify()
				if (re!.Max == -1) {

					if (re!.Min == 0) {
						return simplify1(14, re!.Flags, sub, null)
					}

					if (re!.Min == 1) {
						return simplify1(15, re!.Flags, sub, null)
					}

					let nre = new Regexp({Op: 18})
					nre!.Sub = $.goSlice(nre!.Sub0, undefined, 0)
					for (let i = 0; i < re!.Min - 1; i++) {
						nre!.Sub = $.append(nre!.Sub, sub)
					}
					nre!.Sub = $.append(nre!.Sub, simplify1(15, re!.Flags, sub, null))
					return nre
				}
				if (re!.Min == 1 && re!.Max == 1) {
					return sub
				}
				let prefix: Regexp | null = null
				if (re!.Min > 0) {
					prefix = new Regexp({Op: 18})
					prefix!.Sub = $.goSlice(prefix!.Sub0, undefined, 0)
					for (let i = 0; i < re!.Min; i++) {
						prefix!.Sub = $.append(prefix!.Sub, sub)
					}
				}
				if (re!.Max > re!.Min) {
					let suffix = simplify1(16, re!.Flags, sub, null)
					for (let i = re!.Min + 1; i < re!.Max; i++) {
						let nre2 = new Regexp({Op: 18})
						nre2!.Sub = $.append($.goSlice(nre2!.Sub0, undefined, 0), sub, suffix)
						suffix = simplify1(16, re!.Flags, nre2, null)
					}
					if (prefix == null) {
						return suffix
					}
					prefix!.Sub = $.append(prefix!.Sub, suffix)
				}
				if (prefix != null) {
					return prefix
				}
				return new Regexp({Op: 1})
				break
		}
		return re
	}

	// Register this type with the runtime type system
	static __typeInfo = $.registerStructType(
	  'Regexp',
	  new Regexp(),
	  [{ name: "Equal", args: [{ name: "y", type: { kind: $.TypeKind.Pointer, elemType: "Regexp" } }], returns: [{ type: { kind: $.TypeKind.Basic, name: "boolean" } }] }, { name: "String", args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: "string" } }] }, { name: "MaxCap", args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: "number" } }] }, { name: "CapNames", args: [], returns: [{ type: { kind: $.TypeKind.Slice, elemType: { kind: $.TypeKind.Basic, name: "string" } } }] }, { name: "capNames", args: [{ name: "names", type: { kind: $.TypeKind.Slice, elemType: { kind: $.TypeKind.Basic, name: "string" } } }], returns: [] }, { name: "Simplify", args: [], returns: [{ type: { kind: $.TypeKind.Pointer, elemType: "Regexp" } }] }],
	  Regexp,
	  {"Op": "Op", "Flags": "Flags", "Sub": { kind: $.TypeKind.Slice, elemType: { kind: $.TypeKind.Pointer, elemType: "Regexp" } }, "Sub0": { kind: $.TypeKind.Array, length: 1, elemType: { kind: $.TypeKind.Pointer, elemType: "Regexp" } }, "Rune": { kind: $.TypeKind.Slice, elemType: { kind: $.TypeKind.Basic, name: "number" } }, "Rune0": { kind: $.TypeKind.Array, length: 2, elemType: { kind: $.TypeKind.Basic, name: "number" } }, "Min": { kind: $.TypeKind.Basic, name: "number" }, "Max": { kind: $.TypeKind.Basic, name: "number" }, "Cap": { kind: $.TypeKind.Basic, name: "number" }, "Name": { kind: $.TypeKind.Basic, name: "string" }}
	);
}

export class Op {
	constructor(private _value: number) {}

	valueOf(): number {
		return this._value
	}

	toString(): string {
		return String(this._value)
	}

	static from(value: number): Op {
		return new Op(value)
	}

	public String(): string {
		const i = this._value
		switch (true) {
			case 1 <= i && i <= 19:
				i -= 1
				return $.sliceString("NoMatchEmptyMatchLiteralCharClassAnyCharNotNLAnyCharBeginLineEndLineBeginTextEndTextWordBoundaryNoWordBoundaryCaptureStarPlusQuestRepeatConcatAlternate", _Op_index_0![i], _Op_index_0![i + 1])
				break
			case i == 128:
				return "opPseudo"
				break
			default:
				return "Op(" + strconv.FormatInt((i as number), 10) + ")"
				break
		}
	}
}

// matches no strings
export let OpNoMatch: Op = 1 + 0

// matches empty string
export let OpEmptyMatch: Op = new Op(0)

// matches Runes sequence
export let OpLiteral: Op = new Op(0)

// matches Runes interpreted as range pair list
export let OpCharClass: Op = new Op(0)

// matches any character except newline
export let OpAnyCharNotNL: Op = new Op(0)

// matches any character
export let OpAnyChar: Op = new Op(0)

// matches empty string at beginning of line
export let OpBeginLine: Op = new Op(0)

// matches empty string at end of line
export let OpEndLine: Op = new Op(0)

// matches empty string at beginning of text
export let OpBeginText: Op = new Op(0)

// matches empty string at end of text
export let OpEndText: Op = new Op(0)

// matches word boundary `\b`
export let OpWordBoundary: Op = new Op(0)

// matches word non-boundary `\B`
export let OpNoWordBoundary: Op = new Op(0)

// capturing subexpression with index Cap, optional name Name
export let OpCapture: Op = new Op(0)

// matches Sub[0] zero or more times
export let OpStar: Op = new Op(0)

// matches Sub[0] one or more times
export let OpPlus: Op = new Op(0)

// matches Sub[0] zero or one times
export let OpQuest: Op = new Op(0)

// matches Sub[0] at least Min times, at most Max (Max == -1 is no limit)
export let OpRepeat: Op = new Op(0)

// matches concatenation of Subs
export let OpConcat: Op = new Op(0)

// matches alternation of Subs
export let OpAlternate: Op = new Op(0)

// where pseudo-ops start
let opPseudo: Op = new Op(128)

type printFlags = number;

// (?i:
let flagI: printFlags = (1 << 0)

// (?m:
let flagM: printFlags = 0

// (?s:
let flagS: printFlags = 0

// )
let flagOff: printFlags = 0

// (?: )
let flagPrec: printFlags = 0

// flagI<<negShift is (?-i:
let negShift: number = 5

// addSpan enables the flags f around start..last,
// by setting flags[start] = f and flags[last] = flagOff.
export function addSpan(start: Regexp | null, last: Regexp | null, f: printFlags, flags: $.VarRef<Map<Regexp | null, printFlags>> | null): void {
	if (flags!.value == null) {
		flags!.value = $.makeMap<Regexp | null, printFlags>()
	}
	$.mapSet((flags!.value), start, f)
	$.mapSet((flags!.value), last, 8) // maybe start==last
}

// calcFlags calculates the flags to print around each subexpression in re,
// storing that information in (*flags)[sub] for each affected subexpression.
// The first time an entry needs to be written to *flags, calcFlags allocates the map.
// calcFlags also calculates the flags that must be active or can't be active
// around re and returns those flags.
export function calcFlags(re: Regexp | null, flags: $.VarRef<Map<Regexp | null, printFlags>> | null): printFlags {
	let must: printFlags = 0
	let cant: printFlags = 0
	{

		// If literal is fold-sensitive, return (flagI, 0) or (0, flagI)
		// according to whether (?i) is active.
		// If literal is not fold-sensitive, return 0, 0.

		// If literal is fold-sensitive, return 0, flagI - (?i) has been compiled out.
		// If literal is not fold-sensitive, return 0, 0.

		// (?-s).

		// (?s).

		// (?m)^ (?m)$

		// (?-m)$

		// Gather the must and cant for each subexpression.
		// When we find a conflicting subexpression, insert the necessary
		// flags around the previously identified span and start over.

		// No conflicts: pass the accumulated must and cant upward.

		// Conflicts found; need to finish final span.
		switch (re!.Op) {
			default:
				return [0, 0]
				break
			case 3:
				for (let _i = 0; _i < $.len(re!.Rune); _i++) {
					const r = re!.Rune![_i]
					{
						if (65 <= r && r <= 125251 && unicode.SimpleFold(r) != r) {
							if ((re!.Flags & 1) != 0) {
								return [1, 0]
							} else {
								return [0, 1]
							}
						}
					}
				}
				return [0, 0]
				break
			case 4:
				for (let i = 0; i < $.len(re!.Rune); i += 2) {
					let lo = max(65, re!.Rune![i])
					let hi = min(125251, re!.Rune![i + 1])
					for (let r = lo; r <= hi; r++) {
						for (let f = unicode.SimpleFold(r); f != r; f = unicode.SimpleFold(f)) {
							if (!(lo <= f && f <= hi) && !inCharClass(f, re!.Rune)) {
								return [0, 1]
							}
						}
					}
				}
				return [0, 0]
				break
			case 5:
				return [0, 4]
				break
			case 6:
				return [4, 0]
				break
			case 7:
			case 8:
				return [2, 0]
				break
			case 10:
				if ((re!.Flags & 256) != 0) {
					// (?-m)$
					return [0, 2]
				}
				return [0, 0]
				break
			case 13:
			case 14:
			case 15:
			case 16:
			case 17:
				return calcFlags(re!.Sub![0], flags)
				break
			case 18:
			case 19:
				let [must, cant, allCant] = []
				let start = 0
				let last = 0
				let did = false
				for (let i = 0; i < $.len(re!.Sub); i++) {
					const sub = re!.Sub![i]
					{
						let [subMust, subCant] = calcFlags(sub, flags)
						if ((must & subCant) != 0 || (subMust & cant) != 0) {
							if (must != 0) {
								addSpan(re!.Sub![start], re!.Sub![last], must, flags)
							}
							must = 0
							cant = 0
							start = i
							did = true
						}
						must |= subMust
						cant |= subCant
						allCant |= subCant
						if (subMust != 0) {
							last = i
						}
						if (must == 0 && start == i) {
							start++
						}
					}
				}
				if (!did) {
					// No conflicts: pass the accumulated must and cant upward.
					return [must, cant]
				}
				if (must != 0) {
					// Conflicts found; need to finish final span.
					addSpan(re!.Sub![start], re!.Sub![last], must, flags)
				}
				return [0, allCant]
				break
		}
	}
}

// writeRegexp writes the Perl syntax for the regular expression re to b.
export function writeRegexp(b: strings.Builder | null, re: Regexp | null, f: printFlags, flags: Map<Regexp | null, printFlags>): void {
	using __defer = new $.DisposableStack();
	f |= $.mapGet(flags, re, 0)[0]

	// flagPrec is redundant with other flags being added and terminated
	if ((f & 16) != 0 && (f & ~ ((8 | 16))) != 0 && (f & 8) != 0) {
		// flagPrec is redundant with other flags being added and terminated
		f &= ~(16)
	}
	if ((f & ~ ((8 | 16))) != 0) {
		b.WriteString(`(?`)
		if ((f & 1) != 0) {
			b.WriteString(`i`)
		}
		if ((f & 2) != 0) {
			b.WriteString(`m`)
		}
		if ((f & 4) != 0) {
			b.WriteString(`s`)
		}
		if ((f & ((((2 | 4)) << 5))) != 0) {
			b.WriteString(`-`)
			if ((f & ((2 << 5))) != 0) {
				b.WriteString(`m`)
			}
			if ((f & ((4 << 5))) != 0) {
				b.WriteString(`s`)
			}
		}
		b.WriteString(`:`)
	}
	if ((f & 8) != 0) {
		using __defer = new $.DisposableStack();
		__defer.defer(() => {
			b.WriteString(`)`)
		});
	}
	if ((f & 16) != 0) {
		using __defer = new $.DisposableStack();
		b.WriteString(`(?:`)
		__defer.defer(() => {
			b.WriteString(`)`)
		});
	}

	// Contains 0 and MaxRune. Probably a negated class.
	// Print the gaps.
	switch (re!.Op) {
		default:
			b.WriteString("<invalid op" + strconv.Itoa($.int(re!.Op)) + ">")
			break
		case 1:
			b.WriteString("[^\\x00-\\x{10FFFF}]")
			break
		case 2:
			b.WriteString(`(?:)`)
			break
		case 3:
			for (let _i = 0; _i < $.len(re!.Rune); _i++) {
				const r = re!.Rune![_i]
				{
					escape(b, r, false)
				}
			}
			break
		case 4:
			if ($.len(re!.Rune) % 2 != 0) {
				b.WriteString(`[invalid char class]`)
				break
			}
			b.WriteRune(91)
			if ($.len(re!.Rune) == 0) {
				b.WriteString("^\\x00-\\x{10FFFF}")
			} else if (re!.Rune![0] == 0 && re!.Rune![$.len(re!.Rune) - 1] == unicode.MaxRune && $.len(re!.Rune) > 2) {
				// Contains 0 and MaxRune. Probably a negated class.
				// Print the gaps.
				b.WriteRune(94)
				for (let i = 1; i < $.len(re!.Rune) - 1; i += 2) {
					let [lo, hi] = [re!.Rune![i] + 1, re!.Rune![i + 1] - 1]
					escape(b, lo, lo == 45)
					if (lo != hi) {
						if (hi != lo + 1) {
							b.WriteRune(45)
						}
						escape(b, hi, hi == 45)
					}
				}
			} else {
				for (let i = 0; i < $.len(re!.Rune); i += 2) {
					let [lo, hi] = [re!.Rune![i], re!.Rune![i + 1]]
					escape(b, lo, lo == 45)
					if (lo != hi) {
						if (hi != lo + 1) {
							b.WriteRune(45)
						}
						escape(b, hi, hi == 45)
					}
				}
			}
			b.WriteRune(93)
			break
		case 5:
		case 6:
			b.WriteString(`.`)
			break
		case 7:
			b.WriteString(`^`)
			break
		case 8:
			b.WriteString(`$`)
			break
		case 9:
			b.WriteString("\\A")
			break
		case 10:
			if ((re!.Flags & 256) != 0) {
				b.WriteString(`$`)
			} else {
				b.WriteString("\\z")
			}
			break
		case 11:
			b.WriteString("\\b")
			break
		case 12:
			b.WriteString("\\B")
			break
		case 13:
			if (re!.Name != "") {
				b.WriteString(`(?P<`)
				b.WriteString(re!.Name)
				b.WriteRune(62)
			} else {
				b.WriteRune(40)
			}
			if (re!.Sub![0]!.Op != 2) {
				writeRegexp(b, re!.Sub![0], $.mapGet(flags, re!.Sub![0], 0)[0], flags)
			}
			b.WriteRune(41)
			break
		case 14:
		case 15:
		case 16:
		case 17:
			let p = (0 as printFlags)
			let sub = re!.Sub![0]
			if (sub!.Op > 13 || sub!.Op == 3 && $.len(sub!.Rune) > 1) {
				p = 16
			}
			writeRegexp(b, sub, p, flags)
			switch (re!.Op) {
				case 14:
					b.WriteRune(42)
					break
				case 15:
					b.WriteRune(43)
					break
				case 16:
					b.WriteRune(63)
					break
				case 17:
					b.WriteRune(123)
					b.WriteString(strconv.Itoa(re!.Min))
					if (re!.Max != re!.Min) {
						b.WriteRune(44)
						if (re!.Max >= 0) {
							b.WriteString(strconv.Itoa(re!.Max))
						}
					}
					b.WriteRune(125)
					break
			}
			if ((re!.Flags & 32) != 0) {
				b.WriteRune(63)
			}
			break
		case 18:
			for (let _i = 0; _i < $.len(re!.Sub); _i++) {
				const sub = re!.Sub![_i]
				{
					let p = (0 as printFlags)
					if (sub!.Op == 19) {
						p = 16
					}
					writeRegexp(b, sub, p, flags)
				}
			}
			break
		case 19:
			for (let i = 0; i < $.len(re!.Sub); i++) {
				const sub = re!.Sub![i]
				{
					if (i > 0) {
						b.WriteRune(124)
					}
					writeRegexp(b, sub, 0, flags)
				}
			}
			break
	}
}

let meta: string = "\\.+*?()|[]{}^$"

export function escape(b: strings.Builder | null, r: number, force: boolean): void {
	if (unicode.IsPrint(r)) {
		if (strings.ContainsRune("\\.+*?()|[]{}^$", r) || force) {
			b.WriteRune(92)
		}
		b.WriteRune(r)
		return 
	}

	switch (r) {
		case 7:
			b.WriteString("\\a")
			break
		case 12:
			b.WriteString("\\f")
			break
		case 10:
			b.WriteString("\\n")
			break
		case 13:
			b.WriteString("\\r")
			break
		case 9:
			b.WriteString("\\t")
			break
		case 11:
			b.WriteString("\\v")
			break
		default:
			if (r < 0x100) {
				b.WriteString("\\x")
				let s = strconv.FormatInt((r as number), 16)
				if ($.len(s) == 1) {
					b.WriteRune(48)
				}
				b.WriteString(s)
				break
			}
			b.WriteString("\\x{")
			b.WriteString(strconv.FormatInt((r as number), 16))
			b.WriteString(`}`)
			break
	}
}


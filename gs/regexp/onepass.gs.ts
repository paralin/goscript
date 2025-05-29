import * as $ from "@goscript/builtin/builtin.js";

import * as syntax from "@goscript/regexp/syntax/index.js"

import * as slices from "@goscript/slices/index.js"

import * as strings from "@goscript/strings/index.js"

import * as unicode from "@goscript/unicode/index.js"

import * as utf8 from "@goscript/unicode/utf8/index.js"

class onePassProg {
	public get Inst(): $.Slice<onePassInst> {
		return this._fields.Inst.value
	}
	public set Inst(value: $.Slice<onePassInst>) {
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
		Inst: $.VarRef<$.Slice<onePassInst>>;
		Start: $.VarRef<number>;
		NumCap: $.VarRef<number>;
	}

	constructor(init?: Partial<{Inst?: $.Slice<onePassInst>, NumCap?: number, Start?: number}>) {
		this._fields = {
			Inst: $.varRef(init?.Inst ?? null),
			Start: $.varRef(init?.Start ?? 0),
			NumCap: $.varRef(init?.NumCap ?? 0)
		}
	}

	public clone(): onePassProg {
		const cloned = new onePassProg()
		cloned._fields = {
			Inst: $.varRef(this._fields.Inst.value),
			Start: $.varRef(this._fields.Start.value),
			NumCap: $.varRef(this._fields.NumCap.value)
		}
		return cloned
	}

	// Register this type with the runtime type system
	static __typeInfo = $.registerStructType(
	  'onePassProg',
	  new onePassProg(),
	  [],
	  onePassProg,
	  {"Inst": { kind: $.TypeKind.Slice, elemType: "onePassInst" }, "Start": { kind: $.TypeKind.Basic, name: "number" }, "NumCap": { kind: $.TypeKind.Basic, name: "number" }}
	);
}

class onePassInst {
	public get Next(): $.Slice<number> {
		return this._fields.Next.value
	}
	public set Next(value: $.Slice<number>) {
		this._fields.Next.value = value
	}

	public get Inst(): syntax.Inst {
		return this._fields.Inst.value
	}
	public set Inst(value: syntax.Inst) {
		this._fields.Inst.value = value
	}

	public _fields: {
		Inst: $.VarRef<syntax.Inst>;
		Next: $.VarRef<$.Slice<number>>;
	}

	constructor(init?: Partial<{Inst?: Partial<ConstructorParameters<typeof Inst>[0]>, Next?: $.Slice<number>}>) {
		this._fields = {
			Inst: $.varRef(new Inst(init?.Inst)),
			Next: $.varRef(init?.Next ?? null)
		}
	}

	public clone(): onePassInst {
		const cloned = new onePassInst()
		cloned._fields = {
			Inst: $.varRef(this._fields.Inst.value.clone()),
			Next: $.varRef(this._fields.Next.value)
		}
		return cloned
	}

	public get Op(): syntax.InstOp {
		return this.Inst.Op
	}
	public set Op(value: syntax.InstOp) {
		this.Inst.Op = value
	}

	public get Out(): number {
		return this.Inst.Out
	}
	public set Out(value: number) {
		this.Inst.Out = value
	}

	public get Arg(): number {
		return this.Inst.Arg
	}
	public set Arg(value: number) {
		this.Inst.Arg = value
	}

	public get Rune(): $.Slice<number> {
		return this.Inst.Rune
	}
	public set Rune(value: $.Slice<number>) {
		this.Inst.Rune = value
	}

	// Register this type with the runtime type system
	static __typeInfo = $.registerStructType(
	  'onePassInst',
	  new onePassInst(),
	  [],
	  onePassInst,
	  {"Inst": "Inst", "Next": { kind: $.TypeKind.Slice, elemType: { kind: $.TypeKind.Basic, name: "number" } }}
	);
}

// onePassPrefix returns a literal string that all matches for the
// regexp must start with. Complete is true if the prefix
// is the entire match. Pc is the index of the last rune instruction
// in the string. The onePassPrefix skips over the mandatory
// EmptyBeginText.
export function onePassPrefix(p: syntax.Prog | null): [string, boolean, number] {
	let prefix: string = ""
	let complete: boolean = false
	let pc: number = 0
	{
		let i = p.Inst![p.Start]
		if (i.Op != syntax.InstEmptyWidth || ((syntax.EmptyOp(i.Arg)) & syntax.EmptyBeginText) == 0) {
			return ["", i.Op == syntax.InstMatch, (p.Start as number)]
		}
		pc = i.Out
		i = p.Inst![pc]
		for (; i.Op == syntax.InstNop; ) {
			pc = i.Out
			i = p.Inst![pc]
		}
		// Avoid allocation of buffer if prefix is empty.
		if (iop(i) != syntax.InstRune || $.len(i.Rune) != 1) {
			return ["", i.Op == syntax.InstMatch, (p.Start as number)]
		}

		// Have prefix; gather characters.
		let buf: strings.Builder = new strings.Builder()
		for (; iop(i) == syntax.InstRune && $.len(i.Rune) == 1 && (syntax.Flags(i.Arg) & syntax.FoldCase) == 0 && i.Rune![0] != utf8.RuneError; ) {
			buf.WriteRune(i.Rune![0])
			[pc, i] = [i.Out, p.Inst![i.Out]]
		}
		if (i.Op == syntax.InstEmptyWidth && (syntax.EmptyOp(i.Arg) & syntax.EmptyEndText) != 0 && p.Inst![i.Out].Op == syntax.InstMatch) {
			complete = true
		}
		return [buf.String(), complete, pc]
	}
}

// onePassNext selects the next actionable state of the prog, based on the input character.
// It should only be called when i.Op == InstAlt or InstAltMatch, and from the one-pass machine.
// One of the alternates may ultimately lead without input to end of line. If the instruction
// is InstAltMatch the path to the InstMatch is in i.Out, the normal node in i.Next.
export function onePassNext(i: onePassInst | null, r: number): number {
	let next = i.MatchRunePos(r)
	if (next >= 0) {
		return i.Next![next]
	}
	if (i.Op == syntax.InstAltMatch) {
		return i.Out
	}
	return 0
}

export function iop(i: syntax.Inst | null): syntax.InstOp {
	let op = i.Op
	switch (op) {
		case syntax.InstRune1:
		case syntax.InstRuneAny:
		case syntax.InstRuneAnyNotNL:
			op = syntax.InstRune
			break
	}
	return op
}

class queueOnePass {
	public get sparse(): $.Slice<number> {
		return this._fields.sparse.value
	}
	public set sparse(value: $.Slice<number>) {
		this._fields.sparse.value = value
	}

	public get dense(): $.Slice<number> {
		return this._fields.dense.value
	}
	public set dense(value: $.Slice<number>) {
		this._fields.dense.value = value
	}

	public get size(): number {
		return this._fields.size.value
	}
	public set size(value: number) {
		this._fields.size.value = value
	}

	public get nextIndex(): number {
		return this._fields.nextIndex.value
	}
	public set nextIndex(value: number) {
		this._fields.nextIndex.value = value
	}

	public _fields: {
		sparse: $.VarRef<$.Slice<number>>;
		dense: $.VarRef<$.Slice<number>>;
		size: $.VarRef<number>;
		nextIndex: $.VarRef<number>;
	}

	constructor(init?: Partial<{dense?: $.Slice<number>, nextIndex?: number, size?: number, sparse?: $.Slice<number>}>) {
		this._fields = {
			sparse: $.varRef(init?.sparse ?? null),
			dense: $.varRef(init?.dense ?? null),
			size: $.varRef(init?.size ?? 0),
			nextIndex: $.varRef(init?.nextIndex ?? 0)
		}
	}

	public clone(): queueOnePass {
		const cloned = new queueOnePass()
		cloned._fields = {
			sparse: $.varRef(this._fields.sparse.value),
			dense: $.varRef(this._fields.dense.value),
			size: $.varRef(this._fields.size.value),
			nextIndex: $.varRef(this._fields.nextIndex.value)
		}
		return cloned
	}

	public empty(): boolean {
		const q = this
		return q.nextIndex >= q.size
	}

	public next(): number {
		const q = this
		n = q.dense![q.nextIndex]
		q.nextIndex++
		return n
	}

	public clear(): void {
		const q = this
		q.size = 0
		q.nextIndex = 0
	}

	public contains(u: number): boolean {
		const q = this
		if (u >= ($.len(q.sparse) as number)) {
			return false
		}
		return q.sparse![u] < q.size && q.dense![q.sparse![u]] == u
	}

	public insert(u: number): void {
		const q = this
		if (!q.contains(u)) {
			q.insertNew(u)
		}
	}

	public insertNew(u: number): void {
		const q = this
		if (u >= ($.len(q.sparse) as number)) {
			return 
		}
		q.sparse![u] = q.size
		q.dense![q.size] = u
		q.size++
	}

	// Register this type with the runtime type system
	static __typeInfo = $.registerStructType(
	  'queueOnePass',
	  new queueOnePass(),
	  [{ name: "empty", args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: "boolean" } }] }, { name: "next", args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: "number" } }] }, { name: "clear", args: [], returns: [] }, { name: "contains", args: [{ name: "u", type: { kind: $.TypeKind.Basic, name: "number" } }], returns: [{ type: { kind: $.TypeKind.Basic, name: "boolean" } }] }, { name: "insert", args: [{ name: "u", type: { kind: $.TypeKind.Basic, name: "number" } }], returns: [] }, { name: "insertNew", args: [{ name: "u", type: { kind: $.TypeKind.Basic, name: "number" } }], returns: [] }],
	  queueOnePass,
	  {"sparse": { kind: $.TypeKind.Slice, elemType: { kind: $.TypeKind.Basic, name: "number" } }, "dense": { kind: $.TypeKind.Slice, elemType: { kind: $.TypeKind.Basic, name: "number" } }, "size": { kind: $.TypeKind.Basic, name: "number" }, "nextIndex": { kind: $.TypeKind.Basic, name: "number" }}
	);
}

export function newQueue(size: number): queueOnePass | null {
	let q: queueOnePass | null = null
	{
		return new queueOnePass({dense: $.makeSlice<number>(size, undefined, 'number'), sparse: $.makeSlice<number>(size, undefined, 'number')})
	}
}

let mergeFailed: number = (0xffffffff as number)

let noRune = $.arrayToSlice<number>([])

let noNext = $.arrayToSlice<number>([4294967295])

export function mergeRuneSets(leftRunes: $.VarRef<$.Slice<number>> | null, rightRunes: $.VarRef<$.Slice<number>> | null, leftPC: number, rightPC: number): [$.Slice<number>, $.Slice<number>] {
	using __defer = new $.DisposableStack();
	let leftLen = $.len(leftRunes!.value)
	let rightLen = $.len(rightRunes!.value)
	if ((leftLen & 0x1) != 0 || (rightLen & 0x1) != 0) {
		$.panic("mergeRuneSets odd length []rune")
	}
	let [lx, rx] = []
	let merged = $.makeSlice<number>(0, undefined, 'number')
	let next = $.makeSlice<number>(0, undefined, 'number')
	let ok = true
	__defer.defer(() => {
		if (!ok) {
			merged = null
			next = null
		}
	});

	let ix = -1
	let extend = (newLow: $.VarRef<number> | null, newArray: $.VarRef<$.Slice<number>> | null, pc: number): boolean => {
		if (ix > 0 && (newArray!.value)![newLow!.value] <= merged![ix]) {
			return false
		}
		merged = $.append(merged, (newArray!.value)![newLow!.value], (newArray!.value)![newLow!.value + 1])
		newLow!.value = 2
		ix += 2
		next = $.append(next, pc)
		return true
	}

	for (; lx < leftLen || rx < rightLen; ) {
		switch (true) {
			case rx >= rightLen:
				ok = extend!(lx, leftRunes, leftPC)
				break
			case lx >= leftLen:
				ok = extend!(rx, rightRunes, rightPC)
				break
			case (rightRunes!.value)![rx] < (leftRunes!.value)![lx]:
				ok = extend!(rx, rightRunes, rightPC)
				break
			default:
				ok = extend!(lx, leftRunes, leftPC)
				break
		}
		if (!ok) {
			return [noRune, noNext]
		}
	}
	return [merged, next]
}

// cleanupOnePass drops working memory, and restores certain shortcut instructions.
export function cleanupOnePass(prog: onePassProg | null, original: syntax.Prog | null): void {
	for (let ix = 0; ix < $.len(original!.Inst); ix++) {
		const instOriginal = original!.Inst![ix]
		{
			switch (instOriginal.Op) {
				case syntax.InstAlt:
				case syntax.InstAltMatch:
				case syntax.InstRune:
					break
				case syntax.InstCapture:
				case syntax.InstEmptyWidth:
				case syntax.InstNop:
				case syntax.InstMatch:
				case syntax.InstFail:
					prog!.Inst![ix].Next = null
					break
				case syntax.InstRune1:
				case syntax.InstRuneAny:
				case syntax.InstRuneAnyNotNL:
					prog!.Inst![ix].Next = null
					prog!.Inst![ix] = new onePassInst({Inst: instOriginal})
					break
			}
		}
	}
}

// onePassCopy creates a copy of the original Prog, as we'll be modifying it.
export function onePassCopy(prog: syntax.Prog | null): onePassProg | null {
	let p = new onePassProg({Inst: $.makeSlice<onePassInst>($.len(prog!.Inst)), NumCap: prog!.NumCap, Start: prog!.Start})
	for (let i = 0; i < $.len(prog!.Inst); i++) {
		const inst = prog!.Inst![i]
		{
			p.Inst![i] = new onePassInst({Inst: inst})
		}
	}

	// rewrites one or more common Prog constructs that enable some otherwise
	// non-onepass Progs to be onepass. A:BD (for example) means an InstAlt at
	// ip A, that points to ips B & C.
	// A:BC + B:DA => A:BC + B:CD
	// A:BC + B:DC => A:DC + B:DC

	// A:Bx + B:Ay

	// make sure a target is another Alt

	// Analyzing both legs pointing to Alts is for another day

	// too complicated

	// simple empty transition loop
	// A:BC + B:DA => A:BC + B:DC

	// empty transition to common target
	// A:BC + B:DC => A:DC + B:DC
	for (let pc = 0; pc < $.len(p.Inst); pc++) {
		{

			// A:Bx + B:Ay

			// make sure a target is another Alt

			// Analyzing both legs pointing to Alts is for another day

			// too complicated

			// simple empty transition loop
			// A:BC + B:DA => A:BC + B:DC

			// empty transition to common target
			// A:BC + B:DC => A:DC + B:DC
			switch (p.Inst![pc].Op) {
				default:
					continue
					break
				case syntax.InstAlt:
				case syntax.InstAltMatch:
					let p_A_Other = p.Inst![pc].Out
					let p_A_Alt = p.Inst![pc].Arg
					let instAlt = p.Inst![p_A_Alt!.value].clone()
					if (!(instAlt.Op == syntax.InstAlt || instAlt.Op == syntax.InstAltMatch)) {
						[p_A_Alt, p_A_Other] = [p_A_Other, p_A_Alt]
						instAlt = p.Inst![p_A_Alt!.value].clone()
						if (!(instAlt.Op == syntax.InstAlt || instAlt.Op == syntax.InstAltMatch)) {
							continue
						}
					}
					let instOther = p.Inst![p_A_Other!.value].clone()
					if (instOther.Op == syntax.InstAlt || instOther.Op == syntax.InstAltMatch) {
						// too complicated
						continue
					}
					let p_B_Alt = p.Inst![p_A_Alt!.value].Out
					let p_B_Other = p.Inst![p_A_Alt!.value].Arg
					let patch = false
					if (instAlt.Out == (pc as number)) {
						patch = true
					} else if (instAlt.Arg == (pc as number)) {
						patch = true
						[p_B_Alt, p_B_Other] = [p_B_Other, p_B_Alt]
					}
					if (patch) {
						p_B_Alt!.value = p_A_Other!.value
					}
					if (p_A_Other!.value == p_B_Alt!.value) {
						p_A_Alt!.value = p_B_Other!.value
					}
					break
			}
		}
	}
	return p
}

let anyRuneNotNL = $.arrayToSlice<number>([0, 10 - 1, 10 + 1, unicode.MaxRune])

let anyRune = $.arrayToSlice<number>([0, unicode.MaxRune])

// makeOnePass creates a onepass Prog, if possible. It is possible if at any alt,
// the match engine can always tell which branch to take. The routine may modify
// p if it is turned into a onepass Prog. If it isn't possible for this to be a
// onepass Prog, the Prog nil is returned. makeOnePass is recursive
// to the size of the Prog.
export function makeOnePass(p: onePassProg | null): onePassProg | null {
	// If the machine is very long, it's not worth the time to check if we can use one pass.
	if ($.len(p.Inst) >= 1000) {
		return null
	}

	let instQueue: queueOnePass | null = newQueue($.len(p.Inst))
	let visitQueue: queueOnePass | null = newQueue($.len(p.Inst))
	let check: ((p0: number, p1: $.Slice<boolean>) => boolean) | null = null
	let onePassRunes: $.Slice<$.Slice<number>> = $.makeSlice<$.Slice<number>>($.len(p.Inst))

	// check that paths from Alt instructions are unambiguous, and rebuild the new
	// program as a onepass program

	// check no-input paths to InstMatch

	// Match on empty goes in inst.Out

	// build a dispatch operator from the two legs of the alt.

	// pass matching runes back through these no-ops.

	// expand case-folded runes
	check = (pc: number, m: $.Slice<boolean>): [boolean] => {
		let ok: boolean = false
		{
			ok = true
			let inst = p.Inst![pc]
			if (visitQueue!.contains(pc)) {
				return ok
			}
			visitQueue!.insert(pc)

			// check no-input paths to InstMatch

			// Match on empty goes in inst.Out

			// build a dispatch operator from the two legs of the alt.

			// pass matching runes back through these no-ops.

			// expand case-folded runes
			switch (inst!.Op) {
				case syntax.InstAlt:
				case syntax.InstAltMatch:
					ok = check!(inst!.Out, m) && check!(inst!.Arg, m)
					let matchOut = m![inst!.Out]
					let matchArg = m![inst!.Arg]
					if (matchOut && matchArg) {
						ok = false
						break
					}
					if (matchArg) {
						[inst!.Out, inst!.Arg] = [inst!.Arg, inst!.Out]
						[matchOut, matchArg] = [matchArg, matchOut]
					}
					if (matchOut) {
						m![pc] = true
						inst!.Op = syntax.InstAltMatch
					}
					{
					  const _tmp = mergeRuneSets(onePassRunes![inst!.Out], onePassRunes![inst!.Arg], inst!.Out, inst!.Arg)
					  onePassRunes![pc] = _tmp[0]
					  inst!.Next = _tmp[1]
					}
					if ($.len(inst!.Next) > 0 && inst!.Next![0] == 4294967295) {
						ok = false
						break
					}
					break
				case syntax.InstCapture:
				case syntax.InstNop:
					ok = check!(inst!.Out, m)
					m![pc] = m![inst!.Out]
					onePassRunes![pc] = $.append($.arrayToSlice<number>([]), onePassRunes![inst!.Out])
					inst!.Next = $.makeSlice<number>($.len(onePassRunes![pc]) / 2 + 1, undefined, 'number')
					for (let i = 0; i < $.len(inst!.Next); i++) {
						{
							inst!.Next![i] = inst!.Out
						}
					}
					break
				case syntax.InstEmptyWidth:
					ok = check!(inst!.Out, m)
					m![pc] = m![inst!.Out]
					onePassRunes![pc] = $.append($.arrayToSlice<number>([]), onePassRunes![inst!.Out])
					inst!.Next = $.makeSlice<number>($.len(onePassRunes![pc]) / 2 + 1, undefined, 'number')
					for (let i = 0; i < $.len(inst!.Next); i++) {
						{
							inst!.Next![i] = inst!.Out
						}
					}
					break
				case syntax.InstMatch:
				case syntax.InstFail:
					m![pc] = inst!.Op == syntax.InstMatch
					break
				case syntax.InstRune:
					m![pc] = false
					if ($.len(inst!.Next) > 0) {
						break
					}
					instQueue!.insert(inst!.Out)
					if ($.len(inst!.Rune) == 0) {
						onePassRunes![pc] = $.arrayToSlice<number>([])
						inst!.Next = $.arrayToSlice<number>([inst!.Out])
						break
					}
					let runes = $.makeSlice<number>(0, undefined, 'number')
					if ($.len(inst!.Rune) == 1 && (syntax.Flags(inst!.Arg) & syntax.FoldCase) != 0) {
						let r0 = inst!.Rune![0]
						runes = $.append(runes, r0, r0)
						for (let r1 = unicode.SimpleFold(r0); r1 != r0; r1 = unicode.SimpleFold(r1)) {
							runes = $.append(runes, r1, r1)
						}
						slices.Sort(runes)
					} else {
						runes = $.append(runes, inst!.Rune)
					}
					onePassRunes![pc] = runes
					inst!.Next = $.makeSlice<number>($.len(onePassRunes![pc]) / 2 + 1, undefined, 'number')
					for (let i = 0; i < $.len(inst!.Next); i++) {
						{
							inst!.Next![i] = inst!.Out
						}
					}
					inst!.Op = syntax.InstRune
					break
				case syntax.InstRune1:
					m![pc] = false
					if ($.len(inst!.Next) > 0) {
						break
					}
					instQueue!.insert(inst!.Out)
					let runes = $.arrayToSlice<number>([])
					if ((syntax.Flags(inst!.Arg) & syntax.FoldCase) != 0) {
						let r0 = inst!.Rune![0]
						runes = $.append(runes, r0, r0)
						for (let r1 = unicode.SimpleFold(r0); r1 != r0; r1 = unicode.SimpleFold(r1)) {
							runes = $.append(runes, r1, r1)
						}
						slices.Sort(runes)
					} else {
						runes = $.append(runes, inst!.Rune![0], inst!.Rune![0])
					}
					onePassRunes![pc] = runes
					inst!.Next = $.makeSlice<number>($.len(onePassRunes![pc]) / 2 + 1, undefined, 'number')
					for (let i = 0; i < $.len(inst!.Next); i++) {
						{
							inst!.Next![i] = inst!.Out
						}
					}
					inst!.Op = syntax.InstRune
					break
				case syntax.InstRuneAny:
					m![pc] = false
					if ($.len(inst!.Next) > 0) {
						break
					}
					instQueue!.insert(inst!.Out)
					onePassRunes![pc] = $.append($.arrayToSlice<number>([]), anyRune)
					inst!.Next = $.arrayToSlice<number>([inst!.Out])
					break
				case syntax.InstRuneAnyNotNL:
					m![pc] = false
					if ($.len(inst!.Next) > 0) {
						break
					}
					instQueue!.insert(inst!.Out)
					onePassRunes![pc] = $.append($.arrayToSlice<number>([]), anyRuneNotNL)
					inst!.Next = $.makeSlice<number>($.len(onePassRunes![pc]) / 2 + 1, undefined, 'number')
					for (let i = 0; i < $.len(inst!.Next); i++) {
						{
							inst!.Next![i] = inst!.Out
						}
					}
					break
			}
			return ok
		}}

	instQueue!.clear()
	instQueue!.insert((p.Start as number))
	let m = $.makeSlice<boolean>($.len(p.Inst), undefined, 'boolean')
	for (; !instQueue!.empty(); ) {
		visitQueue!.clear()
		let pc = instQueue!.next()
		if (!check!(pc, m)) {
			p = null
			break
		}
	}
	if (p != null) {
		for (let i = 0; i < $.len(p.Inst); i++) {
			{
				p.Inst![i].Rune = onePassRunes![i]
			}
		}
	}
	return p
}

// compileOnePass returns a new *syntax.Prog suitable for onePass execution if the original Prog
// can be recharacterized as a one-pass regexp program, or syntax.nil if the
// Prog cannot be converted. For a one pass prog, the fundamental condition that must
// be true is: at any InstAlt, there must be no ambiguity about what branch to  take.
export function compileOnePass(prog: syntax.Prog | null): onePassProg | null {
	let p: onePassProg | null = null
	{
		if (prog!.Start == 0) {
			return null
		}
		// onepass regexp is anchored
		if (prog!.Inst![prog!.Start].Op != syntax.InstEmptyWidth || (syntax.EmptyOp(prog!.Inst![prog!.Start].Arg) & syntax.EmptyBeginText) != syntax.EmptyBeginText) {
			return null
		}
		let hasAlt = false
		for (let _i = 0; _i < $.len(prog!.Inst); _i++) {
			const inst = prog!.Inst![_i]
			{
				if (inst.Op == syntax.InstAlt || inst.Op == syntax.InstAltMatch) {
					hasAlt = true
					break
				}
			}
		}
		// If we have alternates, every instruction leading to InstMatch must be EmptyEndText.
		// Also, any match on empty text must be $.
		for (let _i = 0; _i < $.len(prog!.Inst); _i++) {
			const inst = prog!.Inst![_i]
			{
				let opOut = prog!.Inst![inst.Out].Op
				switch (inst.Op) {
					default:
						if (opOut == syntax.InstMatch && hasAlt) {
							return null
						}
						break
					case syntax.InstAlt:
					case syntax.InstAltMatch:
						if (opOut == syntax.InstMatch || prog!.Inst![inst.Arg].Op == syntax.InstMatch) {
							return null
						}
						break
					case syntax.InstEmptyWidth:
						if (opOut == syntax.InstMatch) {
							if ((syntax.EmptyOp(inst.Arg) & syntax.EmptyEndText) == syntax.EmptyEndText) {
								continue
							}
							return null
						}
						break
				}
			}
		}
		// Creates a slightly optimized copy of the original Prog
		// that cleans up some Prog idioms that block valid onepass programs
		p = onePassCopy(prog)

		// checkAmbiguity on InstAlts, build onepass Prog if possible
		p = makeOnePass(p)

		if (p != null) {
			cleanupOnePass(p, prog)
		}
		return p
	}
}


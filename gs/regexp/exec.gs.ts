import * as $ from "@goscript/builtin/builtin.js";
import { onePassNext } from "./onepass.gs.js";

import * as io from "@goscript/io/index.js"

import * as syntax from "@goscript/regexp/syntax/index.js"

import * as sync from "@goscript/sync/index.js"

class queue {
	public get sparse(): $.Slice<number> {
		return this._fields.sparse.value
	}
	public set sparse(value: $.Slice<number>) {
		this._fields.sparse.value = value
	}

	public get dense(): $.Slice<entry> {
		return this._fields.dense.value
	}
	public set dense(value: $.Slice<entry>) {
		this._fields.dense.value = value
	}

	public _fields: {
		sparse: $.VarRef<$.Slice<number>>;
		dense: $.VarRef<$.Slice<entry>>;
	}

	constructor(init?: Partial<{dense?: $.Slice<entry>, sparse?: $.Slice<number>}>) {
		this._fields = {
			sparse: $.varRef(init?.sparse ?? null),
			dense: $.varRef(init?.dense ?? null)
		}
	}

	public clone(): queue {
		const cloned = new queue()
		cloned._fields = {
			sparse: $.varRef(this._fields.sparse.value),
			dense: $.varRef(this._fields.dense.value)
		}
		return cloned
	}

	// Register this type with the runtime type system
	static __typeInfo = $.registerStructType(
	  'queue',
	  new queue(),
	  [],
	  queue,
	  {"sparse": { kind: $.TypeKind.Slice, elemType: { kind: $.TypeKind.Basic, name: "number" } }, "dense": { kind: $.TypeKind.Slice, elemType: "entry" }}
	);
}

class entry {
	public get pc(): number {
		return this._fields.pc.value
	}
	public set pc(value: number) {
		this._fields.pc.value = value
	}

	public get t(): thread | null {
		return this._fields.t.value
	}
	public set t(value: thread | null) {
		this._fields.t.value = value
	}

	public _fields: {
		pc: $.VarRef<number>;
		t: $.VarRef<thread | null>;
	}

	constructor(init?: Partial<{pc?: number, t?: thread | null}>) {
		this._fields = {
			pc: $.varRef(init?.pc ?? 0),
			t: $.varRef(init?.t ?? null)
		}
	}

	public clone(): entry {
		const cloned = new entry()
		cloned._fields = {
			pc: $.varRef(this._fields.pc.value),
			t: $.varRef(this._fields.t.value)
		}
		return cloned
	}

	// Register this type with the runtime type system
	static __typeInfo = $.registerStructType(
	  'entry',
	  new entry(),
	  [],
	  entry,
	  {"pc": { kind: $.TypeKind.Basic, name: "number" }, "t": { kind: $.TypeKind.Pointer, elemType: "thread" }}
	);
}

class thread {
	public get inst(): syntax.Inst | null {
		return this._fields.inst.value
	}
	public set inst(value: syntax.Inst | null) {
		this._fields.inst.value = value
	}

	public get cap(): $.Slice<number> {
		return this._fields.cap.value
	}
	public set cap(value: $.Slice<number>) {
		this._fields.cap.value = value
	}

	public _fields: {
		inst: $.VarRef<syntax.Inst | null>;
		cap: $.VarRef<$.Slice<number>>;
	}

	constructor(init?: Partial<{cap?: $.Slice<number>, inst?: syntax.Inst | null}>) {
		this._fields = {
			inst: $.varRef(init?.inst ?? null),
			cap: $.varRef(init?.cap ?? null)
		}
	}

	public clone(): thread {
		const cloned = new thread()
		cloned._fields = {
			inst: $.varRef(this._fields.inst.value),
			cap: $.varRef(this._fields.cap.value)
		}
		return cloned
	}

	// Register this type with the runtime type system
	static __typeInfo = $.registerStructType(
	  'thread',
	  new thread(),
	  [],
	  thread,
	  {"inst": { kind: $.TypeKind.Pointer, elemType: "Inst" }, "cap": { kind: $.TypeKind.Slice, elemType: { kind: $.TypeKind.Basic, name: "number" } }}
	);
}

class machine {
	// corresponding Regexp
	public get re(): Regexp | null {
		return this._fields.re.value
	}
	public set re(value: Regexp | null) {
		this._fields.re.value = value
	}

	// compiled program
	public get p(): syntax.Prog | null {
		return this._fields.p.value
	}
	public set p(value: syntax.Prog | null) {
		this._fields.p.value = value
	}

	// two queues for runq, nextq
	public get q0(): queue {
		return this._fields.q0.value
	}
	public set q0(value: queue) {
		this._fields.q0.value = value
	}

	// two queues for runq, nextq
	public get q1(): queue {
		return this._fields.q1.value
	}
	public set q1(value: queue) {
		this._fields.q1.value = value
	}

	// pool of available threads
	public get pool(): $.Slice<thread | null> {
		return this._fields.pool.value
	}
	public set pool(value: $.Slice<thread | null>) {
		this._fields.pool.value = value
	}

	// whether a match was found
	public get matched(): boolean {
		return this._fields.matched.value
	}
	public set matched(value: boolean) {
		this._fields.matched.value = value
	}

	// capture information for the match
	public get matchcap(): $.Slice<number> {
		return this._fields.matchcap.value
	}
	public set matchcap(value: $.Slice<number>) {
		this._fields.matchcap.value = value
	}

	public get inputs(): inputs {
		return this._fields.inputs.value
	}
	public set inputs(value: inputs) {
		this._fields.inputs.value = value
	}

	public _fields: {
		re: $.VarRef<Regexp | null>;
		p: $.VarRef<syntax.Prog | null>;
		q0: $.VarRef<queue>;
		q1: $.VarRef<queue>;
		pool: $.VarRef<$.Slice<thread | null>>;
		matched: $.VarRef<boolean>;
		matchcap: $.VarRef<$.Slice<number>>;
		inputs: $.VarRef<inputs>;
	}

	constructor(init?: Partial<{inputs?: inputs, matchcap?: $.Slice<number>, matched?: boolean, p?: syntax.Prog | null, pool?: $.Slice<thread | null>, q0?: queue, q1?: queue, re?: Regexp | null}>) {
		this._fields = {
			re: $.varRef(init?.re ?? null),
			p: $.varRef(init?.p ?? null),
			q0: $.varRef(init?.q0?.clone() ?? new queue()),
			q1: $.varRef(init?.q1?.clone() ?? new queue()),
			pool: $.varRef(init?.pool ?? null),
			matched: $.varRef(init?.matched ?? false),
			matchcap: $.varRef(init?.matchcap ?? null),
			inputs: $.varRef(init?.inputs?.clone() ?? new inputs())
		}
	}

	public clone(): machine {
		const cloned = new machine()
		cloned._fields = {
			re: $.varRef(this._fields.re.value),
			p: $.varRef(this._fields.p.value),
			q0: $.varRef(this._fields.q0.value?.clone() ?? null),
			q1: $.varRef(this._fields.q1.value?.clone() ?? null),
			pool: $.varRef(this._fields.pool.value),
			matched: $.varRef(this._fields.matched.value),
			matchcap: $.varRef(this._fields.matchcap.value),
			inputs: $.varRef(this._fields.inputs.value?.clone() ?? null)
		}
		return cloned
	}

	public init(ncap: number): void {
		const m = this
		for (let _i = 0; _i < $.len(m.pool); _i++) {
			const t = m.pool![_i]
			{
				t.cap = $.goSlice(t.cap, undefined, ncap)
			}
		}
		m.matchcap = $.goSlice(m.matchcap, undefined, ncap)
	}

	// alloc allocates a new thread with the given instruction.
	// It uses the free pool if possible.
	public alloc(i: syntax.Inst | null): thread | null {
		const m = this
		let t: thread | null = null
		{
			let n = $.len(m.pool)
			if (n > 0) {
				t = m.pool![n - 1]
				m.pool = $.goSlice(m.pool, undefined, n - 1)
			} else {
				t = new thread()
				t.cap = $.makeSlice<number>($.len(m.matchcap), $.cap(m.matchcap), 'number')
			}
		}
		t.inst = i
		return t
	}

	// match runs the machine over the input starting at pos.
	// It reports whether a match was found.
	// If so, m.matchcap holds the submatch information.
	public match(i: input, pos: number): boolean {
		const m = this
		let startCond = m.re!.cond
		if (startCond == ~syntax.EmptyOp(0)) {
			// impossible
			return false
		}
		m.matched = false
		for (let i = 0; i < $.len(m.matchcap); i++) {
			{
				m.matchcap![i] = -1
			}
		}
		let [runq, nextq] = [m.q0, m.q1]
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
		for (; ; ) {

			// Anchored match, past beginning of text.

			// Have match; finished exploring alternatives.

			// Match requires literal prefix; fast search for it.
			if ($.len(runq!.dense) == 0) {

				// Anchored match, past beginning of text.
				if ((startCond & syntax.EmptyBeginText) != 0 && pos != 0) {
					// Anchored match, past beginning of text.
					break
				}

				// Have match; finished exploring alternatives.
				if (m.matched) {
					// Have match; finished exploring alternatives.
					break
				}

				// Match requires literal prefix; fast search for it.
				if ($.len(m.re!.prefix) > 0 && r1 != m.re!.prefixRune && i!.canCheckPrefix()) {
					// Match requires literal prefix; fast search for it.
					let advance = i!.index(m.re, pos)
					if (advance < 0) {
						break
					}
					pos += advance
					;[r, width] = i!.step(pos)
					;[r1, width1] = i!.step(pos + width)
				}
			}
			if (!m.matched) {
				if ($.len(m.matchcap) > 0) {
					m.matchcap![0] = pos
				}
				m.add(runq, (m.p!.Start as number), pos, m.matchcap, flag, null)
			}
			flag = newLazyFlag(r, r1)
			m.step(runq, nextq, pos, pos + width, r, flag)
			if (width == 0) {
				break
			}

			// Found a match and not paying attention
			// to where it is, so any match will do.
			if ($.len(m.matchcap) == 0 && m.matched) {
				// Found a match and not paying attention
				// to where it is, so any match will do.
				break
			}
			pos += width
			[r, width] = [r1, width1]
			if (r != -1) {
				;[r1, width1] = i!.step(pos + width)
			}
			[runq, nextq] = [nextq, runq]
		}
		m.clear(nextq)
		return m.matched
	}

	// clear frees all threads on the thread queue.
	public clear(q: queue | null): void {
		const m = this
		for (let _i = 0; _i < $.len(q.dense); _i++) {
			const d = q.dense![_i]
			{
				if (d.t != null) {
					m.pool = $.append(m.pool, d.t)
				}
			}
		}
		q.dense = $.goSlice(q.dense, undefined, 0)
	}

	// step executes one step of the machine, running each of the threads
	// on runq and appending new threads to nextq.
	// The step processes the rune c (which may be endOfText),
	// which starts at position pos and ends at nextPos.
	// nextCond gives the setting for the empty-width flags after c.
	public step(runq: queue | null, nextq: queue | null, pos: number, nextPos: number, c: number, nextCond: $.VarRef<lazyFlag> | null): void {
		const m = this
		let longest = m.re!.longest
		for (let j = 0; j < $.len(runq!.dense); j++) {
			let d = runq!.dense![j]
			let t = d.t
			if (t == null) {
				continue
			}
			if (longest && m.matched && $.len(t.cap) > 0 && m.matchcap![0] < t.cap![0]) {
				m.pool = $.append(m.pool, t)
				continue
			}
			let i = t.inst
			let add = false

			// First-match mode: cut off all lower-priority threads.
			switch (i.Op) {
				default:
					$.panic("bad inst")
					break
				case syntax.InstMatch:
					if ($.len(t.cap) > 0 && (!longest || !m.matched || m.matchcap![1] < pos)) {
						t.cap![1] = pos
						$.copy(m.matchcap, t.cap)
					}
					if (!longest) {
						// First-match mode: cut off all lower-priority threads.
						for (let _i = 0; _i < $.len($.goSlice(runq!.dense, j + 1, undefined)); _i++) {
							const d = $.goSlice(runq!.dense, j + 1, undefined)![_i]
							{
								if (d.t != null) {
									m.pool = $.append(m.pool, d.t)
								}
							}
						}
						runq!.dense = $.goSlice(runq!.dense, undefined, 0)
					}
					m.matched = true
					break
				case syntax.InstRune:
					add = i.MatchRune(c)
					break
				case syntax.InstRune1:
					add = c == i.Rune![0]
					break
				case syntax.InstRuneAny:
					add = true
					break
				case syntax.InstRuneAnyNotNL:
					add = c != 10
					break
			}
			if (add) {
				t = m.add(nextq, i.Out, nextPos, t.cap, nextCond, t)
			}
			if (t != null) {
				m.pool = $.append(m.pool, t)
			}
		}
		runq!.dense = $.goSlice(runq!.dense, undefined, 0)
	}

	// add adds an entry to q for pc, unless the q already has such an entry.
	// It also recursively adds an entry for all instructions reachable from pc by following
	// empty-width conditions satisfied by cond.  pos gives the current position
	// in the input.
	public add(q: queue | null, pc: number, pos: number, cap: $.Slice<number>, cond: $.VarRef<lazyFlag> | null, t: thread | null): thread | null {
		const m = this
		Again: if (pc == 0) {
			return t
		}
		{
			let j = q.sparse![pc]
			if (j < ($.len(q.dense) as number) && q.dense![j].pc == pc) {
				return t
			}
		}
		let j = $.len(q.dense)
		q.dense = $.goSlice(q.dense, undefined, j + 1)
		let d = q.dense![j]
		d.t = null
		d.pc = pc
		q.sparse![pc] = (j as number)
		let i = m.p!.Inst![pc]
		switch (i.Op) {
			default:
				$.panic("unhandled")
				break
			case syntax.InstFail:
				break
			case syntax.InstAlt:
			case syntax.InstAltMatch:
				t = m.add(q, i.Out, pos, cap, cond, t)
				pc = i.Arg
				// goto Again // goto statement skipped
				break
			case syntax.InstEmptyWidth:
				if (cond!.match(syntax.EmptyOp(i.Arg))) {
					pc = i.Out
					// goto Again // goto statement skipped
				}
				break
			case syntax.InstNop:
				pc = i.Out
				// goto Again // goto statement skipped
				break
			case syntax.InstCapture:
				if ($.int(i.Arg) < $.len(cap)) {
					let opos = cap![i.Arg]
					cap![i.Arg] = pos
					m.add(q, i.Out, pos, cap, cond, null)
					cap![i.Arg] = opos
				} else {
					pc = i.Out
					// goto Again // goto statement skipped
				}
				break
			case syntax.InstMatch:
			case syntax.InstRune:
			case syntax.InstRune1:
			case syntax.InstRuneAny:
			case syntax.InstRuneAnyNotNL:
				if (t == null) {
					t = m.alloc(i)
				} else {
					t.inst = i
				}
				if ($.len(cap) > 0 && (t.cap![0] !== cap![0])) {
					$.copy(t.cap, cap)
				}
				d.t = t
				t = null
				break
		}
		return t
	}

	// Register this type with the runtime type system
	static __typeInfo = $.registerStructType(
	  'machine',
	  new machine(),
	  [{ name: "init", args: [{ name: "ncap", type: { kind: $.TypeKind.Basic, name: "number" } }], returns: [] }, { name: "alloc", args: [{ name: "i", type: { kind: $.TypeKind.Pointer, elemType: "Inst" } }], returns: [{ type: { kind: $.TypeKind.Pointer, elemType: "thread" } }] }, { name: "match", args: [{ name: "i", type: "input" }, { name: "pos", type: { kind: $.TypeKind.Basic, name: "number" } }], returns: [{ type: { kind: $.TypeKind.Basic, name: "boolean" } }] }, { name: "clear", args: [{ name: "q", type: { kind: $.TypeKind.Pointer, elemType: "queue" } }], returns: [] }, { name: "step", args: [{ name: "runq", type: { kind: $.TypeKind.Pointer, elemType: "queue" } }, { name: "nextq", type: { kind: $.TypeKind.Pointer, elemType: "queue" } }, { name: "pos", type: { kind: $.TypeKind.Basic, name: "number" } }, { name: "nextPos", type: { kind: $.TypeKind.Basic, name: "number" } }, { name: "c", type: { kind: $.TypeKind.Basic, name: "number" } }, { name: "nextCond", type: { kind: $.TypeKind.Pointer, elemType: "lazyFlag" } }], returns: [] }, { name: "add", args: [{ name: "q", type: { kind: $.TypeKind.Pointer, elemType: "queue" } }, { name: "pc", type: { kind: $.TypeKind.Basic, name: "number" } }, { name: "pos", type: { kind: $.TypeKind.Basic, name: "number" } }, { name: "cap", type: { kind: $.TypeKind.Slice, elemType: { kind: $.TypeKind.Basic, name: "number" } } }, { name: "cond", type: { kind: $.TypeKind.Pointer, elemType: "lazyFlag" } }, { name: "t", type: { kind: $.TypeKind.Pointer, elemType: "thread" } }], returns: [{ type: { kind: $.TypeKind.Pointer, elemType: "thread" } }] }],
	  machine,
	  {"re": { kind: $.TypeKind.Pointer, elemType: "Regexp" }, "p": { kind: $.TypeKind.Pointer, elemType: "Prog" }, "q0": "queue", "q1": "queue", "pool": { kind: $.TypeKind.Slice, elemType: { kind: $.TypeKind.Pointer, elemType: "thread" } }, "matched": { kind: $.TypeKind.Basic, name: "boolean" }, "matchcap": { kind: $.TypeKind.Slice, elemType: { kind: $.TypeKind.Basic, name: "number" } }, "inputs": "inputs"}
	);
}

class inputs {
	// cached inputs, to avoid allocation
	public get bytes(): inputBytes {
		return this._fields.bytes.value
	}
	public set bytes(value: inputBytes) {
		this._fields.bytes.value = value
	}

	public get string(): inputString {
		return this._fields.string.value
	}
	public set string(value: inputString) {
		this._fields.string.value = value
	}

	public get reader(): inputReader {
		return this._fields.reader.value
	}
	public set reader(value: inputReader) {
		this._fields.reader.value = value
	}

	public _fields: {
		bytes: $.VarRef<inputBytes>;
		string: $.VarRef<inputString>;
		reader: $.VarRef<inputReader>;
	}

	constructor(init?: Partial<{bytes?: inputBytes, reader?: inputReader, string?: inputString}>) {
		this._fields = {
			bytes: $.varRef(init?.bytes?.clone() ?? new inputBytes()),
			string: $.varRef(init?.string?.clone() ?? new inputString()),
			reader: $.varRef(init?.reader?.clone() ?? new inputReader())
		}
	}

	public clone(): inputs {
		const cloned = new inputs()
		cloned._fields = {
			bytes: $.varRef(this._fields.bytes.value?.clone() ?? null),
			string: $.varRef(this._fields.string.value?.clone() ?? null),
			reader: $.varRef(this._fields.reader.value?.clone() ?? null)
		}
		return cloned
	}

	public newBytes(b: $.Bytes): input {
		const i = this
		i.bytes.str = b
		return i.bytes
	}

	public newString(s: string): input {
		const i = this
		i._string.str = s
		return i._string
	}

	public newReader(r: io.RuneReader): input {
		const i = this
		i.reader.r = r
		i.reader.atEOT = false
		i.reader.pos = 0
		return i.reader
	}

	public clear(): void {
		const i = this
		if (i.bytes.str != null) {
			i.bytes.str = null
		} else if (i.reader.r != null) {
			i.reader.r = null
		} else {
			i._string.str = ""
		}
	}

	public init(r: io.RuneReader, b: $.Bytes, s: string): [input, number] {
		const i = this
		if (r != null) {
			return [i.newReader(r), 0]
		}
		if (b != null) {
			return [i.newBytes(b), $.len(b)]
		}
		return [i.newString(s), $.len(s)]
	}

	// Register this type with the runtime type system
	static __typeInfo = $.registerStructType(
	  'inputs',
	  new inputs(),
	  [{ name: "newBytes", args: [{ name: "b", type: { kind: $.TypeKind.Slice, elemType: { kind: $.TypeKind.Basic, name: "number" } } }], returns: [{ type: "input" }] }, { name: "newString", args: [{ name: "s", type: { kind: $.TypeKind.Basic, name: "string" } }], returns: [{ type: "input" }] }, { name: "newReader", args: [{ name: "r", type: "RuneReader" }], returns: [{ type: "input" }] }, { name: "clear", args: [], returns: [] }, { name: "init", args: [{ name: "r", type: "RuneReader" }, { name: "b", type: { kind: $.TypeKind.Slice, elemType: { kind: $.TypeKind.Basic, name: "number" } } }, { name: "s", type: { kind: $.TypeKind.Basic, name: "string" } }], returns: [{ type: "input" }, { type: { kind: $.TypeKind.Basic, name: "number" } }] }],
	  inputs,
	  {"bytes": "inputBytes", "string": "inputString", "reader": "inputReader"}
	);
}

class lazyFlag {
	constructor(private _value: number) {}

	valueOf(): number {
		return this._value
	}

	toString(): string {
		return String(this._value)
	}

	static from(value: number): lazyFlag {
		return new lazyFlag(value)
	}

	public match(op: syntax.EmptyOp): boolean {
		const f = this._value
		if (op == 0) {
			return true
		}
		let r1 = ((f >> 32) as number)
		if ((op & syntax.EmptyBeginLine) != 0) {
			if (r1 != 10 && r1 >= 0) {
				return false
			}
			op &= ~(syntax.EmptyBeginLine)
		}
		if ((op & syntax.EmptyBeginText) != 0) {
			if (r1 >= 0) {
				return false
			}
			op &= ~(syntax.EmptyBeginText)
		}
		if (op == 0) {
			return true
		}
		let r2 = (f as number)
		if ((op & syntax.EmptyEndLine) != 0) {
			if (r2 != 10 && r2 >= 0) {
				return false
			}
			op &= ~(syntax.EmptyEndLine)
		}
		if ((op & syntax.EmptyEndText) != 0) {
			if (r2 >= 0) {
				return false
			}
			op &= ~(syntax.EmptyEndText)
		}
		if (op == 0) {
			return true
		}
		if (syntax.IsWordChar(r1) != syntax.IsWordChar(r2)) {
			op &= ~(syntax.EmptyWordBoundary)
		} else {
			op &= ~(syntax.EmptyNoWordBoundary)
		}
		return op == 0
	}
}

export function newLazyFlag(r1: number, r2: number): lazyFlag {
	return new lazyFlag((((r1 as number) << 32) | ((r2 as number) as number)))
}

class onePassMachine {
	public get inputs(): inputs {
		return this._fields.inputs.value
	}
	public set inputs(value: inputs) {
		this._fields.inputs.value = value
	}

	public get matchcap(): $.Slice<number> {
		return this._fields.matchcap.value
	}
	public set matchcap(value: $.Slice<number>) {
		this._fields.matchcap.value = value
	}

	public _fields: {
		inputs: $.VarRef<inputs>;
		matchcap: $.VarRef<$.Slice<number>>;
	}

	constructor(init?: Partial<{inputs?: inputs, matchcap?: $.Slice<number>}>) {
		this._fields = {
			inputs: $.varRef(init?.inputs?.clone() ?? new inputs()),
			matchcap: $.varRef(init?.matchcap ?? null)
		}
	}

	public clone(): onePassMachine {
		const cloned = new onePassMachine()
		cloned._fields = {
			inputs: $.varRef(this._fields.inputs.value?.clone() ?? null),
			matchcap: $.varRef(this._fields.matchcap.value)
		}
		return cloned
	}

	// Register this type with the runtime type system
	static __typeInfo = $.registerStructType(
	  'onePassMachine',
	  new onePassMachine(),
	  [],
	  onePassMachine,
	  {"inputs": "inputs", "matchcap": { kind: $.TypeKind.Slice, elemType: { kind: $.TypeKind.Basic, name: "number" } }}
	);
}

let onePassPool: sync.Pool = new sync.Pool()

export function newOnePassMachine(): onePassMachine | null {
	let { value: m, ok: ok } = $.typeAssert<onePassMachine | null>(onePassPool.Get(), {kind: $.TypeKind.Pointer, elemType: 'onePassMachine'})
	if (!ok) {
		m = new onePassMachine()
	}
	return m
}

export function freeOnePassMachine(m: onePassMachine | null): void {
	m.inputs.clear()
	onePassPool.Put(m)
}

let arrayNoInts: number[] = []


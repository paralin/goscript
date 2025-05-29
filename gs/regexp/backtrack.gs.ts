import * as $ from "@goscript/builtin/builtin.js";

import * as syntax from "@goscript/regexp/syntax/index.js"

import * as sync from "@goscript/sync/index.js"

class job {
	public get pc(): number {
		return this._fields.pc.value
	}
	public set pc(value: number) {
		this._fields.pc.value = value
	}

	public get arg(): boolean {
		return this._fields.arg.value
	}
	public set arg(value: boolean) {
		this._fields.arg.value = value
	}

	public get pos(): number {
		return this._fields.pos.value
	}
	public set pos(value: number) {
		this._fields.pos.value = value
	}

	public _fields: {
		pc: $.VarRef<number>;
		arg: $.VarRef<boolean>;
		pos: $.VarRef<number>;
	}

	constructor(init?: Partial<{arg?: boolean, pc?: number, pos?: number}>) {
		this._fields = {
			pc: $.varRef(init?.pc ?? 0),
			arg: $.varRef(init?.arg ?? false),
			pos: $.varRef(init?.pos ?? 0)
		}
	}

	public clone(): job {
		const cloned = new job()
		cloned._fields = {
			pc: $.varRef(this._fields.pc.value),
			arg: $.varRef(this._fields.arg.value),
			pos: $.varRef(this._fields.pos.value)
		}
		return cloned
	}

	// Register this type with the runtime type system
	static __typeInfo = $.registerStructType(
	  'job',
	  new job(),
	  [],
	  job,
	  {"pc": { kind: $.TypeKind.Basic, name: "number" }, "arg": { kind: $.TypeKind.Basic, name: "boolean" }, "pos": { kind: $.TypeKind.Basic, name: "number" }}
	);
}

let visitedBits: number = 32

// len(prog.Inst) <= max
let maxBacktrackProg: number = 500

// bit vector size <= max (bits)
let maxBacktrackVector: number = 256 * 1024

class bitState {
	public get end(): number {
		return this._fields.end.value
	}
	public set end(value: number) {
		this._fields.end.value = value
	}

	public get cap(): $.Slice<number> {
		return this._fields.cap.value
	}
	public set cap(value: $.Slice<number>) {
		this._fields.cap.value = value
	}

	public get matchcap(): $.Slice<number> {
		return this._fields.matchcap.value
	}
	public set matchcap(value: $.Slice<number>) {
		this._fields.matchcap.value = value
	}

	public get jobs(): $.Slice<job> {
		return this._fields.jobs.value
	}
	public set jobs(value: $.Slice<job>) {
		this._fields.jobs.value = value
	}

	public get visited(): $.Slice<number> {
		return this._fields.visited.value
	}
	public set visited(value: $.Slice<number>) {
		this._fields.visited.value = value
	}

	public get inputs(): inputs {
		return this._fields.inputs.value
	}
	public set inputs(value: inputs) {
		this._fields.inputs.value = value
	}

	public _fields: {
		end: $.VarRef<number>;
		cap: $.VarRef<$.Slice<number>>;
		matchcap: $.VarRef<$.Slice<number>>;
		jobs: $.VarRef<$.Slice<job>>;
		visited: $.VarRef<$.Slice<number>>;
		inputs: $.VarRef<inputs>;
	}

	constructor(init?: Partial<{cap?: $.Slice<number>, end?: number, inputs?: inputs, jobs?: $.Slice<job>, matchcap?: $.Slice<number>, visited?: $.Slice<number>}>) {
		this._fields = {
			end: $.varRef(init?.end ?? 0),
			cap: $.varRef(init?.cap ?? null),
			matchcap: $.varRef(init?.matchcap ?? null),
			jobs: $.varRef(init?.jobs ?? null),
			visited: $.varRef(init?.visited ?? null),
			inputs: $.varRef(init?.inputs?.clone() ?? new inputs())
		}
	}

	public clone(): bitState {
		const cloned = new bitState()
		cloned._fields = {
			end: $.varRef(this._fields.end.value),
			cap: $.varRef(this._fields.cap.value),
			matchcap: $.varRef(this._fields.matchcap.value),
			jobs: $.varRef(this._fields.jobs.value),
			visited: $.varRef(this._fields.visited.value),
			inputs: $.varRef(this._fields.inputs.value?.clone() ?? null)
		}
		return cloned
	}

	// reset resets the state of the backtracker.
	// end is the end position in the input.
	// ncap is the number of captures.
	public reset(prog: syntax.Prog | null, end: number, ncap: number): void {
		const b = this
		b.end = end
		if ($.cap(b.jobs) == 0) {
			b.jobs = $.makeSlice<job>(0, 256)
		} else {
			b.jobs = $.goSlice(b.jobs, undefined, 0)
		}
		let visitedSize = ($.len(prog!.Inst) * (end + 1) + 32 - 1) / 32
		if ($.cap(b.visited) < visitedSize) {
			b.visited = $.makeSlice<number>(visitedSize, 262144 / 32, 'number')
		} else {
			b.visited = $.goSlice(b.visited, undefined, visitedSize)
			clear(b.visited) // set to 0
		}
		if ($.cap(b.cap) < ncap) {
			b.cap = $.makeSlice<number>(ncap, undefined, 'number')
		} else {
			b.cap = $.goSlice(b.cap, undefined, ncap)
		}
		for (let i = 0; i < $.len(b.cap); i++) {
			{
				b.cap![i] = -1
			}
		}
		if ($.cap(b.matchcap) < ncap) {
			b.matchcap = $.makeSlice<number>(ncap, undefined, 'number')
		} else {
			b.matchcap = $.goSlice(b.matchcap, undefined, ncap)
		}
		for (let i = 0; i < $.len(b.matchcap); i++) {
			{
				b.matchcap![i] = -1
			}
		}
	}

	// shouldVisit reports whether the combination of (pc, pos) has not
	// been visited yet.
	public shouldVisit(pc: number, pos: number): boolean {
		const b = this
		let n = ($.int(pc) * (b.end + 1) + pos as number)
		if ((b.visited![n / 32] & ((1 << ((n & (32 - 1)))))) != 0) {
			return false
		}
		b.visited![n / 32] |= (1 << ((n & (32 - 1))))
		return true
	}

	// push pushes (pc, pos, arg) onto the job stack if it should be
	// visited.
	public push(re: Regexp | null, pc: number, pos: number, arg: boolean): void {
		const b = this
		if (re!.prog!.Inst![pc].Op != syntax.InstFail && (arg || b.shouldVisit(pc, pos))) {
			b.jobs = $.append(b.jobs, new job({arg: arg, pc: pc, pos: pos}))
		}
	}

	// Register this type with the runtime type system
	static __typeInfo = $.registerStructType(
	  'bitState',
	  new bitState(),
	  [{ name: "reset", args: [{ name: "prog", type: { kind: $.TypeKind.Pointer, elemType: "Prog" } }, { name: "end", type: { kind: $.TypeKind.Basic, name: "number" } }, { name: "ncap", type: { kind: $.TypeKind.Basic, name: "number" } }], returns: [] }, { name: "shouldVisit", args: [{ name: "pc", type: { kind: $.TypeKind.Basic, name: "number" } }, { name: "pos", type: { kind: $.TypeKind.Basic, name: "number" } }], returns: [{ type: { kind: $.TypeKind.Basic, name: "boolean" } }] }, { name: "push", args: [{ name: "re", type: { kind: $.TypeKind.Pointer, elemType: "Regexp" } }, { name: "pc", type: { kind: $.TypeKind.Basic, name: "number" } }, { name: "pos", type: { kind: $.TypeKind.Basic, name: "number" } }, { name: "arg", type: { kind: $.TypeKind.Basic, name: "boolean" } }], returns: [] }],
	  bitState,
	  {"end": { kind: $.TypeKind.Basic, name: "number" }, "cap": { kind: $.TypeKind.Slice, elemType: { kind: $.TypeKind.Basic, name: "number" } }, "matchcap": { kind: $.TypeKind.Slice, elemType: { kind: $.TypeKind.Basic, name: "number" } }, "jobs": { kind: $.TypeKind.Slice, elemType: "job" }, "visited": { kind: $.TypeKind.Slice, elemType: { kind: $.TypeKind.Basic, name: "number" } }, "inputs": "inputs"}
	);
}

let bitStatePool: sync.Pool = new sync.Pool()

export function newBitState(): bitState | null {
	let { value: b, ok: ok } = $.typeAssert<bitState | null>(bitStatePool.Get(), {kind: $.TypeKind.Pointer, elemType: 'bitState'})
	if (!ok) {
		b = new bitState()
	}
	return b
}

export function freeBitState(b: bitState | null): void {
	b.inputs.clear()
	bitStatePool.Put(b)
}

// maxBitStateLen returns the maximum length of a string to search with
// the backtracker using prog.
export function maxBitStateLen(prog: syntax.Prog | null): number {
	if (!shouldBacktrack(prog)) {
		return 0
	}
	return 262144 / $.len(prog!.Inst)
}

// shouldBacktrack reports whether the program is too
// long for the backtracker to run.
export function shouldBacktrack(prog: syntax.Prog | null): boolean {
	return $.len(prog!.Inst) <= 500
}


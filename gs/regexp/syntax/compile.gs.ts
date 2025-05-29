import * as $ from "@goscript/builtin/builtin.js";

import * as unicode from "@goscript/unicode/index.js"

class patchList {
	public get head(): number {
		return this._fields.head.value
	}
	public set head(value: number) {
		this._fields.head.value = value
	}

	public get tail(): number {
		return this._fields.tail.value
	}
	public set tail(value: number) {
		this._fields.tail.value = value
	}

	public _fields: {
		head: $.VarRef<number>;
		tail: $.VarRef<number>;
	}

	constructor(init?: Partial<{head?: number, tail?: number}>) {
		this._fields = {
			head: $.varRef(init?.head ?? 0),
			tail: $.varRef(init?.tail ?? 0)
		}
	}

	public clone(): patchList {
		const cloned = new patchList()
		cloned._fields = {
			head: $.varRef(this._fields.head.value),
			tail: $.varRef(this._fields.tail.value)
		}
		return cloned
	}

	public patch(p: Prog | null, val: number): void {
		const l = this
		let head = l.head
		for (; head != 0; ) {
			let i = p.Inst![(head >> 1)]
			if ((head & 1) == 0) {
				head = i.Out
				i.Out = val
			} else {
				head = i.Arg
				i.Arg = val
			}
		}
	}

	public append(p: Prog | null, l2: patchList): patchList {
		const l1 = this
		if (l1.head == 0) {
			return l2
		}
		if (l2.head == 0) {
			return l1
		}
		let i = p.Inst![(l1.tail >> 1)]
		if ((l1.tail & 1) == 0) {
			i.Out = l2.head
		} else {
			i.Arg = l2.head
		}
		return new patchList({})
	}

	// Register this type with the runtime type system
	static __typeInfo = $.registerStructType(
	  'patchList',
	  new patchList(),
	  [{ name: "patch", args: [{ name: "p", type: { kind: $.TypeKind.Pointer, elemType: "Prog" } }, { name: "val", type: { kind: $.TypeKind.Basic, name: "number" } }], returns: [] }, { name: "append", args: [{ name: "p", type: { kind: $.TypeKind.Pointer, elemType: "Prog" } }, { name: "l2", type: "patchList" }], returns: [{ type: "patchList" }] }],
	  patchList,
	  {"head": { kind: $.TypeKind.Basic, name: "number" }, "tail": { kind: $.TypeKind.Basic, name: "number" }}
	);
}

export function makePatchList(n: number): patchList {
	return new patchList({})
}

class frag {
	// index of first instruction
	public get i(): number {
		return this._fields.i.value
	}
	public set i(value: number) {
		this._fields.i.value = value
	}

	// where to record end instruction
	public get out(): patchList {
		return this._fields.out.value
	}
	public set out(value: patchList) {
		this._fields.out.value = value
	}

	// whether fragment can match empty string
	public get nullable(): boolean {
		return this._fields.nullable.value
	}
	public set nullable(value: boolean) {
		this._fields.nullable.value = value
	}

	public _fields: {
		i: $.VarRef<number>;
		out: $.VarRef<patchList>;
		nullable: $.VarRef<boolean>;
	}

	constructor(init?: Partial<{i?: number, nullable?: boolean, out?: patchList}>) {
		this._fields = {
			i: $.varRef(init?.i ?? 0),
			out: $.varRef(init?.out?.clone() ?? new patchList()),
			nullable: $.varRef(init?.nullable ?? false)
		}
	}

	public clone(): frag {
		const cloned = new frag()
		cloned._fields = {
			i: $.varRef(this._fields.i.value),
			out: $.varRef(this._fields.out.value?.clone() ?? null),
			nullable: $.varRef(this._fields.nullable.value)
		}
		return cloned
	}

	// Register this type with the runtime type system
	static __typeInfo = $.registerStructType(
	  'frag',
	  new frag(),
	  [],
	  frag,
	  {"i": { kind: $.TypeKind.Basic, name: "number" }, "out": "patchList", "nullable": { kind: $.TypeKind.Basic, name: "boolean" }}
	);
}

class compiler {
	public get p(): Prog | null {
		return this._fields.p.value
	}
	public set p(value: Prog | null) {
		this._fields.p.value = value
	}

	public _fields: {
		p: $.VarRef<Prog | null>;
	}

	constructor(init?: Partial<{p?: Prog | null}>) {
		this._fields = {
			p: $.varRef(init?.p ?? null)
		}
	}

	public clone(): compiler {
		const cloned = new compiler()
		cloned._fields = {
			p: $.varRef(this._fields.p.value)
		}
		return cloned
	}

	public init(): void {
		const c = this
		c.p = new Prog()
		c.p!.NumCap = 2 // implicit ( and ) for whole match $0
		c.inst(5)
	}

	public compile(re: Regexp | null): frag {
		const c = this
		switch (re!.Op) {
			case 1:
				return c.fail()
				break
			case 2:
				return c.nop()
				break
			case 3:
				if ($.len(re!.Rune) == 0) {
					return c.nop()
				}
				let f: frag = new frag()
				for (let j = 0; j < $.len(re!.Rune); j++) {
					{
						let f1 = c.rune($.goSlice(re!.Rune, j, j + 1), re!.Flags).clone()
						if (j == 0) {
							f = f1.clone()
						} else {
							f = c.cat(f, f1).clone()
						}
					}
				}
				return f
				break
			case 4:
				return c.rune(re!.Rune, re!.Flags)
				break
			case 5:
				return c.rune(anyRuneNotNL, 0)
				break
			case 6:
				return c.rune(anyRune, 0)
				break
			case 7:
				return c.empty(1)
				break
			case 8:
				return c.empty(2)
				break
			case 9:
				return c.empty(4)
				break
			case 10:
				return c.empty(8)
				break
			case 11:
				return c.empty(16)
				break
			case 12:
				return c.empty(32)
				break
			case 13:
				let bra = c.cap(((re!.Cap << 1) as number)).clone()
				let sub = c.compile(re!.Sub![0]).clone()
				let ket = c.cap((((re!.Cap << 1) | 1) as number)).clone()
				return c.cat(c.cat(bra, sub), ket)
				break
			case 14:
				return c.star(c.compile(re!.Sub![0]), (re!.Flags & 32) != 0)
				break
			case 15:
				return c.plus(c.compile(re!.Sub![0]), (re!.Flags & 32) != 0)
				break
			case 16:
				return c.quest(c.compile(re!.Sub![0]), (re!.Flags & 32) != 0)
				break
			case 18:
				if ($.len(re!.Sub) == 0) {
					return c.nop()
				}
				let f: frag = new frag()
				for (let i = 0; i < $.len(re!.Sub); i++) {
					const sub = re!.Sub![i]
					{
						if (i == 0) {
							f = c.compile(sub).clone()
						} else {
							f = c.cat(f, c.compile(sub)).clone()
						}
					}
				}
				return f
				break
			case 19:
				let f: frag = new frag()
				for (let _i = 0; _i < $.len(re!.Sub); _i++) {
					const sub = re!.Sub![_i]
					{
						f = c.alt(f, c.compile(sub)).clone()
					}
				}
				return f
				break
		}
		$.panic("regexp: unhandled case in compile")
	}

	public inst(op: InstOp): frag {
		const c = this
		let f = new frag({i: ($.len(c.p!.Inst) as number), nullable: true})
		c.p!.Inst = $.append(c.p!.Inst, new Inst({Op: op}))
		return f
	}

	public nop(): frag {
		const c = this
		let f = c.inst(6).clone()
		f.out = makePatchList((f.i << 1)).clone()
		return f
	}

	public fail(): frag {
		const c = this
		return new frag({})
	}

	public cap(arg: number): frag {
		const c = this
		let f = c.inst(2).clone()
		f.out = makePatchList((f.i << 1)).clone()
		c.p!.Inst![f.i].Arg = arg
		if (c.p!.NumCap < $.int(arg) + 1) {
			c.p!.NumCap = $.int(arg) + 1
		}
		return f
	}

	public cat(f1: frag, f2: frag): frag {
		const c = this
		if (f1.i == 0 || f2.i == 0) {
			return new frag({})
		}
		f1.out.patch(c.p, f2.i)
		return new frag({})
	}

	public alt(f1: frag, f2: frag): frag {
		const c = this
		if (f1.i == 0) {
			return f2
		}
		if (f2.i == 0) {
			return f1
		}
		let f = c.inst(0).clone()
		let i = c.p!.Inst![f.i]
		i.Out = f1.i
		i.Arg = f2.i
		f.out = f1.out.append(c.p, f2.out).clone()
		f.nullable = f1.nullable || f2.nullable
		return f
	}

	public quest(f1: frag, nongreedy: boolean): frag {
		const c = this
		let f = c.inst(0).clone()
		let i = c.p!.Inst![f.i]
		if (nongreedy) {
			i.Arg = f1.i
			f.out = makePatchList((f.i << 1)).clone()
		} else {
			i.Out = f1.i
			f.out = makePatchList(((f.i << 1) | 1)).clone()
		}
		f.out = f.out.append(c.p, f1.out).clone()
		return f
	}

	// loop returns the fragment for the main loop of a plus or star.
	// For plus, it can be used after changing the entry to f1.i.
	// For star, it can be used directly when f1 can't match an empty string.
	// (When f1 can match an empty string, f1* must be implemented as (f1+)?
	// to get the priority match order correct.)
	public loop(f1: frag, nongreedy: boolean): frag {
		const c = this
		let f = c.inst(0).clone()
		let i = c.p!.Inst![f.i]
		if (nongreedy) {
			i.Arg = f1.i
			f.out = makePatchList((f.i << 1)).clone()
		} else {
			i.Out = f1.i
			f.out = makePatchList(((f.i << 1) | 1)).clone()
		}
		f1.out.patch(c.p, f.i)
		return f
	}

	public star(f1: frag, nongreedy: boolean): frag {
		const c = this
		if (f1.nullable) {
			// Use (f1+)? to get priority match order correct.
			// See golang.org/issue/46123.
			return c.quest(c.plus(f1, nongreedy), nongreedy)
		}
		return c.loop(f1, nongreedy)
	}

	public plus(f1: frag, nongreedy: boolean): frag {
		const c = this
		return new frag({})
	}

	public empty(op: EmptyOp): frag {
		const c = this
		let f = c.inst(3).clone()
		c.p!.Inst![f.i].Arg = (op as number)
		f.out = makePatchList((f.i << 1)).clone()
		return f
	}

	public rune(r: $.Slice<number>, flags: Flags): frag {
		const c = this
		let f = c.inst(7).clone()
		f.nullable = false
		let i = c.p!.Inst![f.i]
		i.Rune = r
		flags &= 1 // only relevant flag is FoldCase
		if ($.len(r) != 1 || unicode.SimpleFold(r![0]) == r![0]) {
			// and sometimes not even that
			flags &= ~(1)
		}
		i.Arg = (flags as number)
		f.out = makePatchList((f.i << 1)).clone()
		switch (true) {
			case (flags & 1) == 0 && ($.len(r) == 1 || $.len(r) == 2 && r![0] == r![1]):
				i.Op = 8
				break
			case $.len(r) == 2 && r![0] == 0 && r![1] == unicode.MaxRune:
				i.Op = 9
				break
			case $.len(r) == 4 && r![0] == 0 && r![1] == 10 - 1 && r![2] == 10 + 1 && r![3] == unicode.MaxRune:
				i.Op = 10
				break
		}
		return f
	}

	// Register this type with the runtime type system
	static __typeInfo = $.registerStructType(
	  'compiler',
	  new compiler(),
	  [{ name: "init", args: [], returns: [] }, { name: "compile", args: [{ name: "re", type: { kind: $.TypeKind.Pointer, elemType: "Regexp" } }], returns: [{ type: "frag" }] }, { name: "inst", args: [{ name: "op", type: "InstOp" }], returns: [{ type: "frag" }] }, { name: "nop", args: [], returns: [{ type: "frag" }] }, { name: "fail", args: [], returns: [{ type: "frag" }] }, { name: "cap", args: [{ name: "arg", type: { kind: $.TypeKind.Basic, name: "number" } }], returns: [{ type: "frag" }] }, { name: "cat", args: [{ name: "f1", type: "frag" }, { name: "f2", type: "frag" }], returns: [{ type: "frag" }] }, { name: "alt", args: [{ name: "f1", type: "frag" }, { name: "f2", type: "frag" }], returns: [{ type: "frag" }] }, { name: "quest", args: [{ name: "f1", type: "frag" }, { name: "nongreedy", type: { kind: $.TypeKind.Basic, name: "boolean" } }], returns: [{ type: "frag" }] }, { name: "loop", args: [{ name: "f1", type: "frag" }, { name: "nongreedy", type: { kind: $.TypeKind.Basic, name: "boolean" } }], returns: [{ type: "frag" }] }, { name: "star", args: [{ name: "f1", type: "frag" }, { name: "nongreedy", type: { kind: $.TypeKind.Basic, name: "boolean" } }], returns: [{ type: "frag" }] }, { name: "plus", args: [{ name: "f1", type: "frag" }, { name: "nongreedy", type: { kind: $.TypeKind.Basic, name: "boolean" } }], returns: [{ type: "frag" }] }, { name: "empty", args: [{ name: "op", type: "EmptyOp" }], returns: [{ type: "frag" }] }, { name: "rune", args: [{ name: "r", type: { kind: $.TypeKind.Slice, elemType: { kind: $.TypeKind.Basic, name: "number" } } }, { name: "flags", type: "Flags" }], returns: [{ type: "frag" }] }],
	  compiler,
	  {"p": { kind: $.TypeKind.Pointer, elemType: "Prog" }}
	);
}

// Compile compiles the regexp into a program to be executed.
// The regexp should have been simplified already (returned from re.Simplify).
export function Compile(re: Regexp | null): [Prog | null, $.GoError] {
	let c: compiler = new compiler({})
	c.init()
	let f = c.compile(re).clone()
	f.out.patch(c.p, c.inst(4)!.i)
	c.p!.Start = $.int(f.i)
	return [c.p, null]
}

let anyRuneNotNL = $.arrayToSlice<number>([0, 10 - 1, 10 + 1, unicode.MaxRune])

let anyRune = $.arrayToSlice<number>([0, unicode.MaxRune])


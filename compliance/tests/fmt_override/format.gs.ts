// Generated file based on format.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as $ from "@goscript/builtin";

import * as strconv from "@goscript/strconv"

import * as utf8 from "@goscript/unicode/utf8"

let ldigits: string = "0123456789abcdefx"

let udigits: string = "0123456789ABCDEFX"

let signed: boolean = true

let unsigned: boolean = false

class fmtFlags {
	public get widPresent(): boolean {
		return this._fields.widPresent.value
	}
	public set widPresent(value: boolean) {
		this._fields.widPresent.value = value
	}

	public get precPresent(): boolean {
		return this._fields.precPresent.value
	}
	public set precPresent(value: boolean) {
		this._fields.precPresent.value = value
	}

	public get minus(): boolean {
		return this._fields.minus.value
	}
	public set minus(value: boolean) {
		this._fields.minus.value = value
	}

	public get plus(): boolean {
		return this._fields.plus.value
	}
	public set plus(value: boolean) {
		this._fields.plus.value = value
	}

	public get sharp(): boolean {
		return this._fields.sharp.value
	}
	public set sharp(value: boolean) {
		this._fields.sharp.value = value
	}

	public get space(): boolean {
		return this._fields.space.value
	}
	public set space(value: boolean) {
		this._fields.space.value = value
	}

	public get zero(): boolean {
		return this._fields.zero.value
	}
	public set zero(value: boolean) {
		this._fields.zero.value = value
	}

	// For the formats %+v %#v, we set the plusV/sharpV flags
	// and clear the plus/sharp flags since %+v and %#v are in effect
	// different, flagless formats set at the top level.
	public get plusV(): boolean {
		return this._fields.plusV.value
	}
	public set plusV(value: boolean) {
		this._fields.plusV.value = value
	}

	public get sharpV(): boolean {
		return this._fields.sharpV.value
	}
	public set sharpV(value: boolean) {
		this._fields.sharpV.value = value
	}

	public _fields: {
		widPresent: $.Box<boolean>;
		precPresent: $.Box<boolean>;
		minus: $.Box<boolean>;
		plus: $.Box<boolean>;
		sharp: $.Box<boolean>;
		space: $.Box<boolean>;
		zero: $.Box<boolean>;
		plusV: $.Box<boolean>;
		sharpV: $.Box<boolean>;
	}

	constructor(init?: Partial<{minus?: boolean, plus?: boolean, plusV?: boolean, precPresent?: boolean, sharp?: boolean, sharpV?: boolean, space?: boolean, widPresent?: boolean, zero?: boolean}>) {
		this._fields = {
			widPresent: $.box(init?.widPresent ?? false),
			precPresent: $.box(init?.precPresent ?? false),
			minus: $.box(init?.minus ?? false),
			plus: $.box(init?.plus ?? false),
			sharp: $.box(init?.sharp ?? false),
			space: $.box(init?.space ?? false),
			zero: $.box(init?.zero ?? false),
			plusV: $.box(init?.plusV ?? false),
			sharpV: $.box(init?.sharpV ?? false)
		}
	}

	public clone(): fmtFlags {
		const cloned = new fmtFlags()
		cloned._fields = {
			widPresent: $.box(this._fields.widPresent.value),
			precPresent: $.box(this._fields.precPresent.value),
			minus: $.box(this._fields.minus.value),
			plus: $.box(this._fields.plus.value),
			sharp: $.box(this._fields.sharp.value),
			space: $.box(this._fields.space.value),
			zero: $.box(this._fields.zero.value),
			plusV: $.box(this._fields.plusV.value),
			sharpV: $.box(this._fields.sharpV.value)
		}
		return cloned
	}

	// Register this type with the runtime type system
	static __typeInfo = $.registerType(
	  'fmtFlags',
	  $.TypeKind.Struct,
	  new fmtFlags(),
	  new Set([]),
	  fmtFlags
	);
}

class fmt {
	public get buf(): $.Box<buffer> | null {
		return this._fields.buf.value
	}
	public set buf(value: $.Box<buffer> | null) {
		this._fields.buf.value = value
	}

	// width
	public get wid(): number {
		return this._fields.wid.value
	}
	public set wid(value: number) {
		this._fields.wid.value = value
	}

	// precision
	public get prec(): number {
		return this._fields.prec.value
	}
	public set prec(value: number) {
		this._fields.prec.value = value
	}

	// intbuf is large enough to store %b of an int64 with a sign and
	// avoids padding at the end of the struct on 32 bit architectures.
	public get intbuf(): number[] {
		return this._fields.intbuf.value
	}
	public set intbuf(value: number[]) {
		this._fields.intbuf.value = value
	}

	public get fmtFlags(): fmtFlags {
		return this._fields.fmtFlags.value
	}
	public set fmtFlags(value: fmtFlags) {
		this._fields.fmtFlags.value = value
	}

	public _fields: {
		buf: $.Box<$.Box<buffer> | null>;
		fmtFlags: $.Box<fmtFlags>;
		wid: $.Box<number>;
		prec: $.Box<number>;
		intbuf: $.Box<number[]>;
	}

	constructor(init?: Partial<{buf?: $.Box<buffer> | null, fmtFlags?: ConstructorParameters<typeof fmtFlags>[0], intbuf?: number[], prec?: number, wid?: number}>) {
		this._fields = {
			buf: $.box(init?.buf ?? null),
			fmtFlags: $.box(new fmtFlags(init?.fmtFlags)),
			wid: $.box(init?.wid ?? 0),
			prec: $.box(init?.prec ?? 0),
			intbuf: $.box(init?.intbuf ?? [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0])
		}
	}

	public clone(): fmt {
		const cloned = new fmt()
		cloned._fields = {
			buf: $.box(this._fields.buf.value),
			fmtFlags: $.box(this._fields.fmtFlags.value.clone()),
			wid: $.box(this._fields.wid.value),
			prec: $.box(this._fields.prec.value),
			intbuf: $.box(this._fields.intbuf.value)
		}
		return cloned
	}

	public clearflags(): void {
		const f = this
		f.fmtFlags = new fmtFlags({})
		f.wid = 0
		f.prec = 0
	}

	public init(buf: $.Box<buffer> | null): void {
		const f = this
		f.buf = buf
		f.clearflags()
	}

	// writePadding generates n bytes of padding.
	public writePadding(n: number): void {
		const f = this
		if (n <= 0) {
			// No padding bytes needed.
			return 
		}
		let buf = f.buf!.value
		let oldLen = $.len(buf)
		let newLen = oldLen + n
		if (newLen > $.cap(buf)) {
			buf = 
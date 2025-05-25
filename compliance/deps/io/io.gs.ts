import * as $ from "@goscript/builtin/builtin.js";

import * as errors from "@goscript/errors/index.js"

import * as sync from "@goscript/sync/index.js"

// seek relative to the origin of the file
export let SeekStart: number = 0

// seek relative to the current offset
export let SeekCurrent: number = 1

// seek relative to the end
export let SeekEnd: number = 2

export let ErrShortWrite: $.GoError = errors.New("short write")

let errInvalidWrite: $.GoError = errors.New("invalid write result")

export let ErrShortBuffer: $.GoError = errors.New("short buffer")

export let EOF: $.GoError = errors.New("EOF")

export let ErrUnexpectedEOF: $.GoError = errors.New("unexpected EOF")

export let ErrNoProgress: $.GoError = errors.New("multiple Read calls return no data or error")

export type Reader = null | {
	Read(p: Uint8Array): [number, $.GoError]
}

$.registerInterfaceType(
  'Reader',
  null, // Zero value for interface is null
  [{ name: "Read", args: [{ name: "p", type: { kind: $.TypeKind.Slice, elemType: { kind: $.TypeKind.Basic, name: "number" } } }], returns: [{ type: { kind: $.TypeKind.Basic, name: "number" } }, { type: { kind: $.TypeKind.Interface, name: 'GoError', methods: [{ name: 'Error', args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: 'string' } }] }] } }] }]
);

export type Writer = null | {
	Write(p: Uint8Array): [number, $.GoError]
}

$.registerInterfaceType(
  'Writer',
  null, // Zero value for interface is null
  [{ name: "Write", args: [{ name: "p", type: { kind: $.TypeKind.Slice, elemType: { kind: $.TypeKind.Basic, name: "number" } } }], returns: [{ type: { kind: $.TypeKind.Basic, name: "number" } }, { type: { kind: $.TypeKind.Interface, name: 'GoError', methods: [{ name: 'Error', args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: 'string' } }] }] } }] }]
);

export type Closer = null | {
	Close(): $.GoError
}

$.registerInterfaceType(
  'Closer',
  null, // Zero value for interface is null
  [{ name: "Close", args: [], returns: [{ type: { kind: $.TypeKind.Interface, name: 'GoError', methods: [{ name: 'Error', args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: 'string' } }] }] } }] }]
);

export type Seeker = null | {
	Seek(offset: number, whence: number): [number, $.GoError]
}

$.registerInterfaceType(
  'Seeker',
  null, // Zero value for interface is null
  [{ name: "Seek", args: [{ name: "offset", type: { kind: $.TypeKind.Basic, name: "number" } }, { name: "whence", type: { kind: $.TypeKind.Basic, name: "number" } }], returns: [{ type: { kind: $.TypeKind.Basic, name: "number" } }, { type: { kind: $.TypeKind.Interface, name: 'GoError', methods: [{ name: 'Error', args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: 'string' } }] }] } }] }]
);

export type ReadWriter = null | Reader & Writer

$.registerInterfaceType(
  'ReadWriter',
  null, // Zero value for interface is null
  []
);

export type ReadCloser = null | Reader & Closer

$.registerInterfaceType(
  'ReadCloser',
  null, // Zero value for interface is null
  []
);

export type WriteCloser = null | Writer & Closer

$.registerInterfaceType(
  'WriteCloser',
  null, // Zero value for interface is null
  []
);

export type ReadWriteCloser = null | Reader & Writer & Closer

$.registerInterfaceType(
  'ReadWriteCloser',
  null, // Zero value for interface is null
  []
);

export type ReadSeeker = null | Reader & Seeker

$.registerInterfaceType(
  'ReadSeeker',
  null, // Zero value for interface is null
  []
);

export type ReadSeekCloser = null | Reader & Seeker & Closer

$.registerInterfaceType(
  'ReadSeekCloser',
  null, // Zero value for interface is null
  []
);

export type WriteSeeker = null | Writer & Seeker

$.registerInterfaceType(
  'WriteSeeker',
  null, // Zero value for interface is null
  []
);

export type ReadWriteSeeker = null | Reader & Writer & Seeker

$.registerInterfaceType(
  'ReadWriteSeeker',
  null, // Zero value for interface is null
  []
);

export type ReaderFrom = null | {
	ReadFrom(r: Reader): [number, $.GoError]
}

$.registerInterfaceType(
  'ReaderFrom',
  null, // Zero value for interface is null
  [{ name: "ReadFrom", args: [{ name: "r", type: "Reader" }], returns: [{ type: { kind: $.TypeKind.Basic, name: "number" } }, { type: { kind: $.TypeKind.Interface, name: 'GoError', methods: [{ name: 'Error', args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: 'string' } }] }] } }] }]
);

export type WriterTo = null | {
	WriteTo(w: Writer): [number, $.GoError]
}

$.registerInterfaceType(
  'WriterTo',
  null, // Zero value for interface is null
  [{ name: "WriteTo", args: [{ name: "w", type: "Writer" }], returns: [{ type: { kind: $.TypeKind.Basic, name: "number" } }, { type: { kind: $.TypeKind.Interface, name: 'GoError', methods: [{ name: 'Error', args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: 'string' } }] }] } }] }]
);

export type ReaderAt = null | {
	ReadAt(p: Uint8Array, off: number): [number, $.GoError]
}

$.registerInterfaceType(
  'ReaderAt',
  null, // Zero value for interface is null
  [{ name: "ReadAt", args: [{ name: "p", type: { kind: $.TypeKind.Slice, elemType: { kind: $.TypeKind.Basic, name: "number" } } }, { name: "off", type: { kind: $.TypeKind.Basic, name: "number" } }], returns: [{ type: { kind: $.TypeKind.Basic, name: "number" } }, { type: { kind: $.TypeKind.Interface, name: 'GoError', methods: [{ name: 'Error', args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: 'string' } }] }] } }] }]
);

export type WriterAt = null | {
	WriteAt(p: Uint8Array, off: number): [number, $.GoError]
}

$.registerInterfaceType(
  'WriterAt',
  null, // Zero value for interface is null
  [{ name: "WriteAt", args: [{ name: "p", type: { kind: $.TypeKind.Slice, elemType: { kind: $.TypeKind.Basic, name: "number" } } }, { name: "off", type: { kind: $.TypeKind.Basic, name: "number" } }], returns: [{ type: { kind: $.TypeKind.Basic, name: "number" } }, { type: { kind: $.TypeKind.Interface, name: 'GoError', methods: [{ name: 'Error', args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: 'string' } }] }] } }] }]
);

export type ByteReader = null | {
	ReadByte(): [number, $.GoError]
}

$.registerInterfaceType(
  'ByteReader',
  null, // Zero value for interface is null
  [{ name: "ReadByte", args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: "number" } }, { type: { kind: $.TypeKind.Interface, name: 'GoError', methods: [{ name: 'Error', args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: 'string' } }] }] } }] }]
);

export type ByteScanner = null | {
	UnreadByte(): $.GoError
} & ByteReader

$.registerInterfaceType(
  'ByteScanner',
  null, // Zero value for interface is null
  [{ name: "UnreadByte", args: [], returns: [{ type: { kind: $.TypeKind.Interface, name: 'GoError', methods: [{ name: 'Error', args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: 'string' } }] }] } }] }]
);

export type ByteWriter = null | {
	WriteByte(c: number): $.GoError
}

$.registerInterfaceType(
  'ByteWriter',
  null, // Zero value for interface is null
  [{ name: "WriteByte", args: [{ name: "c", type: { kind: $.TypeKind.Basic, name: "number" } }], returns: [{ type: { kind: $.TypeKind.Interface, name: 'GoError', methods: [{ name: 'Error', args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: 'string' } }] }] } }] }]
);

export type RuneReader = null | {
	ReadRune(): [number, number, $.GoError]
}

$.registerInterfaceType(
  'RuneReader',
  null, // Zero value for interface is null
  [{ name: "ReadRune", args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: "number" } }, { type: { kind: $.TypeKind.Basic, name: "number" } }, { type: { kind: $.TypeKind.Interface, name: 'GoError', methods: [{ name: 'Error', args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: 'string' } }] }] } }] }]
);

export type RuneScanner = null | {
	UnreadRune(): $.GoError
} & RuneReader

$.registerInterfaceType(
  'RuneScanner',
  null, // Zero value for interface is null
  [{ name: "UnreadRune", args: [], returns: [{ type: { kind: $.TypeKind.Interface, name: 'GoError', methods: [{ name: 'Error', args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: 'string' } }] }] } }] }]
);

export type StringWriter = null | {
	WriteString(s: string): [number, $.GoError]
}

$.registerInterfaceType(
  'StringWriter',
  null, // Zero value for interface is null
  [{ name: "WriteString", args: [{ name: "s", type: { kind: $.TypeKind.Basic, name: "string" } }], returns: [{ type: { kind: $.TypeKind.Basic, name: "number" } }, { type: { kind: $.TypeKind.Interface, name: 'GoError', methods: [{ name: 'Error', args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: 'string' } }] }] } }] }]
);

// WriteString writes the contents of the string s to w, which accepts a slice of bytes.
// If w implements [StringWriter], [StringWriter.WriteString] is invoked directly.
// Otherwise, [Writer.Write] is called exactly once.
export function WriteString(w: Writer, s: string): [number, $.GoError] {
	let n: number = 0
	let err: $.GoError = null
	{
		{
			let { value: sw, ok: ok } = $.typeAssert<StringWriter>(w, 'StringWriter')
			if (ok) {
				return sw!.WriteString(s)
			}
		}
		return w!.Write($.stringToBytes(s))
	}
}

// ReadAtLeast reads from r into buf until it has read at least min bytes.
// It returns the number of bytes copied and an error if fewer bytes were read.
// The error is EOF only if no bytes were read.
// If an EOF happens after reading fewer than min bytes,
// ReadAtLeast returns [ErrUnexpectedEOF].
// If min is greater than the length of buf, ReadAtLeast returns [ErrShortBuffer].
// On return, n >= min if and only if err == nil.
// If r returns an error having read at least min bytes, the error is dropped.
export function ReadAtLeast(r: Reader, buf: Uint8Array, min: number): [number, $.GoError] {
	let n: number = 0
	let err: $.GoError = null
	{
		if ($.len(buf) < min) {
			return [0, ErrShortBuffer]
		}
		for (; n < min && err == null; ) {
			let nn: number = 0
			[nn, err] = r!.Read(buf.subarray(n))
			n += nn
		}
		if (n >= min) {
			err = null
		} else if (n > 0 && err == EOF) {
			err = ErrUnexpectedEOF
		}
		return [n, err]
	}
}

// ReadFull reads exactly len(buf) bytes from r into buf.
// It returns the number of bytes copied and an error if fewer bytes were read.
// The error is EOF only if no bytes were read.
// If an EOF happens after reading some but not all the bytes,
// ReadFull returns [ErrUnexpectedEOF].
// On return, n == len(buf) if and only if err == nil.
// If r returns an error having read at least len(buf) bytes, the error is dropped.
export function ReadFull(r: Reader, buf: Uint8Array): [number, $.GoError] {
	let n: number = 0
	let err: $.GoError = null
	{
		return ReadAtLeast(r, buf, $.len(buf))
	}
}

// CopyN copies n bytes (or until an error) from src to dst.
// It returns the number of bytes copied and the earliest
// error encountered while copying.
// On return, written == n if and only if err == nil.
//
// If dst implements [ReaderFrom], the copy is implemented using it.
export function CopyN(dst: Writer, src: Reader, n: number): [number, $.GoError] {
	let written: number = 0
	let err: $.GoError = null
	{
		[written, err] = Copy(dst, LimitReader(src, n))
		if (written == n) {
			return [n, null]
		}

		// src stopped early; must have been EOF.
		if (written < n && err == null) {
			// src stopped early; must have been EOF.
			err = EOF
		}
		return [written, err]
	}
}

// Copy copies from src to dst until either EOF is reached
// on src or an error occurs. It returns the number of bytes
// copied and the first error encountered while copying, if any.
//
// A successful Copy returns err == nil, not err == EOF.
// Because Copy is defined to read from src until EOF, it does
// not treat an EOF from Read as an error to be reported.
//
// If src implements [WriterTo],
// the copy is implemented by calling src.WriteTo(dst).
// Otherwise, if dst implements [ReaderFrom],
// the copy is implemented by calling dst.ReadFrom(src).
export function Copy(dst: Writer, src: Reader): [number, $.GoError] {
	let written: number = 0
	let err: $.GoError = null
	{
		return copyBuffer(dst, src, null)
	}
}

// CopyBuffer is identical to Copy except that it stages through the
// provided buffer (if one is required) rather than allocating a
// temporary one. If buf is nil, one is allocated; otherwise if it has
// zero length, CopyBuffer panics.
//
// If either src implements [WriterTo] or dst implements [ReaderFrom],
// buf will not be used to perform the copy.
export function CopyBuffer(dst: Writer, src: Reader, buf: Uint8Array): [number, $.GoError] {
	let written: number = 0
	let err: $.GoError = null
	{
		if (buf != null && $.len(buf) == 0) {
			$.panic("empty buffer in CopyBuffer")
		}
		return copyBuffer(dst, src, buf)
	}
}

// copyBuffer is the actual implementation of Copy and CopyBuffer.
// if buf is nil, one is allocated.
export function copyBuffer(dst: Writer, src: Reader, buf: Uint8Array): [number, $.GoError] {
	let written: number = 0
	let err: $.GoError = null
	{
		// If the reader has a WriteTo method, use it to do the copy.
		// Avoids an allocation and a copy.
		{
			let { value: wt, ok: ok } = $.typeAssert<WriterTo>(src, 'WriterTo')
			if (ok) {
				return wt!.WriteTo(dst)
			}
		}
		// Similarly, if the writer has a ReadFrom method, use it to do the copy.
		{
			let { value: rf, ok: ok } = $.typeAssert<ReaderFrom>(dst, 'ReaderFrom')
			if (ok) {
				return rf!.ReadFrom(src)
			}
		}
		if (buf == null) {
			let size = 32 * 1024
			{
				let { value: l, ok: ok } = $.typeAssert<LimitedReader | null>(src, {kind: $.TypeKind.Pointer, elemType: 'LimitedReader'})
				if (ok && (size as number) > l!.N) {
					if (l!.N < 1) {
						size = 1
					} else {
						size = (l!.N as number)
					}
				}
			}
			buf = new Uint8Array(size)
		}
		for (; ; ) {
			let [nr, er] = src!.Read(buf)
			if (nr > 0) {
				let [nw, ew] = dst!.Write(buf.subarray(0, nr))
				if (nw < 0 || nr < nw) {
					nw = 0
					if (ew == null) {
						ew = errInvalidWrite
					}
				}
				written += (nw as number)
				if (ew != null) {
					err = ew
					break
				}
				if (nr != nw) {
					err = ErrShortWrite
					break
				}
			}
			if (er != null) {
				if (er != EOF) {
					err = er
				}
				break
			}
		}
		return [written, err]
	}
}

// LimitReader returns a Reader that reads from r
// but stops with EOF after n bytes.
// The underlying implementation is a *LimitedReader.
export function LimitReader(r: Reader, n: number): Reader {
	return new LimitedReader({})
}

export class LimitedReader {
	// underlying reader
	public get R(): Reader {
		return this._fields.R.value
	}
	public set R(value: Reader) {
		this._fields.R.value = value
	}

	// max bytes remaining
	public get N(): number {
		return this._fields.N.value
	}
	public set N(value: number) {
		this._fields.N.value = value
	}

	public _fields: {
		R: $.VarRef<Reader>;
		N: $.VarRef<number>;
	}

	constructor(init?: Partial<{N?: number, R?: Reader}>) {
		this._fields = {
			R: $.varRef(init?.R ?? null),
			N: $.varRef(init?.N ?? 0)
		}
	}

	public clone(): LimitedReader {
		const cloned = new LimitedReader()
		cloned._fields = {
			R: $.varRef(this._fields.R.value),
			N: $.varRef(this._fields.N.value)
		}
		return cloned
	}

	public Read(p: Uint8Array): [number, $.GoError] {
		const l = this
		if (l!.N <= 0) {
			return [0, EOF]
		}
		if (($.len(p) as number) > l!.N) {
			p = p.subarray(0, l!.N)
		}
		[n, err] = l!.R!.Read(p)
		l!.N -= (n as number)
		return [n, err]
	}

	// Register this type with the runtime type system
	static __typeInfo = $.registerStructType(
	  'LimitedReader',
	  new LimitedReader(),
	  [{ name: "Read", args: [{ name: "p", type: { kind: $.TypeKind.Slice, elemType: { kind: $.TypeKind.Basic, name: "number" } } }], returns: [{ type: { kind: $.TypeKind.Basic, name: "number" } }, { type: { kind: $.TypeKind.Interface, name: 'GoError', methods: [{ name: 'Error', args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: 'string' } }] }] } }] }],
	  LimitedReader,
	  {"R": "Reader", "N": { kind: $.TypeKind.Basic, name: "number" }}
	);
}

// NewSectionReader returns a [SectionReader] that reads from r
// starting at offset off and stops with EOF after n bytes.
export function NewSectionReader(r: ReaderAt, off: number, n: number): SectionReader | null {
	let remaining: number = 0
	let maxint64: number = Number.MAX_SAFE_INTEGER - 1

	// Overflow, with no way to return error.
	// Assume we can read up to an offset of 1<<63 - 1.
	if (off <= 9223372036854775807 - n) {
		remaining = n + off
	} else {
		// Overflow, with no way to return error.
		// Assume we can read up to an offset of 1<<63 - 1.
		remaining = 9223372036854775807
	}
	return new SectionReader({})
}

export class SectionReader {
	// constant after creation
	public get r(): ReaderAt {
		return this._fields.r.value
	}
	public set r(value: ReaderAt) {
		this._fields.r.value = value
	}

	// constant after creation
	public get base(): number {
		return this._fields.base.value
	}
	public set base(value: number) {
		this._fields.base.value = value
	}

	public get off(): number {
		return this._fields.off.value
	}
	public set off(value: number) {
		this._fields.off.value = value
	}

	// constant after creation
	public get limit(): number {
		return this._fields.limit.value
	}
	public set limit(value: number) {
		this._fields.limit.value = value
	}

	// constant after creation
	public get n(): number {
		return this._fields.n.value
	}
	public set n(value: number) {
		this._fields.n.value = value
	}

	public _fields: {
		r: $.VarRef<ReaderAt>;
		base: $.VarRef<number>;
		off: $.VarRef<number>;
		limit: $.VarRef<number>;
		n: $.VarRef<number>;
	}

	constructor(init?: Partial<{base?: number, limit?: number, n?: number, off?: number, r?: ReaderAt}>) {
		this._fields = {
			r: $.varRef(init?.r ?? null),
			base: $.varRef(init?.base ?? 0),
			off: $.varRef(init?.off ?? 0),
			limit: $.varRef(init?.limit ?? 0),
			n: $.varRef(init?.n ?? 0)
		}
	}

	public clone(): SectionReader {
		const cloned = new SectionReader()
		cloned._fields = {
			r: $.varRef(this._fields.r.value),
			base: $.varRef(this._fields.base.value),
			off: $.varRef(this._fields.off.value),
			limit: $.varRef(this._fields.limit.value),
			n: $.varRef(this._fields.n.value)
		}
		return cloned
	}

	public Read(p: Uint8Array): [number, $.GoError] {
		const s = this
		if (s!.off >= s!.limit) {
			return [0, EOF]
		}
		{
			let max = s!.limit - s!.off
			if (($.len(p) as number) > max) {
				p = p.subarray(0, max)
			}
		}
		[n, err] = s!.r!.ReadAt(p, s!.off)
		s!.off += (n as number)
		return [n, err]
	}

	public Seek(offset: number, whence: number): [number, $.GoError] {
		const s = this
		switch (whence) {
			default:
				return [0, errWhence]
				break
			case 0:
				offset += s!.base
				break
			case 1:
				offset += s!.off
				break
			case 2:
				offset += s!.limit
				break
		}
		if (offset < s!.base) {
			return [0, errOffset]
		}
		s!.off = offset
		return [offset - s!.base, null]
	}

	public ReadAt(p: Uint8Array, off: number): [number, $.GoError] {
		const s = this
		if (off < 0 || off >= s!.Size()) {
			return [0, EOF]
		}
		off += s!.base
		{
			let max = s!.limit - off
			if (($.len(p) as number) > max) {
				p = p.subarray(0, max)
				[n, err] = s!.r!.ReadAt(p, off)
				if (err == null) {
					err = EOF
				}
				return [n, err]
			}
		}
		return s!.r!.ReadAt(p, off)
	}

	// Size returns the size of the section in bytes.
	public Size(): number {
		const s = this
		return s!.limit - s!.base
	}

	// Outer returns the underlying [ReaderAt] and offsets for the section.
	//
	// The returned values are the same that were passed to [NewSectionReader]
	// when the [SectionReader] was created.
	public Outer(): [ReaderAt, number, number] {
		const s = this
		return [s!.r, s!.base, s!.n]
	}

	// Register this type with the runtime type system
	static __typeInfo = $.registerStructType(
	  'SectionReader',
	  new SectionReader(),
	  [{ name: "Read", args: [{ name: "p", type: { kind: $.TypeKind.Slice, elemType: { kind: $.TypeKind.Basic, name: "number" } } }], returns: [{ type: { kind: $.TypeKind.Basic, name: "number" } }, { type: { kind: $.TypeKind.Interface, name: 'GoError', methods: [{ name: 'Error', args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: 'string' } }] }] } }] }, { name: "Seek", args: [{ name: "offset", type: { kind: $.TypeKind.Basic, name: "number" } }, { name: "whence", type: { kind: $.TypeKind.Basic, name: "number" } }], returns: [{ type: { kind: $.TypeKind.Basic, name: "number" } }, { type: { kind: $.TypeKind.Interface, name: 'GoError', methods: [{ name: 'Error', args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: 'string' } }] }] } }] }, { name: "ReadAt", args: [{ name: "p", type: { kind: $.TypeKind.Slice, elemType: { kind: $.TypeKind.Basic, name: "number" } } }, { name: "off", type: { kind: $.TypeKind.Basic, name: "number" } }], returns: [{ type: { kind: $.TypeKind.Basic, name: "number" } }, { type: { kind: $.TypeKind.Interface, name: 'GoError', methods: [{ name: 'Error', args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: 'string' } }] }] } }] }, { name: "Size", args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: "number" } }] }, { name: "Outer", args: [], returns: [{ type: "ReaderAt" }, { type: { kind: $.TypeKind.Basic, name: "number" } }, { type: { kind: $.TypeKind.Basic, name: "number" } }] }],
	  SectionReader,
	  {"r": "ReaderAt", "base": { kind: $.TypeKind.Basic, name: "number" }, "off": { kind: $.TypeKind.Basic, name: "number" }, "limit": { kind: $.TypeKind.Basic, name: "number" }, "n": { kind: $.TypeKind.Basic, name: "number" }}
	);
}

let errWhence: $.GoError = errors.New("Seek: invalid whence")

let errOffset: $.GoError = errors.New("Seek: invalid offset")

export class OffsetWriter {
	public get w(): WriterAt {
		return this._fields.w.value
	}
	public set w(value: WriterAt) {
		this._fields.w.value = value
	}

	// the original offset
	public get base(): number {
		return this._fields.base.value
	}
	public set base(value: number) {
		this._fields.base.value = value
	}

	// the current offset
	public get off(): number {
		return this._fields.off.value
	}
	public set off(value: number) {
		this._fields.off.value = value
	}

	public _fields: {
		w: $.VarRef<WriterAt>;
		base: $.VarRef<number>;
		off: $.VarRef<number>;
	}

	constructor(init?: Partial<{base?: number, off?: number, w?: WriterAt}>) {
		this._fields = {
			w: $.varRef(init?.w ?? null),
			base: $.varRef(init?.base ?? 0),
			off: $.varRef(init?.off ?? 0)
		}
	}

	public clone(): OffsetWriter {
		const cloned = new OffsetWriter()
		cloned._fields = {
			w: $.varRef(this._fields.w.value),
			base: $.varRef(this._fields.base.value),
			off: $.varRef(this._fields.off.value)
		}
		return cloned
	}

	public Write(p: Uint8Array): [number, $.GoError] {
		const o = this
		[n, err] = o!.w!.WriteAt(p, o!.off)
		o!.off += (n as number)
		return [n, err]
	}

	public WriteAt(p: Uint8Array, off: number): [number, $.GoError] {
		const o = this
		if (off < 0) {
			return [0, errOffset]
		}
		off += o!.base
		return o!.w!.WriteAt(p, off)
	}

	public Seek(offset: number, whence: number): [number, $.GoError] {
		const o = this
		switch (whence) {
			default:
				return [0, errWhence]
				break
			case 0:
				offset += o!.base
				break
			case 1:
				offset += o!.off
				break
		}
		if (offset < o!.base) {
			return [0, errOffset]
		}
		o!.off = offset
		return [offset - o!.base, null]
	}

	// Register this type with the runtime type system
	static __typeInfo = $.registerStructType(
	  'OffsetWriter',
	  new OffsetWriter(),
	  [{ name: "Write", args: [{ name: "p", type: { kind: $.TypeKind.Slice, elemType: { kind: $.TypeKind.Basic, name: "number" } } }], returns: [{ type: { kind: $.TypeKind.Basic, name: "number" } }, { type: { kind: $.TypeKind.Interface, name: 'GoError', methods: [{ name: 'Error', args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: 'string' } }] }] } }] }, { name: "WriteAt", args: [{ name: "p", type: { kind: $.TypeKind.Slice, elemType: { kind: $.TypeKind.Basic, name: "number" } } }, { name: "off", type: { kind: $.TypeKind.Basic, name: "number" } }], returns: [{ type: { kind: $.TypeKind.Basic, name: "number" } }, { type: { kind: $.TypeKind.Interface, name: 'GoError', methods: [{ name: 'Error', args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: 'string' } }] }] } }] }, { name: "Seek", args: [{ name: "offset", type: { kind: $.TypeKind.Basic, name: "number" } }, { name: "whence", type: { kind: $.TypeKind.Basic, name: "number" } }], returns: [{ type: { kind: $.TypeKind.Basic, name: "number" } }, { type: { kind: $.TypeKind.Interface, name: 'GoError', methods: [{ name: 'Error', args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: 'string' } }] }] } }] }],
	  OffsetWriter,
	  {"w": "WriterAt", "base": { kind: $.TypeKind.Basic, name: "number" }, "off": { kind: $.TypeKind.Basic, name: "number" }}
	);
}

// NewOffsetWriter returns an [OffsetWriter] that writes to w
// starting at offset off.
export function NewOffsetWriter(w: WriterAt, off: number): OffsetWriter | null {
	return new OffsetWriter({})
}

// TeeReader returns a [Reader] that writes to w what it reads from r.
// All reads from r performed through it are matched with
// corresponding writes to w. There is no internal buffering -
// the write must complete before the read completes.
// Any error encountered while writing is reported as a read error.
export function TeeReader(r: Reader, w: Writer): Reader {
	return new teeReader({})
}

class teeReader {
	public get r(): Reader {
		return this._fields.r.value
	}
	public set r(value: Reader) {
		this._fields.r.value = value
	}

	public get w(): Writer {
		return this._fields.w.value
	}
	public set w(value: Writer) {
		this._fields.w.value = value
	}

	public _fields: {
		r: $.VarRef<Reader>;
		w: $.VarRef<Writer>;
	}

	constructor(init?: Partial<{r?: Reader, w?: Writer}>) {
		this._fields = {
			r: $.varRef(init?.r ?? null),
			w: $.varRef(init?.w ?? null)
		}
	}

	public clone(): teeReader {
		const cloned = new teeReader()
		cloned._fields = {
			r: $.varRef(this._fields.r.value),
			w: $.varRef(this._fields.w.value)
		}
		return cloned
	}

	public Read(p: Uint8Array): [number, $.GoError] {
		const t = this
		[n, err] = t!.r!.Read(p)
		if (n > 0) {
			{
				let [n, err] = t!.w!.Write(p.subarray(0, n))
				if (err != null) {
					return [n, err]
				}
			}
		}
		return [n, err]
	}

	// Register this type with the runtime type system
	static __typeInfo = $.registerStructType(
	  'teeReader',
	  new teeReader(),
	  [{ name: "Read", args: [{ name: "p", type: { kind: $.TypeKind.Slice, elemType: { kind: $.TypeKind.Basic, name: "number" } } }], returns: [{ type: { kind: $.TypeKind.Basic, name: "number" } }, { type: { kind: $.TypeKind.Interface, name: 'GoError', methods: [{ name: 'Error', args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: 'string' } }] }] } }] }],
	  teeReader,
	  {"r": "Reader", "w": "Writer"}
	);
}

export let Discard: Writer = new discard({})

class discard {
	public _fields: {
	}

	constructor(init?: Partial<{}>) {
		this._fields = {}
	}

	public clone(): discard {
		const cloned = new discard()
		cloned._fields = {
		}
		return cloned
	}

	public Write(p: Uint8Array): [number, $.GoError] {
		return [$.len(p), null]
	}

	public WriteString(s: string): [number, $.GoError] {
		return [$.len(s), null]
	}

	public ReadFrom(r: Reader): [number, $.GoError] {
		let bufp = $.mustTypeAssert<$.VarRef<Uint8Array> | null>(blackHolePool.Get(), {kind: $.TypeKind.Pointer, elemType: {kind: $.TypeKind.Slice, elemType: {kind: $.TypeKind.Basic, name: 'number'}}})
		let readSize = 0
		for (; ; ) {
			[readSize, err] = r!.Read(bufp!.value)
			n += (readSize as number)
			if (err != null) {
				blackHolePool.Put(bufp)
				if (err == EOF) {
					return [n, null]
				}
				return [n, err]
			}
		}
	}

	// Register this type with the runtime type system
	static __typeInfo = $.registerStructType(
	  'discard',
	  new discard(),
	  [{ name: "Write", args: [{ name: "p", type: { kind: $.TypeKind.Slice, elemType: { kind: $.TypeKind.Basic, name: "number" } } }], returns: [{ type: { kind: $.TypeKind.Basic, name: "number" } }, { type: { kind: $.TypeKind.Interface, name: 'GoError', methods: [{ name: 'Error', args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: 'string' } }] }] } }] }, { name: "WriteString", args: [{ name: "s", type: { kind: $.TypeKind.Basic, name: "string" } }], returns: [{ type: { kind: $.TypeKind.Basic, name: "number" } }, { type: { kind: $.TypeKind.Interface, name: 'GoError', methods: [{ name: 'Error', args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: 'string' } }] }] } }] }, { name: "ReadFrom", args: [{ name: "r", type: "Reader" }], returns: [{ type: { kind: $.TypeKind.Basic, name: "number" } }, { type: { kind: $.TypeKind.Interface, name: 'GoError', methods: [{ name: 'Error', args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: 'string' } }] }] } }] }],
	  discard,
	  {}
	);
}

let _: ReaderFrom = new discard({})

let blackHolePool: sync.Pool = new sync.Pool({New: (): null | any => {
	let b = new Uint8Array(8192)
	return b
}
})

// NopCloser returns a [ReadCloser] with a no-op Close method wrapping
// the provided [Reader] r.
// If r implements [WriterTo], the returned [ReadCloser] will implement [WriterTo]
// by forwarding calls to r.
export function NopCloser(r: Reader): ReadCloser {
	{
		let { ok: ok } = $.typeAssert<WriterTo>(r, 'WriterTo')
		if (ok) {
			return new nopCloserWriterTo({})
		}
	}
	return new nopCloser({})
}

class nopCloser {
	public get Reader(): Reader {
		return this._fields.Reader.value
	}
	public set Reader(value: Reader) {
		this._fields.Reader.value = value
	}

	public _fields: {
		Reader: $.VarRef<Reader>;
	}

	constructor(init?: Partial<{Reader?: Partial<ConstructorParameters<typeof Reader>[0]>}>) {
		this._fields = {
			Reader: $.varRef(new Reader(init?.Reader))
		}
	}

	public clone(): nopCloser {
		const cloned = new nopCloser()
		cloned._fields = {
			Reader: $.varRef(this._fields.Reader.value)
		}
		return cloned
	}

	public Close(): $.GoError {
		return null
	}

	public Read(p: Uint8Array): [number, $.GoError] {
		return this.Reader.Read(p)
	}

	// Register this type with the runtime type system
	static __typeInfo = $.registerStructType(
	  'nopCloser',
	  new nopCloser(),
	  [{ name: "Close", args: [], returns: [{ type: { kind: $.TypeKind.Interface, name: 'GoError', methods: [{ name: 'Error', args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: 'string' } }] }] } }] }],
	  nopCloser,
	  {"Reader": "Reader"}
	);
}

class nopCloserWriterTo {
	public get Reader(): Reader {
		return this._fields.Reader.value
	}
	public set Reader(value: Reader) {
		this._fields.Reader.value = value
	}

	public _fields: {
		Reader: $.VarRef<Reader>;
	}

	constructor(init?: Partial<{Reader?: Partial<ConstructorParameters<typeof Reader>[0]>}>) {
		this._fields = {
			Reader: $.varRef(new Reader(init?.Reader))
		}
	}

	public clone(): nopCloserWriterTo {
		const cloned = new nopCloserWriterTo()
		cloned._fields = {
			Reader: $.varRef(this._fields.Reader.value)
		}
		return cloned
	}

	public Close(): $.GoError {
		return null
	}

	public WriteTo(w: Writer): [number, $.GoError] {
		const c = this
		return $.mustTypeAssert<WriterTo>(c.Reader, 'WriterTo')!.WriteTo(w)
	}

	public Read(p: Uint8Array): [number, $.GoError] {
		return this.Reader.Read(p)
	}

	// Register this type with the runtime type system
	static __typeInfo = $.registerStructType(
	  'nopCloserWriterTo',
	  new nopCloserWriterTo(),
	  [{ name: "Close", args: [], returns: [{ type: { kind: $.TypeKind.Interface, name: 'GoError', methods: [{ name: 'Error', args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: 'string' } }] }] } }] }, { name: "WriteTo", args: [{ name: "w", type: "Writer" }], returns: [{ type: { kind: $.TypeKind.Basic, name: "number" } }, { type: { kind: $.TypeKind.Interface, name: 'GoError', methods: [{ name: 'Error', args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: 'string' } }] }] } }] }],
	  nopCloserWriterTo,
	  {"Reader": "Reader"}
	);
}

// ReadAll reads from r until an error or EOF and returns the data it read.
// A successful call returns err == nil, not err == EOF. Because ReadAll is
// defined to read from src until EOF, it does not treat an EOF from Read
// as an error to be reported.
export function ReadAll(r: Reader): [Uint8Array, $.GoError] {
	let b = new Uint8Array(0)

	// Add more capacity (let append pick how much).
	for (; ; ) {
		let [n, err] = r!.Read(b.subarray($.len(b), $.cap(b)))
		b = b.subarray(0, $.len(b) + n)
		if (err != null) {
			if (err == EOF) {
				err = null
			}
			return [b, err]
		}

		// Add more capacity (let append pick how much).
		if ($.len(b) == $.cap(b)) {
			// Add more capacity (let append pick how much).
			b = $.append(b, 0).subarray(0, $.len(b))
		}
	}
}


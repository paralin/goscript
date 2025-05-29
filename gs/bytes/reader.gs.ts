import * as $ from "@goscript/builtin/index.js";
const { copy } = $;

import * as errors from "@goscript/errors/index.js"

import * as io from "@goscript/io/index.js"

import * as utf8 from "@goscript/unicode/utf8/index.js"

export class Reader {
	public get s(): $.Bytes {
		return this._fields.s.value
	}
	public set s(value: $.Bytes) {
		this._fields.s.value = value
	}

	// current reading index
	public get i(): number {
		return this._fields.i.value
	}
	public set i(value: number) {
		this._fields.i.value = value
	}

	// index of previous rune; or < 0
	public get prevRune(): number {
		return this._fields.prevRune.value
	}
	public set prevRune(value: number) {
		this._fields.prevRune.value = value
	}

	public _fields: {
		s: $.VarRef<$.Bytes>;
		i: $.VarRef<number>;
		prevRune: $.VarRef<number>;
	}

	constructor(init?: Partial<{i?: number, prevRune?: number, s?: $.Bytes}>) {
		this._fields = {
			s: $.varRef(init?.s ?? new Uint8Array(0)),
			i: $.varRef(init?.i ?? 0),
			prevRune: $.varRef(init?.prevRune ?? 0)
		}
	}

	public clone(): Reader {
		const cloned = new Reader()
		cloned._fields = {
			s: $.varRef(this._fields.s.value),
			i: $.varRef(this._fields.i.value),
			prevRune: $.varRef(this._fields.prevRune.value)
		}
		return cloned
	}

	// Len returns the number of bytes of the unread portion of the
	// slice.
	public Len(): number {
		const r = this
		if (r.i >= ($.len(r.s) as number)) {
			return 0
		}
		return $.int(($.len(r.s) as number) - r.i)
	}

	// Size returns the original length of the underlying byte slice.
	// Size is the number of bytes available for reading via [Reader.ReadAt].
	// The result is unaffected by any method calls except [Reader.Reset].
	public Size(): number {
		const r = this
		return ($.len(r.s) as number)
	}

	// Read implements the [io.Reader] interface.
	public Read(b: $.Bytes): [number, $.GoError] {
		const r = this
		if (r.i >= ($.len(r.s) as number)) {
			return [0, io.EOF]
		}
		r.prevRune = -1
		const n = $.copy($.bytesToUint8Array(b), $.bytesToUint8Array($.goSlice(r.s, r.i, undefined)))
		r.i += (n as number)
		return [n, null]
	}

	// ReadAt implements the [io.ReaderAt] interface.
	public ReadAt(b: $.Bytes, off: number): [number, $.GoError] {
		const r = this
		if (off < 0) {
			return [0, errors.New("bytes.Reader.ReadAt: negative offset")]
		}
		if (off >= ($.len(r.s) as number)) {
			return [0, io.EOF]
		}
		const n = $.copy($.bytesToUint8Array(b), $.bytesToUint8Array($.goSlice(r.s, off, undefined)))
		let err: $.GoError = null
		if (n < $.len(b)) {
			err = io.EOF
		}
		return [n, err]
	}

	// ReadByte implements the [io.ByteReader] interface.
	public ReadByte(): [number, $.GoError] {
		const r = this
		r.prevRune = -1
		if (r.i >= ($.len(r.s) as number)) {
			return [0, io.EOF]
		}
		let b = r.s![r.i]
		r.i++
		return [b, null]
	}

	// UnreadByte complements [Reader.ReadByte] in implementing the [io.ByteScanner] interface.
	public UnreadByte(): $.GoError {
		const r = this
		if (r.i <= 0) {
			return errors.New("bytes.Reader.UnreadByte: at beginning of slice")
		}
		r.prevRune = -1
		r.i--
		return null
	}

	// ReadRune implements the [io.RuneReader] interface.
	public ReadRune(): [number, number, $.GoError] {
		const r = this
		if (r.i >= ($.len(r.s) as number)) {
			r.prevRune = -1
			return [0, 0, io.EOF]
		}
		r.prevRune = $.int(r.i)
		{
			let c = r.s![r.i]
			if (c < utf8.RuneSelf) {
				r.i++
				return [(c as number), 1, null]
			}
		}
		const [ch, size] = utf8.DecodeRune($.goSlice(r.s, r.i, undefined))
		r.i += (size as number)
		return [ch, size, null]
	}

	// UnreadRune complements [Reader.ReadRune] in implementing the [io.RuneScanner] interface.
	public UnreadRune(): $.GoError {
		const r = this
		if (r.i <= 0) {
			return errors.New("bytes.Reader.UnreadRune: at beginning of slice")
		}
		if (r.prevRune < 0) {
			return errors.New("bytes.Reader.UnreadRune: previous operation was not ReadRune")
		}
		r.i = (r.prevRune as number)
		r.prevRune = -1
		return null
	}

	// Seek implements the [io.Seeker] interface.
	public Seek(offset: number, whence: number): [number, $.GoError] {
		const r = this
		r.prevRune = -1
		let abs: number = 0
		switch (whence) {
			case io.SeekStart:
				abs = offset
				break
			case io.SeekCurrent:
				abs = r.i + offset
				break
			case io.SeekEnd:
				abs = ($.len(r.s) as number) + offset
				break
			default:
				return [0, errors.New("bytes.Reader.Seek: invalid whence")]
				break
		}
		if (abs < 0) {
			return [0, errors.New("bytes.Reader.Seek: negative position")]
		}
		r.i = abs
		return [abs, null]
	}

	// WriteTo implements the [io.WriterTo] interface.
	public WriteTo(w: io.Writer): [number, $.GoError] {
		const r = this
		r.prevRune = -1
		if (r.i >= ($.len(r.s) as number)) {
			return [0, null]
		}
		const b = $.goSlice(r.s, r.i, undefined)
		const [m, err] = w!.Write($.bytesToUint8Array(b))
		if (m > $.len(b)) {
			$.panic("bytes.Reader.WriteTo: invalid Write count")
		}
		r.i += (m as number)
		const n = (m as number)
		if (m != $.len(b) && err == null) {
			return [n, io.ErrShortWrite]
		}
		return [n, err]
	}

	// Reset resets the [Reader] to be reading from b.
	public Reset(b: $.Bytes): void {
		const r = this
		r.s = b
		r.i = 0
		r.prevRune = -1
	}

	// Register this type with the runtime type system
	static __typeInfo = $.registerStructType(
	  'Reader',
	  new Reader(),
	  [{ name: "Len", args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: "number" } }] }, { name: "Size", args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: "number" } }] }, { name: "Read", args: [{ name: "b", type: { kind: $.TypeKind.Slice, elemType: { kind: $.TypeKind.Basic, name: "number" } } }], returns: [{ type: { kind: $.TypeKind.Basic, name: "number" } }, { type: { kind: $.TypeKind.Interface, name: 'GoError', methods: [{ name: 'Error', args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: 'string' } }] }] } }] }, { name: "ReadAt", args: [{ name: "b", type: { kind: $.TypeKind.Slice, elemType: { kind: $.TypeKind.Basic, name: "number" } } }, { name: "off", type: { kind: $.TypeKind.Basic, name: "number" } }], returns: [{ type: { kind: $.TypeKind.Basic, name: "number" } }, { type: { kind: $.TypeKind.Interface, name: 'GoError', methods: [{ name: 'Error', args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: 'string' } }] }] } }] }, { name: "ReadByte", args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: "number" } }, { type: { kind: $.TypeKind.Interface, name: 'GoError', methods: [{ name: 'Error', args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: 'string' } }] }] } }] }, { name: "UnreadByte", args: [], returns: [{ type: { kind: $.TypeKind.Interface, name: 'GoError', methods: [{ name: 'Error', args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: 'string' } }] }] } }] }, { name: "ReadRune", args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: "number" } }, { type: { kind: $.TypeKind.Basic, name: "number" } }, { type: { kind: $.TypeKind.Interface, name: 'GoError', methods: [{ name: 'Error', args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: 'string' } }] }] } }] }, { name: "UnreadRune", args: [], returns: [{ type: { kind: $.TypeKind.Interface, name: 'GoError', methods: [{ name: 'Error', args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: 'string' } }] }] } }] }, { name: "Seek", args: [{ name: "offset", type: { kind: $.TypeKind.Basic, name: "number" } }, { name: "whence", type: { kind: $.TypeKind.Basic, name: "number" } }], returns: [{ type: { kind: $.TypeKind.Basic, name: "number" } }, { type: { kind: $.TypeKind.Interface, name: 'GoError', methods: [{ name: 'Error', args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: 'string' } }] }] } }] }, { name: "WriteTo", args: [{ name: "w", type: "Writer" }], returns: [{ type: { kind: $.TypeKind.Basic, name: "number" } }, { type: { kind: $.TypeKind.Interface, name: 'GoError', methods: [{ name: 'Error', args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: 'string' } }] }] } }] }, { name: "Reset", args: [{ name: "b", type: { kind: $.TypeKind.Slice, elemType: { kind: $.TypeKind.Basic, name: "number" } } }], returns: [] }],
	  Reader,
	  {"s": { kind: $.TypeKind.Slice, elemType: { kind: $.TypeKind.Basic, name: "number" } }, "i": { kind: $.TypeKind.Basic, name: "number" }, "prevRune": { kind: $.TypeKind.Basic, name: "number" }}
	);
}

// NewReader returns a new [Reader] reading from b.
export function NewReader(b: $.Bytes): Reader | null {
	return new Reader({})
}


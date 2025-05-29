import * as $ from "@goscript/builtin/index.js";
const { copy, recover } = $;

import { IndexByte } from "./bytes.gs.js";

import * as errors from "@goscript/errors/index.js"

import * as io from "@goscript/io/index.js"

import * as utf8 from "@goscript/unicode/utf8/index.js"

let smallBufferSize: number = 64

export class Buffer {
	// contents are the bytes buf[off : len(buf)]
	public get buf(): $.Bytes {
		return this._fields.buf.value
	}
	public set buf(value: $.Bytes) {
		this._fields.buf.value = value
	}

	// read at &buf[off], write at &buf[len(buf)]
	public get off(): number {
		return this._fields.off.value
	}
	public set off(value: number) {
		this._fields.off.value = value
	}

	// last read operation, so that Unread* can work correctly.
	public get lastRead(): readOp {
		return this._fields.lastRead.value
	}
	public set lastRead(value: readOp) {
		this._fields.lastRead.value = value
	}

	public _fields: {
		buf: $.VarRef<$.Bytes>;
		off: $.VarRef<number>;
		lastRead: $.VarRef<readOp>;
	}

	constructor(init?: Partial<{buf?: $.Bytes, lastRead?: readOp, off?: number}>) {
		this._fields = {
			buf: $.varRef(init?.buf ?? null),
			off: $.varRef(init?.off ?? 0),
			lastRead: $.varRef(init?.lastRead ?? 0)
		}
	}

	public clone(): Buffer {
		const cloned = new Buffer()
		cloned._fields = {
			buf: $.varRef(this._fields.buf.value),
			off: $.varRef(this._fields.off.value),
			lastRead: $.varRef(this._fields.lastRead.value)
		}
		return cloned
	}

	// Bytes returns a slice of length b.Len() holding the unread portion of the buffer.
	// The slice is valid for use only until the next buffer modification (that is,
	// only until the next call to a method like [Buffer.Read], [Buffer.Write], [Buffer.Reset], or [Buffer.Truncate]).
	// The slice aliases the buffer content at least until the next buffer modification,
	// so immediate changes to the slice will affect the result of future reads.
	public Bytes(): $.Bytes {
		const b = this
		return $.goSlice(b.buf, b.off, undefined)
	}

	// AvailableBuffer returns an empty buffer with b.Available() capacity.
	// This buffer is intended to be appended to and
	// passed to an immediately succeeding [Buffer.Write] call.
	// The buffer is only valid until the next write operation on b.
	public AvailableBuffer(): $.Bytes {
		const b = this
		return $.goSlice(b.buf, $.len(b.buf), undefined)
	}

	// String returns the contents of the unread portion of the buffer
	// as a string. If the [Buffer] is a nil pointer, it returns "<nil>".
	//
	// To build strings more efficiently, see the [strings.Builder] type.
	public String(): string {
		const b = this
		if (b == null) {
			// Special case, useful in debugging.
			return "<nil>"
		}
		if (b.buf === null) {
			return ""
		}
		return $.bytesToString($.goSlice(b.buf, b.off, undefined))
	}

	// empty reports whether the unread portion of the buffer is empty.
	public empty(): boolean {
		const b = this
		return $.len(b.buf) <= b.off
	}

	// Len returns the number of bytes of the unread portion of the buffer;
	// b.Len() == len(b.Bytes()).
	public Len(): number {
		const b = this
		return $.len(b.buf) - b.off
	}

	// Cap returns the capacity of the buffer's underlying byte slice, that is, the
	// total space allocated for the buffer's data.
	public Cap(): number {
		const b = this
		return $.cap(b.buf)
	}

	// Available returns how many bytes are unused in the buffer.
	public Available(): number {
		const b = this
		return $.cap(b.buf) - $.len(b.buf)
	}

	// Truncate discards all but the first n unread bytes from the buffer
	// but continues to use the same allocated storage.
	// It panics if n is negative or greater than the length of the buffer.
	public Truncate(n: number): void {
		const b = this
		if (n == 0) {
			b.Reset()
			return 
		}
		b.lastRead = 0
		if (n < 0 || n > b.Len()) {
			$.panic("bytes.Buffer: truncation out of range")
		}
		b.buf = $.goSlice(b.buf, undefined, b.off + n)
	}

	// Reset resets the buffer to be empty,
	// but it retains the underlying storage for use by future writes.
	// Reset is the same as [Buffer.Truncate](0).
	public Reset(): void {
		const b = this
		b.buf = $.goSlice(b.buf, undefined, 0)
		b.off = 0
		b.lastRead = 0
	}

	// tryGrowByReslice is an inlineable version of grow for the fast-case where the
	// internal buffer only needs to be resliced.
	// It returns the index where bytes should be written and whether it succeeded.
	public tryGrowByReslice(n: number): [number, boolean] {
		const b = this
		if (b.buf === null) {
			return [0, false]
		}
		{
			let l = $.len(b.buf)
			if (n <= $.cap(b.buf) - l) {
				b.buf = $.goSlice(b.buf, undefined, l + n)
				return [l, true]
			}
		}
		return [0, false]
	}

	// grow grows the buffer to guarantee space for n more bytes.
	// It returns the index where bytes should be written.
	// If the buffer can't grow it will panic with ErrTooLarge.
	public grow(n: number): number {
		const b = this
		let m = b.Len()
		if (m == 0 && b.off != 0) {
			b.Reset()
		}
		{
			let [i, ok] = b.tryGrowByReslice(n)
			if (ok) {
				return i
			}
		}
		if (b.buf == null) {
			// Handle null buffer case - create new buffer
			const capacity = n <= 64 ? 64 : n
			b.buf = $.makeSlice<number>(n, capacity, 'byte')
			return 0
		}
		let c = $.cap(b.buf)
		if (n <= c / 2 - m) {
			// We can slide things down instead of allocating a new
			// slice. We only need m+n <= c to slide, but
			// we instead let capacity get twice as large so we
			// don't spend all our time copying.
			$.copy($.bytesToUint8Array(b.buf), $.bytesToUint8Array($.goSlice(b.buf, b.off, undefined)))
		} else if (c > 9223372036854775807 - c - n) {
			$.panic(ErrTooLarge)
		} else {
			// Add b.off to account for b.buf[:b.off] being sliced off the front.
			b.buf = growSlice($.goSlice(b.buf, b.off, undefined), b.off + n)
		}
		b.off = 0
		b.buf = $.goSlice(b.buf, undefined, m + n)
		return m
	}

	// Grow grows the buffer's capacity, if necessary, to guarantee space for
	// another n bytes. After Grow(n), at least n bytes can be written to the
	// buffer without another allocation.
	// If n is negative, Grow will panic.
	// If the buffer can't grow it will panic with [ErrTooLarge].
	public Grow(n: number): void {
		const b = this
		if (n < 0) {
			$.panic("bytes.Buffer.Grow: negative count")
		}
		let m = b.grow(n)
		b.buf = $.goSlice(b.buf, undefined, m)
	}

	// Write appends the contents of p to the buffer, growing the buffer as
	// needed. The return value n is the length of p; err is always nil. If the
	// buffer becomes too large, Write will panic with [ErrTooLarge].
	public Write(p: $.Bytes): [number, $.GoError] {
		const b = this
		b.lastRead = 0
		let [m, ok] = b.tryGrowByReslice($.len(p))
		if (!ok) {
			m = b.grow($.len(p))
		}
		// Copy directly to the buffer at position m
		const targetSlice = $.goSlice(b.buf, m, m + $.len(p))
		if (p instanceof Uint8Array) {
			// Direct Uint8Array copy
			for (let i = 0; i < $.len(p); i++) {
				targetSlice![i] = p[i]
			}
		} else {
			// Copy from Slice<number>
			for (let i = 0; i < $.len(p); i++) {
				targetSlice![i] = p![i]
			}
		}
		return [$.len(p), null]
	}

	// WriteString appends the contents of s to the buffer, growing the buffer as
	// needed. The return value n is the length of s; err is always nil. If the
	// buffer becomes too large, WriteString will panic with [ErrTooLarge].
	public WriteString(s: string): [number, $.GoError] {
		const b = this
		b.lastRead = 0
		let [m, ok] = b.tryGrowByReslice($.len(s))
		if (!ok) {
			m = b.grow($.len(s))
		}
		// Copy string directly to the buffer at position m
		const targetSlice = $.goSlice(b.buf, m, m + $.len(s))
		const encoder = new TextEncoder()
		const encoded = encoder.encode(s)
		for (let i = 0; i < encoded.length; i++) {
			targetSlice![i] = encoded[i]
		}
		return [encoded.length, null]
	}

	// ReadFrom reads data from r until EOF and appends it to the buffer, growing
	// the buffer as needed. The return value n is the number of bytes read. Any
	// error except io.EOF encountered during the read is also returned. If the
	// buffer becomes too large, ReadFrom will panic with [ErrTooLarge].
	public ReadFrom(r: io.Reader): [number, $.GoError] {
		const b = this
		b.lastRead = 0
		let n = 0
		for (; ; ) {
			let i = b.grow(512)
			b.buf = $.goSlice(b.buf, undefined, i)
			let [m, e] = r!.Read($.bytesToUint8Array($.goSlice(b.buf, i, $.cap(b.buf))))
			if (m < 0) {
				$.panic(errNegativeRead)
			}

			b.buf = $.goSlice(b.buf, undefined, i + m)
			n += (m as number)

			// e is EOF, so return nil explicitly
			if (e == io.EOF) {
				return [n, null]
			}
			if (e != null) {
				return [n, e]
			}
		}
	}

	// WriteTo writes data to w until the buffer is drained or an error occurs.
	// The return value n is the number of bytes written; it always fits into an
	// int, but it is int64 to match the [io.WriterTo] interface. Any error
	// encountered during the write is also returned.
	public WriteTo(w: io.Writer): [number, $.GoError] {
		const b = this
		b.lastRead = 0
		let n = 0
		{
			let nBytes = b.Len()
			if (nBytes > 0) {
				let [m, e] = w!.Write($.bytesToUint8Array($.goSlice(b.buf, b.off, undefined)))
				if (m > nBytes) {
					$.panic("bytes.Buffer.WriteTo: invalid Write count")
				}
				b.off += m
				n = (m as number)
				if (e != null) {
					return [n, e]
				}
				// all bytes should have been written, by definition of
				// Write method in io.Writer
				if (m != nBytes) {
					return [n, io.ErrShortWrite]
				}
			}
		}
		b.Reset()
		return [n, null]
	}

	// WriteByte appends the byte c to the buffer, growing the buffer as needed.
	// The returned error is always nil, but is included to match [bufio.Writer]'s
	// WriteByte. If the buffer becomes too large, WriteByte will panic with
	// [ErrTooLarge].
	public WriteByte(c: number): $.GoError {
		const b = this
		b.lastRead = 0
		let [m, ok] = b.tryGrowByReslice(1)
		if (!ok) {
			m = b.grow(1)
		}
		b.buf![m] = c
		return null
	}

	// WriteRune appends the UTF-8 encoding of Unicode code point r to the
	// buffer, returning its length and an error, which is always nil but is
	// included to match [bufio.Writer]'s WriteRune. The buffer is grown as needed;
	// if it becomes too large, WriteRune will panic with [ErrTooLarge].
	public WriteRune(r: number): [number, $.GoError] {
		const b = this
		if ((r as number) < utf8.RuneSelf) {
			b.WriteByte($.byte(r))
			return [1, null]
		}
		b.lastRead = 0
		let [m, ok] = b.tryGrowByReslice(utf8.UTFMax)
		if (!ok) {
			m = b.grow(utf8.UTFMax)
		}
		b.buf = utf8.AppendRune($.bytesToUint8Array($.goSlice(b.buf, undefined, m)), r)
		return [$.len(b.buf) - m, null]
	}

	// Read reads the next len(p) bytes from the buffer or until the buffer
	// is drained. The return value n is the number of bytes read. If the
	// buffer has no data to return, err is [io.EOF] (unless len(p) is zero);
	// otherwise it is nil.
	public Read(p: $.Bytes): [number, $.GoError] {
		const b = this
		b.lastRead = 0
		if (b.empty()) {
			// Buffer is empty, reset to recover space.
			b.Reset()
			if ($.len(p) == 0) {
				return [0, null]
			}
			return [0, io.EOF]
		}
		const n = $.copy($.bytesToUint8Array(p), $.bytesToUint8Array($.goSlice(b.buf, b.off, undefined)))
		b.off += n
		if (n > 0) {
			b.lastRead = -1
		}
		return [n, null]
	}

	// Next returns a slice containing the next n bytes from the buffer,
	// advancing the buffer as if the bytes had been returned by [Buffer.Read].
	// If there are fewer than n bytes in the buffer, Next returns the entire buffer.
	// The slice is only valid until the next call to a read or write method.
	public Next(n: number): $.Bytes {
		const b = this
		b.lastRead = 0
		let m = b.Len()
		if (n > m) {
			n = m
		}
		let data = $.goSlice(b.buf, b.off, b.off + n)
		b.off += n
		if (n > 0) {
			b.lastRead = -1
		}
		return data
	}

	// ReadByte reads and returns the next byte from the buffer.
	// If no byte is available, it returns error [io.EOF].
	public ReadByte(): [number, $.GoError] {
		const b = this
		if (b.empty()) {
			// Buffer is empty, reset to recover space.
			b.Reset()
			return [0, io.EOF]
		}
		let c = b.buf![b.off]
		b.off++
		b.lastRead = -1
		return [c, null]
	}

	// ReadRune reads and returns the next UTF-8-encoded
	// Unicode code point from the buffer.
	// If no bytes are available, the error returned is io.EOF.
	// If the bytes are an erroneous UTF-8 encoding, it
	// consumes one byte and returns U+FFFD, 1.
	public ReadRune(): [number, number, $.GoError] {
		const b = this
		if (b.empty()) {
			// Buffer is empty, reset to recover space.
			b.Reset()
			return [0, 0, io.EOF]
		}
		let c = b.buf![b.off]
		if (c < utf8.RuneSelf) {
			b.off++
			b.lastRead = 1
			return [(c as number), 1, null]
		}
		let r: number
		let n: number
		[r, n] = utf8.DecodeRune($.goSlice(b.buf, b.off, undefined))
		b.off += n
		b.lastRead = (n as readOp)
		return [r, n, null]
	}

	// UnreadRune unreads the last rune returned by [Buffer.ReadRune].
	// If the most recent read or write operation on the buffer was
	// not a successful [Buffer.ReadRune], UnreadRune returns an error.  (In this regard
	// it is stricter than [Buffer.UnreadByte], which will unread the last byte
	// from any read operation.)
	public UnreadRune(): $.GoError {
		const b = this
		if (b.lastRead <= 0) {
			return errors.New("bytes.Buffer: UnreadRune: previous operation was not a successful ReadRune")
		}
		if (b.off >= $.int(b.lastRead)) {
			b.off -= $.int(b.lastRead)
		}
		b.lastRead = 0
		return null
	}

	// UnreadByte unreads the last byte returned by the most recent successful
	// read operation that read at least one byte. If a write has happened since
	// the last read, if the last read returned an error, or if the read read zero
	// bytes, UnreadByte returns an error.
	public UnreadByte(): $.GoError {
		const b = this
		if (b.lastRead == 0) {
			return errUnreadByte
		}
		b.lastRead = 0
		if (b.off > 0) {
			b.off--
		}
		return null
	}

	// ReadBytes reads until the first occurrence of delim in the input,
	// returning a slice containing the data up to and including the delimiter.
	// If ReadBytes encounters an error before finding a delimiter,
	// it returns the data read before the error and the error itself (often [io.EOF]).
	// ReadBytes returns err != nil if and only if the returned data does not end in
	// delim.
	public ReadBytes(delim: number): [$.Bytes, $.GoError] {
		const b = this
		let [slice, err] = b.readSlice(delim)
		let line = $.append<number>(null, slice)
		return [line, err]
	}

	// readSlice is like ReadBytes but returns a reference to internal buffer data.
	public readSlice(delim: number): [$.Bytes, $.GoError] {
		const b = this
		let i = IndexByte($.goSlice(b.buf, b.off, undefined), delim)
		let end = b.off + i + 1
		let err: $.GoError = null
		let line: $.Bytes
		if (i < 0) {
			end = $.len(b.buf)
			err = io.EOF
		}
		line = $.goSlice(b.buf, b.off, end)
		b.off = end
		b.lastRead = -1
		return [line, err]
	}

	// ReadString reads until the first occurrence of delim in the input,
	// returning a string containing the data up to and including the delimiter.
	// If ReadString encounters an error before finding a delimiter,
	// it returns the data read before the error and the error itself (often [io.EOF]).
	// ReadString returns err != nil if and only if the returned data does not end
	// in delim.
	public ReadString(delim: number): [string, $.GoError] {
		const b = this
		let slice: $.Bytes
		let err: $.GoError
		[slice, err] = b.readSlice(delim)
		return [$.bytesToString(slice), err]
	}

	// Register this type with the runtime type system
	static __typeInfo = $.registerStructType(
	  'Buffer',
	  new Buffer(),
	  [{ name: "Bytes", args: [], returns: [{ type: { kind: $.TypeKind.Slice, elemType: { kind: $.TypeKind.Basic, name: "number" } } }] }, { name: "AvailableBuffer", args: [], returns: [{ type: { kind: $.TypeKind.Slice, elemType: { kind: $.TypeKind.Basic, name: "number" } } }] }, { name: "String", args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: "string" } }] }, { name: "empty", args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: "boolean" } }] }, { name: "Len", args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: "number" } }] }, { name: "Cap", args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: "number" } }] }, { name: "Available", args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: "number" } }] }, { name: "Truncate", args: [{ name: "n", type: { kind: $.TypeKind.Basic, name: "number" } }], returns: [] }, { name: "Reset", args: [], returns: [] }, { name: "tryGrowByReslice", args: [{ name: "n", type: { kind: $.TypeKind.Basic, name: "number" } }], returns: [{ type: { kind: $.TypeKind.Basic, name: "number" } }, { type: { kind: $.TypeKind.Basic, name: "boolean" } }] }, { name: "grow", args: [{ name: "n", type: { kind: $.TypeKind.Basic, name: "number" } }], returns: [{ type: { kind: $.TypeKind.Basic, name: "number" } }] }, { name: "Grow", args: [{ name: "n", type: { kind: $.TypeKind.Basic, name: "number" } }], returns: [] }, { name: "Write", args: [{ name: "p", type: { kind: $.TypeKind.Slice, elemType: { kind: $.TypeKind.Basic, name: "number" } } }], returns: [{ type: { kind: $.TypeKind.Basic, name: "number" } }, { type: { kind: $.TypeKind.Interface, name: 'GoError', methods: [{ name: 'Error', args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: 'string' } }] }] } }] }, { name: "WriteString", args: [{ name: "s", type: { kind: $.TypeKind.Basic, name: "string" } }], returns: [{ type: { kind: $.TypeKind.Basic, name: "number" } }, { type: { kind: $.TypeKind.Interface, name: 'GoError', methods: [{ name: 'Error', args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: 'string' } }] }] } }] }, { name: "ReadFrom", args: [{ name: "r", type: "Reader" }], returns: [{ type: { kind: $.TypeKind.Basic, name: "number" } }, { type: { kind: $.TypeKind.Interface, name: 'GoError', methods: [{ name: 'Error', args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: 'string' } }] }] } }] }, { name: "WriteTo", args: [{ name: "w", type: "Writer" }], returns: [{ type: { kind: $.TypeKind.Basic, name: "number" } }, { type: { kind: $.TypeKind.Interface, name: 'GoError', methods: [{ name: 'Error', args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: 'string' } }] }] } }] }, { name: "WriteByte", args: [{ name: "c", type: { kind: $.TypeKind.Basic, name: "number" } }], returns: [{ type: { kind: $.TypeKind.Interface, name: 'GoError', methods: [{ name: 'Error', args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: 'string' } }] }] } }] }, { name: "WriteRune", args: [{ name: "r", type: { kind: $.TypeKind.Basic, name: "number" } }], returns: [{ type: { kind: $.TypeKind.Basic, name: "number" } }, { type: { kind: $.TypeKind.Interface, name: 'GoError', methods: [{ name: 'Error', args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: 'string' } }] }] } }] }, { name: "Read", args: [{ name: "p", type: { kind: $.TypeKind.Slice, elemType: { kind: $.TypeKind.Basic, name: "number" } } }], returns: [{ type: { kind: $.TypeKind.Basic, name: "number" } }, { type: { kind: $.TypeKind.Interface, name: 'GoError', methods: [{ name: 'Error', args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: 'string' } }] }] } }] }, { name: "Next", args: [{ name: "n", type: { kind: $.TypeKind.Basic, name: "number" } }], returns: [{ type: { kind: $.TypeKind.Slice, elemType: { kind: $.TypeKind.Basic, name: "number" } } }] }, { name: "ReadByte", args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: "number" } }, { type: { kind: $.TypeKind.Interface, name: 'GoError', methods: [{ name: 'Error', args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: 'string' } }] }] } }] }, { name: "ReadRune", args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: "number" } }, { type: { kind: $.TypeKind.Basic, name: "number" } }, { type: { kind: $.TypeKind.Interface, name: 'GoError', methods: [{ name: 'Error', args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: 'string' } }] }] } }] }, { name: "UnreadRune", args: [], returns: [{ type: { kind: $.TypeKind.Interface, name: 'GoError', methods: [{ name: 'Error', args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: 'string' } }] }] } }] }, { name: "UnreadByte", args: [], returns: [{ type: { kind: $.TypeKind.Interface, name: 'GoError', methods: [{ name: 'Error', args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: 'string' } }] }] } }] }, { name: "ReadBytes", args: [{ name: "delim", type: { kind: $.TypeKind.Basic, name: "number" } }], returns: [{ type: { kind: $.TypeKind.Slice, elemType: { kind: $.TypeKind.Basic, name: "number" } } }, { type: { kind: $.TypeKind.Interface, name: 'GoError', methods: [{ name: 'Error', args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: 'string' } }] }] } }] }, { name: "readSlice", args: [{ name: "delim", type: { kind: $.TypeKind.Basic, name: "number" } }], returns: [{ type: { kind: $.TypeKind.Slice, elemType: { kind: $.TypeKind.Basic, name: "number" } } }, { type: { kind: $.TypeKind.Interface, name: 'GoError', methods: [{ name: 'Error', args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: 'string' } }] }] } }] }, { name: "ReadString", args: [{ name: "delim", type: { kind: $.TypeKind.Basic, name: "number" } }], returns: [{ type: { kind: $.TypeKind.Basic, name: "string" } }, { type: { kind: $.TypeKind.Interface, name: 'GoError', methods: [{ name: 'Error', args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: 'string' } }] }] } }] }],
	  Buffer,
	  {"buf": { kind: $.TypeKind.Slice, elemType: { kind: $.TypeKind.Basic, name: "number" } }, "off": { kind: $.TypeKind.Basic, name: "number" }, "lastRead": "readOp"}
	);
}

type readOp = number;

// Any other read operation.
let opRead: readOp = -1

// Non-read operation.
let opInvalid: readOp = 0

// Read rune of size 1.
let opReadRune1: readOp = 1

// Read rune of size 2.
let opReadRune2: readOp = 2

// Read rune of size 3.
let opReadRune3: readOp = 3

// Read rune of size 4.
let opReadRune4: readOp = 4

export let ErrTooLarge: $.GoError = errors.New("bytes.Buffer: too large")

let errNegativeRead: $.GoError = errors.New("bytes.Buffer: reader returned negative count from Read")

let maxInt: number = $.int((~(0 as number) >> 1))

export let MinRead: number = 512

// growSlice grows b by n, preserving the original content of b.
// If the allocation fails, it panics with ErrTooLarge.
export function growSlice(b: $.Bytes, n: number): $.Bytes {
	using __defer = new $.DisposableStack();
	__defer.defer(() => {
		if (recover() != null) {
			$.panic(ErrTooLarge)
		}
	});
	// TODO(http://golang.org/issue/51462): We should rely on the append-make
	// pattern so that the compiler can call runtime.growslice. For example:
	//	return append(b, make([]byte, n)...)
	// This avoids unnecessary zero-ing of the first len(b) bytes of the
	// allocated slice, but this pattern causes b to escape onto the heap.
	//
	// Instead use the append-make pattern with a nil slice to ensure that
	// we allocate buffers rounded up to the closest size class.
	let c = $.len(b) + n // ensure enough space for n elements

	// The growth rate has historically always been 2x. In the future,
	// we could rely purely on append to determine the growth rate.
	if (c < 2 * $.cap(b)) {
		// The growth rate has historically always been 2x. In the future,
		// we could rely purely on append to determine the growth rate.
		c = 2 * $.cap(b)
	}
	let b2 = $.append<number>(null, new Uint8Array(c))
	let i = $.copy($.bytesToUint8Array(b2), $.bytesToUint8Array(b))
	return $.goSlice(b2, undefined, i)
}

let errUnreadByte: $.GoError = errors.New("bytes.Buffer: UnreadByte: previous operation was not a successful read")

// NewBuffer creates and initializes a new [Buffer] using buf as its
// initial contents. The new [Buffer] takes ownership of buf, and the
// caller should not use buf after this call. NewBuffer is intended to
// prepare a [Buffer] to read existing data. It can also be used to set
// the initial size of the internal buffer for writing. To do that,
// buf should have the desired capacity but a length of zero.
//
// In most cases, new([Buffer]) (or just declaring a [Buffer] variable) is
// sufficient to initialize a [Buffer].
export function NewBuffer(buf: $.Bytes): Buffer | null {
	return new Buffer({buf: buf})
}

// NewBufferString creates and initializes a new [Buffer] using string s as its
// initial contents. It is intended to prepare a buffer to read an existing
// string.
//
// In most cases, new([Buffer]) (or just declaring a [Buffer] variable) is
// sufficient to initialize a [Buffer].
export function NewBufferString(s: string): Buffer | null {
	return new Buffer({buf: $.stringToBytes(s)})
}


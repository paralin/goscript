import * as $ from "@goscript/builtin/builtin.js";

import * as abi from "@goscript/internal/abi/index.js"

import * as bytealg from "@goscript/internal/bytealg/index.js"

import * as utf8 from "@goscript/unicode/utf8/index.js"

import * as unsafe from "@goscript/unsafe/index.js"

export class Builder {
	// of receiver, to detect copies by value
	public get addr(): Builder | null {
		return this._fields.addr.value
	}
	public set addr(value: Builder | null) {
		this._fields.addr.value = value
	}

	// External users should never get direct access to this buffer, since
	// the slice at some point will be converted to a string using unsafe, also
	// data between len(buf) and cap(buf) might be uninitialized.
	public get buf(): Uint8Array {
		return this._fields.buf.value
	}
	public set buf(value: Uint8Array) {
		this._fields.buf.value = value
	}

	public _fields: {
		addr: $.VarRef<Builder | null>;
		buf: $.VarRef<Uint8Array>;
	}

	constructor(init?: Partial<{addr?: Builder | null, buf?: Uint8Array}>) {
		this._fields = {
			addr: $.varRef(init?.addr ?? null),
			buf: $.varRef(init?.buf ?? new Uint8Array(0))
		}
	}

	public clone(): Builder {
		const cloned = new Builder()
		cloned._fields = {
			addr: $.varRef(this._fields.addr.value),
			buf: $.varRef(this._fields.buf.value)
		}
		return cloned
	}

	public copyCheck(): void {
		const b = this
		if (b!.addr == null) {
			// This hack works around a failing of Go's escape analysis
			// that was causing b to escape and be heap allocated.
			// See issue 23382.
			// TODO: once issue 7921 is fixed, this should be reverted to
			// just "b.addr = b".
			b!.addr = (Builder!)(abi.NoEscape(unsafe.Pointer(b)))
		} else if ((b!.addr !== b)) {
			$.panic("strings: illegal use of non-zero Builder copied by value")
		}
	}

	// String returns the accumulated string.
	public String(): string {
		const b = this
		return unsafe.String(unsafe.SliceData(b!.buf), $.len(b!.buf))
	}

	// Len returns the number of accumulated bytes; b.Len() == len(b.String()).
	public Len(): number {
		const b = this
		return $.len(b!.buf)
	}

	// Cap returns the capacity of the builder's underlying byte slice. It is the
	// total space allocated for the string being built and includes any bytes
	// already written.
	public Cap(): number {
		const b = this
		return $.cap(b!.buf)
	}

	// Reset resets the [Builder] to be empty.
	public Reset(): void {
		const b = this
		b!.addr = null
		b!.buf = null
	}

	// grow copies the buffer to a new, larger buffer so that there are at least n
	// bytes of capacity beyond len(b.buf).
	public grow(n: number): void {
		const b = this
		let buf = bytealg.MakeNoZero(2 * $.cap(b!.buf) + n).subarray(0, $.len(b!.buf))
		copy(buf, b!.buf)
		b!.buf = buf
	}

	// Grow grows b's capacity, if necessary, to guarantee space for
	// another n bytes. After Grow(n), at least n bytes can be written to b
	// without another allocation. If n is negative, Grow panics.
	public Grow(n: number): void {
		const b = this
		b!.copyCheck()
		if (n < 0) {
			$.panic("strings.Builder.Grow: negative count")
		}
		if ($.cap(b!.buf) - $.len(b!.buf) < n) {
			b!.grow(n)
		}
	}

	// Write appends the contents of p to b's buffer.
	// Write always returns len(p), nil.
	public Write(p: Uint8Array): [number, $.GoError] {
		const b = this
		b!.copyCheck()
		b!.buf = $.append(b!.buf, p)
		return [$.len(p), null]
	}

	// WriteByte appends the byte c to b's buffer.
	// The returned error is always nil.
	public WriteByte(c: number): $.GoError {
		const b = this
		b!.copyCheck()
		b!.buf = $.append(b!.buf, c)
		return null
	}

	// WriteRune appends the UTF-8 encoding of Unicode code point r to b's buffer.
	// It returns the length of r and a nil error.
	public WriteRune(r: number): [number, $.GoError] {
		const b = this
		b!.copyCheck()
		let n = $.len(b!.buf)
		b!.buf = utf8.AppendRune(b!.buf, r)
		return [$.len(b!.buf) - n, null]
	}

	// WriteString appends the contents of s to b's buffer.
	// It returns the length of s and a nil error.
	public WriteString(s: string): [number, $.GoError] {
		const b = this
		b!.copyCheck()
		b!.buf = $.append(b!.buf, s)
		return [$.len(s), null]
	}

	// Register this type with the runtime type system
	static __typeInfo = $.registerStructType(
	  'Builder',
	  new Builder(),
	  [{ name: "copyCheck", args: [], returns: [] }, { name: "String", args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: "string" } }] }, { name: "Len", args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: "number" } }] }, { name: "Cap", args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: "number" } }] }, { name: "Reset", args: [], returns: [] }, { name: "grow", args: [{ name: "n", type: { kind: $.TypeKind.Basic, name: "number" } }], returns: [] }, { name: "Grow", args: [{ name: "n", type: { kind: $.TypeKind.Basic, name: "number" } }], returns: [] }, { name: "Write", args: [{ name: "p", type: { kind: $.TypeKind.Slice, elemType: { kind: $.TypeKind.Basic, name: "number" } } }], returns: [{ type: { kind: $.TypeKind.Basic, name: "number" } }, { type: { kind: $.TypeKind.Interface, name: 'GoError', methods: [{ name: 'Error', args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: 'string' } }] }] } }] }, { name: "WriteByte", args: [{ name: "c", type: { kind: $.TypeKind.Basic, name: "number" } }], returns: [{ type: { kind: $.TypeKind.Interface, name: 'GoError', methods: [{ name: 'Error', args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: 'string' } }] }] } }] }, { name: "WriteRune", args: [{ name: "r", type: { kind: $.TypeKind.Basic, name: "number" } }], returns: [{ type: { kind: $.TypeKind.Basic, name: "number" } }, { type: { kind: $.TypeKind.Interface, name: 'GoError', methods: [{ name: 'Error', args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: 'string' } }] }] } }] }, { name: "WriteString", args: [{ name: "s", type: { kind: $.TypeKind.Basic, name: "string" } }], returns: [{ type: { kind: $.TypeKind.Basic, name: "number" } }, { type: { kind: $.TypeKind.Interface, name: 'GoError', methods: [{ name: 'Error', args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: 'string' } }] }] } }] }],
	  Builder,
	  {"addr": { kind: $.TypeKind.Pointer, elemType: "Builder" }, "buf": { kind: $.TypeKind.Slice, elemType: { kind: $.TypeKind.Basic, name: "number" } }}
	);
}


import * as $ from "@goscript/builtin/builtin.js";

export class Builder {
	private _content: string = ""
	private _addr: Builder | null = null

	constructor(init?: Partial<{}>) {
		// Simple constructor - no complex initialization needed
	}

	public clone(): Builder {
		const cloned = new Builder()
		cloned._content = this._content
		cloned._addr = this._addr
		return cloned
	}

	private copyCheck(): void {
		if (this._addr == null) {
			this._addr = this
		} else if (this._addr !== this) {
			$.panic("strings: illegal use of non-zero Builder copied by value")
		}
	}

	// String returns the accumulated string.
	public String(): string {
		return this._content
	}

	// Len returns the number of accumulated bytes; b.Len() == len(b.String()).
	public Len(): number {
		return this._content.length
	}

	// Cap returns the capacity of the builder's underlying byte slice. It is the
	// total space allocated for the string being built and includes any bytes
	// already written.
	public Cap(): number {
		// For simplicity, return the current length since JavaScript strings are dynamic
		return this._content.length
	}

	// Reset resets the Builder to be empty.
	public Reset(): void {
		this._addr = null
		this._content = ""
	}

	// Grow grows b's capacity, if necessary, to guarantee space for
	// another n bytes. After Grow(n), at least n bytes can be written to b
	// without another allocation. If n is negative, Grow panics.
	public Grow(n: number): void {
		this.copyCheck()
		if (n < 0) {
			$.panic("strings.Builder.Grow: negative count")
		}
		// JavaScript strings are dynamic, so no need to pre-allocate
	}

	// Write appends the contents of p to b's buffer.
	// Write always returns len(p), nil.
	public Write(p: Uint8Array): [number, $.GoError] {
		this.copyCheck()
		// Convert byte array to string
		const str = new TextDecoder('utf-8').decode(p)
		this._content += str
		return [p.length, null]
	}

	// WriteByte appends the byte c to b's buffer.
	// The returned error is always nil.
	public WriteByte(c: number): $.GoError {
		this.copyCheck()
		this._content += String.fromCharCode(c)
		return null
	}

	// WriteRune appends the UTF-8 encoding of Unicode code point r to b's buffer.
	// It returns the length of r and a nil error.
	public WriteRune(r: number): [number, $.GoError] {
		this.copyCheck()
		const str = String.fromCodePoint(r)
		this._content += str
		// Return the byte length of the UTF-8 encoding
		const byteLength = new TextEncoder().encode(str).length
		return [byteLength, null]
	}

	// WriteString appends the contents of s to b's buffer.
	// It returns the length of s and a nil error.
	public WriteString(s: string): [number, $.GoError] {
		this.copyCheck()
		this._content += s
		return [s.length, null]
	}

	// Register this type with the runtime type system
	static __typeInfo = $.registerStructType(
	  'Builder',
	  new Builder(),
	  [
		{ name: "String", args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: "string" } }] }, 
		{ name: "Len", args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: "number" } }] }, 
		{ name: "Cap", args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: "number" } }] }, 
		{ name: "Reset", args: [], returns: [] }, 
		{ name: "Grow", args: [{ name: "n", type: { kind: $.TypeKind.Basic, name: "number" } }], returns: [] }, 
		{ name: "Write", args: [{ name: "p", type: { kind: $.TypeKind.Slice, elemType: { kind: $.TypeKind.Basic, name: "number" } } }], returns: [{ type: { kind: $.TypeKind.Basic, name: "number" } }, { type: { kind: $.TypeKind.Interface, name: 'GoError', methods: [{ name: 'Error', args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: 'string' } }] }] } }] }, 
		{ name: "WriteByte", args: [{ name: "c", type: { kind: $.TypeKind.Basic, name: "number" } }], returns: [{ type: { kind: $.TypeKind.Interface, name: 'GoError', methods: [{ name: 'Error', args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: 'string' } }] }] } }] }, 
		{ name: "WriteRune", args: [{ name: "r", type: { kind: $.TypeKind.Basic, name: "number" } }], returns: [{ type: { kind: $.TypeKind.Basic, name: "number" } }, { type: { kind: $.TypeKind.Interface, name: 'GoError', methods: [{ name: 'Error', args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: 'string' } }] }] } }] }, 
		{ name: "WriteString", args: [{ name: "s", type: { kind: $.TypeKind.Basic, name: "string" } }], returns: [{ type: { kind: $.TypeKind.Basic, name: "number" } }, { type: { kind: $.TypeKind.Interface, name: 'GoError', methods: [{ name: 'Error', args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: 'string' } }] }] } }] }
	  ],
	  Builder,
	  {}
	);
}


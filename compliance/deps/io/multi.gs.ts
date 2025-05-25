import * as $ from "@goscript/builtin/builtin.js";
import { copyBuffer } from "./io.gs.js";

class eofReader {
	public _fields: {
	}

	constructor(init?: Partial<{}>) {
		this._fields = {}
	}

	public clone(): eofReader {
		const cloned = new eofReader()
		cloned._fields = {
		}
		return cloned
	}

	public Read(): [number, $.GoError] {
		return [0, EOF]
	}

	// Register this type with the runtime type system
	static __typeInfo = $.registerStructType(
	  'eofReader',
	  new eofReader(),
	  [{ name: "Read", args: [{ name: "", type: { kind: $.TypeKind.Slice, elemType: { kind: $.TypeKind.Basic, name: "number" } } }], returns: [{ type: { kind: $.TypeKind.Basic, name: "number" } }, { type: { kind: $.TypeKind.Interface, name: 'GoError', methods: [{ name: 'Error', args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: 'string' } }] }] } }] }],
	  eofReader,
	  {}
	);
}

class multiReader {
	public get readers(): $.Slice<Reader> {
		return this._fields.readers.value
	}
	public set readers(value: $.Slice<Reader>) {
		this._fields.readers.value = value
	}

	public _fields: {
		readers: $.VarRef<$.Slice<Reader>>;
	}

	constructor(init?: Partial<{readers?: $.Slice<Reader>}>) {
		this._fields = {
			readers: $.varRef(init?.readers ?? null)
		}
	}

	public clone(): multiReader {
		const cloned = new multiReader()
		cloned._fields = {
			readers: $.varRef(this._fields.readers.value)
		}
		return cloned
	}

	public Read(p: Uint8Array): [number, $.GoError] {
		const mr = this
		for (; $.len(mr!.readers) > 0; ) {
			// Optimization to flatten nested multiReaders (Issue 13558).
			if ($.len(mr!.readers) == 1) {
				{
					let { value: r, ok: ok } = $.typeAssert<multiReader | null>(mr!.readers![0], {kind: $.TypeKind.Pointer, elemType: 'multiReader'})
					if (ok) {
						mr!.readers = r!.readers
						continue
					}
				}
			}
			[n, err] = mr!.readers![0]!.Read(p)

			// Use eofReader instead of nil to avoid nil panic
			// after performing flatten (Issue 18232).
			// permit earlier GC
			if (err == EOF) {
				// Use eofReader instead of nil to avoid nil panic
				// after performing flatten (Issue 18232).
				mr!.readers![0] = new eofReader({}) // permit earlier GC
				mr!.readers = $.goSlice(mr!.readers, 1, undefined)
			}

			// Don't return EOF yet. More readers remain.
			if (n > 0 || err != EOF) {

				// Don't return EOF yet. More readers remain.
				if (err == EOF && $.len(mr!.readers) > 0) {
					// Don't return EOF yet. More readers remain.
					err = null
				}
				return [n, err]
			}
		}
		return [0, EOF]
	}

	public WriteTo(w: Writer): [number, $.GoError] {
		const mr = this
		return mr!.writeToWithBuffer(w, new Uint8Array(1024 * 32))
	}

	public writeToWithBuffer(w: Writer, buf: Uint8Array): [number, $.GoError] {
		const mr = this
		for (let i = 0; i < $.len(mr!.readers); i++) {
			const r = mr!.readers![i]
			{
				let n: number = 0
				// reuse buffer with nested multiReaders
				{
					let { value: subMr, ok: ok } = $.typeAssert<multiReader | null>(r, {kind: $.TypeKind.Pointer, elemType: 'multiReader'})
					if (ok) {
						// reuse buffer with nested multiReaders
						[n, err] = subMr!.writeToWithBuffer(w, buf)
					} else {
						[n, err] = copyBuffer(w, r, buf)
					}
				}
				sum += n

				// permit resume / retry after error
				if (err != null) {
					mr!.readers = $.goSlice(mr!.readers, i, undefined) // permit resume / retry after error
					return [sum, err]
				}
				mr!.readers![i] = null // permit early GC
			}
		}
		mr!.readers = null
		return [sum, null]
	}

	// Register this type with the runtime type system
	static __typeInfo = $.registerStructType(
	  'multiReader',
	  new multiReader(),
	  [{ name: "Read", args: [{ name: "p", type: { kind: $.TypeKind.Slice, elemType: { kind: $.TypeKind.Basic, name: "number" } } }], returns: [{ type: { kind: $.TypeKind.Basic, name: "number" } }, { type: { kind: $.TypeKind.Interface, name: 'GoError', methods: [{ name: 'Error', args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: 'string' } }] }] } }] }, { name: "WriteTo", args: [{ name: "w", type: "Writer" }], returns: [{ type: { kind: $.TypeKind.Basic, name: "number" } }, { type: { kind: $.TypeKind.Interface, name: 'GoError', methods: [{ name: 'Error', args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: 'string' } }] }] } }] }, { name: "writeToWithBuffer", args: [{ name: "w", type: "Writer" }, { name: "buf", type: { kind: $.TypeKind.Slice, elemType: { kind: $.TypeKind.Basic, name: "number" } } }], returns: [{ type: { kind: $.TypeKind.Basic, name: "number" } }, { type: { kind: $.TypeKind.Interface, name: 'GoError', methods: [{ name: 'Error', args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: 'string' } }] }] } }] }],
	  multiReader,
	  {"readers": { kind: $.TypeKind.Slice, elemType: "Reader" }}
	);
}

let _: WriterTo = null

// MultiReader returns a Reader that's the logical concatenation of
// the provided input readers. They're read sequentially. Once all
// inputs have returned EOF, Read will return EOF.  If any of the readers
// return a non-nil, non-EOF error, Read will return that error.
export function MultiReader(...readers: Reader[]): Reader {
	let r = $.makeSlice<Reader>($.len(readers))
	copy(r, readers)
	return new multiReader({})
}

class multiWriter {
	public get writers(): $.Slice<Writer> {
		return this._fields.writers.value
	}
	public set writers(value: $.Slice<Writer>) {
		this._fields.writers.value = value
	}

	public _fields: {
		writers: $.VarRef<$.Slice<Writer>>;
	}

	constructor(init?: Partial<{writers?: $.Slice<Writer>}>) {
		this._fields = {
			writers: $.varRef(init?.writers ?? null)
		}
	}

	public clone(): multiWriter {
		const cloned = new multiWriter()
		cloned._fields = {
			writers: $.varRef(this._fields.writers.value)
		}
		return cloned
	}

	public Write(p: Uint8Array): [number, $.GoError] {
		const t = this
		for (let _i = 0; _i < $.len(t!.writers); _i++) {
			const w = t!.writers![_i]
			{
				[n, err] = w!.Write(p)
				if (err != null) {
					return [n, err]
				}
				if (n != $.len(p)) {
					err = ErrShortWrite
					return [n, err]
				}
			}
		}
		return [$.len(p), null]
	}

	public WriteString(s: string): [number, $.GoError] {
		const t = this
		// lazily initialized if/when needed
		let p: Uint8Array = new Uint8Array(0)
		for (let _i = 0; _i < $.len(t!.writers); _i++) {
			const w = t!.writers![_i]
			{
				{
					let { value: sw, ok: ok } = $.typeAssert<StringWriter>(w, 'StringWriter')
					if (ok) {
						[n, err] = sw!.WriteString(s)
					} else {
						if (p == null) {
							p = $.stringToBytes(s)
						}
						[n, err] = w!.Write(p)
					}
				}
				if (err != null) {
					return [n, err]
				}
				if (n != $.len(s)) {
					err = ErrShortWrite
					return [n, err]
				}
			}
		}
		return [$.len(s), null]
	}

	// Register this type with the runtime type system
	static __typeInfo = $.registerStructType(
	  'multiWriter',
	  new multiWriter(),
	  [{ name: "Write", args: [{ name: "p", type: { kind: $.TypeKind.Slice, elemType: { kind: $.TypeKind.Basic, name: "number" } } }], returns: [{ type: { kind: $.TypeKind.Basic, name: "number" } }, { type: { kind: $.TypeKind.Interface, name: 'GoError', methods: [{ name: 'Error', args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: 'string' } }] }] } }] }, { name: "WriteString", args: [{ name: "s", type: { kind: $.TypeKind.Basic, name: "string" } }], returns: [{ type: { kind: $.TypeKind.Basic, name: "number" } }, { type: { kind: $.TypeKind.Interface, name: 'GoError', methods: [{ name: 'Error', args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: 'string' } }] }] } }] }],
	  multiWriter,
	  {"writers": { kind: $.TypeKind.Slice, elemType: "Writer" }}
	);
}

let _: StringWriter = null

// MultiWriter creates a writer that duplicates its writes to all the
// provided writers, similar to the Unix tee(1) command.
//
// Each write is written to each listed writer, one at a time.
// If a listed writer returns an error, that overall write operation
// stops and returns the error; it does not continue down the list.
export function MultiWriter(...writers: Writer[]): Writer {
	let allWriters = $.makeSlice<Writer>(0, $.len(writers))
	for (let _i = 0; _i < $.len(writers); _i++) {
		const w = writers![_i]
		{
			{
				let { value: mw, ok: ok } = $.typeAssert<multiWriter | null>(w, {kind: $.TypeKind.Pointer, elemType: 'multiWriter'})
				if (ok) {
					allWriters = $.append(allWriters, mw!.writers)
				} else {
					allWriters = $.append(allWriters, w)
				}
			}
		}
	}
	return new multiWriter({})
}


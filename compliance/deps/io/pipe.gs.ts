import * as $ from "@goscript/builtin/builtin.js";

import * as errors from "@goscript/errors/index.js"

import * as sync from "@goscript/sync/index.js"

class onceError {
	public get err(): $.GoError {
		return this._fields.err.value
	}
	public set err(value: $.GoError) {
		this._fields.err.value = value
	}

	public get Mutex(): sync.Mutex {
		return this._fields.Mutex.value
	}
	public set Mutex(value: sync.Mutex) {
		this._fields.Mutex.value = value
	}

	public _fields: {
		Mutex: $.VarRef<sync.Mutex>;
		err: $.VarRef<$.GoError>;
	}

	constructor(init?: Partial<{Mutex?: Partial<ConstructorParameters<typeof Mutex>[0]>, err?: $.GoError}>) {
		this._fields = {
			Mutex: $.varRef(new Mutex(init?.Mutex)),
			err: $.varRef(init?.err ?? null)
		}
	}

	public clone(): onceError {
		const cloned = new onceError()
		cloned._fields = {
			Mutex: $.varRef(this._fields.Mutex.value.clone()),
			err: $.varRef(this._fields.err.value)
		}
		return cloned
	}

	public Store(err: $.GoError): void {
		const a = this
		using cleanup = new $.DisposableStack();
		a!.Lock()
		__defer.defer(() => {
			a!.Unlock()
		});
		if (a!.err != null) {
			return 
		}
		a!.err = err
	}

	public Load(): $.GoError {
		const a = this
		using cleanup = new $.DisposableStack();
		a!.Lock()
		__defer.defer(() => {
			a!.Unlock()
		});
		return a!.err
	}

	// Register this type with the runtime type system
	static __typeInfo = $.registerStructType(
	  'onceError',
	  new onceError(),
	  [{ name: "Store", args: [{ name: "err", type: { kind: $.TypeKind.Interface, name: 'GoError', methods: [{ name: 'Error', args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: 'string' } }] }] } }], returns: [] }, { name: "Load", args: [], returns: [{ type: { kind: $.TypeKind.Interface, name: 'GoError', methods: [{ name: 'Error', args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: 'string' } }] }] } }] }],
	  onceError,
	  {"Mutex": "Mutex", "err": { kind: $.TypeKind.Interface, name: 'GoError', methods: [{ name: 'Error', args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: 'string' } }] }] }}
	);
}

export let ErrClosedPipe: $.GoError = errors.New("io: read/write on closed pipe")

class pipe {
	// Serializes Write operations
	public get wrMu(): sync.Mutex {
		return this._fields.wrMu.value
	}
	public set wrMu(value: sync.Mutex) {
		this._fields.wrMu.value = value
	}

	public get wrCh(): $.Channel<Uint8Array> | null {
		return this._fields.wrCh.value
	}
	public set wrCh(value: $.Channel<Uint8Array> | null) {
		this._fields.wrCh.value = value
	}

	public get rdCh(): $.Channel<number> | null {
		return this._fields.rdCh.value
	}
	public set rdCh(value: $.Channel<number> | null) {
		this._fields.rdCh.value = value
	}

	// Protects closing done
	public get once(): sync.Once {
		return this._fields.once.value
	}
	public set once(value: sync.Once) {
		this._fields.once.value = value
	}

	public get done(): $.Channel<{  }> | null {
		return this._fields.done.value
	}
	public set done(value: $.Channel<{  }> | null) {
		this._fields.done.value = value
	}

	public get rerr(): onceError {
		return this._fields.rerr.value
	}
	public set rerr(value: onceError) {
		this._fields.rerr.value = value
	}

	public get werr(): onceError {
		return this._fields.werr.value
	}
	public set werr(value: onceError) {
		this._fields.werr.value = value
	}

	public _fields: {
		wrMu: $.VarRef<sync.Mutex>;
		wrCh: $.VarRef<$.Channel<Uint8Array> | null>;
		rdCh: $.VarRef<$.Channel<number> | null>;
		once: $.VarRef<sync.Once>;
		done: $.VarRef<$.Channel<{  }> | null>;
		rerr: $.VarRef<onceError>;
		werr: $.VarRef<onceError>;
	}

	constructor(init?: Partial<{done?: $.Channel<{  }> | null, once?: sync.Once, rdCh?: $.Channel<number> | null, rerr?: onceError, werr?: onceError, wrCh?: $.Channel<Uint8Array> | null, wrMu?: sync.Mutex}>) {
		this._fields = {
			wrMu: $.varRef(init?.wrMu?.clone() ?? new Mutex()),
			wrCh: $.varRef(init?.wrCh ?? null),
			rdCh: $.varRef(init?.rdCh ?? null),
			once: $.varRef(init?.once?.clone() ?? new Once()),
			done: $.varRef(init?.done ?? null),
			rerr: $.varRef(init?.rerr?.clone() ?? new onceError()),
			werr: $.varRef(init?.werr?.clone() ?? new onceError())
		}
	}

	public clone(): pipe {
		const cloned = new pipe()
		cloned._fields = {
			wrMu: $.varRef(this._fields.wrMu.value?.clone() ?? null),
			wrCh: $.varRef(this._fields.wrCh.value),
			rdCh: $.varRef(this._fields.rdCh.value),
			once: $.varRef(this._fields.once.value?.clone() ?? null),
			done: $.varRef(this._fields.done.value),
			rerr: $.varRef(this._fields.rerr.value?.clone() ?? null),
			werr: $.varRef(this._fields.werr.value?.clone() ?? null)
		}
		return cloned
	}

	public async read(b: Uint8Array): Promise<[number, $.GoError]> {
		const p = this
		await $.selectStatement([
			{
				id: 0,
				isSend: false,
				channel: p!.done,
				onSelected: async (result) => {
					return [0, p!.readCloseError()]
				}
			},
			{
				id: -1,
				isSend: false,
				channel: null,
				onSelected: async (result) => {
				}
			},
		], true)
		await $.selectStatement([
			{
				id: 0,
				isSend: false,
				channel: p!.wrCh,
				onSelected: async (result) => {
					const bw = result.value
					let nr = copy(b, bw)
					await $.chanSend(p!.rdCh, nr)
					return [nr, null]
				}
			},
			{
				id: 1,
				isSend: false,
				channel: p!.done,
				onSelected: async (result) => {
					return [0, p!.readCloseError()]
				}
			},
		], false)
	}

	public closeRead(err: $.GoError): $.GoError {
		const p = this
		if (err == null) {
			err = ErrClosedPipe
		}
		p!.rerr.Store(err)
		p!.once.Do((): void => {
			p!.done.close()
		}
		)
		return null
	}

	public async write(b: Uint8Array): Promise<[number, $.GoError]> {
		const p = this
		await using __defer = new $.AsyncDisposableStack();
		await $.selectStatement([
			{
				id: 0,
				isSend: false,
				channel: p!.done,
				onSelected: async (result) => {
					return [0, p!.writeCloseError()]
				}
			},
			{
				id: -1,
				isSend: false,
				channel: null,
				onSelected: async (result) => {
					p!.wrMu.Lock()
					__defer.defer(() => {
						p!.wrMu.Unlock()
					});
				}
			},
		], true)
		for (let once = true; once || $.len(b) > 0; once = false) {
			await $.selectStatement([
				{
					id: 0,
					isSend: true,
					channel: p!.wrCh,
					value: b,
					onSelected: async (result) => {
						let nw = await $.chanRecv(p!.rdCh)
						b = b.subarray(nw)
						n += nw
					}
				},
				{
					id: 1,
					isSend: false,
					channel: p!.done,
					onSelected: async (result) => {
						return [n, p!.writeCloseError()]
					}
				},
			], false)
		}
		return [n, null]
	}

	public closeWrite(err: $.GoError): $.GoError {
		const p = this
		if (err == null) {
			err = EOF
		}
		p!.werr.Store(err)
		p!.once.Do((): void => {
			p!.done.close()
		}
		)
		return null
	}

	// readCloseError is considered internal to the pipe type.
	public readCloseError(): $.GoError {
		const p = this
		let rerr = p!.rerr.Load()
		{
			let werr = p!.werr.Load()
			if (rerr == null && werr != null) {
				return werr
			}
		}
		return ErrClosedPipe
	}

	// writeCloseError is considered internal to the pipe type.
	public writeCloseError(): $.GoError {
		const p = this
		let werr = p!.werr.Load()
		{
			let rerr = p!.rerr.Load()
			if (werr == null && rerr != null) {
				return rerr
			}
		}
		return ErrClosedPipe
	}

	// Register this type with the runtime type system
	static __typeInfo = $.registerStructType(
	  'pipe',
	  new pipe(),
	  [{ name: "read", args: [{ name: "b", type: { kind: $.TypeKind.Slice, elemType: { kind: $.TypeKind.Basic, name: "number" } } }], returns: [{ type: { kind: $.TypeKind.Basic, name: "number" } }, { type: { kind: $.TypeKind.Interface, name: 'GoError', methods: [{ name: 'Error', args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: 'string' } }] }] } }] }, { name: "closeRead", args: [{ name: "err", type: { kind: $.TypeKind.Interface, name: 'GoError', methods: [{ name: 'Error', args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: 'string' } }] }] } }], returns: [{ type: { kind: $.TypeKind.Interface, name: 'GoError', methods: [{ name: 'Error', args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: 'string' } }] }] } }] }, { name: "write", args: [{ name: "b", type: { kind: $.TypeKind.Slice, elemType: { kind: $.TypeKind.Basic, name: "number" } } }], returns: [{ type: { kind: $.TypeKind.Basic, name: "number" } }, { type: { kind: $.TypeKind.Interface, name: 'GoError', methods: [{ name: 'Error', args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: 'string' } }] }] } }] }, { name: "closeWrite", args: [{ name: "err", type: { kind: $.TypeKind.Interface, name: 'GoError', methods: [{ name: 'Error', args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: 'string' } }] }] } }], returns: [{ type: { kind: $.TypeKind.Interface, name: 'GoError', methods: [{ name: 'Error', args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: 'string' } }] }] } }] }, { name: "readCloseError", args: [], returns: [{ type: { kind: $.TypeKind.Interface, name: 'GoError', methods: [{ name: 'Error', args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: 'string' } }] }] } }] }, { name: "writeCloseError", args: [], returns: [{ type: { kind: $.TypeKind.Interface, name: 'GoError', methods: [{ name: 'Error', args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: 'string' } }] }] } }] }],
	  pipe,
	  {"wrMu": "Mutex", "wrCh": { kind: $.TypeKind.Channel, direction: "both", elemType: { kind: $.TypeKind.Slice, elemType: { kind: $.TypeKind.Basic, name: "number" } } }, "rdCh": { kind: $.TypeKind.Channel, direction: "both", elemType: { kind: $.TypeKind.Basic, name: "number" } }, "once": "Once", "done": { kind: $.TypeKind.Channel, direction: "both", elemType: { kind: $.TypeKind.Struct, fields: {}, methods: [] } }, "rerr": "onceError", "werr": "onceError"}
	);
}

export class PipeReader {
	public get pipe(): pipe {
		return this._fields.pipe.value
	}
	public set pipe(value: pipe) {
		this._fields.pipe.value = value
	}

	public _fields: {
		pipe: $.VarRef<pipe>;
	}

	constructor(init?: Partial<{pipe?: Partial<ConstructorParameters<typeof pipe>[0]>}>) {
		this._fields = {
			pipe: $.varRef(new pipe(init?.pipe))
		}
	}

	public clone(): PipeReader {
		const cloned = new PipeReader()
		cloned._fields = {
			pipe: $.varRef(this._fields.pipe.value.clone())
		}
		return cloned
	}

	// Read implements the standard Read interface:
	// it reads data from the pipe, blocking until a writer
	// arrives or the write end is closed.
	// If the write end is closed with an error, that error is
	// returned as err; otherwise err is EOF.
	public Read(data: Uint8Array): [number, $.GoError] {
		const r = this
		return r!.pipe.read(data)
	}

	// Close closes the reader; subsequent writes to the
	// write half of the pipe will return the error [ErrClosedPipe].
	public Close(): $.GoError {
		const r = this
		return null
	}

	// CloseWithError closes the reader; subsequent writes
	// to the write half of the pipe will return the error err.
	//
	// CloseWithError never overwrites the previous error if it exists
	// and always returns nil.
	public CloseWithError(err: $.GoError): $.GoError {
		const r = this
		return r!.pipe.closeRead(err)
	}

	public get wrMu(): sync.Mutex {
		return this.pipe.wrMu
	}
	public set wrMu(value: sync.Mutex) {
		this.pipe.wrMu = value
	}

	public get wrCh(): $.Channel<Uint8Array> | null {
		return this.pipe.wrCh
	}
	public set wrCh(value: $.Channel<Uint8Array> | null) {
		this.pipe.wrCh = value
	}

	public get rdCh(): $.Channel<number> | null {
		return this.pipe.rdCh
	}
	public set rdCh(value: $.Channel<number> | null) {
		this.pipe.rdCh = value
	}

	public get once(): sync.Once {
		return this.pipe.once
	}
	public set once(value: sync.Once) {
		this.pipe.once = value
	}

	public get done(): $.Channel<{  }> | null {
		return this.pipe.done
	}
	public set done(value: $.Channel<{  }> | null) {
		this.pipe.done = value
	}

	public get rerr(): onceError {
		return this.pipe.rerr
	}
	public set rerr(value: onceError) {
		this.pipe.rerr = value
	}

	public get werr(): onceError {
		return this.pipe.werr
	}
	public set werr(value: onceError) {
		this.pipe.werr = value
	}

	// Register this type with the runtime type system
	static __typeInfo = $.registerStructType(
	  'PipeReader',
	  new PipeReader(),
	  [{ name: "Read", args: [{ name: "data", type: { kind: $.TypeKind.Slice, elemType: { kind: $.TypeKind.Basic, name: "number" } } }], returns: [{ type: { kind: $.TypeKind.Basic, name: "number" } }, { type: { kind: $.TypeKind.Interface, name: 'GoError', methods: [{ name: 'Error', args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: 'string' } }] }] } }] }, { name: "Close", args: [], returns: [{ type: { kind: $.TypeKind.Interface, name: 'GoError', methods: [{ name: 'Error', args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: 'string' } }] }] } }] }, { name: "CloseWithError", args: [{ name: "err", type: { kind: $.TypeKind.Interface, name: 'GoError', methods: [{ name: 'Error', args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: 'string' } }] }] } }], returns: [{ type: { kind: $.TypeKind.Interface, name: 'GoError', methods: [{ name: 'Error', args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: 'string' } }] }] } }] }],
	  PipeReader,
	  {"pipe": "pipe"}
	);
}

export class PipeWriter {
	public get r(): PipeReader {
		return this._fields.r.value
	}
	public set r(value: PipeReader) {
		this._fields.r.value = value
	}

	public _fields: {
		r: $.VarRef<PipeReader>;
	}

	constructor(init?: Partial<{r?: PipeReader}>) {
		this._fields = {
			r: $.varRef(init?.r?.clone() ?? new PipeReader())
		}
	}

	public clone(): PipeWriter {
		const cloned = new PipeWriter()
		cloned._fields = {
			r: $.varRef(this._fields.r.value?.clone() ?? null)
		}
		return cloned
	}

	// Write implements the standard Write interface:
	// it writes data to the pipe, blocking until one or more readers
	// have consumed all the data or the read end is closed.
	// If the read end is closed with an error, that err is
	// returned as err; otherwise err is [ErrClosedPipe].
	public Write(data: Uint8Array): [number, $.GoError] {
		const w = this
		return w!.r.pipe.write(data)
	}

	// Close closes the writer; subsequent reads from the
	// read half of the pipe will return no bytes and EOF.
	public Close(): $.GoError {
		const w = this
		return null
	}

	// CloseWithError closes the writer; subsequent reads from the
	// read half of the pipe will return no bytes and the error err,
	// or EOF if err is nil.
	//
	// CloseWithError never overwrites the previous error if it exists
	// and always returns nil.
	public CloseWithError(err: $.GoError): $.GoError {
		const w = this
		return w!.r.pipe.closeWrite(err)
	}

	// Register this type with the runtime type system
	static __typeInfo = $.registerStructType(
	  'PipeWriter',
	  new PipeWriter(),
	  [{ name: "Write", args: [{ name: "data", type: { kind: $.TypeKind.Slice, elemType: { kind: $.TypeKind.Basic, name: "number" } } }], returns: [{ type: { kind: $.TypeKind.Basic, name: "number" } }, { type: { kind: $.TypeKind.Interface, name: 'GoError', methods: [{ name: 'Error', args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: 'string' } }] }] } }] }, { name: "Close", args: [], returns: [{ type: { kind: $.TypeKind.Interface, name: 'GoError', methods: [{ name: 'Error', args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: 'string' } }] }] } }] }, { name: "CloseWithError", args: [{ name: "err", type: { kind: $.TypeKind.Interface, name: 'GoError', methods: [{ name: 'Error', args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: 'string' } }] }] } }], returns: [{ type: { kind: $.TypeKind.Interface, name: 'GoError', methods: [{ name: 'Error', args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: 'string' } }] }] } }] }],
	  PipeWriter,
	  {"r": "PipeReader"}
	);
}

// Pipe creates a synchronous in-memory pipe.
// It can be used to connect code expecting an [io.Reader]
// with code expecting an [io.Writer].
//
// Reads and Writes on the pipe are matched one to one
// except when multiple Reads are needed to consume a single Write.
// That is, each Write to the [PipeWriter] blocks until it has satisfied
// one or more Reads from the [PipeReader] that fully consume
// the written data.
// The data is copied directly from the Write to the corresponding
// Read (or Reads); there is no internal buffering.
//
// It is safe to call Read and Write in parallel with each other or with Close.
// Parallel calls to Read and parallel calls to Write are also safe:
// the individual calls will be gated sequentially.
export function Pipe(): [PipeReader | null, PipeWriter | null] {
	let pw = new PipeWriter({r: new PipeReader({pipe: {wrCh: $.makeChannel<Uint8Array>(0, new Uint8Array(0), 'both'), rdCh: $.makeChannel<number>(0, 0, 'both'), done: $.makeChannel<{  }>(0, {}, 'both')}})})
	return [pw!.r, pw]
}


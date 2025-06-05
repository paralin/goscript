import * as $ from "@goscript/builtin/index.js";
import { Mutex } from "./mutex.gs.js";

import * as context from "@goscript/context/index.js"

import * as sync from "@goscript/sync/index.js"

import * as atomic from "@goscript/sync/atomic/index.js"

import * as broadcast from "@goscript/github.com/aperturerobotics/util/broadcast/index.js"

import * as errors from "@goscript/github.com/pkg/errors/index.js"

export class RWMutex {
	// bcast is broadcast when below fields change
	public get bcast(): broadcast.Broadcast {
		return this._fields.bcast.value
	}
	public set bcast(value: broadcast.Broadcast) {
		this._fields.bcast.value = value
	}

	// nreaders is the number of active readers
	public get nreaders(): number {
		return this._fields.nreaders.value
	}
	public set nreaders(value: number) {
		this._fields.nreaders.value = value
	}

	// writing indicates there's a write tx active
	public get writing(): boolean {
		return this._fields.writing.value
	}
	public set writing(value: boolean) {
		this._fields.writing.value = value
	}

	// writeWaiting indicates the number of waiting write tx
	public get writeWaiting(): number {
		return this._fields.writeWaiting.value
	}
	public set writeWaiting(value: number) {
		this._fields.writeWaiting.value = value
	}

	public _fields: {
		bcast: $.VarRef<broadcast.Broadcast>;
		nreaders: $.VarRef<number>;
		writing: $.VarRef<boolean>;
		writeWaiting: $.VarRef<number>;
	}

	constructor(init?: Partial<{bcast?: broadcast.Broadcast, nreaders?: number, writeWaiting?: number, writing?: boolean}>) {
		this._fields = {
			bcast: $.varRef(init?.bcast?.clone() ?? new broadcast.Broadcast()),
			nreaders: $.varRef(init?.nreaders ?? 0),
			writing: $.varRef(init?.writing ?? false),
			writeWaiting: $.varRef(init?.writeWaiting ?? 0)
		}
	}

	public clone(): RWMutex {
		const cloned = new RWMutex()
		cloned._fields = {
			bcast: $.varRef(this._fields.bcast.value?.clone() ?? null),
			nreaders: $.varRef(this._fields.nreaders.value),
			writing: $.varRef(this._fields.writing.value),
			writeWaiting: $.varRef(this._fields.writeWaiting.value)
		}
		return cloned
	}

	// Lock attempts to hold a lock on the RWMutex.
	// Returns a lock release function or an error.
	// A single writer OR many readers can hold Lock at a time.
	// If a writer is waiting to lock, readers will wait for it.
	public async Lock(ctx: context.Context, write: boolean): Promise<[(() => void) | null, $.GoError]> {
		const m = this
		let status: atomic.Int32 = new atomic.Int32()
		let waitCh: $.Channel<{  }> | null = null
		await m.bcast.HoldLock((_: (() => void) | null, getWaitCh: (() => $.Channel<{  }> | null) | null): void => {
			if (write) {
				if (m.nreaders != 0 || m.writing) {
					m.writeWaiting++
					waitCh = getWaitCh!()
				}
				 else {
					m.writing = true
					status.Store(1)
				}
			}
			 else if (!m.writing && m.writeWaiting == 0) {
				m.nreaders++
				status.Store(1)
			}
			 else {
				waitCh = getWaitCh!()
			}
		})
		let release = async (): Promise<void> => {
			let pre = status.Swap(2)
			if (pre == 2) {
				return 
			}

			// 0: waiting for lock

			// 1: we have the lock
			await m.bcast.HoldLock((broadcast: (() => void) | null, _: (() => $.Channel<{  }> | null) | null): void => {

				// 0: waiting for lock

				// 1: we have the lock
				if (pre == 0) {
					// 0: waiting for lock
					if (write) {
						m.writeWaiting--
					}
				}
				 else {
					// 1: we have the lock
					if (write) {
						m.writing = false
					}
					 else {
						m.nreaders--
					}
					broadcast!()
				}
			})
		}
		if (status.Load() == 1) {
			return [release, null]
		}
		for (; ; ) {
			const [_selectHasReturn4123788, _selectValue4123788] = await $.selectStatement([
				{
					id: 0,
					isSend: false,
					channel: ctx!.Done(),
					onSelected: async (result) => {
						release!()
						return [null, context.Canceled]
					}
				},
				{
					id: 1,
					isSend: false,
					channel: waitCh,
					onSelected: async (result) => {
					}
				},
			], false)
			if (_selectHasReturn4123788) {
				return _selectValue4123788!
			}
			// If _selectHasReturn4123788 is false, continue execution

			await m.bcast.HoldLock((broadcast: (() => void) | null, getWaitCh: (() => $.Channel<{  }> | null) | null): void => {
				if (write) {
					if (m.nreaders == 0 && !m.writing) {
						m.writeWaiting--
						m.writing = true
						status.Store(1)
					}
					 else {
						waitCh = getWaitCh!()
					}
				}
				 else if (!m.writing && m.writeWaiting == 0) {
					m.nreaders++
					status.Store(1)
				}
				 else {
					waitCh = getWaitCh!()
				}
			})

			if (status.Load() == 1) {
				return [release, null]
			}
		}
	}

	// TryLock attempts to hold a lock on the RWMutex.
	// Returns a lock release function or nil if the lock could not be grabbed.
	// A single writer OR many readers can hold Lock at a time.
	// If a writer is waiting to lock, readers will wait for it.
	public async TryLock(write: boolean): Promise<[(() => void) | null, boolean]> {
		const m = this
		let unlocked: atomic.Bool = new atomic.Bool()
		await m.bcast.HoldLock((broadcast: (() => void) | null, getWaitCh: (() => $.Channel<{  }> | null) | null): void => {
			if (write) {
				if (m.nreaders != 0 || m.writing) {
					unlocked.Store(true)
				}
				 else {
					m.writing = true
				}
			}
			 else if (!m.writing && m.writeWaiting == 0) {
				m.nreaders++
			}
			 else {
				unlocked.Store(true)
			}
		})
		if (unlocked.Load()) {
			return [null, false]
		}
		return [async (): Promise<void> => {
			if (unlocked.Swap(true)) {
				return 
			}

			await m.bcast.HoldLock((broadcast: (() => void) | null, _: (() => $.Channel<{  }> | null) | null): void => {
				if (write) {
					m.writing = false
				}
				 else {
					m.nreaders--
				}
				broadcast!()
			})
		}, true]
	}

	// Locker returns an RWMutexLocker that uses context.Background to write lock the RWMutex.
	public Locker(): sync.Locker {
		const m = this
		return new RWMutexLocker({m: m, write: true})
	}

	// RLocker returns an RWMutexLocker that uses context.Background to read lock the RWMutex.
	public RLocker(): sync.Locker {
		const m = this
		return new RWMutexLocker({m: m, write: false})
	}

	// Register this type with the runtime type system
	static __typeInfo = $.registerStructType(
	  'RWMutex',
	  new RWMutex(),
	  [{ name: "Lock", args: [{ name: "ctx", type: "Context" }, { name: "write", type: { kind: $.TypeKind.Basic, name: "boolean" } }], returns: [{ type: { kind: $.TypeKind.Function, params: [], results: [] } }, { type: { kind: $.TypeKind.Interface, name: 'GoError', methods: [{ name: 'Error', args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: 'string' } }] }] } }] }, { name: "TryLock", args: [{ name: "write", type: { kind: $.TypeKind.Basic, name: "boolean" } }], returns: [{ type: { kind: $.TypeKind.Function, params: [], results: [] } }, { type: { kind: $.TypeKind.Basic, name: "boolean" } }] }, { name: "Locker", args: [], returns: [{ type: "Locker" }] }, { name: "RLocker", args: [], returns: [{ type: "Locker" }] }],
	  RWMutex,
	  {"bcast": "Broadcast", "nreaders": { kind: $.TypeKind.Basic, name: "number" }, "writing": { kind: $.TypeKind.Basic, name: "boolean" }, "writeWaiting": { kind: $.TypeKind.Basic, name: "number" }}
	);
}

export class RWMutexLocker {
	public get m(): RWMutex | null {
		return this._fields.m.value
	}
	public set m(value: RWMutex | null) {
		this._fields.m.value = value
	}

	public get write(): boolean {
		return this._fields.write.value
	}
	public set write(value: boolean) {
		this._fields.write.value = value
	}

	public get mtx(): sync.Mutex {
		return this._fields.mtx.value
	}
	public set mtx(value: sync.Mutex) {
		this._fields.mtx.value = value
	}

	public get rels(): $.Slice<(() => void) | null> {
		return this._fields.rels.value
	}
	public set rels(value: $.Slice<(() => void) | null>) {
		this._fields.rels.value = value
	}

	public _fields: {
		m: $.VarRef<RWMutex | null>;
		write: $.VarRef<boolean>;
		mtx: $.VarRef<sync.Mutex>;
		rels: $.VarRef<$.Slice<(() => void) | null>>;
	}

	constructor(init?: Partial<{m?: RWMutex | null, mtx?: sync.Mutex, rels?: $.Slice<(() => void) | null>, write?: boolean}>) {
		this._fields = {
			m: $.varRef(init?.m ?? null),
			write: $.varRef(init?.write ?? false),
			mtx: $.varRef(init?.mtx?.clone() ?? new sync.Mutex()),
			rels: $.varRef(init?.rels ?? null)
		}
	}

	public clone(): RWMutexLocker {
		const cloned = new RWMutexLocker()
		cloned._fields = {
			m: $.varRef(this._fields.m.value),
			write: $.varRef(this._fields.write.value),
			mtx: $.varRef(this._fields.mtx.value?.clone() ?? null),
			rels: $.varRef(this._fields.rels.value)
		}
		return cloned
	}

	// Lock implements the sync.Locker interface.
	public async Lock(): Promise<void> {
		const l = this
		let [release, err] = await l.m!.Lock(context.Background(), l.write)
		if (err != null) {
			$.panic(errors.Wrap(err, "csync: failed RWMutexLocker Lock"))
		}
		await l.mtx.Lock()
		l.rels = $.append(l.rels, release)
		l.mtx.Unlock()
	}

	// Unlock implements the sync.Locker interface.
	public async Unlock(): Promise<void> {
		const l = this
		await l.mtx.Lock()
		if ($.len(l.rels) == 0) {
			l.mtx.Unlock()
			$.panic("csync: unlock of unlocked RWMutexLocker")
		}
		let rel = l.rels![$.len(l.rels) - 1]
		if ($.len(l.rels) == 1) {
			l.rels = null
		}
		 else {
			l.rels![$.len(l.rels) - 1] = null
			l.rels = $.goSlice(l.rels, undefined, $.len(l.rels) - 1)
		}
		l.mtx.Unlock()
		rel!()
	}

	// Register this type with the runtime type system
	static __typeInfo = $.registerStructType(
	  'RWMutexLocker',
	  new RWMutexLocker(),
	  [{ name: "Lock", args: [], returns: [] }, { name: "Unlock", args: [], returns: [] }],
	  RWMutexLocker,
	  {"m": { kind: $.TypeKind.Pointer, elemType: "RWMutex" }, "write": { kind: $.TypeKind.Basic, name: "boolean" }, "mtx": "Mutex", "rels": { kind: $.TypeKind.Slice, elemType: { kind: $.TypeKind.Function, params: [], results: [] } }}
	);
}



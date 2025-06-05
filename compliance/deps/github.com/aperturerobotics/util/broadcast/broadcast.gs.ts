import * as $ from "@goscript/builtin/index.js";

import * as context from "@goscript/context/index.js"

import * as errors from "@goscript/errors/index.js"

import * as sync from "@goscript/sync/index.js"

export class Broadcast {
	public get mtx(): sync.Mutex {
		return this._fields.mtx.value
	}
	public set mtx(value: sync.Mutex) {
		this._fields.mtx.value = value
	}

	public get ch(): $.Channel<{  }> | null {
		return this._fields.ch.value
	}
	public set ch(value: $.Channel<{  }> | null) {
		this._fields.ch.value = value
	}

	public _fields: {
		mtx: $.VarRef<sync.Mutex>;
		ch: $.VarRef<$.Channel<{  }> | null>;
	}

	constructor(init?: Partial<{ch?: $.Channel<{  }> | null, mtx?: sync.Mutex}>) {
		this._fields = {
			mtx: $.varRef(init?.mtx?.clone() ?? new sync.Mutex()),
			ch: $.varRef(init?.ch ?? null)
		}
	}

	public clone(): Broadcast {
		const cloned = new Broadcast()
		cloned._fields = {
			mtx: $.varRef(this._fields.mtx.value?.clone() ?? null),
			ch: $.varRef(this._fields.ch.value)
		}
		return cloned
	}

	// HoldLock locks the mutex and calls the callback.
	//
	// broadcast closes the wait channel, if any.
	// getWaitCh returns a channel that will be closed when broadcast is called.
	public HoldLock(cb: ((broadcast: (() => void) | null, getWaitCh: (() => $.Channel<{  }> | null) | null) => void) | null): void {
		const c = this
		using __defer = new $.DisposableStack();
		c.mtx.Lock()
		__defer.defer(() => {
			c.mtx.Unlock()
		});
		cb!(c!.broadcastLocked.bind(c!), c!.getWaitChLocked.bind(c!))
	}

	// TryHoldLock attempts to lock the mutex and call the callback.
	// It returns true if the lock was acquired and the callback was called, false otherwise.
	public TryHoldLock(cb: ((broadcast: (() => void) | null, getWaitCh: (() => $.Channel<{  }> | null) | null) => void) | null): boolean {
		const c = this
		using __defer = new $.DisposableStack();
		if (!c.mtx.TryLock()) {
			return false
		}
		__defer.defer(() => {
			c.mtx.Unlock()
		});
		cb!(c!.broadcastLocked.bind(c!), c!.getWaitChLocked.bind(c!))
		return true
	}

	// HoldLockMaybeAsync locks the mutex and calls the callback if possible.
	// If the mutex cannot be locked right now, starts a new Goroutine to wait for it.
	public HoldLockMaybeAsync(cb: ((broadcast: (() => void) | null, getWaitCh: (() => $.Channel<{  }> | null) | null) => void) | null): void {
		const c = this
		using __defer = new $.DisposableStack();
		let holdBroadcastLock = (lock: boolean): void => {
			using __defer = new $.DisposableStack();
			if (lock) {
				c.mtx.Lock()
			}
			// use defer to catch panic cases
			__defer.defer(() => {
				c.mtx.Unlock()
			});
			cb!(c!.broadcastLocked.bind(c!), c!.getWaitChLocked.bind(c!))
		}
		if (c.mtx.TryLock()) {
			holdBroadcastLock!(false)
		}
		 else {
			// slow path: use separate goroutine
			queueMicrotask(() => {
				holdBroadcastLock(true)
			})
		}
	}

	// Wait waits for the cb to return true or an error before returning.
	// When the broadcast channel is broadcasted, re-calls cb again to re-check the value.
	// cb is called while the mutex is locked.
	// Returns context.Canceled if ctx is canceled.
	public async Wait(ctx: context.Context, cb: ((broadcast: (() => void) | null, getWaitCh: (() => $.Channel<{  }> | null) | null) => [boolean, $.GoError]) | null): Promise<$.GoError> {
		const c = this
		if (cb == null || ctx == null) {
			return errors.New("cb and ctx must be set")
		}
		let waitCh: $.Channel<{  }> | null = null
		for (; ; ) {
			if (ctx!.Err() != null) {
				return context.Canceled
			}

			let done: boolean = false
			let err: $.GoError = null
			c.HoldLock((broadcast: (() => void) | null, getWaitCh: (() => $.Channel<{  }> | null) | null): void => {
				;[done, err] = cb!(broadcast, getWaitCh)
				if (!done && err == null) {
					waitCh = getWaitCh!()
				}
			})

			if (done || err != null) {
				return err
			}

			const [_selectHasReturn3801024, _selectValue3801024] = await $.selectStatement([
				{
					id: 0,
					isSend: false,
					channel: ctx!.Done(),
					onSelected: async (result) => {
						return context.Canceled
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
			if (_selectHasReturn3801024) {
				return _selectValue3801024!
			}
			// If _selectHasReturn3801024 is false, continue execution
		}
	}

	// broadcastLocked is the implementation of Broadcast while mtx is locked.
	public broadcastLocked(): void {
		const c = this
		if (c.ch != null) {
			c.ch.close()
			c.ch = null
		}
	}

	// getWaitChLocked is the implementation of GetWaitCh while mtx is locked.
	public getWaitChLocked(): $.Channel<{  }> | null {
		const c = this
		if (c.ch == null) {
			c.ch = $.makeChannel<{  }>(0, {}, 'both')
		}
		return c.ch
	}

	// Register this type with the runtime type system
	static __typeInfo = $.registerStructType(
	  'Broadcast',
	  new Broadcast(),
	  [{ name: "HoldLock", args: [{ name: "cb", type: { kind: $.TypeKind.Function, params: [{ kind: $.TypeKind.Function, params: [], results: [] }, { kind: $.TypeKind.Function, params: [], results: [{ kind: $.TypeKind.Channel, direction: "receive", elemType: { kind: $.TypeKind.Struct, fields: {}, methods: [] } }] }], results: [] } }], returns: [] }, { name: "TryHoldLock", args: [{ name: "cb", type: { kind: $.TypeKind.Function, params: [{ kind: $.TypeKind.Function, params: [], results: [] }, { kind: $.TypeKind.Function, params: [], results: [{ kind: $.TypeKind.Channel, direction: "receive", elemType: { kind: $.TypeKind.Struct, fields: {}, methods: [] } }] }], results: [] } }], returns: [{ type: { kind: $.TypeKind.Basic, name: "boolean" } }] }, { name: "HoldLockMaybeAsync", args: [{ name: "cb", type: { kind: $.TypeKind.Function, params: [{ kind: $.TypeKind.Function, params: [], results: [] }, { kind: $.TypeKind.Function, params: [], results: [{ kind: $.TypeKind.Channel, direction: "receive", elemType: { kind: $.TypeKind.Struct, fields: {}, methods: [] } }] }], results: [] } }], returns: [] }, { name: "Wait", args: [{ name: "ctx", type: "Context" }, { name: "cb", type: { kind: $.TypeKind.Function, params: [{ kind: $.TypeKind.Function, params: [], results: [] }, { kind: $.TypeKind.Function, params: [], results: [{ kind: $.TypeKind.Channel, direction: "receive", elemType: { kind: $.TypeKind.Struct, fields: {}, methods: [] } }] }], results: [{ kind: $.TypeKind.Basic, name: "boolean" }, { kind: $.TypeKind.Interface, name: 'GoError', methods: [{ name: 'Error', args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: 'string' } }] }] }] } }], returns: [{ type: { kind: $.TypeKind.Interface, name: 'GoError', methods: [{ name: 'Error', args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: 'string' } }] }] } }] }, { name: "broadcastLocked", args: [], returns: [] }, { name: "getWaitChLocked", args: [], returns: [{ type: { kind: $.TypeKind.Channel, direction: "receive", elemType: { kind: $.TypeKind.Struct, fields: {}, methods: [] } } }] }],
	  Broadcast,
	  {"mtx": "Mutex", "ch": { kind: $.TypeKind.Channel, direction: "both", elemType: { kind: $.TypeKind.Struct, fields: {}, methods: [] } }}
	);
}


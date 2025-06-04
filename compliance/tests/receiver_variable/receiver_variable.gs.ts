// Generated file based on receiver_variable.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as $ from "@goscript/builtin/index.js";

import * as errors from "@goscript/errors/index.js"

import * as sync from "@goscript/sync/index.js"

export class content {
	public get name(): string {
		return this._fields.name.value
	}
	public set name(value: string) {
		this._fields.name.value = value
	}

	public get bytes(): $.Bytes {
		return this._fields.bytes.value
	}
	public set bytes(value: $.Bytes) {
		this._fields.bytes.value = value
	}

	public get m(): sync.RWMutex {
		return this._fields.m.value
	}
	public set m(value: sync.RWMutex) {
		this._fields.m.value = value
	}

	public _fields: {
		name: $.VarRef<string>;
		bytes: $.VarRef<$.Bytes>;
		m: $.VarRef<sync.RWMutex>;
	}

	constructor(init?: Partial<{bytes?: $.Bytes, m?: sync.RWMutex, name?: string}>) {
		this._fields = {
			name: $.varRef(init?.name ?? ""),
			bytes: $.varRef(init?.bytes ?? new Uint8Array(0)),
			m: $.varRef(init?.m?.clone() ?? new sync.RWMutex())
		}
	}

	public clone(): content {
		const cloned = new content()
		cloned._fields = {
			name: $.varRef(this._fields.name.value),
			bytes: $.varRef(this._fields.bytes.value),
			m: $.varRef(this._fields.m.value?.clone() ?? null)
		}
		return cloned
	}

	public WriteAt(p: $.Bytes, off: number): [number, $.GoError] {
		const c = this
		if (off < 0) {
			return [0, errors.New("negative offset")]
		}
		c.m.Lock()
		let prev = $.len(c.bytes)
		let diff = $.int(off) - prev
		if (diff > 0) {
			c.bytes = $.append(c.bytes, new Uint8Array(diff))
		}
		c.bytes = $.append($.goSlice(c.bytes, undefined, off), p)
		if ($.len(c.bytes) < prev) {
			c.bytes = $.goSlice(c.bytes, undefined, prev)
		}
		c.m.Unlock()
		return [$.len(p), null]
	}

	public ReadAt(b: $.Bytes, off: number): [number, $.GoError] {
		const c = this
		let n: number = 0
		let err: $.GoError = null
		if (off < 0) {
			return [0, errors.New("negative offset")]
		}
		c.m.RLock()
		let size = ($.len(c.bytes) as number)
		if (off >= size) {
			c.m.RUnlock()
			return [0, errors.New("EOF")]
		}
		let l = ($.len(b) as number)
		if (off + l > size) {
			l = size - off
		}
		let btr = $.goSlice(c.bytes, off, off + l)
		n = $.copy(b, btr)
		if ($.len(btr) < $.len(b)) {
			err = errors.New("EOF")
		}
		c.m.RUnlock()
		return [n, err]
	}

	public Size(): number {
		const c = this
		using __defer = new $.DisposableStack();
		c.m.RLock()
		__defer.defer(() => {
			c.m.RUnlock()
		});
		return $.len(c.bytes)
	}

	public Clear(): void {
		const c = this
		using __defer = new $.DisposableStack();
		c.m.Lock()
		__defer.defer(() => {
			c.m.Unlock()
		});
		const _temp_len = $.len
		{
			let len = _temp_len(c.bytes)
			if (len > 0) {
				c.bytes = new Uint8Array(0)
			}
		}
	}

	// Method with complex variable scoping
	public ComplexMethod(): $.GoError {
		const c = this
		using __defer = new $.DisposableStack();
		c.m.Lock()
		__defer.defer(() => {
			c.m.Unlock()
		});
		if ($.len(c.bytes) == 0) {
			c.bytes = new Uint8Array(10)
		}
		for (let i = 0; i < 3; i++) {

			// Nested scope with receiver usage
			{
				let [data, err] = c.getData(i)
				if (err == null) {
					// Nested scope with receiver usage
					if ($.len(data) > 0) {
						c.bytes = $.append(c.bytes, data)
					}
				}
			}
		}
		{
			let x = $.len(c.bytes)
			if (x > 20) {
				// Use receiver in nested scope
				c.bytes = $.goSlice(c.bytes, undefined, 20)

				// Nested function literal that might affect scoping
				let fn = (): void => {
					if ($.len(c.bytes) > 0) {
						c.bytes![0] = 42
					}
				}
				fn!()
			}
		}
		return null
	}

	public getData(index: number): [$.Bytes, $.GoError] {
		if (index < 0) {
			return [null, errors.New("invalid index")]
		}
		return [new Uint8Array([$.byte(index), $.byte(index + 1)]), null]
	}

	// Simple methods that should trigger receiver binding but might not
	public Truncate(): void {
		const c = this
		c.bytes = new Uint8Array(0)
	}

	public Len(): number {
		const c = this
		return $.len(c.bytes)
	}

	// Register this type with the runtime type system
	static __typeInfo = $.registerStructType(
	  'content',
	  new content(),
	  [{ name: "WriteAt", args: [{ name: "p", type: { kind: $.TypeKind.Slice, elemType: { kind: $.TypeKind.Basic, name: "number" } } }, { name: "off", type: { kind: $.TypeKind.Basic, name: "number" } }], returns: [{ type: { kind: $.TypeKind.Basic, name: "number" } }, { type: { kind: $.TypeKind.Interface, name: 'GoError', methods: [{ name: 'Error', args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: 'string' } }] }] } }] }, { name: "ReadAt", args: [{ name: "b", type: { kind: $.TypeKind.Slice, elemType: { kind: $.TypeKind.Basic, name: "number" } } }, { name: "off", type: { kind: $.TypeKind.Basic, name: "number" } }], returns: [{ type: { kind: $.TypeKind.Basic, name: "number" } }, { type: { kind: $.TypeKind.Interface, name: 'GoError', methods: [{ name: 'Error', args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: 'string' } }] }] } }] }, { name: "Size", args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: "number" } }] }, { name: "Clear", args: [], returns: [] }, { name: "ComplexMethod", args: [], returns: [{ type: { kind: $.TypeKind.Interface, name: 'GoError', methods: [{ name: 'Error', args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: 'string' } }] }] } }] }, { name: "getData", args: [{ name: "index", type: { kind: $.TypeKind.Basic, name: "number" } }], returns: [{ type: { kind: $.TypeKind.Slice, elemType: { kind: $.TypeKind.Basic, name: "number" } } }, { type: { kind: $.TypeKind.Interface, name: 'GoError', methods: [{ name: 'Error', args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: 'string' } }] }] } }] }, { name: "Truncate", args: [], returns: [] }, { name: "Len", args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: "number" } }] }],
	  content,
	  {"name": { kind: $.TypeKind.Basic, name: "string" }, "bytes": { kind: $.TypeKind.Slice, elemType: { kind: $.TypeKind.Basic, name: "number" } }, "m": "RWMutex"}
	);
}

export async function main(): Promise<void> {
	let c = new content({bytes: new Uint8Array(0), name: "test"})

	// Test basic functionality that should work
	{
		let err = c.ComplexMethod()
		if (err != null) {
			console.log("Error:", err!.Error())
			return 
		}
	}

	console.log("Complex method completed, size:", c.Size())
}


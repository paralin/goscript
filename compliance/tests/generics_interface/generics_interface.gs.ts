// Generated file based on generics_interface.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as $ from "@goscript/builtin/builtin.js";

type Container<T extends any> = null | {
	Get(): T
	Set(_p0: T): void
	Size(): number
}

$.registerInterfaceType(
  'Container',
  null, // Zero value for interface is null
  [{ name: "Get", args: [], returns: [{ type: { kind: $.TypeKind.Interface, methods: [] } }] }, { name: "Set", args: [{ name: "", type: { kind: $.TypeKind.Interface, methods: [] } }], returns: [] }, { name: "Size", args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: "number" } }] }]
);

type Comparable<T extends $.Comparable> = null | {
	Compare(_p0: T): number
	Equal(_p0: T): boolean
}

$.registerInterfaceType(
  'Comparable',
  null, // Zero value for interface is null
  [{ name: "Compare", args: [{ name: "", type: { kind: $.TypeKind.Interface, methods: [] } }], returns: [{ type: { kind: $.TypeKind.Basic, name: "number" } }] }, { name: "Equal", args: [{ name: "", type: { kind: $.TypeKind.Interface, methods: [] } }], returns: [{ type: { kind: $.TypeKind.Basic, name: "boolean" } }] }]
);

class Box<T extends any> {
	public get value(): T {
		return this._fields.value.value
	}
	public set value(value: T) {
		this._fields.value.value = value
	}

	public get count(): number {
		return this._fields.count.value
	}
	public set count(value: number) {
		this._fields.count.value = value
	}

	public _fields: {
		value: $.Box<T>;
		count: $.Box<number>;
	}

	constructor(init?: Partial<{count?: number, value?: T}>) {
		this._fields = {
			value: $.box(init?.value ?? null!),
			count: $.box(init?.count ?? 0)
		}
	}

	public clone(): Box<T> {
		const cloned = new Box<T>()
		cloned._fields = {
			value: $.box(this._fields.value.value),
			count: $.box(this._fields.count.value)
		}
		return cloned
	}

	public Get(): T {
		const b = this
		return b!.value
	}

	public Set(v: T): void {
		const b = this
		b!.value = v
		b!.count++
	}

	public Size(): number {
		const b = this
		return b!.count
	}

	// Register this type with the runtime type system
	static __typeInfo = $.registerStructType(
	  'Box',
	  new Box(),
	  [{ name: "Get", args: [], returns: [{ type: { kind: $.TypeKind.Interface, methods: [] } }] }, { name: "Set", args: [{ name: "v", type: { kind: $.TypeKind.Interface, methods: [] } }], returns: [] }, { name: "Size", args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: "number" } }] }],
	  Box,
	  {"value": { kind: $.TypeKind.Interface, methods: [] }, "count": { kind: $.TypeKind.Basic, name: "number" }}
	);
}

class StringBox {
	public get value(): string {
		return this._fields.value.value
	}
	public set value(value: string) {
		this._fields.value.value = value
	}

	public _fields: {
		value: $.Box<string>;
	}

	constructor(init?: Partial<{value?: string}>) {
		this._fields = {
			value: $.box(init?.value ?? "")
		}
	}

	public clone(): StringBox {
		const cloned = new StringBox()
		cloned._fields = {
			value: $.box(this._fields.value.value)
		}
		return cloned
	}

	public Compare(other: string): number {
		const s = this
		if (s!.value < other) {
			return -1
		} else if (s!.value > other) {
			return 1
		}
		return 0
	}

	public Equal(other: string): boolean {
		const s = this
		return s!.value == other
	}

	// Register this type with the runtime type system
	static __typeInfo = $.registerStructType(
	  'StringBox',
	  new StringBox(),
	  [{ name: "Compare", args: [{ name: "other", type: { kind: $.TypeKind.Basic, name: "string" } }], returns: [{ type: { kind: $.TypeKind.Basic, name: "number" } }] }, { name: "Equal", args: [{ name: "other", type: { kind: $.TypeKind.Basic, name: "string" } }], returns: [{ type: { kind: $.TypeKind.Basic, name: "boolean" } }] }],
	  StringBox,
	  {"value": { kind: $.TypeKind.Basic, name: "string" }}
	);
}

// Function that works with generic interface
function useContainer<T extends any>(c: Container<T>, val: T): T {
	c!.Set(val)
	return c!.Get()
}

// Function that works with comparable interface
function checkEqual<T extends $.Comparable>(c: Comparable<T>, val: T): boolean {
	return c!.Equal(val)
}

export function main(): void {
	console.log("=== Generic Interface Test ===")

	// Test Box implementing Container
	let intBox = new Box<number>({})
	let result = useContainer(intBox, 42)
	console.log("Int box result:", result)
	console.log("Int box size:", intBox!.Size())

	let stringBox = new Box<string>({})
	let strResult = useContainer(stringBox, "hello")
	console.log("String box result:", strResult)
	console.log("String box size:", stringBox!.Size())

	// Test StringBox implementing Comparable
	let sb = new StringBox({value: "test"})
	console.log("String comparison equal:", checkEqual(sb, "test"))
	console.log("String comparison not equal:", checkEqual(sb, "other"))
	console.log("String comparison -1:", sb!.Compare("zebra"))
	console.log("String comparison 1:", sb!.Compare("alpha"))
	console.log("String comparison 0:", sb!.Compare("test"))
}


// Generated file based on generics_interface.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as $ from "@goscript/builtin/index.js";

export type Container<T extends any> = null | {
	Get(): T
	Set(_p0: T): void
	Size(): number
}

$.registerInterfaceType(
  'Container',
  null, // Zero value for interface is null
  [{ name: "Get", args: [], returns: [{ type: { kind: $.TypeKind.Interface, methods: [] } }] }, { name: "Set", args: [{ name: "", type: { kind: $.TypeKind.Interface, methods: [] } }], returns: [] }, { name: "Size", args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: "number" } }] }]
);

export type Comparable<T extends $.Comparable> = null | {
	Compare(_p0: T): number
	Equal(_p0: T): boolean
}

$.registerInterfaceType(
  'Comparable',
  null, // Zero value for interface is null
  [{ name: "Compare", args: [{ name: "", type: { kind: $.TypeKind.Interface, methods: [] } }], returns: [{ type: { kind: $.TypeKind.Basic, name: "number" } }] }, { name: "Equal", args: [{ name: "", type: { kind: $.TypeKind.Interface, methods: [] } }], returns: [{ type: { kind: $.TypeKind.Basic, name: "boolean" } }] }]
);

export class ValueContainer<T extends any> {
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
		value: $.VarRef<T>;
		count: $.VarRef<number>;
	}

	constructor(init?: Partial<{count?: number, value?: T}>) {
		this._fields = {
			value: $.varRef(init?.value ?? null as any),
			count: $.varRef(init?.count ?? 0)
		}
	}

	public clone(): ValueContainer<T> {
		const cloned = new ValueContainer<T>()
		cloned._fields = {
			value: $.varRef(this._fields.value.value),
			count: $.varRef(this._fields.count.value)
		}
		return cloned
	}

	public Get(): T {
		const b = this
		return b.value
	}

	public Set(v: T): void {
		const b = this
		b.value = v
		b.count++
	}

	public Size(): number {
		const b = this
		return b.count
	}

	// Register this type with the runtime type system
	static __typeInfo = $.registerStructType(
	  'ValueContainer',
	  new ValueContainer(),
	  [{ name: "Get", args: [], returns: [{ type: { kind: $.TypeKind.Interface, methods: [] } }] }, { name: "Set", args: [{ name: "v", type: { kind: $.TypeKind.Interface, methods: [] } }], returns: [] }, { name: "Size", args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: "number" } }] }],
	  ValueContainer,
	  {"value": { kind: $.TypeKind.Interface, methods: [] }, "count": { kind: $.TypeKind.Basic, name: "number" }}
	);
}

export class StringValueContainer {
	public get value(): string {
		return this._fields.value.value
	}
	public set value(value: string) {
		this._fields.value.value = value
	}

	public _fields: {
		value: $.VarRef<string>;
	}

	constructor(init?: Partial<{value?: string}>) {
		this._fields = {
			value: $.varRef(init?.value ?? "")
		}
	}

	public clone(): StringValueContainer {
		const cloned = new StringValueContainer()
		cloned._fields = {
			value: $.varRef(this._fields.value.value)
		}
		return cloned
	}

	public Compare(other: string): number {
		const s = this
		if (s.value < other) {
			return -1
		}
		 else if (s.value > other) {
			return 1
		}
		return 0
	}

	public Equal(other: string): boolean {
		const s = this
		return s.value == other
	}

	// Register this type with the runtime type system
	static __typeInfo = $.registerStructType(
	  'StringValueContainer',
	  new StringValueContainer(),
	  [{ name: "Compare", args: [{ name: "other", type: { kind: $.TypeKind.Basic, name: "string" } }], returns: [{ type: { kind: $.TypeKind.Basic, name: "number" } }] }, { name: "Equal", args: [{ name: "other", type: { kind: $.TypeKind.Basic, name: "string" } }], returns: [{ type: { kind: $.TypeKind.Basic, name: "boolean" } }] }],
	  StringValueContainer,
	  {"value": { kind: $.TypeKind.Basic, name: "string" }}
	);
}

// Function that works with generic interface
export function useContainer<T extends any>(c: Container<T>, val: T): T {
	c!.Set(val)
	return c!.Get()
}

// Function that works with comparable interface
export function checkEqual<T extends $.Comparable>(c: Comparable<T>, val: T): boolean {
	return c!.Equal(val)
}

export async function main(): Promise<void> {
	console.log("=== Generic Interface Test ===")

	// Test ValueContainer implementing Container
	let intValueContainer = new ValueContainer<number>({})
	let result = useContainer(intValueContainer, 42)
	console.log("Int ValueContainer result:", result)
	console.log("Int ValueContainer size:", intValueContainer!.Size())

	let stringValueContainer = new ValueContainer<string>({})
	let strResult = useContainer(stringValueContainer, "hello")
	console.log("String ValueContainer result:", strResult)
	console.log("String ValueContainer size:", stringValueContainer!.Size())

	// Test StringValueContainer implementing Comparable
	let sb = new StringValueContainer({value: "test"})
	console.log("String comparison equal:", checkEqual(sb, "test"))
	console.log("String comparison not equal:", checkEqual(sb, "other"))
	console.log("String comparison -1:", sb!.Compare("zebra"))
	console.log("String comparison 1:", sb!.Compare("alpha"))
	console.log("String comparison 0:", sb!.Compare("test"))
}


// Generated file based on undefined_type_error.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as $ from "@goscript/builtin/index.js";

export class formatter extends $.GoStruct<{wid: number; prec: number; widPresent: boolean; precPresent: boolean; minus: boolean; plus: boolean; sharp: boolean; space: boolean; zero: boolean; plusV: boolean; sharpV: boolean}> {

	constructor(init?: Partial<{minus?: boolean, plus?: boolean, plusV?: boolean, prec?: number, precPresent?: boolean, sharp?: boolean, sharpV?: boolean, space?: boolean, wid?: number, widPresent?: boolean, zero?: boolean}>) {
		super({
			wid: { type: Number, default: 0 },
			prec: { type: Number, default: 0 },
			widPresent: { type: Boolean, default: false },
			precPresent: { type: Boolean, default: false },
			minus: { type: Boolean, default: false },
			plus: { type: Boolean, default: false },
			sharp: { type: Boolean, default: false },
			space: { type: Boolean, default: false },
			zero: { type: Boolean, default: false },
			plusV: { type: Boolean, default: false },
			sharpV: { type: Boolean, default: false }
		}, init)
	}

	public clone(): this {
		return super.clone()
	}

	// Register this type with the runtime type system
	static __typeInfo = $.registerStructType(
	  'formatter',
	  new formatter(),
	  [],
	  formatter,
	  {"wid": { kind: $.TypeKind.Basic, name: "number" }, "prec": { kind: $.TypeKind.Basic, name: "number" }, "widPresent": { kind: $.TypeKind.Basic, name: "boolean" }, "precPresent": { kind: $.TypeKind.Basic, name: "boolean" }, "minus": { kind: $.TypeKind.Basic, name: "boolean" }, "plus": { kind: $.TypeKind.Basic, name: "boolean" }, "sharp": { kind: $.TypeKind.Basic, name: "boolean" }, "space": { kind: $.TypeKind.Basic, name: "boolean" }, "zero": { kind: $.TypeKind.Basic, name: "boolean" }, "plusV": { kind: $.TypeKind.Basic, name: "boolean" }, "sharpV": { kind: $.TypeKind.Basic, name: "boolean" }}
	);
}

export class printer extends $.GoStruct<{buf: $.Bytes; arg: null | any; fmt: formatter}> {

	constructor(init?: Partial<{arg?: null | any, buf?: $.Bytes, fmt?: formatter}>) {
		super({
			buf: { type: Object, default: new Uint8Array(0) },
			arg: { type: Object, default: null },
			fmt: { type: Object, default: new formatter() }
		}, init)
	}

	public clone(): this {
		return super.clone()
	}

	public init(): void {
		const p = this
		p.fmt = new formatter({})
	}

	public format(verb: number): void {
		const p = this
		if (p.fmt.minus) {
			console.log("minus flag set")
		}
		if (p.fmt.plus) {
			console.log("plus flag set")
		}
	}

	// Register this type with the runtime type system
	static __typeInfo = $.registerStructType(
	  'printer',
	  new printer(),
	  [{ name: "init", args: [], returns: [] }, { name: "format", args: [{ name: "verb", type: { kind: $.TypeKind.Basic, name: "number" } }], returns: [] }],
	  printer,
	  {"buf": { kind: $.TypeKind.Slice, elemType: { kind: $.TypeKind.Basic, name: "number" } }, "arg": { kind: $.TypeKind.Interface, methods: [] }, "fmt": "formatter"}
	);
}

export async function main(): Promise<void> {
	let p = new printer({})
	p.init()
	p.format(100)
	console.log("Formatter test completed")
}


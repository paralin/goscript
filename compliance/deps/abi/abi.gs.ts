import * as $ from "@goscript/builtin/builtin.js";

import * as goarch from "@goscript/internal/goarch/index.js"

import * as unsafe from "@goscript/unsafe/index.js"

export class RegArgs {
	// Values in these slots should be precisely the bit-by-bit
	// representation of how they would appear in a register.
	//
	// This means that on big endian arches, integer values should
	// be in the top bits of the slot. Floats are usually just
	// directly represented, but some architectures treat narrow
	// width floating point values specially (e.g. they're promoted
	// first, or they need to be NaN-boxed).
	// untyped integer registers
	public get Ints(): uintptr[] {
		return this._fields.Ints.value
	}
	public set Ints(value: uintptr[]) {
		this._fields.Ints.value = value
	}

	// untyped float registers
	public get Floats(): number[] {
		return this._fields.Floats.value
	}
	public set Floats(value: number[]) {
		this._fields.Floats.value = value
	}

	// Ptrs is a space that duplicates Ints but with pointer type,
	// used to make pointers passed or returned  in registers
	// visible to the GC by making the type unsafe.Pointer.
	public get Ptrs(): Pointer[] {
		return this._fields.Ptrs.value
	}
	public set Ptrs(value: Pointer[]) {
		this._fields.Ptrs.value = value
	}

	// ReturnIsPtr is a bitmap that indicates which registers
	// contain or will contain pointers on the return path from
	// a reflectcall. The i'th bit indicates whether the i'th
	// register contains or will contain a valid Go pointer.
	public get ReturnIsPtr(): IntArgRegBitmap {
		return this._fields.ReturnIsPtr.value
	}
	public set ReturnIsPtr(value: IntArgRegBitmap) {
		this._fields.ReturnIsPtr.value = value
	}

	public _fields: {
		Ints: $.VarRef<uintptr[]>;
		Floats: $.VarRef<number[]>;
		Ptrs: $.VarRef<Pointer[]>;
		ReturnIsPtr: $.VarRef<IntArgRegBitmap>;
	}

	constructor(init?: Partial<{Floats?: number[], Ints?: uintptr[], Ptrs?: Pointer[], ReturnIsPtr?: IntArgRegBitmap}>) {
		this._fields = {
			Ints: $.varRef(init?.Ints ?? []),
			Floats: $.varRef(init?.Floats ?? []),
			Ptrs: $.varRef(init?.Ptrs ?? []),
			ReturnIsPtr: $.varRef(init?.ReturnIsPtr ?? [])
		}
	}

	public clone(): RegArgs {
		const cloned = new RegArgs()
		cloned._fields = {
			Ints: $.varRef(this._fields.Ints.value),
			Floats: $.varRef(this._fields.Floats.value),
			Ptrs: $.varRef(this._fields.Ptrs.value),
			ReturnIsPtr: $.varRef(this._fields.ReturnIsPtr.value)
		}
		return cloned
	}

	public Dump(): void {
		const r = this
		print("Ints:")
		for (let _i = 0; _i < $.len(r!.Ints); _i++) {
			const x = r!.Ints![_i]
			{
				print(" ", x)
			}
		}
		console.log()
		print("Floats:")
		for (let _i = 0; _i < $.len(r!.Floats); _i++) {
			const x = r!.Floats![_i]
			{
				print(" ", x)
			}
		}
		console.log()
		print("Ptrs:")
		for (let _i = 0; _i < $.len(r!.Ptrs); _i++) {
			const x = r!.Ptrs![_i]
			{
				print(" ", x)
			}
		}
		console.log()
	}

	// IntRegArgAddr returns a pointer inside of r.Ints[reg] that is appropriately
	// offset for an argument of size argSize.
	//
	// argSize must be non-zero, fit in a register, and a power-of-two.
	//
	// This method is a helper for dealing with the endianness of different CPU
	// architectures, since sub-word-sized arguments in big endian architectures
	// need to be "aligned" to the upper edge of the register to be interpreted
	// by the CPU correctly.
	public IntRegArgAddr(reg: number, argSize: uintptr): Pointer {
		const r = this
		if (argSize > goarch.PtrSize || argSize == 0 || (argSize & (argSize - 1)) != 0) {
			$.panic("invalid argSize")
		}
		let offset = (0 as uintptr)
		if (goarch.BigEndian) {
			offset = goarch.PtrSize - argSize
		}
		return unsafe.Pointer((unsafe.Pointer(r!.Ints![reg]) as uintptr) + offset)
	}

	// Register this type with the runtime type system
	static __typeInfo = $.registerStructType(
	  'RegArgs',
	  new RegArgs(),
	  [{ name: "Dump", args: [], returns: [] }, { name: "IntRegArgAddr", args: [{ name: "reg", type: { kind: $.TypeKind.Basic, name: "number" } }, { name: "argSize", type: { kind: $.TypeKind.Basic, name: "uintptr" } }], returns: [{ type: { kind: $.TypeKind.Basic, name: "Pointer" } }] }],
	  RegArgs,
	  {"Ints": { kind: $.TypeKind.Array, length: 0, elemType: { kind: $.TypeKind.Basic, name: "uintptr" } }, "Floats": { kind: $.TypeKind.Array, length: 0, elemType: { kind: $.TypeKind.Basic, name: "number" } }, "Ptrs": { kind: $.TypeKind.Array, length: 0, elemType: { kind: $.TypeKind.Basic, name: "Pointer" } }, "ReturnIsPtr": "IntArgRegBitmap"}
	);
}

export type IntArgRegBitmap = number[];


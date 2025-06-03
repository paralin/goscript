// Generated file based on complex_imports.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as $ from "@goscript/builtin/index.js";

import * as context from "@goscript/context/index.js"

import * as os from "@goscript/os/index.js"

import * as time from "@goscript/time/index.js"

export class ComplexStruct {
	public get Ctx(): context.Context {
		return this._fields.Ctx.value
	}
	public set Ctx(value: context.Context) {
		this._fields.Ctx.value = value
	}

	public get Mode(): os.FileMode {
		return this._fields.Mode.value
	}
	public set Mode(value: os.FileMode) {
		this._fields.Mode.value = value
	}

	public get File(): os.File | null {
		return this._fields.File.value
	}
	public set File(value: os.File | null) {
		this._fields.File.value = value
	}

	public get Timer(): time.Timer | null {
		return this._fields.Timer.value
	}
	public set Timer(value: time.Timer | null) {
		this._fields.Timer.value = value
	}

	public get Created(): time.Time {
		return this._fields.Created.value
	}
	public set Created(value: time.Time) {
		this._fields.Created.value = value
	}

	public _fields: {
		Ctx: $.VarRef<context.Context>;
		Mode: $.VarRef<os.FileMode>;
		File: $.VarRef<os.File | null>;
		Timer: $.VarRef<time.Timer | null>;
		Created: $.VarRef<time.Time>;
	}

	constructor(init?: Partial<{Created?: time.Time, Ctx?: context.Context, File?: os.File | null, Mode?: os.FileMode, Timer?: time.Timer | null}>) {
		this._fields = {
			Ctx: $.varRef(init?.Ctx ?? // DEBUG: Field Ctx has type context.Context (*types.Named)
			// DEBUG: Package=context, TypeName=context.Context
			// DEBUG: Using named type zero value
			null),
			Mode: $.varRef(init?.Mode ?? // DEBUG: Field Mode has type os.FileMode (*types.Alias)
			// DEBUG: Using wrapper type zero value
			0 as os.FileMode),
			File: $.varRef(init?.File ?? // DEBUG: Field File has type *os.File (*types.Pointer)
			// DEBUG: Using default zero value
			null),
			Timer: $.varRef(init?.Timer ?? // DEBUG: Field Timer has type *time.Timer (*types.Pointer)
			// DEBUG: Using default zero value
			null),
			Created: $.varRef(init?.Created?.clone() ?? new time.Time())
		}
	}

	public clone(): ComplexStruct {
		const cloned = new ComplexStruct()
		cloned._fields = {
			Ctx: $.varRef(this._fields.Ctx.value),
			Mode: $.varRef(this._fields.Mode.value),
			File: $.varRef(this._fields.File.value),
			Timer: $.varRef(this._fields.Timer.value),
			Created: $.varRef(this._fields.Created.value?.clone() ?? null)
		}
		return cloned
	}

	// Register this type with the runtime type system
	static __typeInfo = $.registerStructType(
	  'ComplexStruct',
	  new ComplexStruct(),
	  [],
	  ComplexStruct,
	  {"Ctx": "Context", "Mode": { kind: $.TypeKind.Basic, name: "number" }, "File": { kind: $.TypeKind.Pointer, elemType: "File" }, "Timer": { kind: $.TypeKind.Pointer, elemType: "Timer" }, "Created": "Time"}
	);
}

export class NestedStruct {
	public get Complex(): ComplexStruct {
		return this._fields.Complex.value
	}
	public set Complex(value: ComplexStruct) {
		this._fields.Complex.value = value
	}

	public get Times(): $.Slice<time.Time> {
		return this._fields.Times.value
	}
	public set Times(value: $.Slice<time.Time>) {
		this._fields.Times.value = value
	}

	public get Files(): $.Slice<os.File | null> {
		return this._fields.Files.value
	}
	public set Files(value: $.Slice<os.File | null>) {
		this._fields.Files.value = value
	}

	public _fields: {
		Complex: $.VarRef<ComplexStruct>;
		Times: $.VarRef<$.Slice<time.Time>>;
		Files: $.VarRef<$.Slice<os.File | null>>;
	}

	constructor(init?: Partial<{Complex?: ComplexStruct, Files?: $.Slice<os.File | null>, Times?: $.Slice<time.Time>}>) {
		this._fields = {
			Complex: $.varRef(init?.Complex?.clone() ?? new ComplexStruct()),
			Times: $.varRef(init?.Times ?? // DEBUG: Field Times has type []time.Time (*types.Slice)
			// DEBUG: Using default zero value
			null),
			Files: $.varRef(init?.Files ?? // DEBUG: Field Files has type []*os.File (*types.Slice)
			// DEBUG: Using default zero value
			null)
		}
	}

	public clone(): NestedStruct {
		const cloned = new NestedStruct()
		cloned._fields = {
			Complex: $.varRef(this._fields.Complex.value?.clone() ?? null),
			Times: $.varRef(this._fields.Times.value),
			Files: $.varRef(this._fields.Files.value)
		}
		return cloned
	}

	// Register this type with the runtime type system
	static __typeInfo = $.registerStructType(
	  'NestedStruct',
	  new NestedStruct(),
	  [],
	  NestedStruct,
	  {"Complex": "ComplexStruct", "Times": { kind: $.TypeKind.Slice, elemType: "Time" }, "Files": { kind: $.TypeKind.Slice, elemType: { kind: $.TypeKind.Pointer, elemType: "File" } }}
	);
}

export async function main(): Promise<void> {
	// Create complex structures
	let complex = new ComplexStruct({Created: time.Now(), Ctx: context.Background(), File: null, Mode: 0o755, Timer: null})

	let nested = new NestedStruct({Complex: complex, Files: $.arrayToSlice<os.File | null>([null]), Times: $.arrayToSlice<time.Time>([time.Now()])})

	console.log("Complex mode:", $.int(complex.Mode))
	console.log("Nested has complex:", nested.Complex.Mode != 0)
	console.log("Times length:", $.len(nested.Times))
	console.log("Files length:", $.len(nested.Files))
}


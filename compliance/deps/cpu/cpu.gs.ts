import * as $ from "@goscript/builtin/builtin.js";
import { doinit } from "./cpu_wasm.gs.js";

// for linkname
import * as _ from "@goscript/unsafe/index.js"

export let DebugOptions: boolean = false

export class CacheLinePad {
	public get _(): number[] {
		return this._fields._.value
	}
	public set _(value: number[]) {
		this._fields._.value = value
	}

	public _fields: {
		_: $.VarRef<number[]>;
	}

	constructor(init?: Partial<{_?: number[]}>) {
		this._fields = {
			_: $.varRef(init?._ ?? [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0])
		}
	}

	public clone(): CacheLinePad {
		const cloned = new CacheLinePad()
		cloned._fields = {
			_: $.varRef(this._fields._.value)
		}
		return cloned
	}

	// Register this type with the runtime type system
	static __typeInfo = $.registerStructType(
	  'CacheLinePad',
	  new CacheLinePad(),
	  [],
	  CacheLinePad,
	  {"_": { kind: $.TypeKind.Array, length: 64, elemType: { kind: $.TypeKind.Basic, name: "number" } }}
	);
}

export let CacheLineSize: uintptr = 64

export let X86: { _?: CacheLinePad; HasAES?: boolean; HasADX?: boolean; HasAVX?: boolean; HasAVX2?: boolean; HasAVX512F?: boolean; HasAVX512BW?: boolean; HasAVX512VL?: boolean; HasBMI1?: boolean; HasBMI2?: boolean; HasERMS?: boolean; HasFSRM?: boolean; HasFMA?: boolean; HasOSXSAVE?: boolean; HasPCLMULQDQ?: boolean; HasPOPCNT?: boolean; HasRDTSCP?: boolean; HasSHA?: boolean; HasSSE3?: boolean; HasSSSE3?: boolean; HasSSE41?: boolean; HasSSE42?: boolean; _?: CacheLinePad } = {}

export let ARM: { _?: CacheLinePad; HasVFPv4?: boolean; HasIDIVA?: boolean; HasV7Atomics?: boolean; _?: CacheLinePad } = {}

export let ARM64: { _?: CacheLinePad; HasAES?: boolean; HasPMULL?: boolean; HasSHA1?: boolean; HasSHA2?: boolean; HasSHA512?: boolean; HasCRC32?: boolean; HasATOMICS?: boolean; HasCPUID?: boolean; HasDIT?: boolean; IsNeoverse?: boolean; _?: CacheLinePad } = {}

export let Loong64: { _?: CacheLinePad; HasLSX?: boolean; HasCRC32?: boolean; HasLAMCAS?: boolean; HasLAM_BH?: boolean; _?: CacheLinePad } = {}

export let MIPS64X: { _?: CacheLinePad; HasMSA?: boolean; _?: CacheLinePad } = {}

export let PPC64: { _?: CacheLinePad; HasDARN?: boolean; HasSCV?: boolean; IsPOWER8?: boolean; IsPOWER9?: boolean; IsPOWER10?: boolean; _?: CacheLinePad } = {}

export let S390X: { _?: CacheLinePad; HasZARCH?: boolean; HasSTFLE?: boolean; HasLDISP?: boolean; HasEIMM?: boolean; HasDFP?: boolean; HasETF3EH?: boolean; HasMSA?: boolean; HasAES?: boolean; HasAESCBC?: boolean; HasAESCTR?: boolean; HasAESGCM?: boolean; HasGHASH?: boolean; HasSHA1?: boolean; HasSHA256?: boolean; HasSHA512?: boolean; HasSHA3?: boolean; HasVX?: boolean; HasVXE?: boolean; HasKDSA?: boolean; HasECDSA?: boolean; HasEDDSA?: boolean; _?: CacheLinePad } = {}

// Initialize examines the processor and sets the relevant variables above.
// This is called by the runtime package early in program initialization,
// before normal init functions are run. env is set by runtime if the OS supports
// cpu feature options in GODEBUG.
export function Initialize(env: string): void {
	doinit()
	processOptions(env)
}

let options: $.Slice<option> = null

class option {
	public get Name(): string {
		return this._fields.Name.value
	}
	public set Name(value: string) {
		this._fields.Name.value = value
	}

	public get Feature(): $.VarRef<boolean> | null {
		return this._fields.Feature.value
	}
	public set Feature(value: $.VarRef<boolean> | null) {
		this._fields.Feature.value = value
	}

	// whether feature value was specified in GODEBUG
	public get Specified(): boolean {
		return this._fields.Specified.value
	}
	public set Specified(value: boolean) {
		this._fields.Specified.value = value
	}

	// whether feature should be enabled
	public get Enable(): boolean {
		return this._fields.Enable.value
	}
	public set Enable(value: boolean) {
		this._fields.Enable.value = value
	}

	public _fields: {
		Name: $.VarRef<string>;
		Feature: $.VarRef<$.VarRef<boolean> | null>;
		Specified: $.VarRef<boolean>;
		Enable: $.VarRef<boolean>;
	}

	constructor(init?: Partial<{Enable?: boolean, Feature?: $.VarRef<boolean> | null, Name?: string, Specified?: boolean}>) {
		this._fields = {
			Name: $.varRef(init?.Name ?? ""),
			Feature: $.varRef(init?.Feature ?? null),
			Specified: $.varRef(init?.Specified ?? false),
			Enable: $.varRef(init?.Enable ?? false)
		}
	}

	public clone(): option {
		const cloned = new option()
		cloned._fields = {
			Name: $.varRef(this._fields.Name.value),
			Feature: $.varRef(this._fields.Feature.value),
			Specified: $.varRef(this._fields.Specified.value),
			Enable: $.varRef(this._fields.Enable.value)
		}
		return cloned
	}

	// Register this type with the runtime type system
	static __typeInfo = $.registerStructType(
	  'option',
	  new option(),
	  [],
	  option,
	  {"Name": { kind: $.TypeKind.Basic, name: "string" }, "Feature": { kind: $.TypeKind.Pointer, elemType: { kind: $.TypeKind.Basic, name: "boolean" } }, "Specified": { kind: $.TypeKind.Basic, name: "boolean" }, "Enable": { kind: $.TypeKind.Basic, name: "boolean" }}
	);
}

// processOptions enables or disables CPU feature values based on the parsed env string.
// The env string is expected to be of the form cpu.feature1=value1,cpu.feature2=value2...
// where feature names is one of the architecture specific list stored in the
// cpu packages options variable and values are either 'on' or 'off'.
// If env contains cpu.all=off then all cpu features referenced through the options
// variable are disabled. Other feature names and values result in warning messages.
export function processOptions(env: string): void {

	// e.g. "SSE2", "on"
	field: for (; env != ""; ) {
		let field = ""
		let i = indexByte(env, 44)
		if (i < 0) {
			[field, env] = [env, ""]
		} else {
			[field, env] = [$.sliceString(env, undefined, i), $.sliceString(env, i + 1, undefined)]
		}
		if ($.len(field) < 4 || $.sliceString(field, undefined, 4) != "cpu.") {
			continue
		}
		i = indexByte(field, 61)
		if (i < 0) {
			print("GODEBUG: no value specified for \"", field, "\"\n")
			continue
		}
		let [key, value] = [$.sliceString(field, 4, i), $.sliceString(field, i + 1, undefined)] // e.g. "SSE2", "on"

		let enable: boolean = false
		switch (value) {
			case "on":
				enable = true
				break
			case "off":
				enable = false
				break
			default:
				print("GODEBUG: value \"", value, "\" not supported for cpu option \"", key, "\"\n")
				continue
				break
		}

		if (key == "all") {
			for (let i = 0; i < $.len(options); i++) {
				{
					options![i].Specified = true
					options![i].Enable = enable
				}
			}
			continue
		}

		for (let i = 0; i < $.len(options); i++) {
			{
				if (options![i].Name == key) {
					options![i].Specified = true
					options![i].Enable = enable
					continue
				}
			}
		}

		print("GODEBUG: unknown cpu feature \"", key, "\"\n")
	}

	for (let _i = 0; _i < $.len(options); _i++) {
		const o = options![_i]
		{
			if (!o.Specified) {
				continue
			}

			if (o.Enable && !o.Feature!.value) {
				print("GODEBUG: can not enable \"", o.Name, "\", missing CPU support\n")
				continue
			}

			o.Feature!.value = o.Enable
		}
	}
}

// indexByte returns the index of the first instance of c in s,
// or -1 if c is not present in s.
// indexByte is semantically the same as [strings.IndexByte].
// We copy this function because "internal/cpu" should not have external dependencies.
export function indexByte(s: string, c: number): number {
	for (let i = 0; i < $.len(s); i++) {
		if ($.indexString(s, i) == c) {
			return i
		}
	}
	return -1
}


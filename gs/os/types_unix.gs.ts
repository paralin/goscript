import * as $ from "@goscript/builtin/builtin.js";

import * as fs from "@goscript/io/fs/index.js"

import * as syscall from "@goscript/syscall/index.js"

import * as time from "@goscript/time/index.js"

class fileStat {
	public get name(): string {
		return this._fields.name.value
	}
	public set name(value: string) {
		this._fields.name.value = value
	}

	public get size(): number {
		return this._fields.size.value
	}
	public set size(value: number) {
		this._fields.size.value = value
	}

	public get mode(): fs.FileMode {
		return this._fields.mode.value
	}
	public set mode(value: fs.FileMode) {
		this._fields.mode.value = value
	}

	public get modTime(): time.Time {
		return this._fields.modTime.value
	}
	public set modTime(value: time.Time) {
		this._fields.modTime.value = value
	}

	public get sys(): syscall.Stat_t {
		return this._fields.sys.value
	}
	public set sys(value: syscall.Stat_t) {
		this._fields.sys.value = value
	}

	public _fields: {
		name: $.VarRef<string>;
		size: $.VarRef<number>;
		mode: $.VarRef<fs.FileMode>;
		modTime: $.VarRef<time.Time>;
		sys: $.VarRef<syscall.Stat_t>;
	}

	constructor(init?: Partial<{modTime?: time.Time, mode?: fs.FileMode, name?: string, size?: number, sys?: syscall.Stat_t}>) {
		this._fields = {
			name: $.varRef(init?.name ?? ""),
			size: $.varRef(init?.size ?? 0),
			mode: $.varRef(init?.mode ?? 0),
			modTime: $.varRef(init?.modTime?.clone() ?? time.Now()),
			sys: $.varRef(init?.sys?.clone() ?? new syscall.Stat_t())
		}
	}

	public clone(): fileStat {
		const cloned = new fileStat()
		cloned._fields = {
			name: $.varRef(this._fields.name.value),
			size: $.varRef(this._fields.size.value),
			mode: $.varRef(this._fields.mode.value),
			modTime: $.varRef(this._fields.modTime.value?.clone() ?? null),
			sys: $.varRef(this._fields.sys.value?.clone() ?? null)
		}
		return cloned
	}

	public Name(): string {
		const fs = this
		return fs!.name
	}

	public IsDir(): boolean {
		const fileStat = this
		return (fileStat!.Mode() & fs.ModeDir) !== 0
	}

	public Size(): number {
		const fs = this
		return fs!.size
	}

	public Mode(): fs.FileMode {
		const fileStat = this
		return fileStat!.mode
	}

	public ModTime(): time.Time {
		const fs = this
		return fs!.modTime
	}

	public Sys(): null | any {
		const fs = this
		return fs!.sys
	}

	// Register this type with the runtime type system
	static __typeInfo = $.registerStructType(
	  'fileStat',
	  new fileStat(),
	  [{ name: "Name", args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: "string" } }] }, { name: "IsDir", args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: "boolean" } }] }, { name: "Size", args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: "number" } }] }, { name: "Mode", args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: "number" } }] }, { name: "ModTime", args: [], returns: [{ type: "Time" }] }, { name: "Sys", args: [], returns: [{ type: { kind: $.TypeKind.Interface, methods: [] } }] }],
	  fileStat,
	  {"name": { kind: $.TypeKind.Basic, name: "string" }, "size": { kind: $.TypeKind.Basic, name: "number" }, "mode": { kind: $.TypeKind.Basic, name: "number" }, "modTime": "Time", "sys": "Stat_t"}
	);
}

export function sameFile(fs1: fileStat | null, fs2: fileStat | null): boolean {
	return fs1!.sys.Dev == fs2!.sys.Dev && fs1!.sys.Ino == fs2!.sys.Ino
}


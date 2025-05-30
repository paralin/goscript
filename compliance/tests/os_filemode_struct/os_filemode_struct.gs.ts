// Generated file based on os_filemode_struct.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as $ from "@goscript/builtin/index.js";

import * as os from "@goscript/os/index.js"

export class file {
	public get mode(): os.FileMode {
		return this._fields.mode.value
	}
	public set mode(value: os.FileMode) {
		this._fields.mode.value = value
	}

	public get name(): string {
		return this._fields.name.value
	}
	public set name(value: string) {
		this._fields.name.value = value
	}

	public _fields: {
		mode: $.VarRef<os.FileMode>;
		name: $.VarRef<string>;
	}

	constructor(init?: Partial<{mode?: os.FileMode, name?: string}>) {
		this._fields = {
			mode: $.varRef(init?.mode ?? new os.FileMode(0)),
			name: $.varRef(init?.name ?? "")
		}
	}

	public clone(): file {
		const cloned = new file()
		cloned._fields = {
			mode: $.varRef(this._fields.mode.value),
			name: $.varRef(this._fields.name.value)
		}
		return cloned
	}

	// Register this type with the runtime type system
	static __typeInfo = $.registerStructType(
	  'file',
	  new file(),
	  [],
	  file,
	  {"mode": { kind: $.TypeKind.Basic, name: "number" }, "name": { kind: $.TypeKind.Basic, name: "string" }}
	);
}

export async function main(): Promise<void> {
	let f = new file({mode: os.FileMode(0o644), name: "test.txt"})

	console.log("File mode:", $.int(f.mode))
	console.log("File name:", f.name)

	// Test type assertion
	let mode: os.FileMode = os.FileMode(0o755)
	console.log("Mode type:", $.int(mode))
}


// Generated file based on named_type_wrapper.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as $ from "@goscript/builtin/index.js";

export class MyFileMode {
	constructor(private _value: number) {}

	valueOf(): number {
		return this._value
	}

	toString(): string {
		return String(this._value)
	}

	static from(value: number): MyFileMode {
		return new MyFileMode(value)
	}

	// Add a method to trigger wrapper class generation
	public String(): string {
		return "mode"
	}
}

export class FileStatus {
	public get mode(): MyFileMode {
		return this._fields.mode.value
	}
	public set mode(value: MyFileMode) {
		this._fields.mode.value = value
	}

	public get size(): number {
		return this._fields.size.value
	}
	public set size(value: number) {
		this._fields.size.value = value
	}

	public _fields: {
		mode: $.VarRef<MyFileMode>;
		size: $.VarRef<number>;
	}

	constructor(init?: Partial<{mode?: MyFileMode, size?: number}>) {
		this._fields = {
			mode: $.varRef(init?.mode ?? new MyFileMode(0)),
			size: $.varRef(init?.size ?? 0)
		}
	}

	public clone(): FileStatus {
		const cloned = new FileStatus()
		cloned._fields = {
			mode: $.varRef(this._fields.mode.value),
			size: $.varRef(this._fields.size.value)
		}
		return cloned
	}

	// Register this type with the runtime type system
	static __typeInfo = $.registerStructType(
	  'FileStatus',
	  new FileStatus(),
	  [],
	  FileStatus,
	  {"mode": "MyFileMode", "size": { kind: $.TypeKind.Basic, name: "number" }}
	);
}

export async function main(): Promise<void> {
	// Test using the named type directly
	let mode: MyFileMode = new MyFileMode(0o644)
	console.log("Mode value:", mode.valueOf())
	console.log("Mode string:", mode.String())

	// Test using in struct
	let status = new FileStatus({mode: new MyFileMode(0o755), size: 1024})

	console.log("Status mode:", status.mode.valueOf())
	console.log("Status size:", status.size)

	// Test type assertion and conversion
	let genericMode: MyFileMode = new MyFileMode(0o777)
	console.log("Generic mode:", genericMode.valueOf())
}


// Generated file based on named_type_wrapper.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as $ from "@goscript/builtin/index.js";

export type MyFileMode = number;

export function MyFileMode_String(m: MyFileMode): string {
	return "mode"
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
			mode: $.varRef(init?.mode ?? // DEBUG: Field mode has type github.com/aperturerobotics/goscript/compliance/tests/named_type_wrapper.MyFileMode (*types.Named)
			// DEBUG: Package=github.com/aperturerobotics/goscript/compliance/tests/named_type_wrapper, TypeName=github.com/aperturerobotics/goscript/compliance/tests/named_type_wrapper.MyFileMode
			// DEBUG: Using wrapper type zero value
			0 as MyFileMode),
			size: $.varRef(init?.size ?? // DEBUG: Field size has type int64 (*types.Basic)
			// DEBUG: Using default zero value
			0)
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
	let mode: MyFileMode = 0o644
	console.log("Mode value:", mode)
	console.log("Mode string:", MyFileMode_String(mode))

	// Test using in struct
	let status = new FileStatus({mode: (0o755 as MyFileMode), size: 1024})

	console.log("Status mode:", status.mode)
	console.log("Status size:", status.size)

	// Test type assertion and conversion
	let genericMode: MyFileMode = (0o777 as MyFileMode)
	console.log("Generic mode:", genericMode)
}


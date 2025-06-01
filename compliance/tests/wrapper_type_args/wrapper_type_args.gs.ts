// Generated file based on wrapper_type_args.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as $ from "@goscript/builtin/index.js";

import * as fmt from "@goscript/fmt/index.js"

import * as os from "@goscript/os/index.js"

export type MyMode = os.FileMode;

export function MyMode_IsExecutable(m: MyMode): boolean {
	return ((m & 0o111)) != 0
}

export function MyMode_String(m: MyMode): string {
	return fmt.Sprintf("%o", m)
}


export type DirInterface = null | {
	MkdirAll(path: string, perm: os.FileMode): $.GoError
}

$.registerInterfaceType(
  'DirInterface',
  null, // Zero value for interface is null
  [{ name: "MkdirAll", args: [{ name: "path", type: { kind: $.TypeKind.Basic, name: "string" } }, { name: "perm", type: { kind: $.TypeKind.Basic, name: "number" } }], returns: [{ type: { kind: $.TypeKind.Interface, name: 'GoError', methods: [{ name: 'Error', args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: 'string' } }] }] } }] }]
);

export class MyDir {
	public _fields: {
	}

	constructor(init?: Partial<{}>) {
		this._fields = {}
	}

	public clone(): MyDir {
		const cloned = new MyDir()
		cloned._fields = {
		}
		return cloned
	}

	public MkdirAll(path: string, perm: os.FileMode): $.GoError {
		fmt.Printf("MkdirAll called with path=%s, perm=%s\n", path, os.FileMode_String(perm))
		return null
	}

	// Register this type with the runtime type system
	static __typeInfo = $.registerStructType(
	  'MyDir',
	  new MyDir(),
	  [{ name: "MkdirAll", args: [{ name: "path", type: { kind: $.TypeKind.Basic, name: "string" } }, { name: "perm", type: { kind: $.TypeKind.Basic, name: "number" } }], returns: [{ type: { kind: $.TypeKind.Interface, name: 'GoError', methods: [{ name: 'Error', args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: 'string' } }] }] } }] }],
	  MyDir,
	  {}
	);
}

// Function that takes wrapper type directly
export function TestFileMode(mode: os.FileMode): void {
	fmt.Printf("TestFileMode called with mode=%s\n", os.FileMode_String(mode))
}

// Function that takes custom wrapper type
export function TestMyMode(mode: MyMode): void {
	fmt.Printf("TestMyMode called with mode=%s, executable=%t\n", MyMode_String(mode), MyMode_IsExecutable(mode))
}

export async function main(): Promise<void> {
	// Test passing literals to functions expecting wrapper types
	TestFileMode(0o644) // Should become: TestFileMode(new os.FileMode(0o644))
	TestFileMode(0o755) // Should become: TestFileMode(new os.FileMode(0o755))

	TestMyMode(0o755) // Should become: TestMyMode(new MyMode(0o755))
	TestMyMode(0o600) // Should become: TestMyMode(new MyMode(0o600))

	// Test interface method calls
	let dir: DirInterface = new MyDir({})
	dir!.MkdirAll("/tmp/test", 0o700) // Should become: dir.MkdirAll("/tmp/test", new os.FileMode(0o700))

	// Test with existing FileMode values (should not be wrapped again)
	let existingMode = (0o644 as os.FileMode)
	TestFileMode(existingMode) // Should stay as-is

	// Test arithmetic operations (should use valueOf)
	let combined = ((0o755 as os.FileMode) | 0o022) // Should become: os.FileMode(0o755).valueOf() | 0o022
	TestFileMode(combined)

	fmt.Println("Test completed")
}


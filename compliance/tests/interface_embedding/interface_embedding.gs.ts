// Generated file based on interface_embedding.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as $ from "@goscript/builtin/index.js";

import * as io from "@goscript/io/index.js"

import * as subpkg from "@goscript/github.com/aperturerobotics/goscript/compliance/tests/interface_embedding/subpkg/index.js"

export type File = null | {
	// Lock locks the file like e.g. flock. It protects against access from
	// other processes.
	Lock(): $.GoError
	// Name returns the name of the file as presented to Open.
	Name(): string
	// Truncate the file.
	Truncate(size: number): $.GoError
	// Unlock unlocks the file.
	Unlock(): $.GoError
} & io.Writer & io.Reader & io.ReaderAt & io.Seeker & io.Closer

$.registerInterfaceType(
  'File',
  null, // Zero value for interface is null
  [{ name: "Lock", args: [], returns: [{ type: { kind: $.TypeKind.Interface, name: 'GoError', methods: [{ name: 'Error', args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: 'string' } }] }] } }] }, { name: "Name", args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: "string" } }] }, { name: "Truncate", args: [{ name: "size", type: { kind: $.TypeKind.Basic, name: "number" } }], returns: [{ type: { kind: $.TypeKind.Interface, name: 'GoError', methods: [{ name: 'Error', args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: 'string' } }] }] } }] }, { name: "Unlock", args: [], returns: [{ type: { kind: $.TypeKind.Interface, name: 'GoError', methods: [{ name: 'Error', args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: 'string' } }] }] } }] }]
);

export class MockFile extends $.GoStruct<{filename: string; content: $.Bytes; position: number}> {

	constructor(init?: Partial<{content?: $.Bytes, filename?: string, position?: number}>) {
		super({
			filename: { type: String, default: "" },
			content: { type: Object, default: new Uint8Array(0) },
			position: { type: Number, default: 0 }
		}, init)
	}

	public clone(): this {
		return super.clone()
	}

	public Name(): string {
		const m = this
		return m.filename
	}

	public Write(p: $.Bytes): [number, $.GoError] {
		const m = this
		m.content = $.append(m.content, p)
		return [$.len(p), null]
	}

	public Read(p: $.Bytes): [number, $.GoError] {
		const m = this
		let remaining = $.len(m.content) - $.int(m.position)
		if (remaining <= 0) {
			return [0, io.EOF]
		}
		let n = $.copy(p, $.goSlice(m.content, m.position, undefined))
		m.position += (n as number)
		return [n, null]
	}

	public ReadAt(p: $.Bytes, off: number): [number, $.GoError] {
		const m = this
		if (off >= ($.len(m.content) as number)) {
			return [0, io.EOF]
		}
		let n = $.copy(p, $.goSlice(m.content, off, undefined))
		return [n, null]
	}

	public Seek(offset: number, whence: number): [number, $.GoError] {
		const m = this
		switch (whence) {
			case 0:
				m.position = offset
				break
			case 1:
				m.position += offset
				break
			case 2:
				m.position = ($.len(m.content) as number) + offset
				break
		}
		return [m.position, null]
	}

	public Close(): $.GoError {
		return null
	}

	public Lock(): $.GoError {
		return null
	}

	public Unlock(): $.GoError {
		return null
	}

	public Truncate(size: number): $.GoError {
		const m = this
		if (size < ($.len(m.content) as number)) {
			m.content = $.goSlice(m.content, undefined, size)
		}
		return null
	}

	// Register this type with the runtime type system
	static __typeInfo = $.registerStructType(
	  'MockFile',
	  new MockFile(),
	  [{ name: "Name", args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: "string" } }] }, { name: "Write", args: [{ name: "p", type: { kind: $.TypeKind.Slice, elemType: { kind: $.TypeKind.Basic, name: "number" } } }], returns: [{ type: { kind: $.TypeKind.Basic, name: "number" } }, { type: { kind: $.TypeKind.Interface, name: 'GoError', methods: [{ name: 'Error', args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: 'string' } }] }] } }] }, { name: "Read", args: [{ name: "p", type: { kind: $.TypeKind.Slice, elemType: { kind: $.TypeKind.Basic, name: "number" } } }], returns: [{ type: { kind: $.TypeKind.Basic, name: "number" } }, { type: { kind: $.TypeKind.Interface, name: 'GoError', methods: [{ name: 'Error', args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: 'string' } }] }] } }] }, { name: "ReadAt", args: [{ name: "p", type: { kind: $.TypeKind.Slice, elemType: { kind: $.TypeKind.Basic, name: "number" } } }, { name: "off", type: { kind: $.TypeKind.Basic, name: "number" } }], returns: [{ type: { kind: $.TypeKind.Basic, name: "number" } }, { type: { kind: $.TypeKind.Interface, name: 'GoError', methods: [{ name: 'Error', args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: 'string' } }] }] } }] }, { name: "Seek", args: [{ name: "offset", type: { kind: $.TypeKind.Basic, name: "number" } }, { name: "whence", type: { kind: $.TypeKind.Basic, name: "number" } }], returns: [{ type: { kind: $.TypeKind.Basic, name: "number" } }, { type: { kind: $.TypeKind.Interface, name: 'GoError', methods: [{ name: 'Error', args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: 'string' } }] }] } }] }, { name: "Close", args: [], returns: [{ type: { kind: $.TypeKind.Interface, name: 'GoError', methods: [{ name: 'Error', args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: 'string' } }] }] } }] }, { name: "Lock", args: [], returns: [{ type: { kind: $.TypeKind.Interface, name: 'GoError', methods: [{ name: 'Error', args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: 'string' } }] }] } }] }, { name: "Unlock", args: [], returns: [{ type: { kind: $.TypeKind.Interface, name: 'GoError', methods: [{ name: 'Error', args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: 'string' } }] }] } }] }, { name: "Truncate", args: [{ name: "size", type: { kind: $.TypeKind.Basic, name: "number" } }], returns: [{ type: { kind: $.TypeKind.Interface, name: 'GoError', methods: [{ name: 'Error', args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: 'string' } }] }] } }] }],
	  MockFile,
	  {"filename": { kind: $.TypeKind.Basic, name: "string" }, "content": { kind: $.TypeKind.Slice, elemType: { kind: $.TypeKind.Basic, name: "number" } }, "position": { kind: $.TypeKind.Basic, name: "number" }}
	);
}

export class file extends $.GoStruct<{File: File; name: string}> {

	constructor(init?: Partial<{File?: File, name?: string}>) {
		super({
			File: { type: Object, default: null, isEmbedded: true },
			name: { type: String, default: "" }
		}, init)
	}

	public clone(): this {
		return super.clone()
	}

	public Name(): string {
		const f = this
		return f!.name
	}

	// Register this type with the runtime type system
	static __typeInfo = $.registerStructType(
	  'file',
	  new file(),
	  [{ name: "Name", args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: "string" } }] }],
	  file,
	  {"File": "File", "name": { kind: $.TypeKind.Basic, name: "string" }}
	);
}

export class qualifiedFile extends $.GoStruct<{File: subpkg.File; metadata: string}> {

	constructor(init?: Partial<{File?: subpkg.File, metadata?: string}>) {
		super({
			File: { type: Object, default: null, isEmbedded: true },
			metadata: { type: String, default: "" }
		}, init)
	}

	public clone(): this {
		return super.clone()
	}

	// Register this type with the runtime type system
	static __typeInfo = $.registerStructType(
	  'qualifiedFile',
	  new qualifiedFile(),
	  [],
	  qualifiedFile,
	  {"File": "File", "metadata": { kind: $.TypeKind.Basic, name: "string" }}
	);
}

export async function main(): Promise<void> {
	// Create a mock file implementation
	let mockFile = new MockFile({content: $.stringToBytes("Hello, World!"), filename: "test.txt", position: 0})

	// Create our embedded file struct
	let f = new file({name: "custom_name.txt", File: mockFile})

	// Test accessing the custom Name() method
	console.log("Custom name:", f!.Name())

	// Test accessing embedded interface methods - these should have null assertions
	console.log("File name:", f!.File!.Name())

	// Test other embedded methods
	let err = f!.Lock()
	if (err != null) {
		console.log("Lock error:", err!.Error())
	} else {
		console.log("Lock successful")
	}

	err = f!.Unlock()
	if (err != null) {
		console.log("Unlock error:", err!.Error())
	} else {
		console.log("Unlock successful")
	}

	// Test Write
	let data = $.stringToBytes("test data")
	let n: number
	[n, err] = f!.Write(data)
	if (err != null) {
		console.log("Write error:", err!.Error())
	} else {
		console.log("Wrote bytes:", n)
	}

	// Test Read
	let buf = new Uint8Array(5)
	;[n, err] = f!.Read(buf)
	if (err != null) {
		console.log("Read error:", err!.Error())
	} else {
		console.log("Read bytes:", n)
	}

	// Test ReadAt
	let buf2 = new Uint8Array(5)
	;[n, err] = f!.ReadAt(buf2, 0)
	if (err != null) {
		console.log("ReadAt error:", err!.Error())
	} else {
		console.log("ReadAt bytes:", n)
	}

	// Test Seek
	let pos: number
	[pos, err] = f!.Seek(0, 0)
	if (err != null) {
		console.log("Seek error:", err!.Error())
	} else {
		console.log("Seek position:", pos)
	}

	// Test Truncate
	err = f!.Truncate(5)
	if (err != null) {
		console.log("Truncate error:", err!.Error())
	} else {
		console.log("Truncate successful")
	}

	// Test Close
	err = f!.Close()
	if (err != null) {
		console.log("Close error:", err!.Error())
	} else {
		console.log("Close successful")
	}

	// Test the qualified interface embedding
	let qualifiedMock = subpkg.NewMockFile("qualified.txt")
	let qf = new qualifiedFile({metadata: "test metadata", File: qualifiedMock})

	console.log("Qualified file name:", qf!.Name())

	err = qf!.Close()
	if (err != null) {
		console.log("Qualified close error:", err!.Error())
	} else {
		console.log("Qualified close successful")
	}

	// Test qualified write
	let qn: number
	[qn, err] = qf!.Write($.stringToBytes("qualified data"))
	if (err != null) {
		console.log("Qualified write error:", err!.Error())
	} else {
		console.log("Qualified wrote bytes:", qn)
	}
}


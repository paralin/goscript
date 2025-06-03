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

export class MockFile {
	public get filename(): string {
		return this._fields.filename.value
	}
	public set filename(value: string) {
		this._fields.filename.value = value
	}

	public get content(): $.Bytes {
		return this._fields.content.value
	}
	public set content(value: $.Bytes) {
		this._fields.content.value = value
	}

	public get position(): number {
		return this._fields.position.value
	}
	public set position(value: number) {
		this._fields.position.value = value
	}

	public _fields: {
		filename: $.VarRef<string>;
		content: $.VarRef<$.Bytes>;
		position: $.VarRef<number>;
	}

	constructor(init?: Partial<{content?: $.Bytes, filename?: string, position?: number}>) {
		this._fields = {
			filename: $.varRef(init?.filename ?? ""),
			content: $.varRef(init?.content ?? new Uint8Array(0)),
			position: $.varRef(init?.position ?? 0)
		}
	}

	public clone(): MockFile {
		const cloned = new MockFile()
		cloned._fields = {
			filename: $.varRef(this._fields.filename.value),
			content: $.varRef(this._fields.content.value),
			position: $.varRef(this._fields.position.value)
		}
		return cloned
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

export class file {
	public get name(): string {
		return this._fields.name.value
	}
	public set name(value: string) {
		this._fields.name.value = value
	}

	public get File(): File {
		return this._fields.File.value
	}
	public set File(value: File) {
		this._fields.File.value = value
	}

	public _fields: {
		File: $.VarRef<File>;
		name: $.VarRef<string>;
	}

	constructor(init?: Partial<{File?: File, name?: string}>) {
		this._fields = {
			File: $.varRef(init?.File ?? null),
			name: $.varRef(init?.name ?? "")
		}
	}

	public clone(): file {
		const cloned = new file()
		cloned._fields = {
			File: $.varRef(this._fields.File.value),
			name: $.varRef(this._fields.name.value)
		}
		return cloned
	}

	public Name(): string {
		const f = this
		return f!.name
	}

	public Close(): $.GoError {
		return this.File!.Close()
	}

	public Lock(): $.GoError {
		return this.File!.Lock()
	}

	public Read(p: $.Bytes): [number, $.GoError] {
		return this.File!.Read(p)
	}

	public ReadAt(p: $.Bytes, off: number): [number, $.GoError] {
		return this.File!.ReadAt(p, off)
	}

	public Seek(offset: number, whence: number): [number, $.GoError] {
		return this.File!.Seek(offset, whence)
	}

	public Truncate(size: number): $.GoError {
		return this.File!.Truncate(size)
	}

	public Unlock(): $.GoError {
		return this.File!.Unlock()
	}

	public Write(p: $.Bytes): [number, $.GoError] {
		return this.File!.Write(p)
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

export class qualifiedFile {
	public get metadata(): string {
		return this._fields.metadata.value
	}
	public set metadata(value: string) {
		this._fields.metadata.value = value
	}

	public get File(): subpkg.File {
		return this._fields.File.value
	}
	public set File(value: subpkg.File) {
		this._fields.File.value = value
	}

	public _fields: {
		File: $.VarRef<subpkg.File>;
		metadata: $.VarRef<string>;
	}

	constructor(init?: Partial<{File?: subpkg.File, metadata?: string}>) {
		this._fields = {
			File: $.varRef(init?.File ?? null),
			metadata: $.varRef(init?.metadata ?? "")
		}
	}

	public clone(): qualifiedFile {
		const cloned = new qualifiedFile()
		cloned._fields = {
			File: $.varRef(this._fields.File.value),
			metadata: $.varRef(this._fields.metadata.value)
		}
		return cloned
	}

	public Close(): $.GoError {
		return this.File!.Close()
	}

	public Name(): string {
		return this.File!.Name()
	}

	public Write(data: $.Bytes): [number, $.GoError] {
		return this.File!.Write(data)
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
	}
	 else {
		console.log("Lock successful")
	}

	err = f!.Unlock()
	if (err != null) {
		console.log("Unlock error:", err!.Error())
	}
	 else {
		console.log("Unlock successful")
	}

	// Test Write
	let data = $.stringToBytes("test data")
	let n: number
	[n, err] = f!.Write(data)
	if (err != null) {
		console.log("Write error:", err!.Error())
	}
	 else {
		console.log("Wrote bytes:", n)
	}

	// Test Read
	let buf = new Uint8Array(5)
	;[n, err] = f!.Read(buf)
	if (err != null) {
		console.log("Read error:", err!.Error())
	}
	 else {
		console.log("Read bytes:", n)
	}

	// Test ReadAt
	let buf2 = new Uint8Array(5)
	;[n, err] = f!.ReadAt(buf2, 0)
	if (err != null) {
		console.log("ReadAt error:", err!.Error())
	}
	 else {
		console.log("ReadAt bytes:", n)
	}

	// Test Seek
	let pos: number
	[pos, err] = f!.Seek(0, 0)
	if (err != null) {
		console.log("Seek error:", err!.Error())
	}
	 else {
		console.log("Seek position:", pos)
	}

	// Test Truncate
	err = f!.Truncate(5)
	if (err != null) {
		console.log("Truncate error:", err!.Error())
	}
	 else {
		console.log("Truncate successful")
	}

	// Test Close
	err = f!.Close()
	if (err != null) {
		console.log("Close error:", err!.Error())
	}
	 else {
		console.log("Close successful")
	}

	// Test the qualified interface embedding
	let qualifiedMock = subpkg.NewMockFile("qualified.txt")
	let qf = new qualifiedFile({metadata: "test metadata", File: qualifiedMock})

	console.log("Qualified file name:", qf!.Name())

	err = qf!.Close()
	if (err != null) {
		console.log("Qualified close error:", err!.Error())
	}
	 else {
		console.log("Qualified close successful")
	}

	// Test qualified write
	let qn: number
	[qn, err] = qf!.Write($.stringToBytes("qualified data"))
	if (err != null) {
		console.log("Qualified write error:", err!.Error())
	}
	 else {
		console.log("Qualified wrote bytes:", qn)
	}
}


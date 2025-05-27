import * as $ from "@goscript/builtin/builtin.js";
import { ErrUnimplemented, ErrInvalid } from "./error.gs.js";

import * as fs from "@goscript/io/fs/index.js"
import * as io from "@goscript/io/index.js"
import * as time from "@goscript/time/index.js"
import * as syscall from "@goscript/syscall/index.js"

// Re-export essential types
export type Time = time.Time;
export type FileInfo = fs.FileInfo;
export type FileMode = fs.FileMode;
export type DirEntry = fs.DirEntry;

// Getpagesize returns the underlying system's memory page size.
export function Getpagesize(): number {
	// Return a standard page size for JavaScript environment
	// Most systems use 4096 bytes as the default page size
	return 4096
}

// Simplified File implementation for JavaScript environment
export class File {
	public name: string = ""
	public closed: boolean = false

	constructor(init?: Partial<{name?: string}>) {
		this.name = init?.name ?? ""
	}

	public clone(): File {
		return new File({name: this.name})
	}

	// All File methods return ErrUnimplemented in JavaScript environment
	public Readdir(n: number): [$.Slice<FileInfo>, $.GoError] {
		return [null, ErrUnimplemented]
	}

	public Readdirnames(n: number): [$.Slice<string>, $.GoError] {
		return [null, ErrUnimplemented]
	}

	public ReadDir(n: number): [$.Slice<DirEntry>, $.GoError] {
		return [null, ErrUnimplemented]
	}

	public Name(): string {
		return this.name
	}

	public Read(b: $.Bytes): [number, $.GoError] {
		return [0, ErrUnimplemented]
	}

	public ReadAt(b: $.Bytes, off: number): [number, $.GoError] {
		return [0, ErrUnimplemented]
	}

	public ReadFrom(r: io.Reader): [number, $.GoError] {
		return [0, ErrUnimplemented]
	}

	public Write(b: $.Bytes): [number, $.GoError] {
		return [0, ErrUnimplemented]
	}

	public WriteAt(b: $.Bytes, off: number): [number, $.GoError] {
		return [0, ErrUnimplemented]
	}

	public WriteTo(w: io.Writer): [number, $.GoError] {
		return [0, ErrUnimplemented]
	}

	public Seek(offset: number, whence: number): [number, $.GoError] {
		return [0, ErrUnimplemented]
	}

	public WriteString(s: string): [number, $.GoError] {
		return [0, ErrUnimplemented]
	}

	public Chmod(mode: number): $.GoError {
		return ErrUnimplemented
	}

	public SetDeadline(t: Time): $.GoError {
		return ErrUnimplemented
	}

	public SetReadDeadline(t: Time): $.GoError {
		return ErrUnimplemented
	}

	public SetWriteDeadline(t: Time): $.GoError {
		return ErrUnimplemented
	}

	public SyscallConn(): [syscall.RawConn, $.GoError] {
		return [new syscall.StubRawConn(), ErrUnimplemented]
	}

	public Close(): $.GoError {
		this.closed = true
		return null
	}

	public Chown(uid: number, gid: number): $.GoError {
		return ErrUnimplemented
	}

	public Truncate(size: number): $.GoError {
		return ErrUnimplemented
	}

	public Sync(): $.GoError {
		return ErrUnimplemented
	}

	public Chdir(): $.GoError {
		return ErrUnimplemented
	}

	public Fd(): syscall.uintptr {
		return 0
	}

	public Stat(): [FileInfo, $.GoError] {
		return [null, ErrUnimplemented]
	}

	// Register this type with the runtime type system
	static __typeInfo = $.registerStructType(
		'File',
		new File(),
		[
			{ name: "Readdir", args: [{ name: "n", type: { kind: $.TypeKind.Basic, name: "number" } }], returns: [{ type: { kind: $.TypeKind.Slice, elemType: "FileInfo" } }, { type: { kind: $.TypeKind.Interface, name: 'GoError', methods: [{ name: 'Error', args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: 'string' } }] }] } }] },
			{ name: "Read", args: [{ name: "b", type: { kind: $.TypeKind.Slice, elemType: { kind: $.TypeKind.Basic, name: "number" } } }], returns: [{ type: { kind: $.TypeKind.Basic, name: "number" } }, { type: { kind: $.TypeKind.Interface, name: 'GoError', methods: [{ name: 'Error', args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: 'string' } }] }] } }] },
			{ name: "Close", args: [], returns: [{ type: { kind: $.TypeKind.Interface, name: 'GoError', methods: [{ name: 'Error', args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: 'string' } }] }] } }] }
		],
		File,
		{ "name": { kind: $.TypeKind.Basic, name: "string" }, "closed": { kind: $.TypeKind.Basic, name: "boolean" } }
	);
}

// File mode constants
export let ModeDir: FileMode = fs.ModeDir
export let ModeAppend: FileMode = fs.ModeAppend
export let ModeExclusive: FileMode = fs.ModeExclusive
export let ModeTemporary: FileMode = fs.ModeTemporary
export let ModeSymlink: FileMode = fs.ModeSymlink
export let ModeDevice: FileMode = fs.ModeDevice
export let ModeNamedPipe: FileMode = fs.ModeNamedPipe
export let ModeSocket: FileMode = fs.ModeSocket
export let ModeSetuid: FileMode = fs.ModeSetuid
export let ModeSetgid: FileMode = fs.ModeSetgid
export let ModeCharDevice: FileMode = fs.ModeCharDevice
export let ModeSticky: FileMode = fs.ModeSticky
export let ModeIrregular: FileMode = fs.ModeIrregular

export let ModeType: FileMode = fs.ModeType
export let ModePerm: FileMode = fs.ModePerm

// SameFile reports whether fi1 and fi2 describe the same file.
export function SameFile(fi1: FileInfo, fi2: FileInfo): boolean {
	// In JavaScript environment, always return false as we can't compare files
	return false
}


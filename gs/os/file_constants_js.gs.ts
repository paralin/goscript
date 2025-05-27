import * as $ from "@goscript/builtin/builtin.js";
import { ErrUnimplemented } from "./error.gs.js";

// JavaScript-specific stubs for file constants and operations
// These provide the required constants and stub implementations

// File open flags - using values compatible with typical Unix systems
export const O_RDONLY = 0
export const O_WRONLY = 1
export const O_RDWR = 2
export const O_APPEND = 1024
export const O_CREATE = 64
export const O_EXCL = 128
export const O_SYNC = 1052672
export const O_TRUNC = 512

// Seek constants
export const SEEK_SET = 0
export const SEEK_CUR = 1
export const SEEK_END = 2

// LinkError stub for compatibility
export class LinkError {
	public get Op(): string {
		return this._fields.Op.value
	}
	public set Op(value: string) {
		this._fields.Op.value = value
	}

	public get Old(): string {
		return this._fields.Old.value
	}
	public set Old(value: string) {
		this._fields.Old.value = value
	}

	public get New(): string {
		return this._fields.New.value
	}
	public set New(value: string) {
		this._fields.New.value = value
	}

	public get Err(): $.GoError {
		return this._fields.Err.value
	}
	public set Err(value: $.GoError) {
		this._fields.Err.value = value
	}

	public _fields: {
		Op: $.VarRef<string>;
		Old: $.VarRef<string>;
		New: $.VarRef<string>;
		Err: $.VarRef<$.GoError>;
	}

	constructor(init?: Partial<{Op?: string, Old?: string, New?: string, Err?: $.GoError}>) {
		this._fields = {
			Op: $.varRef(init?.Op ?? ""),
			Old: $.varRef(init?.Old ?? ""),
			New: $.varRef(init?.New ?? ""),
			Err: $.varRef(init?.Err ?? null)
		}
	}

	public Error(): string {
		const e = this
		return e.Op + " " + e.Old + " " + e.New + ": " + (e.Err?.Error() ?? "")
	}

	public Unwrap(): $.GoError {
		const e = this
		return e.Err
	}
}

// Directory and file operation stubs
export function Readlink(name: string): [string, $.GoError] {
	return ["", ErrUnimplemented]
}

export function TempDir(): string {
	return "/tmp"
}

export function UserCacheDir(): [string, $.GoError] {
	return ["", ErrUnimplemented]
}

export function UserConfigDir(): [string, $.GoError] {
	return ["", ErrUnimplemented]
}

export function UserHomeDir(): [string, $.GoError] {
	return ["", ErrUnimplemented]
} 
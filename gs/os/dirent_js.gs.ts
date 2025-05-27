import * as $ from "@goscript/builtin/builtin.js";
import { readInt } from "./dir_unix.gs.js";

import * as syscall from "@goscript/syscall/index.js"

import * as unsafe from "@goscript/unsafe/index.js"

export function direntIno(buf: $.Bytes): [number, boolean] {
	return [1, true]
}

export function direntReclen(buf: $.Bytes): [number, boolean] {
	return readInt(buf, unsafe.Offsetof(new syscall.Dirent({}).Reclen), unsafe.Sizeof(new syscall.Dirent({}).Reclen))
}

export function direntNamlen(buf: $.Bytes): [number, boolean] {
	let [reclen, ok] = direntReclen(buf)
	if (!ok) {
		return [0, false]
	}
	return [reclen - (unsafe.Offsetof(new syscall.Dirent({}).Name) as number), true]
}

export function direntType(buf: $.Bytes): number {
	return ~(0 as number)
}


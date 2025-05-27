import * as $ from "@goscript/builtin/builtin.js";
import { ErrUnimplemented } from "./error.gs.js";

import * as errors from "@goscript/errors/index.js"
import * as syscall from "@goscript/syscall/index.js"

export let ErrProcessDone: $.GoError = errors.New("os: process already finished")

// Simplified Process class for JavaScript environment
export class Process {
	public get Pid(): number {
		return this._fields.Pid.value
	}
	public set Pid(value: number) {
		this._fields.Pid.value = value
	}

	public _fields: {
		Pid: $.VarRef<number>;
	}

	constructor(init?: Partial<{Pid?: number}>) {
		this._fields = {
			Pid: $.varRef(init?.Pid ?? -1)
		}
	}

	public clone(): Process {
		const cloned = new Process()
		cloned._fields = {
			Pid: $.varRef(this._fields.Pid.value)
		}
		return cloned
	}

	// All process operations return ErrUnimplemented in JavaScript
	public Release(): $.GoError {
		return ErrUnimplemented
	}

	public Kill(): $.GoError {
		return ErrUnimplemented
	}

	public Wait(): [ProcessState | null, $.GoError] {
		return [null, ErrUnimplemented]
	}

	public Signal(sig: Signal): $.GoError {
		return ErrUnimplemented
	}

	// Register this type with the runtime type system
	static __typeInfo = $.registerStructType(
		'Process',
		new Process(),
		[
			{ name: "Release", args: [], returns: [{ type: { kind: $.TypeKind.Interface, name: 'GoError', methods: [{ name: 'Error', args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: 'string' } }] }] } }] },
			{ name: "Kill", args: [], returns: [{ type: { kind: $.TypeKind.Interface, name: 'GoError', methods: [{ name: 'Error', args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: 'string' } }] }] } }] },
			{ name: "Wait", args: [], returns: [{ type: { kind: $.TypeKind.Pointer, elemType: "ProcessState" } }, { type: { kind: $.TypeKind.Interface, name: 'GoError', methods: [{ name: 'Error', args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: 'string' } }] }] } }] },
			{ name: "Signal", args: [{ name: "sig", type: "Signal" }], returns: [{ type: { kind: $.TypeKind.Interface, name: 'GoError', methods: [{ name: 'Error', args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: 'string' } }] }] } }] }
		],
		Process,
		{ "Pid": { kind: $.TypeKind.Basic, name: "number" } }
	);
}

// Simplified ProcAttr class for JavaScript environment  
export class ProcAttr {
	public get Dir(): string {
		return this._fields.Dir.value
	}
	public set Dir(value: string) {
		this._fields.Dir.value = value
	}

	public get Env(): $.Slice<string> {
		return this._fields.Env.value
	}
	public set Env(value: $.Slice<string>) {
		this._fields.Env.value = value
	}

	public get Files(): $.Slice<any> {
		return this._fields.Files.value
	}
	public set Files(value: $.Slice<any>) {
		this._fields.Files.value = value
	}

	public get Sys(): any {
		return this._fields.Sys.value
	}
	public set Sys(value: any) {
		this._fields.Sys.value = value
	}

	public _fields: {
		Dir: $.VarRef<string>;
		Env: $.VarRef<$.Slice<string>>;
		Files: $.VarRef<$.Slice<any>>;
		Sys: $.VarRef<any>;
	}

	constructor(init?: Partial<{Dir?: string, Env?: $.Slice<string>, Files?: $.Slice<any>, Sys?: any}>) {
		this._fields = {
			Dir: $.varRef(init?.Dir ?? ""),
			Env: $.varRef(init?.Env ?? null),
			Files: $.varRef(init?.Files ?? null),
			Sys: $.varRef(init?.Sys ?? null)
		}
	}

	public clone(): ProcAttr {
		const cloned = new ProcAttr()
		cloned._fields = {
			Dir: $.varRef(this._fields.Dir.value),
			Env: $.varRef(this._fields.Env.value),
			Files: $.varRef(this._fields.Files.value),
			Sys: $.varRef(this._fields.Sys.value)
		}
		return cloned
	}

	// Register this type with the runtime type system
	static __typeInfo = $.registerStructType(
		'ProcAttr',
		new ProcAttr(),
		[],
		ProcAttr,
		{ 
			"Dir": { kind: $.TypeKind.Basic, name: "string" },
			"Env": { kind: $.TypeKind.Slice, elemType: { kind: $.TypeKind.Basic, name: "string" } },
			"Files": { kind: $.TypeKind.Slice, elemType: { kind: $.TypeKind.Basic, name: "any" } },
			"Sys": { kind: $.TypeKind.Basic, name: "any" }
		}
	);
}

// Stub ProcessState for JavaScript environment
export class ProcessState {
	public _fields: {}

	constructor() {
		this._fields = {}
	}

	public clone(): ProcessState {
		return new ProcessState()
	}

	// Register this type with the runtime type system
	static __typeInfo = $.registerStructType(
		'ProcessState',
		new ProcessState(),
		[],
		ProcessState,
		{}
	);
}

// Signal interface stub
export type Signal = null | {
	Signal(): void
	String(): string
}
export const Signal = null as any;

// Stub functions that return ErrUnimplemented
export function Getpid(): number {
	return -1 // Not available in JavaScript
}

export function Getppid(): number {
	return -1 // Not available in JavaScript
}

export function FindProcess(pid: number): [Process | null, $.GoError] {
	return [null, ErrUnimplemented]
}

export function StartProcess(name: string, argv: $.Slice<string>, attr: ProcAttr | null): [Process | null, $.GoError] {
	return [null, ErrUnimplemented]
}

// Internal functions used by exec_unix.gs.ts
export function newDoneProcess(pid: number): Process {
	return new Process({Pid: pid})
}

export function newHandleProcess(pid: number, handle: number): Process {
	return new Process({Pid: pid})
}

export function newPIDProcess(pid: number): Process {
	return new Process({Pid: pid})
}


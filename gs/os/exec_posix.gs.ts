import * as $ from "@goscript/builtin/builtin.js";
import { Signal } from "./exec.gs.js";
import { ErrUnimplemented } from "./error.gs.js";

import * as syscall from "@goscript/syscall/index.js"

// Signal constants for JavaScript environment
export let Interrupt: Signal = null // syscall.SIGINT not available in JavaScript

export let Kill: Signal = null // syscall.SIGKILL not available in JavaScript

// Simplified ProcessState for JavaScript environment  
export class ProcessState {
	public get pid(): number {
		return this._fields.pid.value
	}
	public set pid(value: number) {
		this._fields.pid.value = value
	}

	public _fields: {
		pid: $.VarRef<number>;
	}

	constructor(init?: Partial<{pid?: number}>) {
		this._fields = {
			pid: $.varRef(init?.pid ?? -1)
		}
	}

	public clone(): ProcessState {
		const cloned = new ProcessState()
		cloned._fields = {
			pid: $.varRef(this._fields.pid.value)
		}
		return cloned
	}

	// All methods return stub values for JavaScript environment
	public UserTime(): any {
		return 0 // Duration not available
	}

	public SystemTime(): any {
		return 0 // Duration not available
	}

	public Exited(): boolean {
		return false
	}

	public Success(): boolean {
		return false
	}

	public Sys(): null | any {
		return null
	}

	public SysUsage(): null | any {
		return null
	}

	public Pid(): number {
		return this.pid
	}

	public String(): string {
		return `exit status ${this.pid}`
	}

	public ExitCode(): number {
		return -1
	}

	// Register this type with the runtime type system
	static __typeInfo = $.registerStructType(
		'ProcessState',
		new ProcessState(),
		[
			{ name: "UserTime", args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: "any" } }] },
			{ name: "SystemTime", args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: "any" } }] },
			{ name: "Exited", args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: "boolean" } }] },
			{ name: "Success", args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: "boolean" } }] },
			{ name: "Sys", args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: "any" } }] },
			{ name: "SysUsage", args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: "any" } }] },
			{ name: "Pid", args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: "number" } }] },
			{ name: "String", args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: "string" } }] },
			{ name: "ExitCode", args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: "number" } }] }
		],
		ProcessState,
		{ "pid": { kind: $.TypeKind.Basic, name: "number" } }
	);
}


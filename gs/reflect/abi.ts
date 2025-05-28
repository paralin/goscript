import * as $ from "@goscript/builtin/builtin.js";
import { uintptr, Pointer } from "./types.js";

// Stubbed ABI types and functions since we don't need the complex low-level implementation

export interface Type {
	Kind(): number;
	Align(): number;
	Size(): number;
}

export class abiStep {
	public freg: number = 0;
	public ireg: number = 0;
	public kind: number = 0;
	public offset: uintptr = 0;
	public size: uintptr = 0;
	public stkOff: uintptr = 0;

	constructor(init?: Partial<{freg?: number, ireg?: number, kind?: number, offset?: uintptr, size?: uintptr, stkOff?: uintptr}>) {
		if (init) {
			Object.assign(this, init);
		}
	}
}

export class abiSeq {
	public iregs: number = 0;
	public fregs: number = 0;
	public stackBytes: uintptr = 0;
	public steps: $.Slice<abiStep> = $.makeSlice<abiStep>(0, 0);
	public valueStart: $.Slice<number> = $.makeSlice<number>(0, 0);

	constructor(init?: Partial<{fregs?: number, iregs?: number, stackBytes?: uintptr, steps?: $.Slice<abiStep>, valueStart?: $.Slice<number>}>) {
		if (init) {
			Object.assign(this, init);
		}
	}

	public print(): void {
		// Stub implementation
	}

	public assignIntN(offset: uintptr, size: uintptr, n: number, ptrMap: number): boolean {
		// Stub implementation
		return false;
	}

	public assignFloatN(offset: uintptr, size: uintptr, n: number): boolean {
		// Stub implementation  
		return false;
	}

	public stackAssign(size: uintptr, alignment: uintptr): void {
		// Stub implementation
	}

	public regAssign(t: Type | null, offset: uintptr): boolean {
		// Stub implementation
		return false;
	}
}

export class abiDesc {
	public call: abiSeq = new abiSeq();
	public ret: abiSeq = new abiSeq();
	public stackCallArgsSize: uintptr = 0;
	public retOffset: uintptr = 0;
	public spill: uintptr = 0;
	public inRegPtrs: any = {};
	public outRegPtrs: any = {};
	public stackPtrs: any = null;

	constructor(init?: any) {
		if (init) {
			Object.assign(this, init);
		}
	}

	public dump(): void {
		// Stub implementation
	}
}

// Stub functions
export function newAbiDesc(t: any, rcvr: any): abiDesc {
	return new abiDesc();
}

export function intFromReg(r: any, reg: number, argSize: uintptr, to: Pointer): void {
	// Stub implementation
}

export function intToReg(r: any, reg: number, argSize: uintptr, from: Pointer): void {
	// Stub implementation
}

export function floatFromReg(r: any, reg: number, argSize: uintptr, to: Pointer): void {
	// Stub implementation
}

export function floatToReg(r: any, reg: number, argSize: uintptr, from: Pointer): void {
	// Stub implementation
}


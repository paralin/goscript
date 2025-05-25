import * as $ from "@goscript/builtin/builtin.js";

// CommonSize returns sizeof(Type) for a compilation target with a given ptrSize
export function CommonSize(ptrSize: number): number {
	return 4 * ptrSize + 8 + 8
}

// StructFieldSize returns sizeof(StructField) for a compilation target with a given ptrSize
export function StructFieldSize(ptrSize: number): number {
	return 3 * ptrSize
}

// UncommonSize returns sizeof(UncommonType).  This currently does not depend on ptrSize.
// This exported function is in an internal package, so it may change to depend on ptrSize in the future.
export function UncommonSize(): number {
	return 4 + 2 + 2 + 4 + 4
}

// TFlagOff returns the offset of Type.TFlag for a compilation target with a given ptrSize
export function TFlagOff(ptrSize: number): number {
	return 2 * ptrSize + 4
}

// ITabTypeOff returns the offset of ITab.Type for a compilation target with a given ptrSize
export function ITabTypeOff(ptrSize: number): number {
	return ptrSize
}


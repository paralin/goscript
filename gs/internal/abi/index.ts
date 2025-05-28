// Placeholder abi module for reflect package compatibility

// Type represents the ABI type information
export interface Type {
    Size_: number;
    PtrBytes: number;
    Hash: number;
    TFlag: number;
    Align_: number;
    FieldAlign_: number;
    Kind_: number;
}

// RegArgs represents register arguments
export interface RegArgs {
    Ptrs?: any[];
    Ints?: any[];
}

// IntArgRegBitmap represents register usage for integer arguments
export class IntArgRegBitmap {
    constructor(public value: number = 0) {}

    Get(index: number): boolean {
        return (this.value & (1 << index)) !== 0;
    }
}

// FuncPCABI0 returns the entry PC of the function f for ABI0
export function FuncPCABI0(_f: any): number {
    return 0; // Placeholder
}

// FuncPCABIInternal returns the entry PC of the function f for the internal ABI
export function FuncPCABIInternal(_f: any): number {
    return 0; // Placeholder
} 
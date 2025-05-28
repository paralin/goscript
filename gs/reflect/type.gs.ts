import * as $ from "@goscript/builtin/builtin.js";
import { Type, Value } from "./reflect.gs.js";

// canRangeFunc and canRangeFunc2 are used by iter.gs.ts
export function canRangeFunc(t: Type): boolean {
    // Placeholder implementation - check if type can be ranged over
    const kind = t.Kind().valueOf();
    return kind === 23 || kind === 17 || kind === 24; // slice, array, string
}

export function canRangeFunc2(t: Type): boolean {
    // Placeholder implementation for 2-value range
    const kind = t.Kind().valueOf();
    return kind === 21; // map
}

// funcLayout is used by makefunc.gs.ts
export function funcLayout(t: Type, rcvr: Type | null): any {
    // Placeholder implementation
    return {
        Type: null,
        InCount: 0,
        OutCount: 0
    };
} 
import { ReflectValue } from "./types";

// DeepEqual reports whether x and y are "deeply equal," defined as follows.
// Two values of identical type are deeply equal if one of the following cases applies.
export function DeepEqual(x: ReflectValue, y: ReflectValue): boolean {
    // Basic equality check
    if (x === y) {
        return true;
    }

    // Handle null/undefined cases
    if (x == null || y == null) {
        return x === y;
    }

    // Type check
    if (typeof x !== typeof y) {
        return false;
    }

    // For arrays, check length and elements
    if (Array.isArray(x) && Array.isArray(y)) {
        if (x.length !== y.length) {
            return false;
        }
        for (let i = 0; i < x.length; i++) {
            if (!DeepEqual(x[i], y[i])) {
                return false;
            }
        }
        return true;
    }

    // For objects (but not arrays), check properties
    if (typeof x === 'object' && !Array.isArray(x) && !Array.isArray(y)) {
        const xObj = x as Record<string, unknown>;
        const yObj = y as Record<string, unknown>;
        
        const xKeys = Object.keys(xObj);
        const yKeys = Object.keys(yObj);
        
        if (xKeys.length !== yKeys.length) {
            return false;
        }
        
        for (const key of xKeys) {
            if (!yKeys.includes(key)) {
                return false;
            }
            if (!DeepEqual(xObj[key] as ReflectValue, yObj[key] as ReflectValue)) {
                return false;
            }
        }
        return true;
    }

    // For primitive types, use strict equality
    return x === y;
} 
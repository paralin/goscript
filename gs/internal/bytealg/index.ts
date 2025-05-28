// Placeholder bytealg module for reflect package compatibility

// Equal reports whether a and b are the same length and contain the same bytes.
export function Equal(a: Uint8Array | any[], b: Uint8Array | any[]): boolean {
    if (a.length !== b.length) {
        return false;
    }
    for (let i = 0; i < a.length; i++) {
        if (a[i] !== b[i]) {
            return false;
        }
    }
    return true;
}

// Compare returns an integer comparing two byte slices lexicographically.
export function Compare(a: Uint8Array | any[], b: Uint8Array | any[]): number {
    const minLen = Math.min(a.length, b.length);
    for (let i = 0; i < minLen; i++) {
        if (a[i] < b[i]) {
            return -1;
        }
        if (a[i] > b[i]) {
            return 1;
        }
    }
    if (a.length < b.length) {
        return -1;
    }
    if (a.length > b.length) {
        return 1;
    }
    return 0;
} 
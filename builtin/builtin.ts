/**
 * Creates a new slice (TypeScript array) with the specified length and capacity.
 * @param elementType The element type of the slice (for type hinting).
 * @param len The length of the slice.
 * @param cap The capacity of the slice (optional).
 * @returns A new TypeScript array representing the slice.
 */
export const makeSlice = <T>(elementType: any, len: number, cap?: number): Array<T> & { __capacity?: number } => {
    const slice = new Array<T>(len) as Array<T> & { __capacity?: number };
    slice.__capacity = cap !== undefined ? cap : len;
    return slice;
};

/**
 * Returns the length of a slice (TypeScript array).
 * @param slice The slice (TypeScript array).
 * @returns The length of the slice.
 */
export const len = <T>(slice: Array<T>): number => {
    return slice.length;
};

/**
 * Returns the capacity of a slice (TypeScript array).
 * @param slice The slice (TypeScript array).
 * @returns The capacity of the slice.
 */
export const cap = <T>(slice: Array<T> & { __capacity?: number }): number => {
    return slice.__capacity !== undefined ? slice.__capacity : slice.length;
};
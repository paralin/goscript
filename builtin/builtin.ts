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
 * Creates a new map (TypeScript Map).
 * @param keyType The key type of the map (for type hinting).
 * @param valueType The value type of the map (for type hinting).
 * @returns A new TypeScript Map.
 */
export const makeMap = <K, V>(keyType: any, valueType: any): Map<K, V> => {
    return new Map<K, V>();
};

/**
 * Returns the length of a collection (string, array, or map).
 * @param collection The collection to get the length of.
 * @returns The length of the collection.
 */
export const len = <T>(collection: string | Array<T> | Map<any, any>): number => {
    if (typeof collection === 'string' || Array.isArray(collection)) {
        return collection.length;
    } else if (collection instanceof Map) {
        return collection.size;
    }
    return 0; // Default fallback
};

/**
 * Returns the capacity of a slice (TypeScript array).
 * @param slice The slice (TypeScript array).
 * @returns The capacity of the slice.
 */
export const cap = <T>(slice: Array<T> & { __capacity?: number }): number => {
    return slice.__capacity !== undefined ? slice.__capacity : slice.length;
};

/**
 * Converts a string to an array of Unicode code points (runes).
 * @param str The input string.
 * @returns An array of numbers representing the Unicode code points.
 */
export const stringToRunes = (str: string): number[] => {
    return Array.from(str).map(c => c.codePointAt(0) || 0);
};

/**
 * Gets a value from a map, with a default value if the key doesn't exist.
 * @param map The map to get from.
 * @param key The key to get.
 * @param defaultValue The default value to return if the key doesn't exist (defaults to 0).
 * @returns The value for the key, or the default value if the key doesn't exist.
 */
export const mapGet = <K, V>(map: Map<K, V>, key: K, defaultValue: V | null = null): V | null => {
    return map.has(key) ? map.get(key)! : defaultValue;
};

/**
 * Sets a value in a map.
 * @param map The map to set in.
 * @param key The key to set.
 * @param value The value to set.
 */
export const mapSet = <K, V>(map: Map<K, V>, key: K, value: V): void => {
    map.set(key, value);
};

/**
 * Deletes a key from a map.
 * @param map The map to delete from.
 * @param key The key to delete.
 */
export const deleteMapEntry = <K, V>(map: Map<K, V>, key: K): void => {
    map.delete(key);
};

/**
 * Checks if a key exists in a map.
 * @param map The map to check in.
 * @param key The key to check.
 * @returns True if the key exists, false otherwise.
 */
export const mapHas = <K, V>(map: Map<K, V>, key: K): boolean => {
    return map.has(key);
};

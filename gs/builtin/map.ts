/**
 * Creates a new map (TypeScript Map).
 * @returns A new TypeScript Map.
 */
export const makeMap = <K, V>(): Map<K, V> => {
  return new Map<K, V>()
}
/**
 * Gets a value from a map, returning a tuple [value, exists].
 * @param map The map to get from.
 * @param key The key to get.
 * @param defaultValue The default value to return if the key doesn't exist.
 * @returns A tuple [value, exists] where value is the map value or defaultValue, and exists is whether the key was found.
 */
export function mapGet<K, V, D>(map: Map<K, V>, key: K, defaultValue: D): [V, true] | [D, false] {
  const exists = map.has(key)
  if (exists) {
    return [map.get(key)!, true]
  } else {
    return [defaultValue, false]
  }
}

/**
 * Sets a value in a map.
 * @param map The map to set in.
 * @param key The key to set.
 * @param value The value to set.
 */
export const mapSet = <K, V>(map: Map<K, V>, key: K, value: V): void => {
  map.set(key, value)
}

/**
 * Deletes a key from a map.
 * @param map The map to delete from.
 * @param key The key to delete.
 */
export const deleteMapEntry = <K, V>(map: Map<K, V>, key: K): void => {
  map.delete(key)
}

/**
 * Checks if a key exists in a map.
 * @param map The map to check in.
 * @param key The key to check.
 * @returns True if the key exists, false otherwise.
 */
export const mapHas = <K, V>(map: Map<K, V>, key: K): boolean => {
  return map.has(key)
}

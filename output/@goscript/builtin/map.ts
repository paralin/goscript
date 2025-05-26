/**
 * Creates a new map (TypeScript Map).
 * @returns A new TypeScript Map.
 */
export const makeMap = <K, V>(): Map<K, V> => {
  return new Map<K, V>()
}
/**
 * Gets a value from a map, with a default value if the key doesn't exist.
 * @param map The map to get from.
 * @param key The key to get.
 * @param defaultValue The default value to return if the key doesn't exist.
 * @returns The value for the key, or the default value if the key doesn't exist.
 */
export function mapGet<K, V>(map: Map<K, V>, key: K, defaultValue: V): V
export function mapGet<K, V>(map: Map<K, V>, key: K, defaultValue: null): V | null
export function mapGet<K, V>(map: Map<K, V>, key: K): V | undefined
export function mapGet<K, V>(
  map: Map<K, V>,
  key: K,
  defaultValue?: V | null,
): V | null | undefined {
  if (arguments.length === 2) {
    return map.get(key)
  }
  return map.has(key) ? map.get(key)! : defaultValue
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

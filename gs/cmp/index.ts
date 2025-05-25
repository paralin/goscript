// Minimal stub for cmp package
// This provides the Ordered type and comparison functions needed by slices

// Ordered represents types that can be ordered (comparable)
export type Ordered = number | string | boolean | bigint;

// Compare compares two values and returns:
// -1 if a < b
//  0 if a == b
//  1 if a > b
export function Compare<T extends Ordered>(a: T, b: T): number {
  if (a < b) return -1;
  if (a > b) return 1;
  return 0;
}

// Less reports whether a < b
export function Less<T extends Ordered>(a: T, b: T): boolean {
  return a < b;
}

// Or returns the first non-zero result from the comparison functions,
// or zero if all comparisons return zero
export function Or(...comparisons: number[]): number {
  for (const cmp of comparisons) {
    if (cmp !== 0) return cmp;
  }
  return 0;
} 
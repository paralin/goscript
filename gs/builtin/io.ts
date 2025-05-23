/**
 * Implementation of Go's built-in println function
 * @param args Arguments to print
 */
export function println(...args: any[]): void {
  console.log(...args)
}

/**
 * Implementation of Go's built-in panic function
 * @param args Arguments passed to panic
 */
export function panic(...args: any[]): void {
  throw new Error(`panic: ${args.map((arg) => String(arg)).join(' ')}`)
}

/**
 * Represents the Go error type (interface).
 */
export type GoError = {
  Error(): string
} | null

/**
 * Represents the Go error type (interface).
 */
export type GoError = {
  Error(): string
} | null

// newError creates a new Go error with the given message
export function newError(text: string): GoError {
  return {
    Error: () => text,
  }
}

// toGoError converts a JavaScript Error to a Go error
// if the error is already a Go error, it returns it unchanged
export function toGoError(err: Error): GoError {
  if ("Error" in err) {
    return err as GoError
  }
  return {
    JsError: err,
    Error: () => err.message,
  } as GoError
}
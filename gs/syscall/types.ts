import * as $ from '@goscript/builtin/index.js'

// Essential type aliases
export type uintptr = number

// Errno type for syscall errors
export interface Errno {
  Error(): string
  Is(target: $.GoError): boolean
  Errno(): number
}

// RawConn interface - stub implementation for JavaScript environment
export interface RawConn {
  Control(f: (fd: uintptr) => void): $.GoError
  Read(f: (fd: uintptr) => boolean): $.GoError
  Write(f: (fd: uintptr) => boolean): $.GoError
}

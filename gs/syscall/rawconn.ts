import * as $ from '@goscript/builtin/index.js'
import { RawConn, uintptr } from './types.js'

// Stub implementation of RawConn that always returns ErrUnimplemented
export class StubRawConn implements RawConn {
  Control(_f: (fd: uintptr) => void): $.GoError {
    return {
      Error: () => 'operation not implemented in JavaScript environment',
    }
  }

  Read(_f: (fd: uintptr) => boolean): $.GoError {
    return {
      Error: () => 'operation not implemented in JavaScript environment',
    }
  }

  Write(_f: (fd: uintptr) => boolean): $.GoError {
    return {
      Error: () => 'operation not implemented in JavaScript environment',
    }
  }
} 
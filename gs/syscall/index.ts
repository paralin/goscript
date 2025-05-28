import * as $ from '@goscript/builtin/builtin.js'

// Essential type aliases
export type uintptr = number

// Errno type for syscall errors
export interface Errno {
  Error(): string
  Is(target: $.GoError): boolean
  Errno(): number
}

// Essential syscall constants
export const O_RDONLY = 0
export const O_WRONLY = 1
export const O_RDWR = 2
export const O_APPEND = 8
export const O_CREATE = 64
export const O_EXCL = 128
export const O_SYNC = 256
export const O_TRUNC = 512

export const Stdin = 0
export const Stdout = 1
export const Stderr = 2

export const SIGINT = 2
export const SIGTERM = 15

// File mode constants
export const S_IFMT = 0o170000
export const S_IFREG = 0o100000
export const S_IFDIR = 0o040000
export const S_IFLNK = 0o120000
export const S_IFBLK = 0o060000
export const S_IFCHR = 0o020000
export const S_IFIFO = 0o010000
export const S_IFSOCK = 0o140000
export const S_ISUID = 0o004000
export const S_ISGID = 0o002000
export const S_ISVTX = 0o001000

// Environment variable functions using Node.js/browser APIs
export function Getenv(key: string): [string, boolean] {
  if (typeof process !== 'undefined' && process.env) {
    const value = process.env[key]
    return value !== undefined ? [value, true] : ['', false]
  }
  return ['', false]
}

export function Setenv(key: string, value: string): $.GoError {
  if (typeof process !== 'undefined' && process.env) {
    process.env[key] = value
    return null
  }
  return { Error: () => 'setenv not supported' }
}

export function Unsetenv(key: string): $.GoError {
  if (typeof process !== 'undefined' && process.env) {
    delete process.env[key]
    return null
  }
  return { Error: () => 'unsetenv not supported' }
}

export function Clearenv(): void {
  if (typeof process !== 'undefined' && process.env) {
    for (const key in process.env) {
      delete process.env[key]
    }
  }
}

export function Environ(): $.Slice<string> {
  if (typeof process !== 'undefined' && process.env) {
    const env: string[] = []
    for (const [key, value] of Object.entries(process.env)) {
      if (value !== undefined) {
        env.push(`${key}=${value}`)
      }
    }
    return $.arrayToSlice(env)
  }
  return $.arrayToSlice([])
}

// Dirent structure with Reclen field
export class Dirent {
  public Name: $.Bytes = new Uint8Array(0)
  public Reclen: number = 0
  constructor(init?: any) {
    if (init?.Name) this.Name = init.Name
    if (init?.Reclen) this.Reclen = init.Reclen
  }
}

// Stat_t structure stub
export class Stat_t {
  public Dev: number = 0
  public Ino: number = 0
  public Mode: number = 0
  public Nlink: number = 0
  public Uid: number = 0
  public Gid: number = 0
  public Rdev: number = 0
  public Size: number = 0
  public Blksize: number = 0
  public Blocks: number = 0
  public Atime: number = 0
  public Mtime: number = 0
  public Ctime: number = 0
  public AtimeNsec: number = 0
  public MtimeNsec: number = 0
  public CtimeNsec: number = 0

  constructor(init?: any) {
    if (init) {
      Object.assign(this, init)
    }
  }

  public clone(): Stat_t {
    return new Stat_t(this)
  }
}

// RawConn interface - stub implementation for JavaScript environment
export interface RawConn {
  Control(f: (fd: uintptr) => void): $.GoError
  Read(f: (fd: uintptr) => boolean): $.GoError
  Write(f: (fd: uintptr) => boolean): $.GoError
}

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

// Additional error constants - implement as Errno type
export const ENOSYS: Errno = {
  Error: () => 'function not implemented',
  Is: (target: $.GoError) => target === ENOSYS,
  Errno: () => 38,
}

export const EISDIR: Errno = {
  Error: () => 'is a directory',
  Is: (target: $.GoError) => target === EISDIR,
  Errno: () => 21,
}

export const ENOTDIR: Errno = {
  Error: () => 'not a directory',
  Is: (target: $.GoError) => target === ENOTDIR,
  Errno: () => 20,
}

export const ERANGE: Errno = {
  Error: () => 'result too large',
  Is: (target: $.GoError) => target === ERANGE,
  Errno: () => 34,
}

export const ENOMEM: Errno = {
  Error: () => 'out of memory',
  Is: (target: $.GoError) => target === ENOMEM,
  Errno: () => 12,
}

export const ESRCH: Errno = {
  Error: () => 'no such process',
  Is: (target: $.GoError) => target === ESRCH,
  Errno: () => 3,
}

// Additional missing syscall functions
export function Open(
  _path: string,
  _flag: number,
  _perm: number,
): [number, $.GoError] {
  return [-1, ENOSYS]
}

export function Sysctl(_name: string): [string, $.GoError] {
  return ['', ENOSYS]
}

// Getpagesize returns the underlying system's memory page size.
export function Getpagesize(): number {
  // Return a standard page size for JavaScript environment
  // Most systems use 4096 bytes as the default page size
  return 4096
}

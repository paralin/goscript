import * as $ from '@goscript/builtin/index.js'
import { ENOSYS } from './errors.js'

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

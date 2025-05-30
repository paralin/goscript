import * as $ from '@goscript/builtin/index.js'

import * as time from '@goscript/time/index.js'

import * as utf8 from '@goscript/unicode/utf8/index.js'

import * as oserror from '@goscript/internal/oserror/index.js'

export type FS = null | {
  // Open opens the named file.
  // [File.Close] must be called to release any associated resources.
  //
  // When Open returns an error, it should be of type *PathError
  // with the Op field set to "open", the Path field set to name,
  // and the Err field describing the problem.
  //
  // Open should reject attempts to open names that do not satisfy
  // ValidPath(name), returning a *PathError with Err set to
  // ErrInvalid or ErrNotExist.
  //
  // Path names passed to open are UTF-8-encoded,
  // unrooted, slash-separated sequences of path elements, like "x/y/z".
  // Path names must not contain an element that is "." or ".." or the empty string,
  // except for the special case that the name "." may be used for the root directory.
  // Paths must not start or end with a slash: "/x" and "x/" are invalid.
  //
  // Note that paths are slash-separated on all systems, even Windows.
  // Paths containing other characters such as backslash and colon
  // are accepted as valid, but those characters must never be
  // interpreted by an [FS] implementation as path element separators.
  Open(name: string): [File, $.GoError]
}

$.registerInterfaceType(
  'FS',
  null, // Zero value for interface is null
  [
    {
      name: 'Open',
      args: [
        { name: 'name', type: { kind: $.TypeKind.Basic, name: 'string' } },
      ],
      returns: [
        { type: 'File' },
        {
          type: {
            kind: $.TypeKind.Interface,
            name: 'GoError',
            methods: [
              {
                name: 'Error',
                args: [],
                returns: [{ type: { kind: $.TypeKind.Basic, name: 'string' } }],
              },
            ],
          },
        },
      ],
    },
  ],
)

// ValidPath reports whether the given path name
// is valid for use in a call to Open.
//
// Path names passed to open are UTF-8-encoded,
// unrooted, slash-separated sequences of path elements, like "x/y/z".
// Path names must not contain an element that is "." or ".." or the empty string,
// except for the special case that the name "." may be used for the root directory.
// Paths must not start or end with a slash: "/x" and "x/" are invalid.
//
// Note that paths are slash-separated on all systems, even Windows.
// Paths containing other characters such as backslash and colon
// are accepted as valid, but those characters must never be
// interpreted by an [FS] implementation as path element separators.
export function ValidPath(name: string): boolean {
  if (!utf8.ValidString(name)) {
    return false
  }

  // special case
  if (name == '.') {
    // special case
    return true
  }

  // Iterate over elements in name, checking each.

  // reached clean ending
  for (;;) {
    let i = 0
    for (; i < $.len(name) && $.indexString(name, i) != 47; ) {
      i++
    }
    let elem = $.sliceString(name, undefined, i)
    if (elem == '' || elem == '.' || elem == '..') {
      return false
    }

    // reached clean ending
    if (i == $.len(name)) {
      return true
    }
    name = $.sliceString(name, i + 1, undefined)
  }
}

export type File = null | {
  Close(): $.GoError
  Read(_p0: Uint8Array): [number, $.GoError]
  Stat(): [FileInfo, $.GoError]
}

$.registerInterfaceType(
  'File',
  null, // Zero value for interface is null
  [
    {
      name: 'Close',
      args: [],
      returns: [
        {
          type: {
            kind: $.TypeKind.Interface,
            name: 'GoError',
            methods: [
              {
                name: 'Error',
                args: [],
                returns: [{ type: { kind: $.TypeKind.Basic, name: 'string' } }],
              },
            ],
          },
        },
      ],
    },
    {
      name: 'Read',
      args: [
        {
          name: '',
          type: {
            kind: $.TypeKind.Slice,
            elemType: { kind: $.TypeKind.Basic, name: 'number' },
          },
        },
      ],
      returns: [
        { type: { kind: $.TypeKind.Basic, name: 'number' } },
        {
          type: {
            kind: $.TypeKind.Interface,
            name: 'GoError',
            methods: [
              {
                name: 'Error',
                args: [],
                returns: [{ type: { kind: $.TypeKind.Basic, name: 'string' } }],
              },
            ],
          },
        },
      ],
    },
    {
      name: 'Stat',
      args: [],
      returns: [
        { type: 'FileInfo' },
        {
          type: {
            kind: $.TypeKind.Interface,
            name: 'GoError',
            methods: [
              {
                name: 'Error',
                args: [],
                returns: [{ type: { kind: $.TypeKind.Basic, name: 'string' } }],
              },
            ],
          },
        },
      ],
    },
  ],
)

export type DirEntry = null | {
  // Info returns the FileInfo for the file or subdirectory described by the entry.
  // The returned FileInfo may be from the time of the original directory read
  // or from the time of the call to Info. If the file has been removed or renamed
  // since the directory read, Info may return an error satisfying errors.Is(err, ErrNotExist).
  // If the entry denotes a symbolic link, Info reports the information about the link itself,
  // not the link's target.
  Info(): [FileInfo, $.GoError]
  // IsDir reports whether the entry describes a directory.
  IsDir(): boolean
  // Name returns the name of the file (or subdirectory) described by the entry.
  // This name is only the final element of the path (the base name), not the entire path.
  // For example, Name would return "hello.go" not "home/gopher/hello.go".
  Name(): string
  // Type returns the type bits for the entry.
  // The type bits are a subset of the usual FileMode bits, those returned by the FileMode.Type method.
  Type(): FileMode
}

$.registerInterfaceType(
  'DirEntry',
  null, // Zero value for interface is null
  [
    {
      name: 'Info',
      args: [],
      returns: [
        { type: 'FileInfo' },
        {
          type: {
            kind: $.TypeKind.Interface,
            name: 'GoError',
            methods: [
              {
                name: 'Error',
                args: [],
                returns: [{ type: { kind: $.TypeKind.Basic, name: 'string' } }],
              },
            ],
          },
        },
      ],
    },
    {
      name: 'IsDir',
      args: [],
      returns: [{ type: { kind: $.TypeKind.Basic, name: 'boolean' } }],
    },
    {
      name: 'Name',
      args: [],
      returns: [{ type: { kind: $.TypeKind.Basic, name: 'string' } }],
    },
    { name: 'Type', args: [], returns: [{ type: 'FileMode' }] },
  ],
)

export type ReadDirFile =
  | null
  | ({
      // ReadDir reads the contents of the directory and returns
      // a slice of up to n DirEntry values in directory order.
      // Subsequent calls on the same file will yield further DirEntry values.
      //
      // If n > 0, ReadDir returns at most n DirEntry structures.
      // In this case, if ReadDir returns an empty slice, it will return
      // a non-nil error explaining why.
      // At the end of a directory, the error is io.EOF.
      // (ReadDir must return io.EOF itself, not an error wrapping io.EOF.)
      //
      // If n <= 0, ReadDir returns all the DirEntry values from the directory
      // in a single slice. In this case, if ReadDir succeeds (reads all the way
      // to the end of the directory), it returns the slice and a nil error.
      // If it encounters an error before the end of the directory,
      // ReadDir returns the DirEntry list read until that point and a non-nil error.
      ReadDir(n: number): [$.Slice<DirEntry>, $.GoError]
    } & File)

$.registerInterfaceType(
  'ReadDirFile',
  null, // Zero value for interface is null
  [
    {
      name: 'ReadDir',
      args: [{ name: 'n', type: { kind: $.TypeKind.Basic, name: 'number' } }],
      returns: [
        { type: { kind: $.TypeKind.Slice, elemType: 'DirEntry' } },
        {
          type: {
            kind: $.TypeKind.Interface,
            name: 'GoError',
            methods: [
              {
                name: 'Error',
                args: [],
                returns: [{ type: { kind: $.TypeKind.Basic, name: 'string' } }],
              },
            ],
          },
        },
      ],
    },
  ],
)

// "invalid argument"
export let ErrInvalid: $.GoError = errInvalid()

// "permission denied"
export let ErrPermission: $.GoError = errPermission()

// "file already exists"
export let ErrExist: $.GoError = errExist()

// "file does not exist"
export let ErrNotExist: $.GoError = errNotExist()

// "file already closed"
export let ErrClosed: $.GoError = errClosed()

export function errInvalid(): $.GoError {
  return oserror.ErrInvalid
}

export function errPermission(): $.GoError {
  return oserror.ErrPermission
}

export function errExist(): $.GoError {
  return oserror.ErrExist
}

export function errNotExist(): $.GoError {
  return oserror.ErrNotExist
}

export function errClosed(): $.GoError {
  return oserror.ErrClosed
}

export type FileInfo = null | {
  // abbreviation for Mode().IsDir()
  IsDir(): boolean
  // modification time
  ModTime(): time.Time
  // file mode bits
  Mode(): FileMode
  // base name of the file
  Name(): string
  // length in bytes for regular files; system-dependent for others
  Size(): number
  // underlying data source (can return nil)
  Sys(): null | any
}

$.registerInterfaceType(
  'FileInfo',
  null, // Zero value for interface is null
  [
    {
      name: 'IsDir',
      args: [],
      returns: [{ type: { kind: $.TypeKind.Basic, name: 'boolean' } }],
    },
    { name: 'ModTime', args: [], returns: [{ type: 'Time' }] },
    { name: 'Mode', args: [], returns: [{ type: 'FileMode' }] },
    {
      name: 'Name',
      args: [],
      returns: [{ type: { kind: $.TypeKind.Basic, name: 'string' } }],
    },
    {
      name: 'Size',
      args: [],
      returns: [{ type: { kind: $.TypeKind.Basic, name: 'number' } }],
    },
    {
      name: 'Sys',
      args: [],
      returns: [{ type: { kind: $.TypeKind.Interface, methods: [] } }],
    },
  ],
)

export class FileMode {
  constructor(private _value: number) {}

  valueOf(): number {
    return this._value
  }

  toString(): string {
    return String(this._value)
  }

  static from(value: number): FileMode {
    return new FileMode(value)
  }
}

// The single letters are the abbreviations
// used by the String method's formatting.
// d: is a directory
export let ModeDir: FileMode = new FileMode(2147483648)

// a: append-only
export let ModeAppend: FileMode = new FileMode(0)

// l: exclusive use
export let ModeExclusive: FileMode = new FileMode(0)

// T: temporary file; Plan 9 only
export let ModeTemporary: FileMode = new FileMode(0)

// L: symbolic link
export let ModeSymlink: FileMode = new FileMode(0)

// D: device file
export let ModeDevice: FileMode = new FileMode(0)

// p: named pipe (FIFO)
export let ModeNamedPipe: FileMode = new FileMode(0)

// S: Unix domain socket
export let ModeSocket: FileMode = new FileMode(0)

// u: setuid
export let ModeSetuid: FileMode = new FileMode(0)

// g: setgid
export let ModeSetgid: FileMode = new FileMode(0)

// c: Unix character device, when ModeDevice is set
export let ModeCharDevice: FileMode = new FileMode(0)

// t: sticky
export let ModeSticky: FileMode = new FileMode(0)

// ?: non-regular file; nothing else is known about this file
export let ModeIrregular: FileMode = new FileMode(0)

// Mask for the type bits. For regular files, none will be set.
export let ModeType: FileMode = new FileMode(
  2147483648 | 134217728 | 33554432 | 16777216 | 67108864 | 2097152 | 524288,
)

// Unix permission bits
export let ModePerm: FileMode = new FileMode(0o777)

// FileMode methods
export function fileModeString(mode: FileMode): string {
  const buf: string[] = []

  // File type
  if (mode.valueOf() & ModeDir.valueOf()) buf.push('d')
  else if (mode.valueOf() & ModeSymlink.valueOf()) buf.push('L')
  else if (mode.valueOf() & ModeDevice.valueOf()) buf.push('D')
  else if (mode.valueOf() & ModeNamedPipe.valueOf()) buf.push('p')
  else if (mode.valueOf() & ModeSocket.valueOf()) buf.push('S')
  else if (mode.valueOf() & ModeCharDevice.valueOf()) buf.push('c')
  else if (mode.valueOf() & ModeIrregular.valueOf()) buf.push('?')
  else buf.push('-')

  // Permission bits
  const perm = mode.valueOf() & ModePerm.valueOf()
  buf.push(perm & 0o400 ? 'r' : '-')
  buf.push(perm & 0o200 ? 'w' : '-')
  buf.push(perm & 0o100 ? 'x' : '-')
  buf.push(perm & 0o040 ? 'r' : '-')
  buf.push(perm & 0o020 ? 'w' : '-')
  buf.push(perm & 0o010 ? 'x' : '-')
  buf.push(perm & 0o004 ? 'r' : '-')
  buf.push(perm & 0o002 ? 'w' : '-')
  buf.push(perm & 0o001 ? 'x' : '-')

  return buf.join('')
}

export function fileModeType(mode: FileMode): FileMode {
  return new FileMode(mode.valueOf() & ModeType.valueOf())
}

export class PathError {
  public get Op(): string {
    return this._fields.Op.value
  }
  public set Op(value: string) {
    this._fields.Op.value = value
  }

  public get Path(): string {
    return this._fields.Path.value
  }
  public set Path(value: string) {
    this._fields.Path.value = value
  }

  public get Err(): $.GoError {
    return this._fields.Err.value
  }
  public set Err(value: $.GoError) {
    this._fields.Err.value = value
  }

  public _fields: {
    Op: $.VarRef<string>
    Path: $.VarRef<string>
    Err: $.VarRef<$.GoError>
  }

  constructor(init?: Partial<{ Err?: $.GoError; Op?: string; Path?: string }>) {
    this._fields = {
      Op: $.varRef(init?.Op ?? ''),
      Path: $.varRef(init?.Path ?? ''),
      Err: $.varRef(init?.Err ?? null),
    }
  }

  public clone(): PathError {
    const cloned = new PathError()
    cloned._fields = {
      Op: $.varRef(this._fields.Op.value),
      Path: $.varRef(this._fields.Path.value),
      Err: $.varRef(this._fields.Err.value),
    }
    return cloned
  }

  public Error(): string {
    const e = this
    return e!.Op + ' ' + e!.Path + ': ' + e!.Err!.Error()
  }

  public Unwrap(): $.GoError {
    const e = this
    return e!.Err
  }

  // Timeout reports whether this error represents a timeout.
  public Timeout(): boolean {
    const e = this
    let { value: t, ok: ok } = $.typeAssert<null | {
      Timeout(): boolean
    }>(e!.Err, {
      kind: $.TypeKind.Interface,
      methods: [
        {
          name: 'Timeout',
          args: [],
          returns: [{ type: { kind: $.TypeKind.Basic, name: 'boolean' } }],
        },
      ],
    })
    return ok && t!.Timeout()
  }

  // Register this type with the runtime type system
  static __typeInfo = $.registerStructType(
    'PathError',
    new PathError(),
    [
      {
        name: 'Error',
        args: [],
        returns: [{ type: { kind: $.TypeKind.Basic, name: 'string' } }],
      },
      {
        name: 'Unwrap',
        args: [],
        returns: [
          {
            type: {
              kind: $.TypeKind.Interface,
              name: 'GoError',
              methods: [
                {
                  name: 'Error',
                  args: [],
                  returns: [
                    { type: { kind: $.TypeKind.Basic, name: 'string' } },
                  ],
                },
              ],
            },
          },
        ],
      },
      {
        name: 'Timeout',
        args: [],
        returns: [{ type: { kind: $.TypeKind.Basic, name: 'boolean' } }],
      },
    ],
    PathError,
    {
      Op: { kind: $.TypeKind.Basic, name: 'string' },
      Path: { kind: $.TypeKind.Basic, name: 'string' },
      Err: {
        kind: $.TypeKind.Interface,
        name: 'GoError',
        methods: [
          {
            name: 'Error',
            args: [],
            returns: [{ type: { kind: $.TypeKind.Basic, name: 'string' } }],
          },
        ],
      },
    },
  )
}

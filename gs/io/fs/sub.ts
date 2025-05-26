import * as $ from '@goscript/builtin/builtin.js'
import { ValidPath, FS, PathError, ErrInvalid, File, DirEntry } from './fs.js'
import { ReadDir } from './readdir.js'
import { ReadFile } from './readfile.js'
import { Glob } from './glob.js'

import * as errors from '@goscript/errors/index.js'

import * as path from '@goscript/path/index.js'

export type SubFS =
  | null
  | ({
      // Sub returns an FS corresponding to the subtree rooted at dir.
      Sub(dir: string): [FS, $.GoError]
    } & FS)

$.registerInterfaceType(
  'SubFS',
  null, // Zero value for interface is null
  [
    {
      name: 'Sub',
      args: [{ name: 'dir', type: { kind: $.TypeKind.Basic, name: 'string' } }],
      returns: [
        { type: 'FS' },
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

// Sub returns an [FS] corresponding to the subtree rooted at fsys's dir.
//
// If dir is ".", Sub returns fsys unchanged.
// Otherwise, if fs implements [SubFS], Sub returns fsys.Sub(dir).
// Otherwise, Sub returns a new [FS] implementation sub that,
// in effect, implements sub.Open(name) as fsys.Open(path.Join(dir, name)).
// The implementation also translates calls to ReadDir, ReadFile, and Glob appropriately.
//
// Note that Sub(os.DirFS("/"), "prefix") is equivalent to os.DirFS("/prefix")
// and that neither of them guarantees to avoid operating system
// accesses outside "/prefix", because the implementation of [os.DirFS]
// does not check for symbolic links inside "/prefix" that point to
// other directories. That is, [os.DirFS] is not a general substitute for a
// chroot-style security mechanism, and Sub does not change that fact.
export function Sub(fsys: FS, dir: string): [FS, $.GoError] {
  if (!ValidPath(dir)) {
    return [null, new PathError({ Err: ErrInvalid, Op: 'sub', Path: dir })]
  }
  if (dir == '.') {
    return [fsys, null]
  }
  {
    let { value: fsysTyped, ok: ok } = $.typeAssert<SubFS>(fsys, 'SubFS')
    if (ok) {
      return fsysTyped!.Sub(dir)
    }
  }
  return [new subFS({}), null]
}

class subFS {
  public get fsys(): FS {
    return this._fields.fsys.value
  }
  public set fsys(value: FS) {
    this._fields.fsys.value = value
  }

  public get dir(): string {
    return this._fields.dir.value
  }
  public set dir(value: string) {
    this._fields.dir.value = value
  }

  public _fields: {
    fsys: $.VarRef<FS>
    dir: $.VarRef<string>
  }

  constructor(init?: Partial<{ dir?: string; fsys?: FS }>) {
    this._fields = {
      fsys: $.varRef(init?.fsys ?? null),
      dir: $.varRef(init?.dir ?? ''),
    }
  }

  public clone(): subFS {
    const cloned = new subFS()
    cloned._fields = {
      fsys: $.varRef(this._fields.fsys.value),
      dir: $.varRef(this._fields.dir.value),
    }
    return cloned
  }

  // fullName maps name to the fully-qualified name dir/name.
  public fullName(op: string, name: string): [string, $.GoError] {
    const f = this
    if (!ValidPath(name)) {
      return ['', new PathError({ Err: ErrInvalid, Op: op, Path: name })]
    }
    return [path.Join(f!.dir, name), null]
  }

  // shorten maps name, which should start with f.dir, back to the suffix after f.dir.
  public shorten(name: string): [string, boolean] {
    const f = this
    if (name == f!.dir) {
      return ['.', true]
    }
    if (
      $.len(name) >= $.len(f!.dir) + 2 &&
      $.indexString(name, $.len(f!.dir)) == 47 &&
      $.sliceString(name, undefined, $.len(f!.dir)) == f!.dir
    ) {
      return [$.sliceString(name, $.len(f!.dir) + 1, undefined), true]
    }
    return ['', false]
  }

  // fixErr shortens any reported names in PathErrors by stripping f.dir.
  public fixErr(err: $.GoError): $.GoError {
    const f = this
    {
      let { value: e, ok: ok } = $.typeAssert<PathError | null>(err, {
        kind: $.TypeKind.Pointer,
        elemType: 'PathError',
      })
      if (ok) {
        {
          let [short, ok] = f!.shorten(e!.Path)
          if (ok) {
            e!.Path = short
          }
        }
      }
    }
    return err
  }

  public Open(name: string): [File, $.GoError] {
    const f = this
    let [full, err] = f!.fullName('open', name)
    if (err != null) {
      return [null, err]
    }
    let file: File
    ;[file, err] = f!.fsys!.Open(full)
    return [file, f!.fixErr(err)]
  }

  public ReadDir(name: string): [$.Slice<DirEntry>, $.GoError] {
    const f = this
    let [full, err] = f!.fullName('read', name)
    if (err != null) {
      return [null, err]
    }
    let dir: $.Slice<DirEntry>
    ;[dir, err] = ReadDir(f!.fsys, full)
    return [dir, f!.fixErr(err)]
  }

  public ReadFile(name: string): [Uint8Array, $.GoError] {
    const f = this
    let [full, err] = f!.fullName('read', name)
    if (err != null) {
      return [new Uint8Array(0), err]
    }
    let data: Uint8Array
    ;[data, err] = ReadFile(f!.fsys, full)
    return [data, f!.fixErr(err)]
  }

  public Glob(pattern: string): [$.Slice<string>, $.GoError] {
    const f = this
    {
      let [, err] = path.Match(pattern, '')
      if (err != null) {
        return [null, err]
      }
    }
    if (pattern == '.') {
      return [$.arrayToSlice<string>(['.']), null]
    }
    let full = f!.dir + '/' + pattern
    let [list, err] = Glob(f!.fsys, full)
    for (let i = 0; i < $.len(list); i++) {
      const name = list![i]
      {
        let [shortName, ok] = f!.shorten(name)

        // can't use fmt in this package
        if (!ok) {
          return [
            null,
            errors.New(
              'invalid result from inner fsys Glob: ' +
                shortName +
                ' not in ' +
                f!.dir,
            ),
          ]
        }
        list![i] = shortName
      }
    }
    return [list, f!.fixErr(err)]
  }

  public Sub(dir: string): [FS, $.GoError] {
    const f = this
    if (dir == '.') {
      return [f, null]
    }
    let [_full, err] = f!.fullName('sub', dir)
    if (err != null) {
      return [null, err]
    }
    return [new subFS({}), null]
  }

  // Register this type with the runtime type system
  static __typeInfo = $.registerStructType(
    'subFS',
    new subFS(),
    [
      {
        name: 'fullName',
        args: [
          { name: 'op', type: { kind: $.TypeKind.Basic, name: 'string' } },
          { name: 'name', type: { kind: $.TypeKind.Basic, name: 'string' } },
        ],
        returns: [
          { type: { kind: $.TypeKind.Basic, name: 'string' } },
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
        name: 'shorten',
        args: [
          { name: 'name', type: { kind: $.TypeKind.Basic, name: 'string' } },
        ],
        returns: [
          { type: { kind: $.TypeKind.Basic, name: 'string' } },
          { type: { kind: $.TypeKind.Basic, name: 'boolean' } },
        ],
      },
      {
        name: 'fixErr',
        args: [
          {
            name: 'err',
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
        name: 'ReadDir',
        args: [
          { name: 'name', type: { kind: $.TypeKind.Basic, name: 'string' } },
        ],
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
        name: 'ReadFile',
        args: [
          { name: 'name', type: { kind: $.TypeKind.Basic, name: 'string' } },
        ],
        returns: [
          {
            type: {
              kind: $.TypeKind.Slice,
              elemType: { kind: $.TypeKind.Basic, name: 'number' },
            },
          },
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
        name: 'Glob',
        args: [
          { name: 'pattern', type: { kind: $.TypeKind.Basic, name: 'string' } },
        ],
        returns: [
          {
            type: {
              kind: $.TypeKind.Slice,
              elemType: { kind: $.TypeKind.Basic, name: 'string' },
            },
          },
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
        name: 'Sub',
        args: [
          { name: 'dir', type: { kind: $.TypeKind.Basic, name: 'string' } },
        ],
        returns: [
          { type: 'FS' },
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
    ],
    subFS,
    { fsys: 'FS', dir: { kind: $.TypeKind.Basic, name: 'string' } },
  )
}

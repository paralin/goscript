import * as $ from '@goscript/builtin/builtin.js'
import { FS, FileInfo } from './fs.js'

export type StatFS =
  | null
  | ({
      // Stat returns a FileInfo describing the file.
      // If there is an error, it should be of type *PathError.
      Stat(name: string): [FileInfo, $.GoError]
    } & FS)

$.registerInterfaceType(
  'StatFS',
  null, // Zero value for interface is null
  [
    {
      name: 'Stat',
      args: [
        { name: 'name', type: { kind: $.TypeKind.Basic, name: 'string' } },
      ],
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

// Stat returns a [FileInfo] describing the named file from the file system.
//
// If fs implements [StatFS], Stat calls fs.Stat.
// Otherwise, Stat opens the [File] to stat it.
export function Stat(fsys: FS, name: string): [FileInfo, $.GoError] {
  using __defer = new $.DisposableStack()
  {
    let { value: fsysTyped, ok: ok } = $.typeAssert<StatFS>(fsys, 'StatFS')
    if (ok) {
      return fsysTyped!.Stat(name)
    }
  }

  let [file, err] = fsys!.Open(name)
  if (err != null) {
    return [null, err]
  }
  __defer.defer(() => {
    file!.Close()
  })
  return file!.Stat()
}

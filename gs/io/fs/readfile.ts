import * as $ from '@goscript/builtin/index.js'
import { FS } from './fs.js'

import * as io from '@goscript/io/index.js'

export type ReadFileFS =
  | null
  | ({
      // ReadFile reads the named file and returns its contents.
      // A successful call returns a nil error, not io.EOF.
      // (Because ReadFile reads the whole file, the expected EOF
      // from the final Read is not treated as an error to be reported.)
      //
      // The caller is permitted to modify the returned byte slice.
      // This method should return a copy of the underlying data.
      ReadFile(name: string): [Uint8Array, $.GoError]
    } & FS)

$.registerInterfaceType(
  'ReadFileFS',
  null, // Zero value for interface is null
  [
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
                returns: [{ type: { kind: $.TypeKind.Basic, name: 'string' } }],
              },
            ],
          },
        },
      ],
    },
  ],
)

// ReadFile reads the named file from the file system fs and returns its contents.
// A successful call returns a nil error, not [io.EOF].
// (Because ReadFile reads the whole file, the expected EOF
// from the final Read is not treated as an error to be reported.)
//
// If fs implements [ReadFileFS], ReadFile calls fs.ReadFile.
// Otherwise ReadFile calls fs.Open and uses Read and Close
// on the returned [File].
export function ReadFile(fsys: FS, name: string): [Uint8Array, $.GoError] {
  using __defer = new $.DisposableStack()
  {
    let { value: fsysTyped, ok: ok } = $.typeAssert<ReadFileFS>(
      fsys,
      'ReadFileFS',
    )
    if (ok) {
      return fsysTyped!.ReadFile(name)
    }
  }

  let [file, err] = fsys!.Open(name)
  if (err != null) {
    return [new Uint8Array(0), err]
  }
  __defer.defer(() => {
    file!.Close()
  })

  let data = new Uint8Array(0)
  for (;;) {
    if ($.len(data) >= $.cap(data)) {
      // Grow the array by creating a new larger one
      let newData = new Uint8Array($.len(data) * 2 + 1)
      newData.set(data)
      data = newData
    }
    let [n, err] = file!.Read(data.subarray($.len(data), $.cap(data)))
    data = data.subarray(0, $.len(data) + n)
    if (err != null) {
      if (err == io.EOF) {
        err = null
      }
      return [data, err]
    }
  }
}

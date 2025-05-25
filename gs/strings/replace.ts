import * as $ from '@goscript/builtin/builtin.js'
import { makeStringFinder, stringFinder } from './search.js'
import { Count, HasPrefix } from './strings.js'
import { Builder } from './builder.js'
import * as io from '@goscript/io/index.js'

export class Replacer {
  // guards buildOnce method
  public get built(): boolean {
    return this._fields.built.value
  }
  public set built(value: boolean) {
    this._fields.built.value = value
  }

  public get r(): replacer {
    return this._fields.r.value
  }
  public set r(value: replacer) {
    this._fields.r.value = value
  }

  public get oldnew(): $.Slice<string> {
    return this._fields.oldnew.value
  }
  public set oldnew(value: $.Slice<string>) {
    this._fields.oldnew.value = value
  }

  public _fields: {
    built: $.VarRef<boolean>
    r: $.VarRef<replacer>
    oldnew: $.VarRef<$.Slice<string>>
  }

  constructor(
    init?: Partial<{
      oldnew?: $.Slice<string>
      built?: boolean
      r?: replacer
    }>,
  ) {
    this._fields = {
      built: $.varRef(init?.built ?? false),
      r: $.varRef(init?.r ?? null),
      oldnew: $.varRef(init?.oldnew ?? null),
    }
  }

  public clone(): Replacer {
    const cloned = new Replacer()
    cloned._fields = {
      built: $.varRef(this._fields.built.value),
      r: $.varRef(this._fields.r.value),
      oldnew: $.varRef(this._fields.oldnew.value),
    }
    return cloned
  }

  public buildOnce(): void {
    if (this.built) {
      return
    }
    const r = this
    const built = r.build()
    r.r = built
    r.oldnew = null
    r.built = true
  }

  public build(): replacer {
    const b = this
    let oldnew = b!.oldnew

    // Handle empty case - no replacements to do
    if ($.len(oldnew) == 0) {
      return {
        Replace: (s: string): string => s,
        WriteString: (w: io.Writer, s: string): [number, $.GoError] => {
          const bytes = $.stringToBytes(s)
          return w.Write(bytes)
        },
      }
    }

    if ($.len(oldnew) == 2 && $.len(oldnew![0]) > 1) {
      return makeSingleStringReplacer(oldnew![0], oldnew![1])
    }
    let allNewBytes = true
    for (let i = 0; i < $.len(oldnew); i += 2) {
      if ($.len(oldnew![i]) != 1) {
        return makeGenericReplacer(oldnew)
      }
      if ($.len(oldnew![i + 1]) != 1) {
        allNewBytes = false
      }
    }
    if (allNewBytes) {
      let r: number[] = new Array(256)
      for (let i = 0; i < r.length; i++) {
        r[i] = i
      }
      // The first occurrence of old->new map takes precedence
      // over the others with the same old string.
      for (let i = $.len(oldnew) - 2; i >= 0; i -= 2) {
        let o = $.indexString(oldnew![i], 0)
        let n = $.indexString(oldnew![i + 1], 0)
        r[o] = n
      }
      return {
        Replace: (s: string): string => {
          let result = ''
          for (let i = 0; i < s.length; i++) {
            const charCode = s.charCodeAt(i)
            if (charCode < 256) {
              result += String.fromCharCode(r[charCode])
            } else {
              result += s[i]
            }
          }
          return result
        },
        WriteString: (w: io.Writer, s: string): [number, $.GoError] => {
          const replaced = this.Replace(s)
          const bytes = $.stringToBytes(replaced)
          return w.Write(bytes)
        },
      }
    }
    let r = new byteStringReplacer({
      toReplace: $.makeSlice<string>(0, $.len(oldnew) / 2),
    })
    for (let i = $.len(oldnew) - 2; i >= 0; i -= 2) {
      let o = $.indexString(oldnew![i], 0)
      let n = oldnew![i + 1]
      // To avoid counting repetitions multiple times.

      // We need to use string([]byte{o}) instead of string(o),
      // to avoid utf8 encoding of o.
      // E. g. byte(150) produces string of length 2.
      if (r.replacements![o] == null) {
        // We need to use string([]byte{o}) instead of string(o),
        // to avoid utf8 encoding of o.
        // E. g. byte(150) produces string of length 2.
        r.toReplace = $.append(
          r.toReplace,
          $.bytesToString(new Uint8Array([o])),
        )
      }
      r.replacements![o] = $.stringToBytes(n)
    }
    return r
  }

  // Replace returns a copy of s with all replacements performed.
  public Replace(s: string): string {
    const r = this
    r.buildOnce()
    return r.r!.Replace(s)
  }

  // WriteString writes s to w with all replacements performed.
  public WriteString(w: io.Writer, s: string): [number, $.GoError] {
    const r = this
    r.buildOnce()
    return r.r!.WriteString(w, s)
  }

  // Register this type with the runtime type system
  static __typeInfo = $.registerStructType(
    'Replacer',
    new Replacer(),
    [
      { name: 'buildOnce', args: [], returns: [] },
      { name: 'build', args: [], returns: [{ type: 'replacer' }] },
      {
        name: 'Replace',
        args: [{ name: 's', type: { kind: $.TypeKind.Basic, name: 'string' } }],
        returns: [{ type: { kind: $.TypeKind.Basic, name: 'string' } }],
      },
      {
        name: 'WriteString',
        args: [
          { name: 'w', type: 'Writer' },
          { name: 's', type: { kind: $.TypeKind.Basic, name: 'string' } },
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
    Replacer,
    {
      built: { kind: $.TypeKind.Basic, name: 'boolean' },
      r: 'replacer',
      oldnew: {
        kind: $.TypeKind.Slice,
        elemType: { kind: $.TypeKind.Basic, name: 'string' },
      },
    },
  )
}

type replacer = null | {
  Replace(s: string): string
  WriteString(w: io.Writer, s: string): [number, $.GoError]
}

$.registerInterfaceType(
  'replacer',
  null, // Zero value for interface is null
  [
    {
      name: 'Replace',
      args: [{ name: 's', type: { kind: $.TypeKind.Basic, name: 'string' } }],
      returns: [{ type: { kind: $.TypeKind.Basic, name: 'string' } }],
    },
    {
      name: 'WriteString',
      args: [
        { name: 'w', type: 'Writer' },
        { name: 's', type: { kind: $.TypeKind.Basic, name: 'string' } },
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
  ],
)

// NewReplacer returns a new [Replacer] from a list of old, new string
// pairs. Replacements are performed in the order they appear in the
// target string, without overlapping matches. The old string
// comparisons are done in argument order.
//
// NewReplacer panics if given an odd number of arguments.
export function NewReplacer(...oldnew: string[]): Replacer | null {
  if ($.len(oldnew) % 2 == 1) {
    $.panic('strings.NewReplacer: odd argument count')
  }
  return new Replacer({ oldnew: $.append(null, ...oldnew) })
}

class trieNode {
  // value is the value of the trie node's key/value pair. It is empty if
  // this node is not a complete key.
  public get value(): string {
    return this._fields.value.value
  }
  public set value(value: string) {
    this._fields.value.value = value
  }

  // priority is the priority (higher is more important) of the trie node's
  // key/value pair; keys are not necessarily matched shortest- or longest-
  // first. Priority is positive if this node is a complete key, and zero
  // otherwise. In the example above, positive/zero priorities are marked
  // with a trailing "+" or "-".
  public get priority(): number {
    return this._fields.priority.value
  }
  public set priority(value: number) {
    this._fields.priority.value = value
  }

  // prefix is the difference in keys between this trie node and the next.
  // In the example above, node n4 has prefix "cbc" and n4's next node is n5.
  // Node n5 has no children and so has zero prefix, next and table fields.
  public get prefix(): string {
    return this._fields.prefix.value
  }
  public set prefix(value: string) {
    this._fields.prefix.value = value
  }

  public get next(): trieNode | null {
    return this._fields.next.value
  }
  public set next(value: trieNode | null) {
    this._fields.next.value = value
  }

  // table is a lookup table indexed by the next byte in the key, after
  // remapping that byte through genericReplacer.mapping to create a dense
  // index. In the example above, the keys only use 'a', 'b', 'c', 'x' and
  // 'y', which remap to 0, 1, 2, 3 and 4. All other bytes remap to 5, and
  // genericReplacer.tableSize will be 5. Node n0's table will be
  // []*trieNode{ 0:n1, 1:n4, 3:n6 }, where the 0, 1 and 3 are the remapped
  // 'a', 'b' and 'x'.
  public get table(): $.Slice<trieNode | null> {
    return this._fields.table.value
  }
  public set table(value: $.Slice<trieNode | null>) {
    this._fields.table.value = value
  }

  public _fields: {
    value: $.VarRef<string>
    priority: $.VarRef<number>
    prefix: $.VarRef<string>
    next: $.VarRef<trieNode | null>
    table: $.VarRef<$.Slice<trieNode | null>>
  }

  constructor(
    init?: Partial<{
      next?: trieNode | null
      prefix?: string
      priority?: number
      table?: $.Slice<trieNode | null>
      value?: string
    }>,
  ) {
    this._fields = {
      value: $.varRef(init?.value ?? ''),
      priority: $.varRef(init?.priority ?? 0),
      prefix: $.varRef(init?.prefix ?? ''),
      next: $.varRef(init?.next ?? null),
      table: $.varRef(init?.table ?? null),
    }
  }

  public clone(): trieNode {
    const cloned = new trieNode()
    cloned._fields = {
      value: $.varRef(this._fields.value.value),
      priority: $.varRef(this._fields.priority.value),
      prefix: $.varRef(this._fields.prefix.value),
      next: $.varRef(this._fields.next.value),
      table: $.varRef(this._fields.table.value),
    }
    return cloned
  }

  public add(
    key: string,
    val: string,
    priority: number,
    r: genericReplacer | null,
  ): void {
    const t = this
    if (key == '') {
      if (t!.priority == 0) {
        t!.value = val
        t!.priority = priority
      }
      return
    }
    if (t!.prefix != '') {
      // Need to split the prefix among multiple nodes.
      // length of the longest common prefix
      let n: number = 0
      for (; n < $.len(t!.prefix) && n < $.len(key); n++) {
        if ($.indexString(t!.prefix, n) != $.indexString(key, n)) {
          break
        }
      }

      // First byte differs, start a new lookup table here. Looking up
      // what is currently t.prefix[0] will lead to prefixNode, and
      // looking up key[0] will lead to keyNode.

      // Insert new node after the common section of the prefix.
      if (n == $.len(t!.prefix)) {
        t!.next!.add($.sliceString(key, n, undefined), val, priority, r)
      } else if (n == 0) {
        // First byte differs, start a new lookup table here. Looking up
        // what is currently t.prefix[0] will lead to prefixNode, and
        // looking up key[0] will lead to keyNode.
        let prefixNode: trieNode | null = null
        if ($.len(t!.prefix) == 1) {
          prefixNode = t!.next
        } else {
          prefixNode = new trieNode({
            next: t!.next,
            prefix: $.sliceString(t!.prefix, 1, undefined),
          })
        }
        let keyNode = new trieNode()
        t!.table = $.makeSlice<trieNode | null>(r!.tableSize)
        t!.table![r!.mapping![$.indexString(t!.prefix, 0)]] = prefixNode
        t!.table![r!.mapping![$.indexString(key, 0)]] = keyNode
        t!.prefix = ''
        t!.next = null
        keyNode!.add($.sliceString(key, 1, undefined), val, priority, r)
      } else {
        // Insert new node after the common section of the prefix.
        let next = new trieNode({
          next: t!.next,
          prefix: $.sliceString(t!.prefix, n, undefined),
        })
        t!.prefix = $.sliceString(t!.prefix, undefined, n)
        t!.next = next
        next!.add($.sliceString(key, n, undefined), val, priority, r)
      }
    } else if (t!.table != null) {
      // Insert into existing table.
      let m = r!.mapping![$.indexString(key, 0)]
      if (t!.table![m] == null) {
        t!.table![m] = new trieNode()
      }
      t!.table![m]!.add($.sliceString(key, 1, undefined), val, priority, r)
    } else {
      t!.prefix = key
      t!.next = new trieNode()
      t!.next!.add('', val, priority, r)
    }
  }

  // Register this type with the runtime type system
  static __typeInfo = $.registerStructType(
    'trieNode',
    new trieNode(),
    [
      {
        name: 'add',
        args: [
          { name: 'key', type: { kind: $.TypeKind.Basic, name: 'string' } },
          { name: 'val', type: { kind: $.TypeKind.Basic, name: 'string' } },
          {
            name: 'priority',
            type: { kind: $.TypeKind.Basic, name: 'number' },
          },
          {
            name: 'r',
            type: { kind: $.TypeKind.Pointer, elemType: 'genericReplacer' },
          },
        ],
        returns: [],
      },
    ],
    trieNode,
    {
      value: { kind: $.TypeKind.Basic, name: 'string' },
      priority: { kind: $.TypeKind.Basic, name: 'number' },
      prefix: { kind: $.TypeKind.Basic, name: 'string' },
      next: { kind: $.TypeKind.Pointer, elemType: 'trieNode' },
      table: {
        kind: $.TypeKind.Slice,
        elemType: { kind: $.TypeKind.Pointer, elemType: 'trieNode' },
      },
    },
  )
}

class genericReplacer {
  public get root(): trieNode {
    return this._fields.root.value
  }
  public set root(value: trieNode) {
    this._fields.root.value = value
  }

  // tableSize is the size of a trie node's lookup table. It is the number
  // of unique key bytes.
  public get tableSize(): number {
    return this._fields.tableSize.value
  }
  public set tableSize(value: number) {
    this._fields.tableSize.value = value
  }

  // mapping maps from key bytes to a dense index for trieNode.table.
  public get mapping(): number[] {
    return this._fields.mapping.value
  }
  public set mapping(value: number[]) {
    this._fields.mapping.value = value
  }

  public _fields: {
    root: $.VarRef<trieNode>
    tableSize: $.VarRef<number>
    mapping: $.VarRef<number[]>
  }

  constructor(
    init?: Partial<{ mapping?: number[]; root?: trieNode; tableSize?: number }>,
  ) {
    this._fields = {
      root: $.varRef(init?.root?.clone() ?? new trieNode()),
      tableSize: $.varRef(init?.tableSize ?? 0),
      mapping: $.varRef(
        init?.mapping ?? [
          0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
          0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
          0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
          0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
          0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
          0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
          0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
          0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
          0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
          0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
          0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
          0, 0, 0,
        ],
      ),
    }
  }

  public clone(): genericReplacer {
    const cloned = new genericReplacer()
    cloned._fields = {
      root: $.varRef(this._fields.root.value?.clone() ?? null),
      tableSize: $.varRef(this._fields.tableSize.value),
      mapping: $.varRef(this._fields.mapping.value),
    }
    return cloned
  }

  public lookup(s: string, ignoreRoot: boolean): [string, number, boolean] {
    const r = this
    let bestPriority = 0
    let node = r!.root
    let n = 0
    let val: string = ''
    let keylen: number = 0
    let found: boolean = false
    for (; node != null; ) {
      if (node!.priority > bestPriority && !(ignoreRoot && node === r!.root)) {
        bestPriority = node!.priority
        val = node!.value
        keylen = n
        found = true
      }

      if (s == '') {
        break
      }
      if (node!.table != null) {
        let index = r!.mapping![$.indexString(s, 0)]
        if ((index as number) == r!.tableSize) {
          break
        }
        node = node!.table![index]!
        s = $.sliceString(s, 1, undefined)
        n++
      } else if (node!.prefix != '' && HasPrefix(s, node!.prefix)) {
        n += $.len(node!.prefix)
        s = $.sliceString(s, $.len(node!.prefix), undefined)
        node = node!.next!
      } else {
        break
      }
    }
    return [val, keylen, found]
  }

  public Replace(s: string): string {
    const r = this
    let result = ''
    let last = 0
    for (let i = 0; i <= $.len(s); ) {
      // Fast path: s[i] is not a prefix of any pattern.
      if (i != $.len(s) && r!.root.priority == 0) {
        let index = r!.mapping![$.indexString(s, i)] as number
        if (index == r!.tableSize || r!.root.table![index] == null) {
          i++
          continue
        }
      }

      // Ignore the empty match iff the previous loop found the empty match.
      let [val, keylen, match] = r!.lookup(
        $.sliceString(s, i, undefined),
        false,
      )
      if (match) {
        result += $.sliceString(s, last, i)
        result += val
        i += keylen
        last = i
        continue
      }
      i++
    }
    if (last != $.len(s)) {
      result += $.sliceString(s, last, undefined)
    }
    return result
  }

  public WriteString(w: io.Writer, s: string): [number, $.GoError] {
    const r = this
    let sw = getStringWriter(w)
    let last: number = 0
    let wn: number = 0
    let n: number = 0
    let err: $.GoError | null = null
    let prevMatchEmpty: boolean = false
    for (let i = 0; i <= $.len(s); ) {
      // Fast path: s[i] is not a prefix of any pattern.
      if (i != $.len(s) && r!.root.priority == 0) {
        let index = r!.mapping![$.indexString(s, i)] as number
        if (index == r!.tableSize || r!.root.table![index] == null) {
          i++
          continue
        }
      }

      // Ignore the empty match iff the previous loop found the empty match.
      let [val, keylen, match] = r!.lookup(
        $.sliceString(s, i, undefined),
        prevMatchEmpty,
      )
      prevMatchEmpty = match && keylen == 0
      if (match) {
        ;[wn, err] = sw!.WriteString($.sliceString(s, last, i))
        n += wn
        if (err != null) {
          return [n, err]
        }
        ;[wn, err] = sw!.WriteString(val)
        n += wn
        if (err != null) {
          return [n, err]
        }
        i += keylen
        last = i
        continue
      }
      i++
    }
    if (last != $.len(s)) {
      ;[wn, err] = sw!.WriteString($.sliceString(s, last, undefined))
      n += wn
    }
    return [n, err]
  }

  // Register this type with the runtime type system
  static __typeInfo = $.registerStructType(
    'genericReplacer',
    new genericReplacer(),
    [
      {
        name: 'lookup',
        args: [
          { name: 's', type: { kind: $.TypeKind.Basic, name: 'string' } },
          {
            name: 'ignoreRoot',
            type: { kind: $.TypeKind.Basic, name: 'boolean' },
          },
        ],
        returns: [
          { type: { kind: $.TypeKind.Basic, name: 'string' } },
          { type: { kind: $.TypeKind.Basic, name: 'number' } },
          { type: { kind: $.TypeKind.Basic, name: 'boolean' } },
        ],
      },
      {
        name: 'Replace',
        args: [{ name: 's', type: { kind: $.TypeKind.Basic, name: 'string' } }],
        returns: [{ type: { kind: $.TypeKind.Basic, name: 'string' } }],
      },
      {
        name: 'WriteString',
        args: [
          { name: 'w', type: 'Writer' },
          { name: 's', type: { kind: $.TypeKind.Basic, name: 'string' } },
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
    genericReplacer,
    {
      root: 'trieNode',
      tableSize: { kind: $.TypeKind.Basic, name: 'number' },
      mapping: {
        kind: $.TypeKind.Array,
        length: 256,
        elemType: { kind: $.TypeKind.Basic, name: 'number' },
      },
    },
  )
}

export function makeGenericReplacer(
  oldnew: $.Slice<string>,
): genericReplacer | null {
  let r = new genericReplacer()
  // Find each byte used, then assign them each an index.
  for (let i = 0; i < $.len(oldnew); i += 2) {
    let key = oldnew![i]
    for (let j = 0; j < $.len(key); j++) {
      r!.mapping![$.indexString(key, j)] = 1
    }
  }

  for (let _i = 0; _i < $.len(r!.mapping); _i++) {
    const b = r!.mapping![_i]
    {
      r!.tableSize += b as number
    }
  }

  let index: number = 0
  for (let i = 0; i < $.len(r!.mapping); i++) {
    const b = r!.mapping![i]
    {
      if (b == 0) {
        r!.mapping![i] = $.byte(r!.tableSize)
      } else {
        r!.mapping![i] = index
        index++
      }
    }
  }
  // Ensure root node uses a lookup table (for performance).
  r!.root.table = $.makeSlice<trieNode | null>(r!.tableSize)

  for (let i = 0; i < $.len(oldnew); i += 2) {
    r!.root.add(oldnew![i], oldnew![i + 1], $.len(oldnew) - i, r)
  }
  return r
}

type appendSliceWriter = Uint8Array

class stringWriter {
  public get w(): io.Writer {
    return this._fields.w.value
  }
  public set w(value: io.Writer) {
    this._fields.w.value = value
  }

  public _fields: {
    w: $.VarRef<io.Writer>
  }

  constructor(init?: Partial<{ w?: io.Writer }>) {
    this._fields = {
      w: $.varRef(init?.w!),
    }
  }

  public clone(): stringWriter {
    const cloned = new stringWriter()
    cloned._fields = {
      w: $.varRef(this._fields.w.value),
    }
    return cloned
  }

  public WriteString(s: string): [number, $.GoError] {
    const w = this
    return w.w!.Write($.stringToBytes(s))
  }

  // Register this type with the runtime type system
  static __typeInfo = $.registerStructType(
    'stringWriter',
    new stringWriter(),
    [
      {
        name: 'WriteString',
        args: [{ name: 's', type: { kind: $.TypeKind.Basic, name: 'string' } }],
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
    stringWriter,
    { w: 'Writer' },
  )
}

export function getStringWriter(w: io.Writer): io.StringWriter {
  let { value: sw, ok: ok } = $.typeAssert<io.StringWriter>(
    w,
    'io.StringWriter',
  )
  if (!ok) {
    sw = new stringWriter({ w: w })
  }
  return sw
}

class singleStringReplacer {
  public get finder(): stringFinder | null {
    return this._fields.finder.value
  }
  public set finder(value: stringFinder | null) {
    this._fields.finder.value = value
  }

  // value is the new string that replaces that pattern when it's found.
  public get value(): string {
    return this._fields.value.value
  }
  public set value(value: string) {
    this._fields.value.value = value
  }

  public _fields: {
    finder: $.VarRef<stringFinder | null>
    value: $.VarRef<string>
  }

  constructor(
    init?: Partial<{ finder?: stringFinder | null; value?: string }>,
  ) {
    this._fields = {
      finder: $.varRef(init?.finder ?? null),
      value: $.varRef(init?.value ?? ''),
    }
  }

  public clone(): singleStringReplacer {
    const cloned = new singleStringReplacer()
    cloned._fields = {
      finder: $.varRef(this._fields.finder.value),
      value: $.varRef(this._fields.value.value),
    }
    return cloned
  }

  public Replace(s: string): string {
    const r = this
    let buf: Builder = new Builder()
    let [i, matched] = [0, false]
    for (;;) {
      let match = r!.finder!.next($.sliceString(s, i, undefined))
      if (match == -1) {
        break
      }
      matched = true
      buf.Grow(match + $.len(r!.value))
      buf.WriteString($.sliceString(s, i, i + match))
      buf.WriteString(r!.value)
      i += match + $.len(r!.finder!.pattern)
    }
    if (!matched) {
      return s
    }
    buf.WriteString($.sliceString(s, i, undefined))
    return buf.String()
  }

  public WriteString(w: io.Writer, s: string): [number, $.GoError] {
    const r = this
    let sw = getStringWriter(w)
    let i: number = 0
    let wn: number = 0
    let n: number = 0
    let err: $.GoError | null = null
    for (;;) {
      let match = r!.finder!.next($.sliceString(s, i, undefined))
      if (match == -1) {
        break
      }
      ;[wn, err] = sw!.WriteString($.sliceString(s, i, i + match))
      n += wn
      if (err != null) {
        return [n, err]
      }
      ;[wn, err] = sw!.WriteString(r!.value)
      n += wn
      if (err != null) {
        return [n, err]
      }
      i += match + $.len(r!.finder!.pattern)
    }
    ;[wn, err] = sw!.WriteString($.sliceString(s, i, undefined))
    n += wn
    return [n, err]
  }

  // Register this type with the runtime type system
  static __typeInfo = $.registerStructType(
    'singleStringReplacer',
    new singleStringReplacer(),
    [
      {
        name: 'Replace',
        args: [{ name: 's', type: { kind: $.TypeKind.Basic, name: 'string' } }],
        returns: [{ type: { kind: $.TypeKind.Basic, name: 'string' } }],
      },
      {
        name: 'WriteString',
        args: [
          { name: 'w', type: 'Writer' },
          { name: 's', type: { kind: $.TypeKind.Basic, name: 'string' } },
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
    singleStringReplacer,
    {
      finder: { kind: $.TypeKind.Pointer, elemType: 'stringFinder' },
      value: { kind: $.TypeKind.Basic, name: 'string' },
    },
  )
}

export function makeSingleStringReplacer(
  pattern: string,
  value: string,
): singleStringReplacer | null {
  return new singleStringReplacer({
    finder: makeStringFinder(pattern),
    value: value,
  })
}

type byteReplacer = number[]

class byteStringReplacer {
  // replacements contains replacement byte slices indexed by old byte.
  // A nil []byte means that the old byte should not be replaced.
  public get replacements(): Uint8Array[] {
    return this._fields.replacements.value
  }
  public set replacements(value: Uint8Array[]) {
    this._fields.replacements.value = value
  }

  // toReplace keeps a list of bytes to replace. Depending on length of toReplace
  // and length of target string it may be faster to use Count, or a plain loop.
  // We store single byte as a string, because Count takes a string.
  public get toReplace(): $.Slice<string> {
    return this._fields.toReplace.value
  }
  public set toReplace(value: $.Slice<string>) {
    this._fields.toReplace.value = value
  }

  public _fields: {
    replacements: $.VarRef<Uint8Array[]>
    toReplace: $.VarRef<$.Slice<string>>
  }

  constructor(
    init?: Partial<{
      replacements?: Uint8Array[]
      toReplace?: $.Slice<string>
    }>,
  ) {
    this._fields = {
      replacements: $.varRef(
        init?.replacements ?? [
          new Uint8Array(0),
          new Uint8Array(0),
          new Uint8Array(0),
          new Uint8Array(0),
          new Uint8Array(0),
          new Uint8Array(0),
          new Uint8Array(0),
          new Uint8Array(0),
          new Uint8Array(0),
          new Uint8Array(0),
          new Uint8Array(0),
          new Uint8Array(0),
          new Uint8Array(0),
          new Uint8Array(0),
          new Uint8Array(0),
          new Uint8Array(0),
          new Uint8Array(0),
          new Uint8Array(0),
          new Uint8Array(0),
          new Uint8Array(0),
          new Uint8Array(0),
          new Uint8Array(0),
          new Uint8Array(0),
          new Uint8Array(0),
          new Uint8Array(0),
          new Uint8Array(0),
          new Uint8Array(0),
          new Uint8Array(0),
          new Uint8Array(0),
          new Uint8Array(0),
          new Uint8Array(0),
          new Uint8Array(0),
          new Uint8Array(0),
          new Uint8Array(0),
          new Uint8Array(0),
          new Uint8Array(0),
          new Uint8Array(0),
          new Uint8Array(0),
          new Uint8Array(0),
          new Uint8Array(0),
          new Uint8Array(0),
          new Uint8Array(0),
          new Uint8Array(0),
          new Uint8Array(0),
          new Uint8Array(0),
          new Uint8Array(0),
          new Uint8Array(0),
          new Uint8Array(0),
          new Uint8Array(0),
          new Uint8Array(0),
          new Uint8Array(0),
          new Uint8Array(0),
          new Uint8Array(0),
          new Uint8Array(0),
          new Uint8Array(0),
          new Uint8Array(0),
          new Uint8Array(0),
          new Uint8Array(0),
          new Uint8Array(0),
          new Uint8Array(0),
          new Uint8Array(0),
          new Uint8Array(0),
          new Uint8Array(0),
          new Uint8Array(0),
          new Uint8Array(0),
          new Uint8Array(0),
          new Uint8Array(0),
          new Uint8Array(0),
          new Uint8Array(0),
          new Uint8Array(0),
          new Uint8Array(0),
          new Uint8Array(0),
          new Uint8Array(0),
          new Uint8Array(0),
          new Uint8Array(0),
          new Uint8Array(0),
          new Uint8Array(0),
          new Uint8Array(0),
          new Uint8Array(0),
          new Uint8Array(0),
          new Uint8Array(0),
          new Uint8Array(0),
          new Uint8Array(0),
          new Uint8Array(0),
          new Uint8Array(0),
          new Uint8Array(0),
          new Uint8Array(0),
          new Uint8Array(0),
          new Uint8Array(0),
          new Uint8Array(0),
          new Uint8Array(0),
          new Uint8Array(0),
          new Uint8Array(0),
          new Uint8Array(0),
          new Uint8Array(0),
          new Uint8Array(0),
          new Uint8Array(0),
          new Uint8Array(0),
          new Uint8Array(0),
          new Uint8Array(0),
          new Uint8Array(0),
          new Uint8Array(0),
          new Uint8Array(0),
          new Uint8Array(0),
          new Uint8Array(0),
          new Uint8Array(0),
          new Uint8Array(0),
          new Uint8Array(0),
          new Uint8Array(0),
          new Uint8Array(0),
          new Uint8Array(0),
          new Uint8Array(0),
          new Uint8Array(0),
          new Uint8Array(0),
          new Uint8Array(0),
          new Uint8Array(0),
          new Uint8Array(0),
          new Uint8Array(0),
          new Uint8Array(0),
          new Uint8Array(0),
          new Uint8Array(0),
          new Uint8Array(0),
          new Uint8Array(0),
          new Uint8Array(0),
          new Uint8Array(0),
          new Uint8Array(0),
          new Uint8Array(0),
          new Uint8Array(0),
          new Uint8Array(0),
        ],
      ),
      toReplace: $.varRef(init?.toReplace ?? null),
    }
  }

  public clone(): byteStringReplacer {
    const cloned = new byteStringReplacer()
    cloned._fields = {
      replacements: $.varRef(this._fields.replacements.value),
      toReplace: $.varRef(this._fields.toReplace.value),
    }
    return cloned
  }

  public Replace(s: string): string {
    const r = this
    let newSize = $.len(s)
    let anyChanges = false
    if ($.len(r!.toReplace) * 8 <= $.len(s)) {
      // The -1 is because we are replacing 1 byte with len(replacements[b]) bytes.
      for (let _i = 0; _i < $.len(r!.toReplace); _i++) {
        const x = r!.toReplace![_i]
        {
          // The -1 is because we are replacing 1 byte with len(replacements[b]) bytes.
          {
            let c = Count(s, x)
            if (c != 0) {
              // The -1 is because we are replacing 1 byte with len(replacements[b]) bytes.
              newSize += c * ($.len(r!.replacements![$.indexString(x, 0)]) - 1)
              anyChanges = true
            }
          }
        }
      }
    } else {
      // See above for explanation of -1
      for (let i = 0; i < $.len(s); i++) {
        let b = $.indexString(s, i)

        // See above for explanation of -1
        if (r!.replacements![b] != null) {
          // See above for explanation of -1
          newSize += $.len(r!.replacements![b]) - 1
          anyChanges = true
        }
      }
    }
    if (!anyChanges) {
      return s
    }
    let buf = new Uint8Array(newSize)
    let j = 0
    for (let i = 0; i < $.len(s); i++) {
      let b = $.indexString(s, i)
      if (r!.replacements![b] != null) {
        j += copy(buf.subarray(j), r!.replacements![b])
      } else {
        buf![j] = b
        j++
      }
    }
    return $.bytesToString(buf)
  }

  public WriteString(w: io.Writer, s: string): [number, $.GoError] {
    const r = this
    let sw = getStringWriter(w)
    let last = 0
    let n: number = 0
    let err: $.GoError | null = null
    for (let i = 0; i < $.len(s); i++) {
      let b = $.indexString(s, i)
      if (r!.replacements![b] == null) {
        continue
      }
      if (last != i) {
        let [nw, err] = sw!.WriteString($.sliceString(s, last, i))
        n += nw
        if (err != null) {
          return [n, err]
        }
      }
      last = i + 1
      let [nw, err] = w!.Write(r!.replacements![b])
      n += nw
      if (err != null) {
        return [n, err]
      }
    }
    if (last != $.len(s)) {
      let [nw, err] = sw!.WriteString($.sliceString(s, last, undefined))
      n += nw
    }
    return [n, err]
  }

  // Register this type with the runtime type system
  static __typeInfo = $.registerStructType(
    'byteStringReplacer',
    new byteStringReplacer(),
    [
      {
        name: 'Replace',
        args: [{ name: 's', type: { kind: $.TypeKind.Basic, name: 'string' } }],
        returns: [{ type: { kind: $.TypeKind.Basic, name: 'string' } }],
      },
      {
        name: 'WriteString',
        args: [
          { name: 'w', type: 'Writer' },
          { name: 's', type: { kind: $.TypeKind.Basic, name: 'string' } },
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
    byteStringReplacer,
    {
      replacements: {
        kind: $.TypeKind.Array,
        length: 256,
        elemType: {
          kind: $.TypeKind.Slice,
          elemType: { kind: $.TypeKind.Basic, name: 'number' },
        },
      },
      toReplace: {
        kind: $.TypeKind.Slice,
        elemType: { kind: $.TypeKind.Basic, name: 'string' },
      },
    },
  )
}

let countCutOff: number = 8

// Helper function to copy bytes
function copy(dst: Uint8Array, src: Uint8Array): number {
  const n = Math.min(dst.length, src.length)
  for (let i = 0; i < n; i++) {
    dst[i] = src[i]
  }
  return n
}

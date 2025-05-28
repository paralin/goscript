import * as $ from '@goscript/builtin/builtin.js'
import { Type } from './type.js'
import { StructField } from './types.js'

// VisibleFields returns all the visible fields in t, which must be a
// struct type. A field is defined as visible if it's accessible
// directly with a FieldByName call. The returned fields include fields
// inside anonymous struct members and unexported fields. They follow
// the same order found in the struct, with anonymous fields followed
// immediately by their promoted fields.
//
// For each element e of the returned slice, the corresponding field
// can be retrieved from a value v of type t by calling v.FieldByIndex(e.Index).
export function VisibleFields(t: Type): $.Slice<StructField> {
  if (t == null) {
    $.panic('reflect: VisibleFields(nil)')
  }
  if (t!.Kind().valueOf() != 25) {
    $.panic('reflect.VisibleFields of non-struct type ' + t!.String())
  }
  let w = new visibleFieldsWalker({
    byName: $.makeMap<string, number>(),
    fields: $.makeSlice<StructField>(0, t!.NumField!()),
    index: $.makeSlice<number>(0, 2, 'number'),
    visiting: $.makeMap<Type, boolean>(),
  })
  w.walk(t)
  // Remove all the fields that have been hidden.
  // Use an in-place removal that avoids copying in
  // the common case that there are no hidden fields.
  let j = 0

  // A field has been removed. We need to shuffle
  // all the subsequent elements up.
  for (let i = 0; i < $.len(w.fields); i++) {
    {
      let f = w.fields![i]
      if (f!.Name == '') {
        continue
      }

      // A field has been removed. We need to shuffle
      // all the subsequent elements up.
      if (i != j) {
        // A field has been removed. We need to shuffle
        // all the subsequent elements up.
        w.fields![j] = f!.clone()
      }
      j++
    }
  }
  return $.goSlice(w.fields, undefined, j)
}

class visibleFieldsWalker {
  public get byName(): Map<string, number> {
    return this._fields.byName.value
  }
  public set byName(value: Map<string, number>) {
    this._fields.byName.value = value
  }

  public get visiting(): Map<Type, boolean> {
    return this._fields.visiting.value
  }
  public set visiting(value: Map<Type, boolean>) {
    this._fields.visiting.value = value
  }

  public get fields(): $.Slice<StructField> {
    return this._fields.fields.value
  }
  public set fields(value: $.Slice<StructField>) {
    this._fields.fields.value = value
  }

  public get index(): $.Slice<number> {
    return this._fields.index.value
  }
  public set index(value: $.Slice<number>) {
    this._fields.index.value = value
  }

  public _fields: {
    byName: $.VarRef<Map<string, number>>
    visiting: $.VarRef<Map<Type, boolean>>
    fields: $.VarRef<$.Slice<StructField>>
    index: $.VarRef<$.Slice<number>>
  }

  constructor(
    init?: Partial<{
      byName?: Map<string, number>
      fields?: $.Slice<StructField>
      index?: $.Slice<number>
      visiting?: Map<Type, boolean>
    }>,
  ) {
    this._fields = {
      byName: $.varRef(init?.byName ?? $.makeMap<string, number>()),
      visiting: $.varRef(init?.visiting ?? $.makeMap<Type, boolean>()),
      fields: $.varRef(init?.fields ?? $.makeSlice<StructField>(0, 0)),
      index: $.varRef(init?.index ?? $.makeSlice<number>(0, 2, 'number')),
    }
  }

  public clone(): visibleFieldsWalker {
    const cloned = new visibleFieldsWalker()
    cloned._fields = {
      byName: $.varRef(this._fields.byName.value),
      visiting: $.varRef(this._fields.visiting.value),
      fields: $.varRef(this._fields.fields.value),
      index: $.varRef(this._fields.index.value),
    }
    return cloned
  }

  // walk walks all the fields in the struct type t, visiting
  // fields in index preorder and appending them to w.fields
  // (this maintains the required ordering).
  // Fields that have been overridden have their
  // Name field cleared.
  public walk(t: Type): void {
    const w = this
    if ($.mapGet(w.visiting, t, false)[0]) {
      return
    }
    $.mapSet(w.visiting, t, true)
    for (let i = 0; i < t!.NumField!(); i++) {
      let f = t!.Field!(i).clone()
      f.Index = $.append(null, w.index) as number[]
      if (f.Anonymous) {
        let t = f.Type
        if (f.Type!.Kind().valueOf() == 22) {
          const elemType = f.Type!.Elem!()
          if (elemType) {
            f.Type = elemType
          }
        }
        if (f.Type!.Kind().valueOf() == 25) {
          w.walk(f.Type)
        }
      } else {
        w.fields = $.append(w.fields, f)
      }
    }
    $.deleteMapEntry(w.visiting, t)
  }

  // Register this type with the runtime type system
  static __typeInfo = $.registerStructType(
    'visibleFieldsWalker',
    new visibleFieldsWalker(),
    [{ name: 'walk', args: [{ name: 't', type: 'Type' }], returns: [] }],
    visibleFieldsWalker,
    {
      byName: {
        kind: $.TypeKind.Map,
        keyType: { kind: $.TypeKind.Basic, name: 'string' },
        elemType: { kind: $.TypeKind.Basic, name: 'number' },
      },
      visiting: {
        kind: $.TypeKind.Map,
        keyType: 'Type',
        elemType: { kind: $.TypeKind.Basic, name: 'boolean' },
      },
      fields: { kind: $.TypeKind.Slice, elemType: 'StructField' },
      index: {
        kind: $.TypeKind.Slice,
        elemType: { kind: $.TypeKind.Basic, name: 'number' },
      },
    },
  )
}

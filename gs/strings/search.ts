import * as $ from '@goscript/builtin/builtin.js'
import { HasPrefix } from './strings.gs.js'

class stringFinder {
  // pattern is the string that we are searching for in the text.
  public get pattern(): string {
    return this._fields.pattern.value
  }
  public set pattern(value: string) {
    this._fields.pattern.value = value
  }

  // badCharSkip[b] contains the distance between the last byte of pattern
  // and the rightmost occurrence of b in pattern. If b is not in pattern,
  // badCharSkip[b] is len(pattern).
  //
  // Whenever a mismatch is found with byte b in the text, we can safely
  // shift the matching frame at least badCharSkip[b] until the next time
  // the matching char could be in alignment.
  public get badCharSkip(): number[] {
    return this._fields.badCharSkip.value
  }
  public set badCharSkip(value: number[]) {
    this._fields.badCharSkip.value = value
  }

  // goodSuffixSkip[i] defines how far we can shift the matching frame given
  // that the suffix pattern[i+1:] matches, but the byte pattern[i] does
  // not. There are two cases to consider:
  //
  // 1. The matched suffix occurs elsewhere in pattern (with a different
  // byte preceding it that we might possibly match). In this case, we can
  // shift the matching frame to align with the next suffix chunk. For
  // example, the pattern "mississi" has the suffix "issi" next occurring
  // (in right-to-left order) at index 1, so goodSuffixSkip[3] ==
  // shift+len(suffix) == 3+4 == 7.
  //
  // 2. If the matched suffix does not occur elsewhere in pattern, then the
  // matching frame may share part of its prefix with the end of the
  // matching suffix. In this case, goodSuffixSkip[i] will contain how far
  // to shift the frame to align this portion of the prefix to the
  // suffix. For example, in the pattern "abcxxxabc", when the first
  // mismatch from the back is found to be in position 3, the matching
  // suffix "xxabc" is not found elsewhere in the pattern. However, its
  // rightmost "abc" (at position 6) is a prefix of the whole pattern, so
  // goodSuffixSkip[3] == shift+len(suffix) == 6+5 == 11.
  public get goodSuffixSkip(): $.Slice<number> {
    return this._fields.goodSuffixSkip.value
  }
  public set goodSuffixSkip(value: $.Slice<number>) {
    this._fields.goodSuffixSkip.value = value
  }

  public _fields: {
    pattern: $.VarRef<string>
    badCharSkip: $.VarRef<number[]>
    goodSuffixSkip: $.VarRef<$.Slice<number>>
  }

  constructor(
    init?: Partial<{
      badCharSkip?: number[]
      goodSuffixSkip?: $.Slice<number>
      pattern?: string
    }>,
  ) {
    this._fields = {
      pattern: $.varRef(init?.pattern ?? ''),
      badCharSkip: $.varRef(init?.badCharSkip ?? new Array(256).fill(0)),
      goodSuffixSkip: $.varRef(init?.goodSuffixSkip ?? null),
    }
  }

  public clone(): stringFinder {
    const cloned = new stringFinder()
    cloned._fields = {
      pattern: $.varRef(this._fields.pattern.value),
      badCharSkip: $.varRef(this._fields.badCharSkip.value),
      goodSuffixSkip: $.varRef(this._fields.goodSuffixSkip.value),
    }
    return cloned
  }

  // next returns the index in text of the first occurrence of the pattern. If
  // the pattern is not found, it returns -1.
  public next(text: string): number {
    const f = this
    let i = $.len(f!.pattern) - 1
    for (; i < $.len(text); ) {
      // Compare backwards from the end until the first unmatching character.
      let j = $.len(f!.pattern) - 1
      for (
        ;
        j >= 0 && $.indexString(text, i) == $.indexString(f!.pattern, j);

      ) {
        i--
        j--
      }

      // match
      if (j < 0) {
        return i + 1
      }
      i += max(f!.badCharSkip![$.indexString(text, i)], f!.goodSuffixSkip![j])
    }
    return -1
  }

  // Register this type with the runtime type system
  static __typeInfo = $.registerStructType(
    'stringFinder',
    new stringFinder(),
    [
      {
        name: 'next',
        args: [
          { name: 'text', type: { kind: $.TypeKind.Basic, name: 'string' } },
        ],
        returns: [{ type: { kind: $.TypeKind.Basic, name: 'number' } }],
      },
    ],
    stringFinder,
    {
      pattern: { kind: $.TypeKind.Basic, name: 'string' },
      badCharSkip: {
        kind: $.TypeKind.Array,
        length: 256,
        elemType: { kind: $.TypeKind.Basic, name: 'number' },
      },
      goodSuffixSkip: {
        kind: $.TypeKind.Slice,
        elemType: { kind: $.TypeKind.Basic, name: 'number' },
      },
    },
  )
}

export function makeStringFinder(pattern: string): stringFinder | null {
  let f = new stringFinder({
    goodSuffixSkip: $.makeSlice<number>($.len(pattern)),
    pattern: pattern,
  })
  // last is the index of the last character in the pattern.
  let last = $.len(pattern) - 1

  // Build bad character table.
  // Bytes not in the pattern can skip one pattern's length.
  for (let i = 0; i < $.len(f!.badCharSkip); i++) {
    {
      f!.badCharSkip![i] = $.len(pattern)
    }
  }
  // The loop condition is < instead of <= so that the last byte does not
  // have a zero distance to itself. Finding this byte out of place implies
  // that it is not in the last position.
  for (let i = 0; i < last; i++) {
    f!.badCharSkip![$.indexString(pattern, i)] = last - i
  }

  // Build good suffix table.
  // First pass: set each value to the next index which starts a prefix of
  // pattern.
  let lastPrefix = last

  // lastPrefix is the shift, and (last-i) is len(suffix).
  for (let i = last; i >= 0; i--) {
    if (HasPrefix(pattern, $.sliceString(pattern, i + 1, undefined))) {
      lastPrefix = i + 1
    }
    // lastPrefix is the shift, and (last-i) is len(suffix).
    f!.goodSuffixSkip![i] = lastPrefix + last - i
  }
  // Second pass: find repeats of pattern's suffix starting from the front.

  // (last-i) is the shift, and lenSuffix is len(suffix).
  for (let i = 0; i < last; i++) {
    let lenSuffix = longestCommonSuffix(
      pattern,
      $.sliceString(pattern, 1, i + 1),
    )

    // (last-i) is the shift, and lenSuffix is len(suffix).
    if (
      $.indexString(pattern, i - lenSuffix) !=
      $.indexString(pattern, last - lenSuffix)
    ) {
      // (last-i) is the shift, and lenSuffix is len(suffix).
      f!.goodSuffixSkip![last - lenSuffix] = lenSuffix + last - i
    }
  }

  return f
}

export function longestCommonSuffix(a: string, b: string): [number] {
  let i: number = 0
  {
    for (; i < $.len(a) && i < $.len(b); i++) {
      if (
        $.indexString(a, $.len(a) - 1 - i) != $.indexString(b, $.len(b) - 1 - i)
      ) {
        break
      }
    }
    return [i]
  }
}

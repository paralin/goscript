import * as $ from '@goscript/builtin/builtin.js'

import * as unsafe from '@goscript/unsafe/index.js'

export function HasPrefix(s: string, prefix: string): boolean {
  return (
    $.len(s) >= $.len(prefix) &&
    $.sliceString(s, undefined, $.len(prefix)) == prefix
  )
}

export function HasSuffix(s: string, suffix: string): boolean {
  return (
    $.len(s) >= $.len(suffix) &&
    $.sliceString(s, $.len(s) - $.len(suffix), undefined) == suffix
  )
}

export function IndexByte(s: string, c: number): number {
  const char = String.fromCharCode(c)
  return s.indexOf(char)
}

export function Index(s: string, substr: string): number {
  if (substr === '') {
    return 0
  }
  return s.indexOf(substr)
}

export function Cut(s: string, sep: string): [string, string, boolean] {
  let i = Index(s, sep)
  if (i >= 0) {
    return [
      $.sliceString(s, undefined, i),
      $.sliceString(s, i + $.len(sep), undefined),
      true,
    ]
  }
  return [s, '', false]
}

export function CutPrefix(s: string, prefix: string): [string, boolean] {
  if (!HasPrefix(s, prefix)) {
    return [s, false]
  }
  return [$.sliceString(s, $.len(prefix), undefined), true]
}

export function CutSuffix(s: string, suffix: string): [string, boolean] {
  if (!HasSuffix(s, suffix)) {
    return [s, false]
  }
  return [$.sliceString(s, undefined, $.len(s) - $.len(suffix)), true]
}

export function TrimPrefix(s: string, prefix: string): string {
  if (HasPrefix(s, prefix)) {
    return $.sliceString(s, $.len(prefix), undefined)
  }
  return s
}

export function TrimSuffix(s: string, suffix: string): string {
  if (HasSuffix(s, suffix)) {
    return $.sliceString(s, undefined, $.len(s) - $.len(suffix))
  }
  return s
}

export function Clone(s: string): string {
  if ($.len(s) == 0) {
    return ''
  }
  let b = new Uint8Array($.len(s))
  $.copy(b, s)
  return unsafe.String(b![0], $.len(b))
}

export function CopyBytes(b: Uint8Array, s: string): number {
  return $.copy(b, s)
}

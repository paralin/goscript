import * as $ from '@goscript/builtin/index.js'

// Type definitions
export type uintptr = number

export class Frame {
  constructor(private _value: uintptr) {}

  valueOf(): uintptr {
    return this._value
  }

  toString(): string {
    return String(this._value)
  }

  static from(value: uintptr): Frame {
    return new Frame(value)
  }

  // pc returns the program counter for this frame;
  // multiple frames may have the same PC value.
  public pc(): uintptr {
    return this._value - 1
  }

  // file returns the full path to the file that contains the
  // function for this Frame's pc.
  public file(): string {
    return 'unknown'
  }

  // line returns the line number of source code of the
  // function for this Frame's pc.
  public line(): number {
    return 0
  }

  // name returns the name of this function, if known.
  public name(): string {
    return 'unknown'
  }

  // MarshalText formats a stacktrace Frame as a text string.
  public MarshalText(): [$.Bytes, $.GoError] {
    const name = this.name()
    if (name == 'unknown') {
      return [new TextEncoder().encode(name), null]
    }
    return [
      new TextEncoder().encode(`${name} ${this.file()}:${this.line()}`),
      null,
    ]
  }
}

export class StackTrace {
  constructor(private _value: Frame[] | null) {}

  valueOf(): Frame[] | null {
    return this._value
  }

  toString(): string {
    return String(this._value)
  }

  static from(value: Frame[] | null): StackTrace {
    return new StackTrace(value)
  }
}

class stack {
  constructor(private _value: uintptr[]) {}

  valueOf(): uintptr[] {
    return this._value
  }

  toString(): string {
    return String(this._value)
  }

  static from(value: uintptr[]): stack {
    return new stack(value)
  }

  public StackTrace(): StackTrace {
    const s = this._value
    if (!s || s.length === 0) {
      return new StackTrace(null)
    }

    const frames: Frame[] = []
    for (let i = 0; i < s.length; i++) {
      frames.push(new Frame(s[i]))
    }
    return new StackTrace(frames)
  }
}

// callers returns a simplified stack trace using JavaScript's native stack
export function callers(): $.VarRef<stack> | null {
  try {
    // Get JavaScript stack trace
    throw new Error()
  } catch (e: any) {
    // Parse the stack trace to get some basic frame information
    const stackLines = e.stack ? e.stack.split('\n') : []

    // Create simplified frame data - just use line numbers as uintptr values
    const pcs: uintptr[] = []
    for (let i = 0; i < Math.min(stackLines.length, 8); i++) {
      pcs.push(i + 1) // Simple frame counter
    }

    const st = new stack(pcs)
    return $.varRef(st)
  }
}

// funcname extracts the function name from a full function path
export function funcname(name: string): string {
  const lastDot = name.lastIndexOf('.')
  if (lastDot >= 0) {
    return name.substring(lastDot + 1)
  }
  return name
}

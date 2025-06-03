// Handwritten TypeScript implementation of Go's fmt package
// Optimized for JavaScript runtime and simplified for common use cases

import * as $ from '@goscript/builtin/index.js'
import * as errors from '@goscript/errors/index.js'

// Basic interfaces
export interface Stringer {
  String(): string
}

export interface GoStringer {
  GoString(): string
}

export interface Formatter {
  Format(f: State, verb: number): void
}

export interface State {
  Flag(c: number): boolean
  Precision(): [number, boolean]
  Width(): [number, boolean]
  Write(b: Uint8Array): [number, $.GoError | null]
}

// Simple printf-style formatting implementation
function formatValue(value: any, verb: string): string {
  if (value === null || value === undefined) {
    return '<nil>'
  }

  switch (verb) {
    case 'v': // default format
      return defaultFormat(value)
    case 'd': // decimal integer
      return String(Math.floor(Number(value)))
    case 'f': // decimal point, no exponent
      return Number(value).toString()
    case 's': // string
      return String(value)
    case 't': // boolean
      return value ? 'true' : 'false'
    case 'T': // type
      return typeof value
    case 'c': // character (Unicode code point)
      return String.fromCharCode(Number(value))
    case 'x': // hexadecimal lowercase
      return Number(value).toString(16)
    case 'X': // hexadecimal uppercase
      return Number(value).toString(16).toUpperCase()
    case 'o': // octal
      return Number(value).toString(8)
    case 'b': // binary
      return Number(value).toString(2)
    case 'e': // scientific notation lowercase
      return Number(value).toExponential()
    case 'E': // scientific notation uppercase
      return Number(value).toExponential().toUpperCase()
    case 'g': // %e for large exponents, %f otherwise
      return Number(value).toPrecision()
    case 'G': // %E for large exponents, %F otherwise
      return Number(value).toPrecision().toUpperCase()
    case 'q': // quoted string
      return JSON.stringify(String(value))
    case 'p': // pointer (address)
      return '0x' + (value as any)?.__address?.toString(16) || '0'
    default:
      return String(value)
  }
}

function defaultFormat(value: any): string {
  if (value === null || value === undefined) return '<nil>'
  if (typeof value === 'boolean') return value ? 'true' : 'false'
  if (typeof value === 'number') return value.toString()
  if (typeof value === 'string') return value
  if (Array.isArray(value))
    return '[' + value.map(defaultFormat).join(' ') + ']'
  if (typeof value === 'object') {
    // Check for Stringer interface
    if (value.String && typeof value.String === 'function') {
      return value.String()
    }
    // Default object representation
    if (value.constructor?.name && value.constructor.name !== 'Object') {
      return `{${Object.entries(value)
        .map(([k, v]) => `${k}:${defaultFormat(v)}`)
        .join(' ')}}`
    }
    return JSON.stringify(value)
  }
  return String(value)
}

function parseFormat(format: string, args: any[]): string {
  let result = ''
  let argIndex = 0

  for (let i = 0; i < format.length; i++) {
    if (format[i] === '%') {
      if (i + 1 < format.length) {
        const nextChar = format[i + 1]
        if (nextChar === '%') {
          result += '%'
          i++ // skip the next %
          continue
        }

        // Parse format specifier
        let j = i + 1
        let width = ''
        let precision = ''
        let flags = ''

        // Parse flags (-, +, #, 0, space)
        while (j < format.length && '+-# 0'.includes(format[j])) {
          flags += format[j]
          j++
        }

        // Parse width
        while (j < format.length && format[j] >= '0' && format[j] <= '9') {
          width += format[j]
          j++
        }

        // Parse precision
        if (j < format.length && format[j] === '.') {
          j++
          while (j < format.length && format[j] >= '0' && format[j] <= '9') {
            precision += format[j]
            j++
          }
        }

        // Get the verb
        if (j < format.length) {
          const verb = format[j]

          if (argIndex < args.length) {
            let formatted = formatValue(args[argIndex], verb)

            // Apply width and precision formatting
            if (width && !precision) {
              const w = parseInt(width)
              if (flags.includes('-')) {
                formatted = formatted.padEnd(w)
              } else {
                formatted = formatted.padStart(
                  w,
                  flags.includes('0') ? '0' : ' ',
                )
              }
            } else if (
              precision &&
              (verb === 'f' || verb === 'e' || verb === 'g')
            ) {
              const p = parseInt(precision)
              const num = Number(args[argIndex])
              if (verb === 'f') {
                formatted = num.toFixed(p)
              } else if (verb === 'e') {
                formatted = num.toExponential(p)
              } else if (verb === 'g') {
                formatted = num.toPrecision(p)
              }

              if (width) {
                const w = parseInt(width)
                if (flags.includes('-')) {
                  formatted = formatted.padEnd(w)
                } else {
                  formatted = formatted.padStart(w)
                }
              }
            }

            result += formatted
            argIndex++
          } else {
            result += `%!${verb}(MISSING)`
          }

          i = j
        } else {
          result += format[i]
        }
      } else {
        result += format[i]
      }
    } else {
      result += format[i]
    }
  }

  return result
}

// Global stdout simulation for Print functions
let stdout = {
  write: (data: string) => {
    // Use process.stdout.write if available (Node.js), otherwise fallback to console.log
    // but we need to avoid adding extra newlines that console.log adds
    if (
      typeof process !== 'undefined' &&
      process.stdout &&
      process.stdout.write
    ) {
      process.stdout.write(data)
    } else {
      // In browser environments, we need to use console.log but handle newlines carefully
      // If the data already ends with \n, we should strip it to avoid double newlines
      if (data.endsWith('\n')) {
        console.log(data.slice(0, -1))
      } else {
        // Use console.log without adding newline by using a custom method
        if (console.log) {
          // For data without newlines, we can just print it directly
          // This is a bit of a hack but works for most cases
          console.log(data)
        }
      }
    }
  },
}

// Print functions
export function Print(...a: any[]): [number, $.GoError | null] {
  const result = a.map(defaultFormat).join(' ')
  stdout.write(result)
  return [result.length, null]
}

export function Printf(
  format: string,
  ...a: any[]
): [number, $.GoError | null] {
  const result = parseFormat(format, a)
  stdout.write(result)
  return [result.length, null]
}

export function Println(...a: any[]): [number, $.GoError | null] {
  const result = a.map(defaultFormat).join(' ') + '\n'
  stdout.write(result)
  return [result.length, null]
}

// Sprint functions (return strings)
export function Sprint(...a: any[]): string {
  return a.map(defaultFormat).join(' ')
}

export function Sprintf(format: string, ...a: any[]): string {
  return parseFormat(format, a)
}

export function Sprintln(...a: any[]): string {
  return a.map(defaultFormat).join(' ') + '\n'
}

// Fprint functions (write to Writer) - simplified implementation
export function Fprint(w: any, ...a: any[]): [number, $.GoError | null] {
  const result = a.map(defaultFormat).join(' ')
  if (w && w.Write) {
    return w.Write(new TextEncoder().encode(result))
  }
  return [0, $.newError('Writer does not implement Write method')]
}

export function Fprintf(
  w: any,
  format: string,
  ...a: any[]
): [number, $.GoError | null] {
  const result = parseFormat(format, a)
  if (w && w.Write) {
    return w.Write(new TextEncoder().encode(result))
  }
  return [0, $.newError('Writer does not implement Write method')]
}

export function Fprintln(w: any, ...a: any[]): [number, $.GoError | null] {
  const result = a.map(defaultFormat).join(' ') + '\n'
  if (w && w.Write) {
    return w.Write(new TextEncoder().encode(result))
  }
  return [0, $.newError('Writer does not implement Write method')]
}

// Append functions (append to byte slice)
export function Append(b: Uint8Array, ...a: any[]): Uint8Array {
  const result = a.map(defaultFormat).join(' ')
  const encoded = new TextEncoder().encode(result)
  const newArray = new Uint8Array(b.length + encoded.length)
  newArray.set(b)
  newArray.set(encoded, b.length)
  return newArray
}

export function Appendf(
  b: Uint8Array,
  format: string,
  ...a: any[]
): Uint8Array {
  const result = parseFormat(format, a)
  const encoded = new TextEncoder().encode(result)
  const newArray = new Uint8Array(b.length + encoded.length)
  newArray.set(b)
  newArray.set(encoded, b.length)
  return newArray
}

export function Appendln(b: Uint8Array, ...a: any[]): Uint8Array {
  const result = a.map(defaultFormat).join(' ') + '\n'
  const encoded = new TextEncoder().encode(result)
  const newArray = new Uint8Array(b.length + encoded.length)
  newArray.set(b)
  newArray.set(encoded, b.length)
  return newArray
}

// Error creation
export function Errorf(format: string, ...a: any[]): any {
  const message = parseFormat(format, a)
  return errors.New(message)
}

// FormatString - simplified implementation
export function FormatString(state: State, verb: number): string {
  let result = '%'

  // Add flags
  if (state.Flag(32)) result += ' ' // space
  if (state.Flag(43)) result += '+' // plus
  if (state.Flag(45)) result += '-' // minus
  if (state.Flag(35)) result += '#' // hash
  if (state.Flag(48)) result += '0' // zero

  // Add width
  const [width, hasWidth] = state.Width()
  if (hasWidth) {
    result += width.toString()
  }

  // Add precision
  const [precision, hasPrecision] = state.Precision()
  if (hasPrecision) {
    result += '.' + precision.toString()
  }

  // Add verb
  result += String.fromCharCode(verb)

  return result
}

// Scanning functions - stubbed for now
export function Scan(..._a: any[]): [number, $.GoError | null] {
  // TODO: Implement scanning from stdin
  return [0, $.newError('Scan not implemented')]
}

export function Scanf(
  _format: string,
  ..._a: any[]
): [number, $.GoError | null] {
  // TODO: Implement formatted scanning from stdin
  return [0, $.newError('Scanf not implemented')]
}

export function Scanln(..._a: any[]): [number, $.GoError | null] {
  // TODO: Implement line scanning from stdin
  return [0, $.newError('Scanln not implemented')]
}

export function Sscan(_str: string, ..._a: any[]): [number, $.GoError | null] {
  // TODO: Implement scanning from string
  return [0, $.newError('Sscan not implemented')]
}

export function Sscanf(
  _str: string,
  _format: string,
  ..._a: any[]
): [number, $.GoError | null] {
  // TODO: Implement formatted scanning from string
  return [0, $.newError('Sscanf not implemented')]
}

export function Sscanln(
  _str: string,
  ..._a: any[]
): [number, $.GoError | null] {
  // TODO: Implement line scanning from string
  return [0, $.newError('Sscanln not implemented')]
}

export function Fscan(_r: any, ..._a: any[]): [number, $.GoError | null] {
  // TODO: Implement scanning from Reader
  return [0, $.newError('Fscan not implemented')]
}

export function Fscanf(
  _r: any,
  _format: string,
  ..._a: any[]
): [number, $.GoError | null] {
  // TODO: Implement formatted scanning from Reader
  return [0, $.newError('Fscanf not implemented')]
}

export function Fscanln(_r: any, ..._a: any[]): [number, $.GoError | null] {
  // TODO: Implement line scanning from Reader
  return [0, $.newError('Fscanln not implemented')]
}

// Scanner and ScanState interfaces - stubbed
export interface Scanner {
  Scan(state: ScanState, verb: number): $.GoError | null
}

export interface ScanState {
  ReadRune(): [number, number, $.GoError | null]
  UnreadRune(): $.GoError | null
  SkipSpace(): void
  Token(
    skipSpace: boolean,
    f: (r: number) => boolean,
  ): [Uint8Array, $.GoError | null]
  Width(): [number, boolean]
  Read(buf: $.Bytes): [number, $.GoError | null]
}

/**
 * GoScript implementation of Go's fmt package.
 * This is a handwritten override for the fmt package that provides
 * basic formatting functionality compatible with Go's fmt package.
 */
import * as $ from "@goscript/builtin";

/**
 * Printf formats according to a format specifier and writes to standard output.
 * It returns the number of bytes written.
 * 
 * @param format - The format string
 * @param args - The arguments to format
 * @returns The number of bytes written
 */
export function Printf(format: string, ...args: any[]): number {
  const str = Sprintf(format, ...args);
  console.log(str);
  return str.length;
}

/**
 * Println formats using the default formats for its operands and writes to standard output.
 * Spaces are always added between operands and a newline is appended.
 * It returns the number of bytes written.
 * 
 * @param args - The arguments to print
 * @returns The number of bytes written
 */
export function Println(...args: any[]): number {
  const str = args.map(arg => String(arg)).join(" ") + "\n";
  console.log(str);
  return str.length;
}

/**
 * Sprintf formats according to a format specifier and returns the resulting string.
 * Supported format verbs:
 * - %v: the value in a default format
 * - %d: integer in base 10
 * - %s: string
 * - %f: floating-point number
 * - %T: type of the value
 * - %t: boolean (true or false)
 * 
 * @param format - The format string
 * @param args - The arguments to format
 * @returns The formatted string
 */
export function Sprintf(format: string, ...args: any[]): string {
  let argIndex = 0;
  return format.replace(/%[vdsfTt]/g, match => {
    if (argIndex >= args.length) return match;
    const arg = args[argIndex++];
    switch (match) {
      case "%v": return String(arg);
      case "%d": return Number(arg).toString();
      case "%s": return String(arg);
      case "%f": return Number(arg).toString();
      case "%T": return typeof arg;
      case "%t": return Boolean(arg).toString();
      default: return match;
    }
  });
}

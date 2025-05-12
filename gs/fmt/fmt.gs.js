

const $ = {
  println: console.log
};

/**
 * Printf formats according to a format specifier and writes to standard output.
 * It returns the number of bytes written.
 */
function Printf(format, ...args) {
  const str = Sprintf(format, ...args);
  console.log(str);
  return str.length;
}

/**
 * Println formats using the default formats for its operands and writes to standard output.
 * Spaces are always added between operands and a newline is appended.
 * It returns the number of bytes written.
 */
function Println(...args) {
  const str = args.map(arg => String(arg)).join(" ") + "\n";
  console.log(str);
  return str.length;
}

/**
 * Sprintf formats according to a format specifier and returns the resulting string.
 */
function Sprintf(format, ...args) {
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

module.exports = {
  Printf,
  Println,
  Sprintf
};

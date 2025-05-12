

export const Printf = function(format, ...args) {
  const str = Sprintf(format, ...args);
  console.log(str);
  return str.length;
};

export const Println = function(...args) {
  const str = args.map(arg => String(arg)).join(" ") + "\n";
  console.log(str);
  return str.length;
};

export const Sprintf = function(format, ...args) {
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
};

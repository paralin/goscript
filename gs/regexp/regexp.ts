import * as $ from "../builtin";
import * as bytes from "../bytes";
import * as io from "../io";
import * as syntax from "./syntax";
import * as strings from "../strings";
import * as unicode from "../unicode";
import { lazyFlag, newLazyFlag } from "./lazyFlag.js";

export const ErrInvalidRepeatSize = new Error("invalid repeat size");
export const ErrInvalidUTF8 = new Error("invalid UTF-8");
export const ErrInvalidEscape = new Error("invalid escape sequence");
export const ErrInvalidCharClass = new Error("invalid character class");
export const ErrInvalidCharRange = new Error("invalid character class range");
export const ErrMissingBracket = new Error("missing closing ]");
export const ErrMissingParen = new Error("missing closing )");
export const ErrMissingRepeatArgument = new Error("missing argument to repetition operator");
export const ErrTrailingBackslash = new Error("trailing backslash at end of expression");
export const ErrUnexpectedParen = new Error("unexpected )");
export const ErrInvalidNamedCapture = new Error("invalid named capture");
export const ErrInvalidPerlOp = new Error("invalid or unsupported Perl syntax");
export const ErrNestingDepth = new Error("expression nests too deeply");
export const ErrLarge = new Error("expression too large");
export const ErrMissingBrace = new Error("missing closing }");
export const ErrInvalidStdName = new Error("invalid Unicode standard name");
export const ErrInvalidPerlName = new Error("invalid named capture group");
export const ErrInternalError = new Error("internal error");

/**
 * Compile parses a regular expression and returns, if successful,
 * a Regexp that can be used to match against text.
 */
export function Compile(expr: string): [Regexp, Error | null] {
  try {
    const re = new RegExp(expr);
    const regexp = new Regexp(expr, re, [""], 0);
    
    let numSubexp = 0;
    let inClass = false;
    let escaped = false;
    
    for (let i = 0; i < expr.length; i++) {
      const c = expr[i];
      
      if (inClass) {
        if (c === ']' && !escaped) {
          inClass = false;
        }
      } else if (c === '[' && !escaped) {
        inClass = true;
      } else if (c === '(' && !escaped) {
        if (i + 2 < expr.length && expr[i+1] === '?' && expr[i+2] === ':') {
          continue;
        }
        numSubexp++;
      }
      
      escaped = c === '\\' && !escaped;
    }
    
    regexp.setNumSubexp(numSubexp);
    
    const subexpNames = [""];
    for (let i = 0; i < numSubexp; i++) {
      subexpNames.push("");
    }
    regexp.setSubexpNames(subexpNames);
    
    return [regexp, null];
  } catch (e) {
    return [new Regexp(), e as Error];
  }
}

/**
 * CompilePOSIX is like Compile but restricts the regular expression
 * to POSIX ERE (egrep) syntax and changes the match semantics to
 * leftmost-longest.
 */
export function CompilePOSIX(expr: string): [Regexp, Error | null] {
  const [re, err] = Compile(expr);
  if (err !== null) {
    return [re, err];
  }
  re.Longest();
  return [re, null];
}

/**
 * MustCompile is like Compile but panics if the expression cannot be parsed.
 * It simplifies safe initialization of global variables holding compiled regular
 * expressions.
 */
export function MustCompile(expr: string): Regexp {
  const [re, err] = Compile(expr);
  if (err !== null) {
    throw err;
  }
  return re;
}

/**
 * MustCompilePOSIX is like CompilePOSIX but panics if the expression cannot be parsed.
 * It simplifies safe initialization of global variables holding compiled regular
 * expressions.
 */
export function MustCompilePOSIX(expr: string): Regexp {
  const [re, err] = CompilePOSIX(expr);
  if (err !== null) {
    throw err;
  }
  return re;
}

/**
 * QuoteMeta returns a string that escapes all regular expression metacharacters
 * inside the argument text; the returned string is a regular expression matching
 * the literal text.
 */
export function QuoteMeta(s: string): string {
  return s.replace(/[\\\.+*?()|[\]{}^$]/g, '\\$&');
}

/**
 * Match reports whether the byte slice b contains any match of the regular expression pattern.
 */
export function Match(pattern: string, b: Uint8Array): [boolean, Error | null] {
  try {
    const [re, err] = Compile(pattern);
    if (err !== null) {
      return [false, err];
    }
    return [re.Match(b), null];
  } catch (e) {
    return [false, e as Error];
  }
}

/**
 * MatchString reports whether the string s contains any match of the regular expression pattern.
 */
export function MatchString(pattern: string, s: string): [boolean, Error | null] {
  try {
    const [re, err] = Compile(pattern);
    if (err !== null) {
      return [false, err];
    }
    return [re.MatchString(s), null];
  } catch (e) {
    return [false, e as Error];
  }
}

/**
 * MatchReader reports whether the text returned by the RuneReader contains any match of the regular expression pattern.
 */
export function MatchReader(pattern: string, r: io.RuneReader): [boolean, Error | null] {
  try {
    const [re, err] = Compile(pattern);
    if (err !== null) {
      return [false, err];
    }
    return [re.MatchReader(r), null];
  } catch (e) {
    return [false, e as Error];
  }
}

export class Regexp {
  private _expr: string;
  private _jsRegexp: RegExp;
  private _subexpNames: string[];
  private _numSubexp: number;
  private _longest: boolean;
  private _prefix: string;
  private _prefixComplete: boolean;

  constructor(expr: string = "", jsRegexp: RegExp | null = null, subexpNames: string[] | null = null, numSubexp: number = 0) {
    this._expr = expr;
    this._jsRegexp = jsRegexp || new RegExp("");
    this._subexpNames = subexpNames || [""];
    this._numSubexp = numSubexp;
    this._longest = false;
    this._prefix = "";
    this._prefixComplete = false;
  }
  
  setNumSubexp(num: number): void {
    this._numSubexp = num;
  }
  
  setSubexpNames(names: string[]): void {
    this._subexpNames = names;
  }

  public String(): string {
    return this._expr;
  }

  public Copy(): Regexp {
    const re = new Regexp(
      this._expr,
      new RegExp(this._jsRegexp.source, this._jsRegexp.flags),
      [...this._subexpNames],
      this._numSubexp
    );
    re._longest = this._longest;
    re._prefix = this._prefix;
    re._prefixComplete = this._prefixComplete;
    return re;
  }

  public Longest() {
    this._longest = true;
  }

  public NumSubexp(): number {
    return this._numSubexp;
  }

  public SubexpNames(): string[] {
    return this._subexpNames;
  }

  public SubexpIndex(name: string): number {
    for (let i = 1; i < this._subexpNames.length; i++) {
      if (this._subexpNames[i] === name) {
        return i;
      }
    }
    return -1;
  }

  public LiteralPrefix(): [string, boolean] {
    return [this._prefix, this._prefixComplete];
  }

  public MatchReader(r: io.RuneReader): boolean {
    const builder = new strings.Builder();
    let rune: number;
    let size: number;
    
    while (true) {
      [rune, size] = r.ReadRune();
      if (rune === -1 || size === 0) {
        break;
      }
      builder.WriteRune(rune);
    }
    
    return this.MatchString(builder.String());
  }

  public MatchString(s: string): boolean {
    return this._jsRegexp.test(s);
  }

  public Match(b: Uint8Array): boolean {
    return this.MatchString(new TextDecoder().decode(b));
  }

  public FindString(s: string): string {
    const match = s.match(this._jsRegexp);
    return match ? match[0] : "";
  }

  public FindStringIndex(s: string): number[] | null {
    const match = this._jsRegexp.exec(s);
    if (!match) {
      return null;
    }
    
    const index = match.index;
    const length = match[0].length;
    return [index, index + length];
  }

  public Find(b: Uint8Array): Uint8Array | null {
    const s = new TextDecoder().decode(b);
    const match = this.FindString(s);
    
    if (match === "") {
      return null;
    }
    
    return new TextEncoder().encode(match);
  }

  public FindIndex(b: Uint8Array): number[] | null {
    return this.FindStringIndex(new TextDecoder().decode(b));
  }
  
  public FindSubmatch(b: Uint8Array): Uint8Array[] | null {
    const s = new TextDecoder().decode(b);
    const matches = this.FindStringSubmatch(s);
    
    if (!matches) {
      return null;
    }
    
    return matches.map(match => new TextEncoder().encode(match));
  }
  
  public FindStringSubmatch(s: string): string[] | null {
    const match = this._jsRegexp.exec(s);
    if (!match) {
      return null;
    }
    
    return Array.from(match);
  }
  
  public FindStringSubmatchIndex(s: string): number[] | null {
    const match = this._jsRegexp.exec(s);
    if (!match) {
      return null;
    }
    
    const result: number[] = [];
    result.push(match.index);
    result.push(match.index + match[0].length);
    
    for (let i = 1; i < match.length; i++) {
      if (match[i] === undefined) {
        result.push(-1);
        result.push(-1);
      } else {
        const subIndex = s.indexOf(match[i], result[result.length - 2]);
        result.push(subIndex);
        result.push(subIndex + match[i].length);
      }
    }
    
    return result;
  }
  
  public FindSubmatchIndex(b: Uint8Array): number[] | null {
    const s = new TextDecoder().decode(b);
    return this.FindStringSubmatchIndex(s);
  }
  
  public FindAllString(s: string, n: number): string[] {
    const result: string[] = [];
    const re = new RegExp(this._jsRegexp.source, this._jsRegexp.flags + 'g');
    let match: RegExpExecArray | null;
    
    while ((match = re.exec(s)) !== null) {
      result.push(match[0]);
      if (n >= 0 && result.length >= n) {
        break;
      }
    }
    
    return result;
  }
  
  public FindAllStringIndex(s: string, n: number): number[][] {
    const result: number[][] = [];
    const re = new RegExp(this._jsRegexp.source, this._jsRegexp.flags + 'g');
    let match: RegExpExecArray | null;
    
    while ((match = re.exec(s)) !== null) {
      result.push([match.index, match.index + match[0].length]);
      if (n >= 0 && result.length >= n) {
        break;
      }
    }
    
    return result;
  }
  
  public FindAll(b: Uint8Array, n: number): Uint8Array[] {
    const s = new TextDecoder().decode(b);
    const matches = this.FindAllString(s, n);
    
    return matches.map(match => new TextEncoder().encode(match));
  }
  
  public FindAllIndex(b: Uint8Array, n: number): number[][] {
    const s = new TextDecoder().decode(b);
    return this.FindAllStringIndex(s, n);
  }
  
  public Split(s: string, n: number): string[] {
    if (n == 0) {
      return [];
    }
    
    if (n < 0) {
      return s.split(this._jsRegexp);
    }
    
    return s.split(this._jsRegexp, n);
  }
  
  public ReplaceAllString(src: string, repl: string): string {
    return src.replace(new RegExp(this._jsRegexp.source, this._jsRegexp.flags + 'g'), repl);
  }
  
  public ReplaceAll(src: Uint8Array, repl: Uint8Array): Uint8Array {
    const srcStr = new TextDecoder().decode(src);
    const replStr = new TextDecoder().decode(repl);
    const result = this.ReplaceAllString(srcStr, replStr);
    return new TextEncoder().encode(result);
  }
  
  public ReplaceAllLiteralString(src: string, repl: string): string {
    const escapedRepl = repl.replace(/\$/g, '$$$$');
    return src.replace(new RegExp(this._jsRegexp.source, this._jsRegexp.flags + 'g'), escapedRepl);
  }
  
  public ReplaceAllLiteral(src: Uint8Array, repl: Uint8Array): Uint8Array {
    const srcStr = new TextDecoder().decode(src);
    const replStr = new TextDecoder().decode(repl);
    const result = this.ReplaceAllLiteralString(srcStr, replStr);
    return new TextEncoder().encode(result);
  }
  
  public ReplaceAllStringFunc(src: string, repl: (s: string) => string): string {
    const re = new RegExp(this._jsRegexp.source, this._jsRegexp.flags + 'g');
    return src.replace(re, (match) => repl(match));
  }
  
  public ReplaceAllFunc(src: Uint8Array, repl: (b: Uint8Array) => Uint8Array): Uint8Array {
    const srcStr = new TextDecoder().decode(src);
    const result = this.ReplaceAllStringFunc(srcStr, (match) => {
      const matchBytes = new TextEncoder().encode(match);
      const replBytes = repl(matchBytes);
      return new TextDecoder().decode(replBytes);
    });
    return new TextEncoder().encode(result);
  }
  
  public FindAllStringSubmatch(s: string, n: number): string[][] {
    const result: string[][] = [];
    const re = new RegExp(this._jsRegexp.source, this._jsRegexp.flags + 'g');
    let match: RegExpExecArray | null;
    
    while ((match = re.exec(s)) !== null) {
      result.push(Array.from(match));
      if (n >= 0 && result.length >= n) {
        break;
      }
    }
    
    return result;
  }
  
  public FindAllStringSubmatchIndex(s: string, n: number): number[][] {
    const result: number[][] = [];
    const re = new RegExp(this._jsRegexp.source, this._jsRegexp.flags + 'g');
    let match: RegExpExecArray | null;
    
    while ((match = re.exec(s)) !== null) {
      const indices: number[] = [];
      indices.push(match.index);
      indices.push(match.index + match[0].length);
      
      for (let i = 1; i < match.length; i++) {
        if (match[i] === undefined) {
          indices.push(-1);
          indices.push(-1);
        } else {
          const subIndex = s.indexOf(match[i], indices[indices.length - 2]);
          indices.push(subIndex);
          indices.push(subIndex + match[i].length);
        }
      }
      
      result.push(indices);
      if (n >= 0 && result.length >= n) {
        break;
      }
    }
    
    return result;
  }
  
  public FindAllSubmatch(b: Uint8Array, n: number): Uint8Array[][] {
    const s = new TextDecoder().decode(b);
    const matches = this.FindAllStringSubmatch(s, n);
    
    return matches.map(submatches => 
      submatches.map(match => new TextEncoder().encode(match))
    );
  }
  
  public FindAllSubmatchIndex(b: Uint8Array, n: number): number[][] {
    const s = new TextDecoder().decode(b);
    return this.FindAllStringSubmatchIndex(s, n);
  }
  
  public FindReaderIndex(r: io.RuneReader): number[] | null {
    const builder = new strings.Builder();
    let rune: number;
    let size: number;
    
    while (true) {
      [rune, size] = r.ReadRune();
      if (rune === -1 || size === 0) {
        break;
      }
      builder.WriteRune(rune);
    }
    
    return this.FindStringIndex(builder.String());
  }
  
  public FindReaderSubmatchIndex(r: io.RuneReader): number[] | null {
    const builder = new strings.Builder();
    let rune: number;
    let size: number;
    
    while (true) {
      [rune, size] = r.ReadRune();
      if (rune === -1 || size === 0) {
        break;
      }
      builder.WriteRune(rune);
    }
    
    return this.FindStringSubmatchIndex(builder.String());
  }
  
  public Expand(dst: Uint8Array, template: Uint8Array, src: Uint8Array, match: number[]): Uint8Array {
    if (match === null || match.length === 0) {
      return dst;
    }
    
    const srcStr = new TextDecoder().decode(src);
    const templateStr = new TextDecoder().decode(template);
    
    const submatches: string[] = [];
    for (let i = 0; i < match.length; i += 2) {
      if (match[i] >= 0 && match[i+1] >= 0) {
        submatches.push(srcStr.substring(match[i], match[i+1]));
      } else {
        submatches.push("");
      }
    }
    
    let result = templateStr.replace(/\$(\d+|\{([^}]+)\})/g, (_, g1, g2) => {
      const name = g2 || g1;
      let index: number;
      
      if (/^\d+$/.test(name)) {
        index = parseInt(name, 10);
        if (index >= submatches.length) {
          return "";
        }
        return submatches[index];
      } else {
        index = this.SubexpIndex(name);
        if (index < 0 || index >= submatches.length) {
          return "";
        }
        return submatches[index];
      }
    });
    
    result = result.replace(/\$\$/g, '$');
    
    const resultBytes = new TextEncoder().encode(result);
    const dstStr = new TextDecoder().decode(dst);
    const combined = dstStr + result;
    
    return new TextEncoder().encode(combined);
  }
  
  public ExpandString(dst: Uint8Array, template: string, src: string, match: number[]): Uint8Array {
    const templateBytes = new TextEncoder().encode(template);
    const srcBytes = new TextEncoder().encode(src);
    return this.Expand(dst, templateBytes, srcBytes, match);
  }
}

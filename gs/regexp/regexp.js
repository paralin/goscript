import * as $ from "../builtin";
import * as syntax from "./syntax";
import { lazyFlag, newLazyFlag } from "./lazyFlag";
import { 
  RegexpError, 
  ErrInvalidRepeatSize,
  ErrInvalidUTF8,
  ErrInvalidEscape,
  ErrInvalidPerlOp,
  ErrMissingBracket,
  ErrMissingParen,
  ErrMissingBrace,
  ErrTrailingBackslash,
  ErrInvalidCharRange,
  ErrInvalidCharClass,
  ErrInvalidNamedCapture,
  ErrInvalidPerlName,
  ErrInvalidStdName,
  ErrMissingRepeatArgument,
  ErrInvalidRepeatOp,
  ErrInvalidStdOp,
  ErrNestingDepth,
  ErrLarge,
  ErrUnexpectedParen,
  ErrInternalError
} from "./error.js";

export class Regexp {
  #pattern;
  #jsRegexp;
  #numSubexp = 0;
  #subexpNames = [];
  #longest = false;

  constructor(expr) {
    this.#pattern = expr;
    this.#jsRegexp = new RegExp(expr, 'u');
  }

  setNumSubexp(n) {
    this.#numSubexp = n;
  }

  setSubexpNames(names) {
    this.#subexpNames = names;
  }

  String() {
    return this.#pattern;
  }

  Copy() {
    const re = new Regexp(this.#pattern);
    re.#numSubexp = this.#numSubexp;
    re.#subexpNames = [...this.#subexpNames];
    re.#longest = this.#longest;
    return re;
  }

  Longest(longest = true) {
    this.#longest = longest;
    return this;
  }

  NumSubexp() {
    return this.#numSubexp;
  }

  SubexpNames() {
    return this.#subexpNames;
  }

  SubexpIndex(name) {
    for (let i = 0; i < this.#subexpNames.length; i++) {
      if (this.#subexpNames[i] === name) {
        return i;
      }
    }
    return -1;
  }

  LiteralPrefix() {
    return ["", false];
  }

  MatchReader(r) {
    return false;
  }

  MatchString(s) {
    return this.#jsRegexp.test(s);
  }

  Match(b) {
    return this.MatchString($.decodeUtf8(b));
  }

  FindString(s) {
    const match = s.match(this.#jsRegexp);
    return match ? match[0] : "";
  }

  FindStringIndex(s) {
    const match = s.match(this.#jsRegexp);
    if (!match) return null;
    return [match.index, match.index + match[0].length];
  }

  Find(b) {
    const s = $.decodeUtf8(b);
    const match = this.FindString(s);
    if (match === "") return null;
    return $.encodeUtf8(match);
  }

  FindIndex(b) {
    const s = $.decodeUtf8(b);
    return this.FindStringIndex(s);
  }

  FindSubmatch(b) {
    const s = $.decodeUtf8(b);
    const matches = this.FindStringSubmatch(s);
    if (!matches) return null;
    return matches.map(m => m ? $.encodeUtf8(m) : null);
  }

  FindStringSubmatch(s) {
    const match = s.match(this.#jsRegexp);
    return match;
  }

  FindStringSubmatchIndex(s) {
    const match = s.match(this.#jsRegexp);
    if (!match) return null;
    
    const result = [match.index, match.index + match[0].length];
    
    for (let i = 1; i < match.length; i++) {
      if (match[i] === undefined) {
        result.push(-1, -1);
      } else {
        const subIndex = s.indexOf(match[i], result[result.length - 1]);
        result.push(subIndex, subIndex + match[i].length);
      }
    }
    
    return result;
  }

  FindSubmatchIndex(b) {
    const s = $.decodeUtf8(b);
    return this.FindStringSubmatchIndex(s);
  }

  FindAllString(s, n) {
    if (n === 0) return [];
    
    const re = new RegExp(this.#jsRegexp, 'gu');
    const results = [];
    let match;
    
    while ((match = re.exec(s)) !== null) {
      results.push(match[0]);
      if (n > 0 && results.length >= n) break;
    }
    
    return results.length > 0 ? results : null;
  }

  FindAllStringIndex(s, n) {
    if (n === 0) return [];
    
    const re = new RegExp(this.#jsRegexp, 'gu');
    const results = [];
    let match;
    
    while ((match = re.exec(s)) !== null) {
      results.push([match.index, match.index + match[0].length]);
      if (n > 0 && results.length >= n) break;
    }
    
    return results.length > 0 ? results : null;
  }

  FindAll(b, n) {
    const s = $.decodeUtf8(b);
    const matches = this.FindAllString(s, n);
    if (!matches) return null;
    return matches.map(m => $.encodeUtf8(m));
  }

  FindAllIndex(b, n) {
    const s = $.decodeUtf8(b);
    return this.FindAllStringIndex(s, n);
  }

  //
  //
  //
  Split(s, n) {
    if (n === 0) return [];
    return s.split(this.#jsRegexp, n);
  }

  ReplaceAllString(src, repl) {
    return src.replace(this.#jsRegexp, repl);
  }

  ReplaceAll(src, repl) {
    const s = $.decodeUtf8(src);
    const r = $.decodeUtf8(repl);
    const result = this.ReplaceAllString(s, r);
    return $.encodeUtf8(result);
  }

  ReplaceAllLiteralString(src, repl) {
    return src.replace(this.#jsRegexp, () => repl);
  }

  ReplaceAllLiteral(src, repl) {
    const s = $.decodeUtf8(src);
    const r = $.decodeUtf8(repl);
    const result = this.ReplaceAllLiteralString(s, r);
    return $.encodeUtf8(result);
  }

  ReplaceAllStringFunc(src, repl) {
    return src.replace(this.#jsRegexp, (match, ...args) => {
      const offset = args[args.length - 2];
      const string = args[args.length - 1];
      const groups = args.slice(0, args.length - 2);
      return repl(match);
    });
  }

  ReplaceAllFunc(src, repl) {
    const s = $.decodeUtf8(src);
    const result = this.ReplaceAllStringFunc(s, (match) => {
      return $.decodeUtf8(repl($.encodeUtf8(match)));
    });
    return $.encodeUtf8(result);
  }

  //
  //
  //
  Expand(dst, template, src, match) {
    if (!match) return dst;
    
    const s = $.decodeUtf8(src);
    const t = $.decodeUtf8(template);
    
    let result = $.decodeUtf8(dst);
    
    result += t.replace(/\$(\d+)|\$\{(\d+)\}|\$\$|\$(\w+)|\$\{(\w+)\}/g, (_, digit, bracketDigit, name, bracketName) => {
      if (_ === '$$') return '$';
      
      const index = digit || bracketDigit;
      if (index) {
        const idx = parseInt(index, 10);
        if (idx * 2 < match.length) {
          const start = match[idx * 2];
          const end = match[idx * 2 + 1];
          if (start >= 0 && end >= 0) {
            return s.substring(start, end);
          }
        }
        return '';
      }
      
      const namedIndex = this.SubexpIndex(name || bracketName);
      if (namedIndex > 0 && namedIndex * 2 < match.length) {
        const start = match[namedIndex * 2];
        const end = match[namedIndex * 2 + 1];
        if (start >= 0 && end >= 0) {
          return s.substring(start, end);
        }
      }
      
      return '';
    });
    
    return $.encodeUtf8(result);
  }

  ExpandString(dst, template, src, match) {
    if (!match) return dst;
    
    let result = $.decodeUtf8(dst);
    
    result += template.replace(/\$(\d+)|\$\{(\d+)\}|\$\$|\$(\w+)|\$\{(\w+)\}/g, (_, digit, bracketDigit, name, bracketName) => {
      if (_ === '$$') return '$';
      
      const index = digit || bracketDigit;
      if (index) {
        const idx = parseInt(index, 10);
        if (idx * 2 < match.length) {
          const start = match[idx * 2];
          const end = match[idx * 2 + 1];
          if (start >= 0 && end >= 0) {
            return src.substring(start, end);
          }
        }
        return '';
      }
      
      const namedIndex = this.SubexpIndex(name || bracketName);
      if (namedIndex > 0 && namedIndex * 2 < match.length) {
        const start = match[namedIndex * 2];
        const end = match[namedIndex * 2 + 1];
        if (start >= 0 && end >= 0) {
          return src.substring(start, end);
        }
      }
      
      return '';
    });
    
    return $.encodeUtf8(result);
  }
}

export function Compile(expr) {
  try {
    const re = new Regexp(expr);
    return [re, null];
  } catch (e) {
    const goError = e instanceof RegexpError ? e : new RegexpError(e.message || String(e));
    return [null, goError];
  }
}

export function CompilePOSIX(expr) {
  try {
    const [re, err] = Compile(expr);
    if (err) return [null, err];
    re.Longest(true);
    return [re, null];
  } catch (e) {
    const goError = e instanceof RegexpError ? e : new RegexpError(e.message || String(e));
    return [null, goError];
  }
}

export function MustCompile(str) {
  const [re, err] = Compile(str);
  if (err) {
    $.panic("regexp: Compile(" + str + "): " + err.message);
  }
  return re;
}

export function MustCompilePOSIX(str) {
  const [re, err] = CompilePOSIX(str);
  if (err) {
    $.panic("regexp: CompilePOSIX(" + str + "): " + err.message);
  }
  return re;
}

export function QuoteMeta(s) {
  return s.replace(/[\\^$.*+?()[\]{}|]/g, '\\$&');
}

export function Match(pattern, b) {
  const [re, err] = Compile(pattern);
  if (err) return [false, err];
  return [re.Match(b), null];
}

export function MatchString(pattern, s) {
  const [re, err] = Compile(pattern);
  if (err) return [false, err];
  return [re.MatchString(s), null];
}

export function MatchReader(pattern, r) {
  const [re, err] = Compile(pattern);
  if (err) return [false, err];
  return [re.MatchReader(r), null];
}

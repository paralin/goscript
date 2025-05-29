import * as $ from "../builtin";

export interface GoError {
  Error(): string;
}

export class RegexpError extends Error implements GoError {
  constructor(message: string);
  Error(): string;
}

export const ErrInvalidRepeatSize: RegexpError;
export const ErrInvalidUTF8: RegexpError;
export const ErrInvalidEscape: RegexpError;
export const ErrInvalidPerlOp: RegexpError;
export const ErrMissingBracket: RegexpError;
export const ErrMissingParen: RegexpError;
export const ErrMissingBrace: RegexpError;
export const ErrTrailingBackslash: RegexpError;
export const ErrInvalidCharRange: RegexpError;
export const ErrInvalidCharClass: RegexpError;
export const ErrInvalidNamedCapture: RegexpError;
export const ErrInvalidPerlName: RegexpError;
export const ErrInvalidStdName: RegexpError;
export const ErrMissingRepeatArgument: RegexpError;
export const ErrInvalidRepeatOp: RegexpError;
export const ErrInvalidStdOp: RegexpError;
export const ErrNestingDepth: RegexpError;
export const ErrLarge: RegexpError;
export const ErrUnexpectedParen: RegexpError;
export const ErrInternalError: RegexpError;

export class Regexp {
  constructor(expr: string);
  setNumSubexp(n: number): void;
  setSubexpNames(names: string[]): void;
  String(): string;
  Copy(): Regexp;
  Longest(longest?: boolean): Regexp;
  NumSubexp(): number;
  SubexpNames(): string[];
  SubexpIndex(name: string): number;
  LiteralPrefix(): [string, boolean];
  MatchReader(r: any): boolean;
  MatchString(s: string): boolean;
  Match(b: Uint8Array): boolean;
  FindString(s: string): string;
  FindStringIndex(s: string): [number, number] | null;
  Find(b: Uint8Array): Uint8Array | null;
  FindIndex(b: Uint8Array): [number, number] | null;
  FindSubmatch(b: Uint8Array): (Uint8Array | null)[] | null;
  FindStringSubmatch(s: string): string[] | null;
  FindStringSubmatchIndex(s: string): number[] | null;
  FindSubmatchIndex(b: Uint8Array): number[] | null;
  FindAllString(s: string, n: number): string[] | null;
  FindAllStringIndex(s: string, n: number): number[][] | null;
  FindAll(b: Uint8Array, n: number): Uint8Array[] | null;
  FindAllIndex(b: Uint8Array, n: number): number[][] | null;
  Split(s: string, n: number): string[];
  ReplaceAllString(src: string, repl: string): string;
  ReplaceAll(src: Uint8Array, repl: Uint8Array): Uint8Array;
  ReplaceAllLiteralString(src: string, repl: string): string;
  ReplaceAllLiteral(src: Uint8Array, repl: Uint8Array): Uint8Array;
  ReplaceAllStringFunc(src: string, repl: (match: string) => string): string;
  ReplaceAllFunc(src: Uint8Array, repl: (match: Uint8Array) => Uint8Array): Uint8Array;
  Expand(dst: Uint8Array, template: Uint8Array, src: Uint8Array, match: number[]): Uint8Array;
  ExpandString(dst: Uint8Array, template: string, src: string, match: number[]): Uint8Array;
}

export function Compile(expr: string): [Regexp | null, RegexpError | null];
export function CompilePOSIX(expr: string): [Regexp | null, RegexpError | null];
export function MustCompile(str: string): Regexp;
export function MustCompilePOSIX(str: string): Regexp;
export function QuoteMeta(s: string): string;
export function Match(pattern: string, b: Uint8Array): [boolean, RegexpError | null];
export function MatchString(pattern: string, s: string): [boolean, RegexpError | null];
export function MatchReader(pattern: string, r: any): [boolean, RegexpError | null];

import * as $ from "@goscript/builtin/builtin.js";
import { ErrUnimplemented } from "./error.gs.js";
import { File } from "./types_js.gs.js";

import * as fs from "@goscript/io/fs/index.js"

// JavaScript-specific implementations for filesystem operations
// These functions stub filesystem operations that cannot be implemented 
// in a JavaScript environment

// File operations - stub implementations
export function Open(name: string): [File | null, $.GoError] {
  return [null, ErrUnimplemented]
}

export function Create(name: string): [File | null, $.GoError] {
  return [null, ErrUnimplemented]
}

export function OpenFile(name: string, flag: number, perm: number): [File | null, $.GoError] {
  return [null, ErrUnimplemented]
}

export function ReadFile(name: string): [$.Bytes, $.GoError] {
  return [null, ErrUnimplemented]
}

export function WriteFile(name: string, data: $.Bytes, perm: number): $.GoError {
  return ErrUnimplemented
}

// Directory operations - stub implementations  
export function Mkdir(name: string, perm: number): $.GoError {
  return ErrUnimplemented
}

export function MkdirAll(path: string, perm: number): $.GoError {
  return ErrUnimplemented
}

export function Remove(name: string): $.GoError {
  return ErrUnimplemented
}

export function RemoveAll(path: string): $.GoError {
  return ErrUnimplemented
}

export function Chdir(dir: string): $.GoError {
  return ErrUnimplemented
}

export function Chmod(name: string, mode: number): $.GoError {
  return ErrUnimplemented
}

export function Rename(oldpath: string, newpath: string): $.GoError {
  return ErrUnimplemented
}

// File information operations - stub implementations
export function Stat(name: string): [fs.FileInfo, $.GoError] {
  return [null, ErrUnimplemented]
}

export function Lstat(name: string): [fs.FileInfo, $.GoError] {
  return [null, ErrUnimplemented]
}

// Link operations - stub implementations  
export function Link(oldname: string, newname: string): $.GoError {
  return ErrUnimplemented
}

export function Symlink(oldname: string, newname: string): $.GoError {
  return ErrUnimplemented
}

export function Readlink(name: string): [string, $.GoError] {
  return ["", ErrUnimplemented]
}

export function Truncate(name: string, size: number): $.GoError {
  return ErrUnimplemented
}

// File system information - stub implementations
export function DirFS(dir: string): fs.FS {
  // Return a stub filesystem that always returns ErrUnimplemented
  return new stubFS()
}

class stubFS {
  public Open(name: string): [fs.File, $.GoError] {
    return [null, ErrUnimplemented]
  }
}

 
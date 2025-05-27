import * as $ from "@goscript/builtin/builtin.js";
import { ErrUnimplemented } from "./error.gs.js";
import { File } from "./types.gs.js";

// joinPath joins directory and file paths - simplified implementation for JavaScript
export function joinPath(dir: string, file: string): string {
  if (dir === "" || dir === ".") {
    return file
  }
  if (file === "") {
    return dir
  }
  // Remove trailing slash from dir if present
  if (dir.endsWith("/")) {
    dir = dir.slice(0, -1)
  }
  // Remove leading slash from file if present  
  if (file.startsWith("/")) {
    file = file.slice(1)
  }
  return dir + "/" + file
}

// CreateTemp creates a new temporary file in the directory dir.
// Stubbed implementation for JavaScript environment.
export function CreateTemp(dir: string, pattern: string): [File | null, $.GoError] {
  return [null, ErrUnimplemented]
}

// MkdirTemp creates a new temporary directory.
// Stubbed implementation for JavaScript environment.
export function MkdirTemp(dir: string, pattern: string): [string, $.GoError] {
  return ["", ErrUnimplemented]
} 
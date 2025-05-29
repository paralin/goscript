import * as $ from '@goscript/builtin/index.js'
import { FileInfoToDirEntry, ReadDir } from './readdir.js'
import { Stat } from './stat.js'
import { FS, DirEntry } from './fs.js'

import * as errors from '@goscript/errors/index.js'

import * as path from '@goscript/path/index.js'

export let SkipDir: $.GoError = errors.New('skip this directory')

export let SkipAll: $.GoError = errors.New('skip everything and stop the walk')

export type WalkDirFunc =
  | ((path: string, d: DirEntry, err: $.GoError) => $.GoError)
  | null

// walkDir recursively descends path, calling walkDirFn.
export function walkDir(
  fsys: FS,
  name: string,
  d: DirEntry,
  walkDirFn: WalkDirFunc,
): $.GoError {
  // Successfully skipped directory.
  {
    let err = walkDirFn!(name, d, null)
    if (err != null || !d!.IsDir()) {
      // Successfully skipped directory.
      if (err == SkipDir && d!.IsDir()) {
        // Successfully skipped directory.
        err = null
      }
      return err
    }
  }

  let [dirs, err] = ReadDir(fsys, name)

  // Second call, to report ReadDir error.
  if (err != null) {
    // Second call, to report ReadDir error.
    err = walkDirFn!(name, d, err)
    if (err != null) {
      if (err == SkipDir && d!.IsDir()) {
        err = null
      }
      return err
    }
  }

  for (let _i = 0; _i < $.len(dirs); _i++) {
    const d1 = dirs![_i]
    {
      let name1 = path.Join(name, d1!.Name())
      {
        let err = walkDir(fsys, name1, d1, walkDirFn)
        if (err != null) {
          if (err == SkipDir) {
            break
          }
          return err
        }
      }
    }
  }
  return null
}

// WalkDir walks the file tree rooted at root, calling fn for each file or
// directory in the tree, including root.
//
// All errors that arise visiting files and directories are filtered by fn:
// see the [fs.WalkDirFunc] documentation for details.
//
// The files are walked in lexical order, which makes the output deterministic
// but requires WalkDir to read an entire directory into memory before proceeding
// to walk that directory.
//
// WalkDir does not follow symbolic links found in directories,
// but if root itself is a symbolic link, its target will be walked.
export function WalkDir(fsys: FS, root: string, fn: WalkDirFunc): $.GoError {
  let [info, err] = Stat(fsys, root)
  if (err != null) {
    err = fn!(root, null, err)
  } else {
    err = walkDir(fsys, root, FileInfoToDirEntry(info), fn)
  }
  if (err == SkipDir || err == SkipAll) {
    return null
  }
  return err
}

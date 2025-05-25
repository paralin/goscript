// Package io provides basic interfaces to I/O primitives.
// Its primary job is to wrap existing implementations of such primitives,
// such as those in package os, into shared public interfaces that abstract
// the functionality, plus some other related primitives.

import * as $ from '@goscript/builtin/builtin.js'

// Simple error implementation for io package
class IOError {
  constructor(private message: string) {}

  Error(): string {
    return this.message
  }

  toString(): string {
    return this.message
  }
}

function newError(message: string): $.GoError {
  return new IOError(message)
}

// Error variables
export const EOF = newError('EOF')
export const ErrClosedPipe = newError('io: read/write on closed pipe')
export const ErrNoProgress = newError('multiple Read calls return no data or error')
export const ErrShortBuffer = newError('short buffer')
export const ErrShortWrite = newError('short write')
export const ErrUnexpectedEOF = newError('unexpected EOF')

// Seek whence values
export const SeekStart = 0   // seek relative to the origin of the file
export const SeekCurrent = 1 // seek relative to the current offset
export const SeekEnd = 2     // seek relative to the end

// Core interfaces

// Reader is the interface that wraps the basic Read method
export interface Reader {
  Read(p: Uint8Array): [number, $.GoError]
}

// Writer is the interface that wraps the basic Write method
export interface Writer {
  Write(p: Uint8Array): [number, $.GoError]
}

// Closer is the interface that wraps the basic Close method
export interface Closer {
  Close(): $.GoError
}

// Seeker is the interface that wraps the basic Seek method
export interface Seeker {
  Seek(offset: number, whence: number): [number, $.GoError]
}

// Combined interfaces
export interface ReadWriter extends Reader, Writer {}
export interface ReadCloser extends Reader, Closer {}
export interface WriteCloser extends Writer, Closer {}
export interface ReadWriteCloser extends Reader, Writer, Closer {}
export interface ReadSeeker extends Reader, Seeker {}
export interface WriteSeeker extends Writer, Seeker {}
export interface ReadWriteSeeker extends Reader, Writer, Seeker {}

// ReaderAt is the interface that wraps the basic ReadAt method
export interface ReaderAt {
  ReadAt(p: Uint8Array, off: number): [number, $.GoError]
}

// WriterAt is the interface that wraps the basic WriteAt method
export interface WriterAt {
  WriteAt(p: Uint8Array, off: number): [number, $.GoError]
}

// ByteReader is the interface that wraps the ReadByte method
export interface ByteReader {
  ReadByte(): [number, $.GoError]
}

// ByteWriter is the interface that wraps the WriteByte method
export interface ByteWriter {
  WriteByte(c: number): $.GoError
}

// ByteScanner is the interface that adds the UnreadByte method to the basic ReadByte method
export interface ByteScanner extends ByteReader {
  UnreadByte(): $.GoError
}

// RuneReader is the interface that wraps the ReadRune method
export interface RuneReader {
  ReadRune(): [number, number, $.GoError]
}

// RuneScanner is the interface that adds the UnreadRune method to the basic ReadRune method
export interface RuneScanner extends RuneReader {
  UnreadRune(): $.GoError
}

// StringWriter is the interface that wraps the WriteString method
export interface StringWriter {
  WriteString(s: string): [number, $.GoError]
}

// WriterTo is the interface that wraps the WriteTo method
export interface WriterTo {
  WriteTo(w: Writer): [number, $.GoError]
}

// ReaderFrom is the interface that wraps the ReadFrom method
export interface ReaderFrom {
  ReadFrom(r: Reader): [number, $.GoError]
}

// Discard is a Writer on which all Write calls succeed without doing anything
class DiscardWriter implements Writer {
  Write(p: Uint8Array): [number, $.GoError] {
    return [p.length, null]
  }
}

export const Discard: Writer = new DiscardWriter()

// WriteString writes the contents of the string s to w, which accepts a slice of bytes
export function WriteString(w: Writer, s: string): [number, $.GoError] {
  // Check if w implements StringWriter interface
  if ('WriteString' in w && typeof (w as any).WriteString === 'function') {
    return (w as StringWriter).WriteString(s)
  }
  
  // Convert string to bytes and write
  const bytes = new TextEncoder().encode(s)
  return w.Write(bytes)
}

// LimitedReader reads from R but limits the amount of data returned to just N bytes
export class LimitedReader implements Reader {
  public R: Reader
  public N: number

  constructor(r: Reader, n: number) {
    this.R = r
    this.N = n
  }

  Read(p: Uint8Array): [number, $.GoError] {
    if (this.N <= 0) {
      return [0, EOF]
    }
    
    let readBuf = p
    if (p.length > this.N) {
      readBuf = p.subarray(0, this.N)
    }
    
    const [n, err] = this.R.Read(readBuf)
    this.N -= n
    return [n, err]
  }
}

// LimitReader returns a Reader that reads from r but stops with EOF after n bytes
export function LimitReader(r: Reader, n: number): Reader {
  return new LimitedReader(r, n)
}

// SectionReader implements Read, Seek, and ReadAt on a section of an underlying ReaderAt
export class SectionReader implements Reader, Seeker, ReaderAt {
  private r: ReaderAt
  private base: number
  private off: number
  private limit: number

  constructor(r: ReaderAt, off: number, n: number) {
    this.r = r
    this.base = off
    this.off = off
    this.limit = off + n
  }

  Read(p: Uint8Array): [number, $.GoError] {
    if (this.off >= this.limit) {
      return [0, EOF]
    }
    
    let max = this.limit - this.off
    if (p.length > max) {
      p = p.subarray(0, max)
    }
    
    const [n, err] = this.r.ReadAt(p, this.off)
    this.off += n
    return [n, err]
  }

  Seek(offset: number, whence: number): [number, $.GoError] {
    let abs: number
    switch (whence) {
      case SeekStart:
        abs = this.base + offset
        break
      case SeekCurrent:
        abs = this.off + offset
        break
      case SeekEnd:
        abs = this.limit + offset
        break
      default:
        return [0, newError('io.SectionReader.Seek: invalid whence')]
    }
    
    if (abs < this.base) {
      return [0, newError('io.SectionReader.Seek: negative position')]
    }
    
    this.off = abs
    return [abs - this.base, null]
  }

  ReadAt(p: Uint8Array, off: number): [number, $.GoError] {
    if (off < 0 || off >= this.limit - this.base) {
      return [0, EOF]
    }
    
    off += this.base
    if (off + p.length > this.limit) {
      p = p.subarray(0, this.limit - off)
      const [n, err] = this.r.ReadAt(p, off)
      if (err === null) {
        return [n, EOF]
      }
      return [n, err]
    }
    
    return this.r.ReadAt(p, off)
  }

  Size(): number {
    return this.limit - this.base
  }
}

// NewSectionReader returns a SectionReader that reads from r starting at offset off and stops with EOF after n bytes
export function NewSectionReader(r: ReaderAt, off: number, n: number): SectionReader {
  return new SectionReader(r, off, n)
}

// OffsetWriter maps writes at offset base to offset base+off in the underlying writer
export class OffsetWriter implements Writer, WriterAt {
  private w: WriterAt
  private base: number
  private off: number

  constructor(w: WriterAt, off: number) {
    this.w = w
    this.base = off
    this.off = 0
  }

  Write(p: Uint8Array): [number, $.GoError] {
    const [n, err] = this.w.WriteAt(p, this.base + this.off)
    this.off += n
    return [n, err]
  }

  WriteAt(p: Uint8Array, off: number): [number, $.GoError] {
    if (off < 0) {
      return [0, newError('io.OffsetWriter.WriteAt: negative offset')]
    }
    return this.w.WriteAt(p, this.base + off)
  }

  Seek(offset: number, whence: number): [number, $.GoError] {
    let abs: number
    switch (whence) {
      case SeekStart:
        abs = offset
        break
      case SeekCurrent:
        abs = this.off + offset
        break
      default:
        return [0, newError('io.OffsetWriter.Seek: invalid whence')]
    }
    
    if (abs < 0) {
      return [0, newError('io.OffsetWriter.Seek: negative position')]
    }
    
    this.off = abs
    return [abs, null]
  }
}

// NewOffsetWriter returns an OffsetWriter that writes to w starting at offset off
export function NewOffsetWriter(w: WriterAt, off: number): OffsetWriter {
  return new OffsetWriter(w, off)
}

// Copy copies from src to dst until either EOF is reached on src or an error occurs
export function Copy(dst: Writer, src: Reader): [number, $.GoError] {
  return CopyBuffer(dst, src, null)
}

// CopyBuffer is identical to Copy except that it stages through the provided buffer
export function CopyBuffer(dst: Writer, src: Reader, buf: Uint8Array | null): [number, $.GoError] {
  // If src implements WriterTo, use it
  if ('WriteTo' in src && typeof (src as any).WriteTo === 'function') {
    return (src as WriterTo).WriteTo(dst)
  }
  
  // If dst implements ReaderFrom, use it
  if ('ReadFrom' in dst && typeof (dst as any).ReadFrom === 'function') {
    return (dst as ReaderFrom).ReadFrom(src)
  }
  
  if (buf === null) {
    buf = new Uint8Array(32 * 1024) // 32KB default buffer
  }
  
  let written = 0
  while (true) {
    const [nr, er] = src.Read(buf)
    if (nr > 0) {
      const [nw, ew] = dst.Write(buf.subarray(0, nr))
      if (nw < 0 || nr < nw) {
        if (ew === null) {
          return [written, ErrShortWrite]
        }
        return [written, ew]
      }
      written += nw
      if (ew !== null) {
        return [written, ew]
      }
      if (nr !== nw) {
        return [written, ErrShortWrite]
      }
    }
    if (er !== null) {
      if (er === EOF) {
        break
      }
      return [written, er]
    }
  }
  return [written, null]
}

// CopyN copies n bytes (or until an error) from src to dst
export function CopyN(dst: Writer, src: Reader, n: number): [number, $.GoError] {
  const [written, err] = Copy(dst, LimitReader(src, n))
  if (written === n) {
    return [written, null]
  }
  if (written < n && err === null) {
    // src stopped early; must have been EOF
    return [written, EOF]
  }
  return [written, err]
}

// ReadAtLeast reads from r into buf until it has read at least min bytes
export function ReadAtLeast(r: Reader, buf: Uint8Array, min: number): [number, $.GoError] {
  if (buf.length < min) {
    return [0, ErrShortBuffer]
  }
  
  let n = 0
  while (n < min) {
    const [nn, err] = r.Read(buf.subarray(n))
    n += nn
    if (err !== null) {
      if (err === EOF && n >= min) {
        return [n, null]
      }
      if (err === EOF && n < min) {
        return [n, ErrUnexpectedEOF]
      }
      return [n, err]
    }
  }
  return [n, null]
}

// ReadFull reads exactly len(buf) bytes from r into buf
export function ReadFull(r: Reader, buf: Uint8Array): [number, $.GoError] {
  return ReadAtLeast(r, buf, buf.length)
}

// ReadAll reads from r until an error or EOF and returns the data it read
export function ReadAll(r: Reader): [Uint8Array, $.GoError] {
  const chunks: Uint8Array[] = []
  let totalLength = 0
  const buf = new Uint8Array(512)
  
  while (true) {
    const [n, err] = r.Read(buf)
    if (n > 0) {
      chunks.push(buf.subarray(0, n))
      totalLength += n
    }
    if (err !== null) {
      if (err === EOF) {
        break
      }
      return [new Uint8Array(0), err]
    }
  }
  
  // Combine all chunks
  const result = new Uint8Array(totalLength)
  let offset = 0
  for (const chunk of chunks) {
    result.set(chunk, offset)
    offset += chunk.length
  }
  
  return [result, null]
}

// NopCloser returns a ReadCloser with a no-op Close method wrapping the provided Reader r
export function NopCloser(r: Reader): ReadCloser {
  return {
    Read: r.Read.bind(r),
    Close: () => null
  }
}

// MultiReader returns a Reader that's the logical concatenation of the provided input readers
export function MultiReader(...readers: Reader[]): Reader {
  return new multiReader(readers.slice())
}

class multiReader implements Reader {
  private readers: Reader[]

  constructor(readers: Reader[]) {
    this.readers = readers
  }

  Read(p: Uint8Array): [number, $.GoError] {
    while (this.readers.length > 0) {
      if (this.readers.length === 1) {
        // Optimization for single reader
        const r = this.readers[0]
        const [n, err] = r.Read(p)
        if (err === EOF) {
          this.readers = []
        }
        return [n, err]
      }
      
      const [n, err] = this.readers[0].Read(p)
      if (err === EOF) {
        this.readers.shift() // Remove first reader
        continue
      }
      if (n > 0 || err !== EOF) {
        if (err === EOF && this.readers.length > 1) {
          // Don't return EOF if there are more readers
          return [n, null]
        }
        return [n, err]
      }
    }
    return [0, EOF]
  }
}

// MultiWriter creates a writer that duplicates its writes to all the provided writers
export function MultiWriter(...writers: Writer[]): Writer {
  return new multiWriter(writers.slice())
}

class multiWriter implements Writer {
  private writers: Writer[]

  constructor(writers: Writer[]) {
    this.writers = writers
  }

  Write(p: Uint8Array): [number, $.GoError] {
    for (const w of this.writers) {
      const [n, err] = w.Write(p)
      if (err !== null) {
        return [n, err]
      }
      if (n !== p.length) {
        return [n, ErrShortWrite]
      }
    }
    return [p.length, null]
  }
}

// TeeReader returns a Reader that writes to w what it reads from r
export function TeeReader(r: Reader, w: Writer): Reader {
  return new teeReader(r, w)
}

class teeReader implements Reader {
  private r: Reader
  private w: Writer

  constructor(r: Reader, w: Writer) {
    this.r = r
    this.w = w
  }

  Read(p: Uint8Array): [number, $.GoError] {
    const [n, err] = this.r.Read(p)
    if (n > 0) {
      const [nw, ew] = this.w.Write(p.subarray(0, n))
      if (ew !== null) {
        return [n, ew]
      }
      if (nw !== n) {
        return [n, ErrShortWrite]
      }
    }
    return [n, err]
  }
} 
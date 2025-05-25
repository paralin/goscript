// Runtime constants for the JavaScript/WebAssembly target
export const GOOS = 'js'
export const GOARCH = 'wasm'

// Version returns the Go version as a string
export const GOVERSION = 'go1.24.3'
export function Version(): string {
  return GOVERSION
}

// GOMAXPROCS sets the maximum number of operating system threads
//
// JavaScript is single threaded so this always returns 1.
export function GOMAXPROCS(n: number): number {
  // In a full implementation, we would set the max procs
  // Since JavaScript only supports 1, just return 1.
  return 1
}

// NumCPU returns the number of logical CPUs on the system.
export function NumCPU(): number {
  // In browser environment, use navigator.hardwareConcurrency if available
  if (typeof navigator !== 'undefined' && navigator.hardwareConcurrency) {
    return navigator.hardwareConcurrency
  }

  // Default to 1 if we can't determine
  return 1
}

// GC runs a garbage collection and blocks the caller until the
// garbage collection is complete. In JavaScript, we can suggest GC but not force it.
export function GC(): void {
  // In JavaScript, we can't force garbage collection
  // Some engines have gc() function in development, but it's not standard
  if (typeof globalThis.gc === 'function') {
    ;(globalThis as any).gc()
  }
  // Otherwise, this is a no-op
}

// Gosched yields the processor, allowing other goroutines to run.
// In JavaScript, we can use setTimeout(0) or queueMicrotask for similar effect
export function Gosched(): Promise<void> {
  return new Promise((resolve) => {
    queueMicrotask(resolve)
  })
}

// NumGoroutine returns the number of goroutines that currently exist.
// In goscript, this is informational only
let goroutineCount = 1 // Start with main goroutine

export function NumGoroutine(): number {
  return goroutineCount
}

// Internal function to track goroutine creation (called by goscript runtime)
export function _incrementGoroutineCount(): void {
  goroutineCount++
}

// Internal function to track goroutine completion (called by goscript runtime)
export function _decrementGoroutineCount(): void {
  if (goroutineCount > 0) {
    goroutineCount--
  }
}

// Caller returns details about the calling goroutine's stack.
// This is a simplified version for goscript
export function Caller(skip: number): [number, string, number, boolean] {
  // In JavaScript, we can use Error stack trace, but it's limited
  // Return dummy values for goscript compatibility
  const pc = 0 // program counter (not meaningful in JS)
  const file = 'unknown'
  const line = 0
  const ok = false // indicate we don't have real stack info
  return [pc, file, line, ok]
}

// Stack returns a formatted stack trace of the calling goroutine.
// In JavaScript, we use Error.stack
export function Stack(): Uint8Array {
  const stack = new Error().stack || 'stack trace unavailable'
  const encoder = new TextEncoder()
  return encoder.encode(stack)
}

// MemStats represents memory allocation statistics
export class MemStats {
  // Simplified memory stats for goscript
  public Alloc: number = 0 // bytes allocated and not yet freed
  public TotalAlloc: number = 0 // bytes allocated (even if freed)
  public Sys: number = 0 // bytes obtained from system
  public Lookups: number = 0 // number of pointer lookups
  public Mallocs: number = 0 // number of mallocs
  public Frees: number = 0 // number of frees

  constructor() {
    // Initialize with some default values
    // In a real environment, these would be obtained from the JS runtime
    this.updateMemoryStats()
  }

  private updateMemoryStats(): void {
    // Use performance.memory if available (Chrome/Edge)
    if (typeof performance !== 'undefined' && (performance as any).memory) {
      const mem = (performance as any).memory
      this.Alloc = mem.usedJSHeapSize || 0
      this.Sys = mem.totalJSHeapSize || 0
      this.TotalAlloc = this.Alloc // Simplified
    }
  }
}

// ReadMemStats populates m with memory allocator statistics
export function ReadMemStats(m: MemStats): void {
  // Update the provided MemStats object with current values
  if (typeof performance !== 'undefined' && (performance as any).memory) {
    const mem = (performance as any).memory
    m.Alloc = mem.usedJSHeapSize || 0
    m.Sys = mem.totalJSHeapSize || 0
    m.TotalAlloc = m.Alloc // Simplified
  }
}

// Error interface for runtime errors
export interface Error {
  Error(): string
}

// TypeAssertionError represents a failed type assertion
export class TypeAssertionError implements Error {
  constructor(
    public readonly interfaceType: string,
    public readonly concrete: string,
    public readonly assertedType: string,
    public readonly missingMethod?: string,
  ) {}

  Error(): string {
    if (this.missingMethod) {
      return `interface conversion: ${this.interfaceType} is ${this.concrete}, not ${this.assertedType} (missing ${this.missingMethod} method)`
    }
    return `interface conversion: ${this.interfaceType} is ${this.concrete}, not ${this.assertedType}`
  }
}

// PanicError represents a panic
export class PanicError implements Error {
  constructor(public readonly value: any) {}

  Error(): string {
    return `panic: ${this.value}`
  }
}

// SetFinalizer sets the finalizer associated with obj to the provided finalizer function.
// In goscript/TypeScript environment, finalizers are not supported, so this throws an error.
export function SetFinalizer(
  obj: object,
  finalizer: ((obj: object) => void) | null,
): void {
  throw new Error(
    'runtime.SetFinalizer is not supported in goscript TypeScript environment',
  )
}

// KeepAlive keeps obj reachable until the point where KeepAlive is called
export function KeepAlive(obj: any): void {
  // In JavaScript, just accessing the object keeps it alive for this call
  // This is mostly a no-op but we touch the object to ensure it's not optimized away
  if (obj !== null && obj !== undefined) {
    // Touch the object to keep it alive
    void obj
  }
}

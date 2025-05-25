// Package sync provides basic synchronization primitives such as mutual exclusion
// locks. Other than the Once and WaitGroup types, most are intended for use by
// low-level library routines. Higher-level synchronization is better done via
// channels and communication.

// Locker represents an object that can be locked and unlocked
export interface Locker {
  Lock(): Promise<void>
  Unlock(): void
}

// Mutex is a mutual exclusion lock
export class Mutex implements Locker {
  private _locked: boolean = false
  private _waitQueue: Array<() => void> = []

  constructor(init?: Partial<{}>) {
    // Mutex has no public fields to initialize
  }

  // Lock locks m
  // If the lock is already in use, the calling goroutine blocks until the mutex is available
  public async Lock(): Promise<void> {
    if (!this._locked) {
      this._locked = true
      return
    }

    // In a real implementation, this would block the goroutine
    // Use Promise to simulate blocking behavior like channels
    return new Promise<void>((resolve) => {
      this._waitQueue.push(resolve)
    })
  }

  // TryLock tries to lock m and reports whether it succeeded
  public TryLock(): boolean {
    if (!this._locked) {
      this._locked = true
      return true
    }
    return false
  }

  // Unlock unlocks m
  public Unlock(): void {
    if (!this._locked) {
      throw new Error('sync: unlock of unlocked mutex')
    }

    this._locked = false

    // Wake up the next waiting goroutine
    if (this._waitQueue.length > 0) {
      const next = this._waitQueue.shift()!
      this._locked = true
      // Use queueMicrotask to simulate goroutine scheduling
      queueMicrotask(() => next())
    }
  }

  // clone returns a copy of this Mutex instance
  public clone(): Mutex {
    return new Mutex()
  }
}

// RWMutex is a reader/writer mutual exclusion lock
export class RWMutex {
  private _readers: number = 0
  private _writer: boolean = false
  private _readerWaitQueue: Array<() => void> = []
  private _writerWaitQueue: Array<() => void> = []

  constructor(init?: Partial<{}>) {
    // RWMutex has no public fields to initialize
  }

  // Lock locks rw for writing
  public async Lock(): Promise<void> {
    if (!this._writer && this._readers === 0) {
      this._writer = true
      return
    }

    return new Promise<void>((resolve) => {
      this._writerWaitQueue.push(resolve)
    })
  }

  // TryLock tries to lock rw for writing and reports whether it succeeded
  public TryLock(): boolean {
    if (!this._writer && this._readers === 0) {
      this._writer = true
      return true
    }
    return false
  }

  // Unlock unlocks rw for writing
  public Unlock(): void {
    if (!this._writer) {
      throw new Error('sync: unlock of unlocked RWMutex')
    }

    this._writer = false
    this._wakeUpWaiters()
  }

  // RLock locks rw for reading
  public async RLock(): Promise<void> {
    if (!this._writer) {
      this._readers++
      return
    }

    return new Promise<void>((resolve) => {
      this._readerWaitQueue.push(() => {
        this._readers++
        resolve()
      })
    })
  }

  // TryRLock tries to lock rw for reading and reports whether it succeeded
  public TryRLock(): boolean {
    if (!this._writer) {
      this._readers++
      return true
    }
    return false
  }

  // RUnlock undoes a single RLock call
  public RUnlock(): void {
    if (this._readers === 0) {
      throw new Error('sync: RUnlock of unlocked RWMutex')
    }

    this._readers--
    if (this._readers === 0) {
      this._wakeUpWaiters()
    }
  }

  private _wakeUpWaiters(): void {
    // Prioritize writers
    if (this._writerWaitQueue.length > 0 && this._readers === 0) {
      const next = this._writerWaitQueue.shift()!
      this._writer = true
      queueMicrotask(() => next())
    } else if (this._readerWaitQueue.length > 0 && !this._writer) {
      // Wake up all waiting readers
      const readers = this._readerWaitQueue.splice(0)
      queueMicrotask(() => {
        readers.forEach((reader) => reader())
      })
    }
  }

  // clone returns a copy of this RWMutex instance
  public clone(): RWMutex {
    return new RWMutex()
  }
}

// WaitGroup waits for a collection of goroutines to finish
export class WaitGroup {
  private _counter: number = 0
  private _waiters: Array<() => void> = []

  constructor(init?: Partial<{}>) {
    // WaitGroup has no public fields to initialize
  }

  // Add adds delta, which may be negative, to the WaitGroup counter
  public Add(delta: number): void {
    this._counter += delta
    if (this._counter < 0) {
      throw new Error('sync: negative WaitGroup counter')
    }
    if (this._counter === 0) {
      // Wake up all waiters
      const waiters = this._waiters.splice(0)
      queueMicrotask(() => {
        waiters.forEach((waiter) => waiter())
      })
    }
  }

  // Done decrements the WaitGroup counter by one
  public Done(): void {
    this.Add(-1)
  }

  // Wait blocks until the WaitGroup counter is zero
  public async Wait(): Promise<void> {
    if (this._counter === 0) {
      return
    }

    return new Promise<void>((resolve) => {
      this._waiters.push(resolve)
    })
  }

  // clone returns a copy of this WaitGroup instance
  public clone(): WaitGroup {
    return new WaitGroup()
  }
}

// Once is an object that will perform exactly one action
export class Once {
  private _done: boolean = false
  private _m: Mutex = new Mutex()

  constructor(init?: Partial<{}>) {
    // Once has no public fields to initialize
  }

  // Do calls the function f if and only if Do is being called for the first time for this instance of Once
  public async Do(f: () => void): Promise<void> {
    if (this._done) {
      return
    }

    await this._m.Lock()
    try {
      if (!this._done) {
        f()
        this._done = true
      }
    } finally {
      this._m.Unlock()
    }
  }

  // clone returns a copy of this Once instance
  public clone(): Once {
    return new Once()
  }
}

// Cond implements a condition variable, a rendezvous point for goroutines waiting for or announcing the occurrence of an event
export class Cond {
  private _l: Locker
  private _waiters: Array<() => void> = []

  constructor(l: Locker) {
    this._l = l
  }

  // Broadcast wakes all goroutines waiting on c
  public Broadcast(): void {
    const waiters = this._waiters.splice(0)
    queueMicrotask(() => {
      waiters.forEach((waiter) => waiter())
    })
  }

  // Signal wakes one goroutine waiting on c, if there is any
  public Signal(): void {
    if (this._waiters.length > 0) {
      const waiter = this._waiters.shift()!
      queueMicrotask(() => waiter())
    }
  }

  // Wait atomically unlocks c.L and suspends execution of the calling goroutine
  public async Wait(): Promise<void> {
    this._l.Unlock()

    return new Promise<void>((resolve) => {
      this._waiters.push(async () => {
        await this._l.Lock()
        resolve()
      })
    })
  }

  // clone returns a copy of this Cond instance
  public clone(): Cond {
    return new Cond(this._l)
  }
}

// NewCond returns a new Cond with Locker l
export function NewCond(l: Locker): Cond {
  return new Cond(l)
}

// Map is like a Go map[interface{}]interface{} but is safe for concurrent use by multiple goroutines
export class Map {
  private _m: RWMutex = new RWMutex()
  private _data: globalThis.Map<any, any> = new globalThis.Map()

  constructor(init?: Partial<{}>) {
    // Map has no public fields to initialize
  }

  // Delete deletes the value for a key
  public async Delete(key: any): Promise<void> {
    await this._m.Lock()
    try {
      this._data.delete(key)
    } finally {
      this._m.Unlock()
    }
  }

  // Load returns the value stored in the map for a key, or nil if no value is present
  public async Load(key: any): Promise<[any, boolean]> {
    await this._m.RLock()
    try {
      const value = this._data.get(key)
      return [value, this._data.has(key)]
    } finally {
      this._m.RUnlock()
    }
  }

  // LoadAndDelete deletes the value for a key, returning the previous value if any
  public async LoadAndDelete(key: any): Promise<[any, boolean]> {
    await this._m.Lock()
    try {
      const value = this._data.get(key)
      const loaded = this._data.has(key)
      this._data.delete(key)
      return [value, loaded]
    } finally {
      this._m.Unlock()
    }
  }

  // LoadOrStore returns the existing value for the key if present
  public async LoadOrStore(key: any, value: any): Promise<[any, boolean]> {
    await this._m.Lock()
    try {
      if (this._data.has(key)) {
        return [this._data.get(key), true]
      }
      this._data.set(key, value)
      return [value, false]
    } finally {
      this._m.Unlock()
    }
  }

  // Range calls f sequentially for each key and value present in the map
  public async Range(f: (key: any, value: any) => boolean): Promise<void> {
    await this._m.RLock()
    try {
      for (const [key, value] of this._data) {
        if (!f(key, value)) {
          break
        }
      }
    } finally {
      this._m.RUnlock()
    }
  }

  // Store sets the value for a key
  public async Store(key: any, value: any): Promise<void> {
    await this._m.Lock()
    try {
      this._data.set(key, value)
    } finally {
      this._m.Unlock()
    }
  }

  // clone returns a copy of this Map instance
  public clone(): Map {
    return new Map()
  }
}

// Pool is a set of temporary objects that may be individually saved and retrieved
export class Pool {
  public New?: () => any
  private _pool: any[] = []

  constructor(init?: Partial<{ New?: () => any }>) {
    this.New = init?.New
  }

  // Get selects an arbitrary item from the Pool, removes it from the Pool, and returns it to the caller
  public Get(): any {
    if (this._pool.length > 0) {
      return this._pool.pop()
    }
    if (this.New) {
      return this.New()
    }
    return null
  }

  // Put adds x to the pool
  public Put(x: any): void {
    if (x !== null && x !== undefined) {
      this._pool.push(x)
    }
  }

  // clone returns a copy of this Pool instance
  public clone(): Pool {
    return new Pool({ New: this.New })
  }
}

// OnceFunc returns a function that invokes f only once
export function OnceFunc(f: () => void): () => void {
  let called = false
  return () => {
    if (!called) {
      called = true
      f()
    }
  }
}

// OnceValue returns a function that invokes f only once and returns the value returned by f
export function OnceValue<T>(f: () => T): () => T {
  let value: T
  let called = false
  return () => {
    if (!called) {
      called = true
      value = f()
    }
    return value
  }
}

// OnceValues returns a function that invokes f only once and returns the values returned by f
export function OnceValues<T1, T2>(f: () => [T1, T2]): () => [T1, T2] {
  let value1: T1
  let value2: T2
  let called = false
  return () => {
    if (!called) {
      called = true
      ;[value1, value2] = f()
    }
    return [value1, value2]
  }
}

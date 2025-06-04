import * as $ from '@goscript/builtin/index.js'

export const Canceled = $.newError('context canceled')

export const DeadlineExceeded = $.newError('context deadline exceeded')

// Function types
export type CancelFunc = () => void
export type CancelCauseFunc = (cause: $.GoError) => void

// Context interface matching Go's context.Context
export type Context = null | {
  // Deadline returns the time when work done on behalf of this context should be canceled
  Deadline(): [Date | null, boolean]

  // Done returns a channel that's closed when work done on behalf of this context should be canceled
  Done(): $.Channel<{}>

  // Err returns a non-nil error value after Done is closed
  Err(): $.GoError

  // Value returns the value associated with this context for key, or null
  Value(key: any): any
}

// ContextNonNil is a non-nil context
export type ContextNonNil = Exclude<Context, null>

// Base implementation for all contexts
abstract class baseContext implements ContextNonNil {
  abstract Deadline(): [Date | null, boolean]
  abstract Done(): $.Channel<{}>
  abstract Err(): $.GoError
  abstract Value(key: any): any
}

// Background/TODO context that is never canceled
class backgroundContext extends baseContext {
  private static readonly neverClosedChannel = $.makeChannel<{}>(0, {}, 'both')

  static getNeverClosedChannel(): $.Channel<{}> {
    return backgroundContext.neverClosedChannel
  }

  Deadline(): [Date | null, boolean] {
    return [null, false]
  }

  Done(): $.Channel<{}> {
    return backgroundContext.neverClosedChannel
  }

  Err(): $.GoError {
    return null
  }

  Value(_key: any): any {
    return null
  }
}

// Value context wraps a parent and adds a key-value pair
class valueContext extends baseContext {
  constructor(
    private parent: ContextNonNil,
    private key: any,
    private val: any,
  ) {
    super()
  }

  getParent(): ContextNonNil {
    return this.parent
  }

  Deadline(): [Date | null, boolean] {
    return this.parent.Deadline()
  }

  Done(): $.Channel<{}> {
    return this.parent.Done()
  }

  Err(): $.GoError {
    return this.parent.Err()
  }

  Value(key: any): any {
    if (this.key === key) {
      return this.val
    }
    return this.parent.Value(key)
  }
}

// Cancel context that can be canceled
class cancelContext extends baseContext {
  protected doneChannel: $.Channel<{}>
  protected err: $.GoError = null
  protected cause: $.GoError = null
  protected children: Set<cancelContext> = new Set()
  protected parent: ContextNonNil
  protected parentCancelCtx: cancelContext | null = null
  protected removeFromParent: (() => void) | null = null

  constructor(parent: ContextNonNil) {
    super()
    this.parent = parent
    this.doneChannel = $.makeChannel<{}>(0, {}, 'both')
  }

  Deadline(): [Date | null, boolean] {
    return this.parent.Deadline()
  }

  Done(): $.Channel<{}> {
    return this.doneChannel
  }

  Err(): $.GoError {
    return this.err
  }

  Value(key: any): any {
    return this.parent.Value(key)
  }

  getCause(): $.GoError {
    return this.cause ?? this.err
  }

  cancel(removeFromParent: boolean, err: $.GoError, cause: $.GoError): void {
    if (this.err !== null) {
      return // Already canceled
    }

    this.err = err
    this.cause = cause
    this.doneChannel.close()

    // Cancel all children
    for (const child of this.children) {
      child.cancel(false, err, cause)
    }
    this.children.clear()

    // Remove from parent's children if requested
    if (removeFromParent && this.removeFromParent) {
      this.removeFromParent()
      this.removeFromParent = null
    }
  }

  propagateCancel(): void {
    // Find parent cancelContext if any
    let parent = this.parent
    while (parent instanceof valueContext) {
      parent = (parent as valueContext).getParent()
    }

    if (parent instanceof cancelContext) {
      // Parent is a cancel context, register as child
      this.parentCancelCtx = parent
      if (parent.err !== null) {
        // Parent already canceled
        this.cancel(false, parent.err, parent.cause)
      } else {
        parent.children.add(this)
        this.removeFromParent = () => {
          parent.children.delete(this)
        }
      }
    } else {
      // Watch parent's Done channel
      this.watchParentDone()
    }
  }

  private watchParentDone(): void {
    const parentDone = this.parent.Done()
    ;(async () => {
      try {
        await parentDone.receive()
      } catch {
        // Channel closed
      }
      // Parent is done, cancel this context
      const parentErr = this.parent.Err()
      if (parentErr && this.err === null) {
        this.cancel(false, parentErr, null)
      }
    })()
  }
}

// Timer context with deadline
class timerContext extends cancelContext {
  private deadline: Date
  private timer: any

  constructor(parent: ContextNonNil, deadline: Date) {
    super(parent)
    this.deadline = deadline
  }

  Deadline(): [Date | null, boolean] {
    return [this.deadline, true]
  }

  startTimer(): void {
    const now = Date.now()
    const duration = this.deadline.getTime() - now

    if (duration <= 0) {
      // Already expired
      this.cancel(true, DeadlineExceeded, null)
      return
    }

    this.timer = setTimeout(() => {
      this.cancel(true, DeadlineExceeded, null)
    }, duration)
  }

  cancel(removeFromParent: boolean, err: $.GoError, cause: $.GoError): void {
    super.cancel(removeFromParent, err, cause)
    if (this.timer) {
      clearTimeout(this.timer)
      this.timer = null
    }
  }
}

// Without cancel context - inherits values but not cancellation
class withoutCancelContext extends baseContext {
  constructor(private parent: ContextNonNil) {
    super()
  }

  Deadline(): [Date | null, boolean] {
    return [null, false]
  }

  Done(): $.Channel<{}> {
    return backgroundContext.getNeverClosedChannel()
  }

  Err(): $.GoError {
    return null
  }

  Value(key: any): any {
    return this.parent.Value(key)
  }
}

// Singleton contexts
const background = new backgroundContext()
const todo = new backgroundContext()

// Background returns a non-nil, empty Context that is never canceled
export function Background(): Context {
  return background
}

// TODO returns a non-nil, empty Context
export function TODO(): Context {
  return todo
}

// WithCancel returns a copy of parent with a new Done channel
export function WithCancel(parent: Context): [ContextNonNil, CancelFunc] {
  if (parent === null) {
    throw new Error('cannot create context from nil parent')
  }
  const ctx = new cancelContext(parent)
  ctx.propagateCancel()

  return [
    ctx,
    () => {
      ctx.cancel(true, Canceled, null)
    },
  ]
}

// WithCancelCause returns a copy of parent with a new Done channel and cause recording
export function WithCancelCause(
  parent: Context,
): [ContextNonNil, CancelCauseFunc] {
  if (parent === null) {
    throw new Error('cannot create context from nil parent')
  }
  const ctx = new cancelContext(parent)
  ctx.propagateCancel()

  return [
    ctx,
    (cause: $.GoError) => {
      ctx.cancel(true, Canceled, cause)
    },
  ]
}

// WithDeadline returns a copy of parent with the deadline adjusted to be no later than d
export function WithDeadline(
  parent: Context,
  d: Date,
): [ContextNonNil, CancelFunc] {
  return WithDeadlineCause(parent, d, null)
}

// WithDeadlineCause is like WithDeadline but also sets the cause
export function WithDeadlineCause(
  parent: Context,
  d: Date,
  cause: $.GoError,
): [ContextNonNil, CancelFunc] {
  if (parent === null) {
    throw new Error('cannot create context from nil parent')
  }
  // Check if parent deadline is already earlier
  const [parentDeadline, ok] = parent.Deadline()
  if (ok && parentDeadline && parentDeadline <= d) {
    // Parent deadline is already sooner
    return WithCancel(parent)
  }

  const ctx = new timerContext(parent, d)
  ctx.propagateCancel()
  ctx.startTimer()

  return [
    ctx,
    () => {
      ctx.cancel(true, Canceled, cause)
    },
  ]
}

// WithTimeout returns WithDeadline(parent, Date.now() + timeout)
export function WithTimeout(
  parent: Context,
  timeout: number,
): [ContextNonNil, CancelFunc] {
  return WithDeadline(parent, new Date(Date.now() + timeout))
}

// WithTimeoutCause is like WithTimeout but also sets the cause
export function WithTimeoutCause(
  parent: Context,
  timeout: number,
  cause: $.GoError,
): [ContextNonNil, CancelFunc] {
  return WithDeadlineCause(parent, new Date(Date.now() + timeout), cause)
}

// WithValue returns a copy of parent with the value associated with key
export function WithValue(parent: Context, key: any, val: any): ContextNonNil {
  if (parent === null) {
    throw new Error('cannot create context from nil parent')
  }
  return new valueContext(parent, key, val)
}

// WithoutCancel returns a context that inherits values but not cancellation
export function WithoutCancel(parent: Context): ContextNonNil {
  if (parent === null) {
    throw new Error('cannot create context from nil parent')
  }
  return new withoutCancelContext(parent)
}

// Cause returns the underlying cause of the context's cancellation
export function Cause(ctx: Context): $.GoError {
  if (!ctx) return null

  let c = ctx
  // Unwrap value contexts
  while (c instanceof valueContext) {
    c = (c as valueContext).getParent()
  }

  if (c instanceof cancelContext) {
    return c.getCause()
  }

  return c.Err()
}

// AfterFunc runs f in a separate goroutine after ctx is done
export function AfterFunc(ctx: Context, f: () => void): () => boolean {
  if (ctx === null) {
    throw new Error('cannot create context from nil parent')
  }
  let stopped = false
  let done = false

  const _promise = (async () => {
    try {
      await ctx.Done().receive()
    } catch {
      // Channel closed
    }
    if (!stopped) {
      done = true
      // Run in next tick to simulate goroutine
      setImmediate(f)
    }
  })()

  return () => {
    if (!done) {
      stopped = true
      return true
    }
    return false
  }
}

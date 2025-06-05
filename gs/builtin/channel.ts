/**
 * Represents the result of a channel receive operation with 'ok' value
 */
export interface ChannelReceiveResult<T> {
  value: T // Should be T | ZeroValue<T>
  ok: boolean
}

/**
 * Represents a result from a select operation
 */
export interface SelectResult<T> {
  value: T // Should be T | ZeroValue<T>
  ok: boolean
  id: number
}

/**
 * Represents a Go channel in TypeScript.
 * Supports asynchronous sending and receiving of values.
 */
export interface Channel<T> {
  /**
   * Sends a value to the channel.
   * Returns a promise that resolves when the value is accepted by the channel.
   * @param value The value to send.
   */
  send(value: T): Promise<void>

  /**
   * Receives a value from the channel.
   * Returns a promise that resolves with the received value.
   * If the channel is closed, it throws an error.
   */
  receive(): Promise<T>

  /**
   * Receives a value from the channel along with a boolean indicating
   * whether the channel is still open.
   * Returns a promise that resolves with {value, ok}.
   * - If channel is open and has data: {value: <data>, ok: true}
   * - If channel is closed and empty: {value: <zero value>, ok: false}
   * - If channel is closed but has remaining buffered data: {value: <data>, ok: true}
   */
  receiveWithOk(): Promise<ChannelReceiveResult<T>>

  /**
   * Closes the channel.
   * No more values can be sent to a closed channel.
   * Receive operations on a closed channel return the zero value and ok=false.
   */
  close(): void

  /**
   * Used in select statements to create a receive operation promise.
   * @param id An identifier for this case in the select statement
   * @returns Promise that resolves when this case is selected
   */
  selectReceive(id: number): Promise<SelectResult<T>>

  /**
   * Used in select statements to create a send operation promise.
   * @param value The value to send
   * @param id An identifier for this case in the select statement
   * @returns Promise that resolves when this case is selected
   */
  selectSend(value: T, id: number): Promise<SelectResult<boolean>>

  /**
   * Checks if the channel has data ready to be received without blocking.
   * Used for non-blocking select operations.
   */
  canReceiveNonBlocking(): boolean

  /**
   * Checks if the channel can accept a send operation without blocking.
   * Used for non-blocking select operations.
   */
  canSendNonBlocking(): boolean
}

/**
 * Represents a case in a select statement.
 */
export interface SelectCase<T> {
  id: number
  isSend: boolean // true for send, false for receive
  channel: Channel<any> | ChannelRef<any> | null // Allow null and ChannelRef
  value?: any // Value to send for send cases
  // Optional handlers for when this case is selected
  onSelected?: (result: SelectResult<T>) => Promise<any>
}

/**
 * Helper for 'select' statements. Takes an array of select cases
 * and resolves when one of them completes, following Go's select rules.
 *
 * @param cases Array of SelectCase objects
 * @param hasDefault Whether there is a default case
 * @returns A promise that resolves with the result of the selected case
 */
export async function selectStatement<T, V = void>(
  cases: SelectCase<T>[],
  hasDefault: boolean = false,
): Promise<[boolean, V]> {
  if (cases.length === 0 && !hasDefault) {
    // Go spec: If there are no cases, the select statement blocks forever.
    // Emulate blocking forever with a promise that never resolves.
    return new Promise<[boolean, V]>(() => {}) // Promise never resolves
  }

  // 1. Check for ready (non-blocking) operations
  const readyCases: SelectCase<T>[] = []
  for (const caseObj of cases) {
    if (caseObj.id === -1) {
      // Skip default case in this check
      continue
    }
    // Skip nil channels - they are never ready in Go
    if (caseObj.channel === null) {
      continue
    }
    if (caseObj.channel) {
      if (caseObj.isSend && caseObj.channel.canSendNonBlocking()) {
        readyCases.push(caseObj)
      } else if (!caseObj.isSend && caseObj.channel.canReceiveNonBlocking()) {
        readyCases.push(caseObj)
      }
    }
  }

  if (readyCases.length > 0) {
    // If one or more cases are ready, choose one pseudo-randomly
    const selectedCase =
      readyCases[Math.floor(Math.random() * readyCases.length)]

    // Execute the selected operation and its onSelected handler
    // Add check for channel existence
    if (selectedCase.channel) {
      if (selectedCase.isSend) {
        const result = await selectedCase.channel.selectSend(
          selectedCase.value,
          selectedCase.id,
        )
        if (selectedCase.onSelected) {
          const handlerResult = await selectedCase.onSelected(
            result as SelectResult<T>,
          )
          return [handlerResult !== undefined, handlerResult as V]
        }
      } else {
        const result = await selectedCase.channel.selectReceive(selectedCase.id)
        if (selectedCase.onSelected) {
          const handlerResult = await selectedCase.onSelected(result)
          return [handlerResult !== undefined, handlerResult as V]
        }
      }
    } else {
      // This case should ideally not happen if channel is required for non-default cases
      console.error('Selected case without a channel:', selectedCase)
    }
    return [false, undefined as V] // Return after executing a ready case
  }

  // 2. If no operations are ready and there's a default case, select default
  if (hasDefault) {
    // Find the default case (it will have id -1)
    const defaultCase = cases.find((c) => c.id === -1)
    if (defaultCase && defaultCase.onSelected) {
      // Execute the onSelected handler for the default case
      const handlerResult = await defaultCase.onSelected({
        value: undefined,
        ok: false,
        id: -1,
      } as SelectResult<T>)
      return [handlerResult !== undefined, handlerResult as V]
    }
    return [false, undefined as V] // Return after executing the default case
  }

  // 3. If no operations are ready and no default case, block until one is ready
  // Use Promise.race on the blocking promises
  const blockingPromises = cases
    .filter((c) => c.id !== -1) // Exclude default case
    .filter((c) => c.channel !== null) // Exclude nil channels (they would block forever)
    .map((caseObj) => {
      // At this point caseObj.channel is guaranteed to be non-null
      if (caseObj.isSend) {
        return caseObj.channel!.selectSend(caseObj.value, caseObj.id)
      } else {
        return caseObj.channel!.selectReceive(caseObj.id)
      }
    })

  // If all non-default cases have nil channels, we effectively block forever
  if (blockingPromises.length === 0) {
    // No valid channels to operate on, block forever (unless there's a default)
    return new Promise<[boolean, V]>(() => {}) // Promise never resolves
  }

  const result = await Promise.race(blockingPromises)
  // Execute onSelected handler for the selected case
  const selectedCase = cases.find((c) => c.id === result.id)
  if (selectedCase && selectedCase.onSelected) {
    const handlerResult = await selectedCase.onSelected(result)
    return [handlerResult !== undefined, handlerResult as V]
  }

  // No explicit return needed here, as the function will implicitly return after the await
  return [false, undefined as V]
}

/**
 * Helper function for channel send operations that handles nil channels correctly.
 * In Go, sending to a nil channel blocks forever.
 * @param channel The channel to send to (can be null)
 * @param value The value to send
 * @returns Promise that never resolves if channel is null, otherwise delegates to channel.send()
 */
export async function chanSend<T>(
  channel: Channel<T> | ChannelRef<T> | null,
  value: T,
): Promise<void> {
  if (channel === null) {
    // In Go, sending to a nil channel blocks forever
    return new Promise<void>(() => {}) // Promise that never resolves
  }
  return channel.send(value)
}

/**
 * Helper function for channel receive operations that handles nil channels correctly.
 * In Go, receiving from a nil channel blocks forever.
 * @param channel The channel to receive from (can be null)
 * @returns Promise that never resolves if channel is null, otherwise delegates to channel.receive()
 */
export async function chanRecv<T>(
  channel: Channel<T> | ChannelRef<T> | null,
): Promise<T> {
  if (channel === null) {
    // In Go, receiving from a nil channel blocks forever
    return new Promise<T>(() => {}) // Promise that never resolves
  }
  return channel.receive()
}

/**
 * Helper function for channel receive operations with ok value that handles nil channels correctly.
 * In Go, receiving from a nil channel blocks forever.
 * @param channel The channel to receive from (can be null)
 * @returns Promise that never resolves if channel is null, otherwise delegates to channel.receiveWithOk()
 */
export async function chanRecvWithOk<T>(
  channel: Channel<T> | ChannelRef<T> | null,
): Promise<ChannelReceiveResult<T>> {
  if (channel === null) {
    // In Go, receiving from a nil channel blocks forever
    return new Promise<ChannelReceiveResult<T>>(() => {}) // Promise that never resolves
  }
  return channel.receiveWithOk()
}

/**
 * Creates a new channel with the specified buffer size and zero value.
 * @param bufferSize The size of the channel buffer. If 0, creates an unbuffered channel.
 * @param zeroValue The zero value for the channel's element type.
 * @param direction Optional direction for the channel. Default is 'both' (bidirectional).
 * @returns A new channel instance or channel reference.
 */
export function makeChannel<T>(
  bufferSize: number,
  zeroValue: T,
  direction: 'send',
): SendOnlyChannelRef<T>
export function makeChannel<T>(
  bufferSize: number,
  zeroValue: T,
  direction: 'receive',
): ReceiveOnlyChannelRef<T>
export function makeChannel<T>(
  bufferSize: number,
  zeroValue: T,
  direction?: 'both',
): Channel<T>
export function makeChannel<T>(
  bufferSize: number,
  zeroValue: T,
  direction: 'send' | 'receive' | 'both' = 'both',
): Channel<T> | ChannelRef<T> {
  const channel = new BufferedChannel<T>(bufferSize, zeroValue)

  if (direction === 'send') {
    return new SendOnlyChannelRef<T>(channel)
  } else if (direction === 'receive') {
    return new ReceiveOnlyChannelRef<T>(channel)
  } else {
    return channel
  }
}

// A simple implementation of buffered channels
class BufferedChannel<T> implements Channel<T> {
  private buffer: T[] = []
  private closed: boolean = false
  private capacity: number
  public zeroValue: T // Made public for access by ChannelRef or for type inference

  // Senders queue: stores { value, resolve for send, reject for send }
  private senders: Array<{
    value: T
    resolveSend: () => void
    rejectSend: (e: Error) => void
  }> = []

  // Receivers queue for receive(): stores { resolve for receive, reject for receive }
  private receivers: Array<{
    resolveReceive: (value: T) => void
    rejectReceive: (e: Error) => void
  }> = []

  // Receivers queue for receiveWithOk(): stores { resolve for receiveWithOk }
  private receiversWithOk: Array<{
    resolveReceive: (result: ChannelReceiveResult<T>) => void
  }> = []

  constructor(capacity: number, zeroValue: T) {
    if (capacity < 0) {
      throw new Error('Channel capacity cannot be negative')
    }
    this.capacity = capacity
    this.zeroValue = zeroValue
  }

  async send(value: T): Promise<void> {
    if (this.closed) {
      throw new Error('send on closed channel')
    }

    // Attempt to hand off to a waiting receiver (rendezvous)
    if (this.receivers.length > 0) {
      const receiverTask = this.receivers.shift()!
      queueMicrotask(() => receiverTask.resolveReceive(value))
      return
    }
    if (this.receiversWithOk.length > 0) {
      const receiverTask = this.receiversWithOk.shift()!
      queueMicrotask(() => receiverTask.resolveReceive({ value, ok: true }))
      return
    }

    // If no waiting receivers, try to buffer if space is available
    if (this.buffer.length < this.capacity) {
      this.buffer.push(value)
      return
    }

    // Buffer is full (or capacity is 0 and no receivers are waiting). Sender must block.
    return new Promise<void>((resolve, reject) => {
      this.senders.push({ value, resolveSend: resolve, rejectSend: reject })
    })
  }

  async receive(): Promise<T> {
    // Attempt to get from buffer first
    if (this.buffer.length > 0) {
      const value = this.buffer.shift()!
      // If a sender was waiting because the buffer was full, unblock it.
      if (this.senders.length > 0) {
        const senderTask = this.senders.shift()!
        this.buffer.push(senderTask.value) // Sender's value now goes into buffer
        queueMicrotask(() => senderTask.resolveSend()) // Unblock sender
      }
      return value
    }

    // Buffer is empty.
    // If channel is closed (and buffer is empty), return zero value.
    if (this.closed) {
      return this.zeroValue
    }

    // Buffer is empty, channel is open.
    // Attempt to rendezvous with a waiting sender.
    if (this.senders.length > 0) {
      const senderTask = this.senders.shift()!
      queueMicrotask(() => senderTask.resolveSend()) // Unblock the sender
      return senderTask.value // Return the value from sender
    }

    // Buffer is empty, channel is open, no waiting senders. Receiver must block.
    return new Promise<T>((resolve, reject) => {
      this.receivers.push({ resolveReceive: resolve, rejectReceive: reject })
    })
  }

  async receiveWithOk(): Promise<ChannelReceiveResult<T>> {
    // Attempt to get from buffer first
    if (this.buffer.length > 0) {
      const value = this.buffer.shift()!
      if (this.senders.length > 0) {
        const senderTask = this.senders.shift()!
        this.buffer.push(senderTask.value)
        queueMicrotask(() => senderTask.resolveSend())
      }
      return { value, ok: true }
    }

    // Buffer is empty.
    // Attempt to rendezvous with a waiting sender.
    if (this.senders.length > 0) {
      const senderTask = this.senders.shift()!
      queueMicrotask(() => senderTask.resolveSend())
      return { value: senderTask.value, ok: true }
    }

    // Buffer is empty, no waiting senders.
    // If channel is closed, return zero value with ok: false.
    if (this.closed) {
      return { value: this.zeroValue, ok: false }
    }

    // Buffer is empty, channel is open, no waiting senders. Receiver must block.
    return new Promise<ChannelReceiveResult<T>>((resolve) => {
      this.receiversWithOk.push({ resolveReceive: resolve })
    })
  }

  async selectReceive(id: number): Promise<SelectResult<T>> {
    if (this.buffer.length > 0) {
      const value = this.buffer.shift()!
      if (this.senders.length > 0) {
        const senderTask = this.senders.shift()!
        this.buffer.push(senderTask.value)
        queueMicrotask(() => senderTask.resolveSend())
      }
      return { value, ok: true, id }
    }

    if (this.senders.length > 0) {
      const senderTask = this.senders.shift()!
      queueMicrotask(() => senderTask.resolveSend())
      return { value: senderTask.value, ok: true, id }
    }

    if (this.closed) {
      return { value: this.zeroValue, ok: false, id }
    }

    return new Promise<SelectResult<T>>((resolve) => {
      this.receiversWithOk.push({
        resolveReceive: (result: ChannelReceiveResult<T>) => {
          resolve({ ...result, id })
        },
      })
    })
  }

  async selectSend(value: T, id: number): Promise<SelectResult<boolean>> {
    if (this.closed) {
      // A select case sending on a closed channel panics in Go.
      // This will cause Promise.race in selectStatement to reject.
      throw new Error('send on closed channel')
    }

    if (this.receivers.length > 0) {
      const receiverTask = this.receivers.shift()!
      queueMicrotask(() => receiverTask.resolveReceive(value))
      return { value: true, ok: true, id }
    }
    if (this.receiversWithOk.length > 0) {
      const receiverTask = this.receiversWithOk.shift()!
      queueMicrotask(() => receiverTask.resolveReceive({ value, ok: true }))
      return { value: true, ok: true, id }
    }

    if (this.buffer.length < this.capacity) {
      this.buffer.push(value)
      return { value: true, ok: true, id }
    }

    return new Promise<SelectResult<boolean>>((resolve, reject) => {
      this.senders.push({
        value,
        resolveSend: () => resolve({ value: true, ok: true, id }),
        rejectSend: (e) => reject(e), // Propagate error if channel closes
      })
    })
  }

  close(): void {
    if (this.closed) {
      throw new Error('close of closed channel')
    }
    this.closed = true

    const sendersToNotify = [...this.senders] // Shallow copy for iteration
    this.senders = []
    for (const senderTask of sendersToNotify) {
      queueMicrotask(() =>
        senderTask.rejectSend(new Error('send on closed channel')),
      )
    }

    const receiversToNotify = [...this.receivers]
    this.receivers = []
    for (const receiverTask of receiversToNotify) {
      queueMicrotask(() => receiverTask.resolveReceive(this.zeroValue))
    }

    const receiversWithOkToNotify = [...this.receiversWithOk]
    this.receiversWithOk = []
    for (const receiverTask of receiversWithOkToNotify) {
      queueMicrotask(() =>
        receiverTask.resolveReceive({ value: this.zeroValue, ok: false }),
      )
    }
  }

  canReceiveNonBlocking(): boolean {
    return this.buffer.length > 0 || this.senders.length > 0 || this.closed
  }

  canSendNonBlocking(): boolean {
    if (this.closed) {
      return true // Ready to panic
    }
    return (
      this.buffer.length < this.capacity ||
      this.receivers.length > 0 ||
      this.receiversWithOk.length > 0
    )
  }
}

/**
 * Represents a reference to a channel with a specific direction.
 */
export interface ChannelRef<T> {
  /**
   * The underlying channel
   */
  channel: Channel<T>

  /**
   * The direction of this channel reference
   */
  direction: 'send' | 'receive' | 'both'

  // Channel methods
  send(value: T): Promise<void>
  receive(): Promise<T>
  receiveWithOk(): Promise<ChannelReceiveResult<T>>
  close(): void
  canSendNonBlocking(): boolean
  canReceiveNonBlocking(): boolean
  selectSend(value: T, id: number): Promise<SelectResult<boolean>>
  selectReceive(id: number): Promise<SelectResult<T>>
}

/**
 * A bidirectional channel reference.
 */
export class BidirectionalChannelRef<T> implements ChannelRef<T> {
  direction = 'both' as const

  constructor(public channel: Channel<T>) {}

  // Delegate all methods to the underlying channel
  send(value: T): Promise<void> {
    return this.channel.send(value)
  }

  receive(): Promise<T> {
    return this.channel.receive()
  }

  receiveWithOk(): Promise<ChannelReceiveResult<T>> {
    return this.channel.receiveWithOk()
  }

  close(): void {
    this.channel.close()
  }

  canSendNonBlocking(): boolean {
    return this.channel.canSendNonBlocking()
  }

  canReceiveNonBlocking(): boolean {
    return this.channel.canReceiveNonBlocking()
  }

  selectSend(value: T, id: number): Promise<SelectResult<boolean>> {
    return this.channel.selectSend(value, id)
  }

  selectReceive(id: number): Promise<SelectResult<T>> {
    return this.channel.selectReceive(id)
  }
}

/**
 * A send-only channel reference.
 */
export class SendOnlyChannelRef<T> implements ChannelRef<T> {
  direction = 'send' as const

  constructor(public channel: Channel<T>) {}

  // Allow send operations
  send(value: T): Promise<void> {
    return this.channel.send(value)
  }

  // Allow close operations
  close(): void {
    this.channel.close()
  }

  canSendNonBlocking(): boolean {
    return this.channel.canSendNonBlocking()
  }

  selectSend(value: T, id: number): Promise<SelectResult<boolean>> {
    return this.channel.selectSend(value, id)
  }

  // Disallow receive operations
  receive(): Promise<T> {
    throw new Error('Cannot receive from send-only channel')
  }

  receiveWithOk(): Promise<ChannelReceiveResult<T>> {
    throw new Error('Cannot receive from send-only channel')
  }

  canReceiveNonBlocking(): boolean {
    return false
  }

  selectReceive(_id: number): Promise<SelectResult<T>> {
    throw new Error('Cannot receive from send-only channel')
  }
}

/**
 * A receive-only channel reference.
 */
export class ReceiveOnlyChannelRef<T> implements ChannelRef<T> {
  direction = 'receive' as const

  constructor(public channel: Channel<T>) {}

  // Allow receive operations
  receive(): Promise<T> {
    return this.channel.receive()
  }

  receiveWithOk(): Promise<ChannelReceiveResult<T>> {
    return this.channel.receiveWithOk()
  }

  canReceiveNonBlocking(): boolean {
    return this.channel.canReceiveNonBlocking()
  }

  selectReceive(id: number): Promise<SelectResult<T>> {
    return this.channel.selectReceive(id)
  }

  // Disallow send operations
  send(_value: T): Promise<void> {
    throw new Error('Cannot send to receive-only channel')
  }

  // Disallow close operations
  close(): void {
    throw new Error('Cannot close receive-only channel')
  }

  canSendNonBlocking(): boolean {
    return false
  }

  selectSend(_value: T, _id: number): Promise<SelectResult<boolean>> {
    throw new Error('Cannot send to receive-only channel')
  }
}

/**
 * Creates a new channel reference with the specified direction.
 */
export function makeChannelRef<T>(
  channel: Channel<T>,
  direction: 'send' | 'receive' | 'both',
): ChannelRef<T> {
  switch (direction) {
    case 'send':
      return new SendOnlyChannelRef<T>(channel)
    case 'receive':
      return new ReceiveOnlyChannelRef<T>(channel)
    default: // 'both'
      return new BidirectionalChannelRef<T>(channel)
  }
}

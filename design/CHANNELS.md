# Channel Type Implementation in GoScript

## Overview
This document outlines the design and implementation of channel types in GoScript, with a special focus on channel direction and type assertions.

## Channel Types in Go
In Go, channels can have one of three directions:
- Bidirectional: `chan T`
- Send-only: `chan<- T`
- Receive-only: `<-chan T`

A key feature of Go's type system is that a bidirectional channel can be used where a send-only or receive-only channel is expected, but not vice versa.

## Channel Direction in TypeScript
In the GoScript runtime, channel directions are represented by the `direction` property in `ChannelTypeInfo`:
- Bidirectional: `'both'`
- Send-only: `'send'`
- Receive-only: `'receive'`

## ChannelRef Concept
To support Go's channel direction conversions, we introduce the `ChannelRef` concept. A `ChannelRef` is a wrapper around a channel that may restrict the operations allowed on the channel based on its direction:

```typescript
export interface ChannelRef<T> {
  /**
   * Returns the underlying channel
   */
  channel: Channel<T>
  
  /**
   * The direction of this channel reference
   */
  direction: 'send' | 'receive' | 'both'
}
```

We'll also need implementation classes for each direction:

```typescript
class BidirectionalChannelRef<T> implements ChannelRef<T> {
  constructor(public channel: Channel<T>) {}
  direction: 'both' = 'both'
}

class SendOnlyChannelRef<T> implements ChannelRef<T> {
  constructor(public channel: Channel<T>) {}
  direction: 'send' = 'send'
}

class ReceiveOnlyChannelRef<T> implements ChannelRef<T> {
  constructor(public channel: Channel<T>) {}
  direction: 'receive' = 'receive'
}
```

## Implementation Strategy
1. Update the compiler to include channel direction in type assertions
2. Modify the `matchesChannelType` function to check both element type and direction
3. Implement the `ChannelRef` concept for handling channel direction changes
4. Update type assertions to handle channel direction compatibility (bidirectional can be used as send-only or receive-only)

## Type Assertion Rules
When performing type assertions on channels, the following rules apply:
1. A bidirectional channel can be asserted to be a bidirectional, send-only, or receive-only channel of the same element type
2. A send-only channel can only be asserted to be a send-only channel of the same element type
3. A receive-only channel can only be asserted to be a receive-only channel of the same element type
4. The element type must match exactly for the assertion to succeed

## Runtime Implementation
The runtime implementation will use the `ChannelRef` interface to represent channels with specific directions. When a channel is created with `make(chan T)`, it will be a bidirectional channel. When a channel is converted to a send-only or receive-only channel, it will be wrapped in a `ChannelRef` with the appropriate direction.

The `matchesChannelType` function will be updated to check both the element type and the direction of the channel, following the rules described above.

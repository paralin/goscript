# Channel Design in GoScript

This document outlines how Go's channel semantics are mapped to TypeScript in the GoScript compiler.

## 1. Channel Representation

### 1.1 Channel Types

Go channels have three main variants:
- Bidirectional: `chan T` (can send and receive)
- Send-only: `chan<- T` (can only send)
- Receive-only: `<-chan T` (can only receive)

In TypeScript, we represent these with a single `$.Channel<T>` interface that has direction information:

```typescript
export interface Channel<T> {
  // Core operations
  send(value: T): Promise<void>;
  receive(): Promise<T>;
  receiveWithOk(): Promise<ChannelReceiveResult<T>>;
  close(): void;
  
  // Select statement support
  selectReceive(id: number): Promise<SelectResult<T>>;
  selectSend(value: T, id: number): Promise<SelectResult<boolean>>;
  canReceiveNonBlocking(): boolean;
  canSendNonBlocking(): boolean;
  
  // Channel metadata
  readonly direction: ChannelDirection;
  readonly elementType: string;
}

export enum ChannelDirection {
  SEND_ONLY = "send",
  RECEIVE_ONLY = "receive",
  BIDIRECTIONAL = "both"
}
```

### 1.2 Channel Implementation

The underlying implementation in TypeScript is a single `BufferedChannel<T>` class that implements the `Channel<T>` interface:

```typescript
class BufferedChannel<T> implements Channel<T> {
  private buffer: T[] = [];
  private closed: boolean = false;
  private capacity: number;
  private senders: Array<(value: boolean) => void> = [];
  private receivers: Array<(value: T) => void> = [];
  private receiversWithOk: Array<(result: ChannelReceiveResult<T>) => void> = [];
  private zeroValue: T;
  
  // Direction used for type assertions and assignability checks
  public readonly direction: ChannelDirection;
  public readonly elementType: string;

  constructor(capacity: number, zeroValue: T, direction: ChannelDirection = ChannelDirection.BIDIRECTIONAL, elementType: string = 'any') {
    this.capacity = capacity;
    this.zeroValue = zeroValue;
    this.direction = direction;
    this.elementType = elementType;
  }
  
  // Implementation of Channel methods...
}
```

## 2. Channel Assignability

Go has specific rules for assigning channels with different directions:
- A bidirectional channel can be assigned to a send-only or receive-only channel
- A send-only or receive-only channel cannot be assigned to a bidirectional channel
- A send-only channel cannot be assigned to a receive-only channel and vice versa

In TypeScript, we enforce these rules through the runtime type system and type assertions:

```typescript
// Example rules in the type system
function isChannelAssignable(source: Channel<any>, target: ChannelTypeInfo): boolean {
  // 1. Element types must match (or be compatible)
  if (!areElementTypesCompatible(source.elementType, target.elemType)) {
    return false;
  }
  
  // 2. Direction compatibility
  switch (source.direction) {
    case ChannelDirection.BIDIRECTIONAL:
      // Bidirectional can be assigned to any direction
      return true;
    case ChannelDirection.SEND_ONLY:
      // Send-only can only be assigned to send-only
      return target.direction === ChannelDirection.SEND_ONLY;
    case ChannelDirection.RECEIVE_ONLY:
      // Receive-only can only be assigned to receive-only
      return target.direction === ChannelDirection.RECEIVE_ONLY;
    default:
      return false;
  }
}
```

## 3. Type Assertions

### 3.1 Channel Type Assertions

Go allows type assertions on channel values when interface{} contains a channel:

```go
var i interface{} = make(chan int)
ch, ok := i.(chan int)    // Succeeds
ch2, ok := i.(chan<- int) // May succeed
ch3, ok := i.(<-chan int) // May succeed
```

In TypeScript, we implement this by:

1. Adding a proper `matchesChannelType` function that considers direction and element type
2. Ensuring `typeAssert` handles channel types correctly

```typescript
function matchesChannelType(value: any, info: ChannelTypeInfo): boolean {
  if (typeof value !== 'object' || value === null || !('send' in value) || 
      !('receive' in value) || !('close' in value)) {
    return false;
  }
  
  // Check element type compatibility
  if (info.elemType && !areElementTypesCompatible(value.elementType, info.elemType)) {
    return false;
  }
  
  // Check direction compatibility
  if (info.direction) {
    switch (info.direction) {
      case ChannelDirection.BIDIRECTIONAL:
        // For bidirectional assertion, channel must be exactly bidirectional
        return value.direction === ChannelDirection.BIDIRECTIONAL;
      case ChannelDirection.SEND_ONLY:
        // For send-only assertion, channel can be bidirectional or send-only
        return value.direction === ChannelDirection.BIDIRECTIONAL || 
               value.direction === ChannelDirection.SEND_ONLY;
      case ChannelDirection.RECEIVE_ONLY:
        // For receive-only assertion, channel can be bidirectional or receive-only
        return value.direction === ChannelDirection.BIDIRECTIONAL || 
               value.direction === ChannelDirection.RECEIVE_ONLY;
      default:
        return false;
    }
  }
  
  // If no direction specified in the type info, allow any direction
  return true;
}
```

### 3.2 Channel Type Creation

When channels are created or converted through type assertion, the compiler generates code that passes the appropriate direction:

```typescript
// Go: make(chan int)
$.makeChannel<number>(0, 0, $.ChannelDirection.BIDIRECTIONAL, 'number')

// Go: make(chan<- int)
$.makeChannel<number>(0, 0, $.ChannelDirection.SEND_ONLY, 'number')

// Go: make(<-chan int)
$.makeChannel<number>(0, 0, $.ChannelDirection.RECEIVE_ONLY, 'number')
```

## 4. Nil Channels

Go allows nil channels for all channel types. In our TypeScript representation, nil channels are represented as `null`:

```typescript
// Go: var c chan int = nil
let c: $.Channel<number> = null
```

Type assertion of nil channels follows Go semantics:
- `nil.(chan T)` succeeds with `(nil, true)`
- `nil.(chan<- T)` succeeds with `(nil, true)`
- `nil.(<-chan T)` succeeds with `(nil, true)`
- `c.(chan T)` fails with `(nil, false)` if `c` is a nil channel of a different type

## References

- [Go Language Specification - Channels](https://golang.org/ref/spec#Channel_types)
- [Go Language Specification - Type Assertions](https://golang.org/ref/spec#Type_assertions)
- [Effective Go - Channels](https://golang.org/doc/effective_go#channels)

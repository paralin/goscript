import * as $ from "@goscript/builtin/builtin.js";

// Context represents a context that can be canceled
export class Context {
  private doneChannel: $.Channel<{}>;
  private canceled: boolean = false;

  constructor() {
    // Create a done channel that will be closed when context is canceled
    this.doneChannel = $.makeChannel<{}>(0, {}, 'both');
  }

  // Done returns a channel that is closed when the context is canceled
  public Done(): $.Channel<{}> {
    return this.doneChannel;
  }

  // Internal method to cancel the context
  public cancel(): void {
    if (!this.canceled) {
      this.canceled = true;
      // Close the done channel to signal cancellation
      // This will cause any receivers waiting on Done() to unblock
      this.doneChannel.close();
    }
  }

  public isCanceled(): boolean {
    return this.canceled;
  }
}

// Background returns a non-nil, empty Context
export function Background(): Context {
  return new Context();
}

// WithCancel returns a copy of parent with a new Done channel
// The returned context's Done channel is closed when the returned cancel function
// is called or when the parent context's Done channel is closed, whichever happens first
export function WithCancel(parent: Context): [Context, () => void] {
  const child = new Context();
  
  // Create the cancel function
  const cancel = () => {
    child.cancel();
  };

  // If parent gets canceled, cancel the child too
  if (parent) {
    queueMicrotask(async () => {
      try {
        await parent.Done().receive();
        child.cancel();
      } catch (e) {
        // Parent context was canceled (channel closed), cancel child
        child.cancel();
      }
    });
  }

  return [child, cancel];
}

// TypeScript implementation of Go's iter package
// This provides iterator types and functions

// Seq is an iterator over sequences of individual values
export type Seq<V> = (_yield: (value: V) => boolean) => void;

// Seq2 is an iterator over sequences of pairs of values
export type Seq2<K, V> = (_yield: (key: K, value: V) => boolean) => void;

// Pull converts the "push-style" iterator sequence seq into a "pull-style" iterator
// Returns a function that returns the next value and a boolean indicating if iteration should continue
export function Pull<V>(seq: Seq<V>): [() => [V | undefined, boolean], () => void] {
  let done = false;
  let nextValue: V | undefined;
  let hasNext = false;
  
  const iterator = seq(function(value: V): boolean {
    nextValue = value;
    hasNext = true;
    return false; // Stop iteration after getting one value
  });
  
  const next = (): [V | undefined, boolean] => {
    if (done) {
      return [undefined, false];
    }
    
    if (hasNext) {
      const value = nextValue;
      hasNext = false;
      nextValue = undefined;
      return [value, true];
    }
    
    // Try to get next value
    seq(function(value: V): boolean {
      nextValue = value;
      hasNext = true;
      return false; // Stop after getting one value
    });
    
    if (hasNext) {
      const value = nextValue;
      hasNext = false;
      nextValue = undefined;
      return [value, true];
    }
    
    done = true;
    return [undefined, false];
  };
  
  const stop = (): void => {
    done = true;
    hasNext = false;
    nextValue = undefined;
  };
  
  return [next, stop];
}

// Pull2 converts the "push-style" iterator sequence seq into a "pull-style" iterator
// Returns a function that returns the next key-value pair and a boolean indicating if iteration should continue
export function Pull2<K, V>(seq: Seq2<K, V>): [() => [K | undefined, V | undefined, boolean], () => void] {
  let done = false;
  let nextKey: K | undefined;
  let nextValue: V | undefined;
  let hasNext = false;
  
  const next = (): [K | undefined, V | undefined, boolean] => {
    if (done) {
      return [undefined, undefined, false];
    }
    
    if (hasNext) {
      const key = nextKey;
      const value = nextValue;
      hasNext = false;
      nextKey = undefined;
      nextValue = undefined;
      return [key, value, true];
    }
    
    // Try to get next value
    seq(function(key: K, value: V): boolean {
      nextKey = key;
      nextValue = value;
      hasNext = true;
      return false; // Stop after getting one value
    });
    
    if (hasNext) {
      const key = nextKey;
      const value = nextValue;
      hasNext = false;
      nextKey = undefined;
      nextValue = undefined;
      return [key, value, true];
    }
    
    done = true;
    return [undefined, undefined, false];
  };
  
  const stop = (): void => {
    done = true;
    hasNext = false;
    nextKey = undefined;
    nextValue = undefined;
  };
  
  return [next, stop];
} 
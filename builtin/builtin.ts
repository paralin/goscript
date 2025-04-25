/**
 * Creates a new slice (TypeScript array) with the specified length and capacity.
 * @param elementType The element type of the slice (for type hinting).
 * @param len The length of the slice.
 * @param cap The capacity of the slice (optional).
 * @returns A new TypeScript array representing the slice.
 */
export const makeSlice = <T>(elementType: any, len: number, cap?: number): Array<T> & { __capacity?: number } => {
    const slice = new Array<T>(len) as Array<T> & { __capacity?: number };
    slice.__capacity = cap !== undefined ? cap : len;
    return slice;
};

/**
 * Creates a new map (TypeScript Map).
 * @param keyType The key type of the map (for type hinting).
 * @param valueType The value type of the map (for type hinting).
 * @returns A new TypeScript Map.
 */
export const makeMap = <K, V>(keyType: any, valueType: any): Map<K, V> => {
    return new Map<K, V>();
};

/**
 * Returns the length of a collection (string, array, or map).
 * @param collection The collection to get the length of.
 * @returns The length of the collection.
 */
export const len = <T>(collection: string | Array<T> | Map<any, any>): number => {
    if (typeof collection === 'string' || Array.isArray(collection)) {
        return collection.length;
    } else if (collection instanceof Map) {
        return collection.size;
    }
    return 0; // Default fallback
};

/**
 * Returns the capacity of a slice (TypeScript array).
 * @param slice The slice (TypeScript array).
 * @returns The capacity of the slice.
 */
export const cap = <T>(slice: Array<T> & { __capacity?: number }): number => {
    return slice.__capacity !== undefined ? slice.__capacity : slice.length;
};

/**
 * Converts a string to an array of Unicode code points (runes).
 * @param str The input string.
 * @returns An array of numbers representing the Unicode code points.
 */
export const stringToRunes = (str: string): number[] => {
    return Array.from(str).map(c => c.codePointAt(0) || 0);
};

/**
 * Gets a value from a map, with a default value if the key doesn't exist.
 * @param map The map to get from.
 * @param key The key to get.
 * @param defaultValue The default value to return if the key doesn't exist (defaults to 0).
 * @returns The value for the key, or the default value if the key doesn't exist.
 */
export const mapGet = <K, V>(map: Map<K, V>, key: K, defaultValue: V | null = null): V | null => {
    return map.has(key) ? map.get(key)! : defaultValue;
};

/**
 * Sets a value in a map.
 * @param map The map to set in.
 * @param key The key to set.
 * @param value The value to set.
 */
export const mapSet = <K, V>(map: Map<K, V>, key: K, value: V): void => {
    map.set(key, value);
};

/**
 * Deletes a key from a map.
 * @param map The map to delete from.
 * @param key The key to delete.
 */
export const deleteMapEntry = <K, V>(map: Map<K, V>, key: K): void => {
    map.delete(key);
};

/**
 * Checks if a key exists in a map.
 * @param map The map to check in.
 * @param key The key to check.
 * @returns True if the key exists, false otherwise.
 */
export const mapHas = <K, V>(map: Map<K, V>, key: K): boolean => {
    return map.has(key);
};
/**
 * Appends elements to a slice (TypeScript array).
 * Note: In Go, append can return a new slice if the underlying array is reallocated.
 * This helper emulates that by returning the modified array.
 * @param slice The slice (TypeScript array) to append to.
 * @param elements The elements to append.
 * @returns The modified slice (TypeScript array).
 */
export const append = <T>(slice: Array<T>, ...elements: T[]): Array<T> => {
    slice.push(...elements);
    return slice;
};
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
    send(value: T): Promise<void>;

    /**
     * Receives a value from the channel.
     * Returns a promise that resolves with the received value.
     */
    receive(): Promise<T>;

    /**
     * Closes the channel.
     * No more values can be sent to a closed channel.
     */
    close(): void;
}

// A simple implementation of buffered channels
class BufferedChannel<T> implements Channel<T> {
    private buffer: T[] = [];
    private closed: boolean = false;
    private capacity: number;
    private senders: Array<(value: boolean) => void> = []; // Resolvers for blocked senders
    private receivers: Array<(value: T) => void> = []; // Resolvers for blocked receivers

    constructor(capacity: number) {
        this.capacity = capacity;
    }

    async send(value: T): Promise<void> {
        if (this.closed) {
            throw new Error("send on closed channel");
        }

        // If there are waiting receivers, directly pass the value
        if (this.receivers.length > 0) {
            const receiver = this.receivers.shift()!;
            receiver(value);
            return;
        }

        // If buffer is not full, add to buffer
        if (this.buffer.length < this.capacity) {
            this.buffer.push(value);
            return;
        }

        // Buffer is full, block the sender
        return new Promise<void>((resolve, reject) => {
            this.senders.push((success: boolean) => {
                if (success) {
                    this.buffer.push(value);
                    resolve();
                } else {
                    reject(new Error("send on closed channel"));
                }
            });
        });
    }

    async receive(): Promise<T> {
        // If buffer has values, return from buffer
        if (this.buffer.length > 0) {
            const value = this.buffer.shift()!;

            // If there are waiting senders, unblock one
            if (this.senders.length > 0) {
                const sender = this.senders.shift()!;
                sender(true); // Unblock with success
            }

            return value;
        }

        // If channel is closed and buffer is empty, throw error
        if (this.closed) {
            throw new Error("receive on closed channel");
        }

        // Buffer is empty, block the receiver
        return new Promise<T>((resolve) => {
            this.receivers.push(resolve);
        });
    }

    close(): void {
        if (this.closed) {
            throw new Error("close of closed channel");
        }

        this.closed = true;

        // Unblock all waiting senders with failure
        for (const sender of this.senders) {
            sender(false);
        }
        this.senders = [];

        // Unblock all waiting receivers with undefined
        for (const receiver of this.receivers) {
            receiver(undefined as any);
        }
        this.receivers = [];
    }
}

/**
 * Creates a new channel with the specified buffer size.
 * @param bufferSize The size of the channel buffer. If 0, creates an unbuffered channel.
 * @returns A new channel instance.
 */
export const makeChannel = <T>(bufferSize: number): Channel<T> => {
    return new BufferedChannel<T>(bufferSize);
};

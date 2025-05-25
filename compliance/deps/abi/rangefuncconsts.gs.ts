import * as $ from "@goscript/builtin/builtin.js";

export type RF_State = number;

// body of loop has exited in a non-panic way
export let RF_DONE: RF_State = (0 as RF_State)

// body of loop has not exited yet, is not running  -- this is not a panic index
export let RF_READY: RF_State = 0

// body of loop is either currently running, or has panicked
export let RF_PANIC: RF_State = 0

// iterator function return, i.e., sequence is "exhausted"
export let RF_EXHAUSTED: RF_State = 0

// body of loop panicked but iterator function defer-recovered it away
export let RF_MISSING_PANIC: number = 4


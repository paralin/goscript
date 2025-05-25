import * as $ from "@goscript/builtin/builtin.js";

// StackNosplitBase is the base maximum number of bytes that a chain of
// NOSPLIT functions can use.
//
// This value must be multiplied by the stack guard multiplier, so do not
// use it directly. See runtime/stack.go:stackNosplit and
// cmd/internal/objabi/stack.go:StackNosplit.
export let StackNosplitBase: number = 800

// After a stack split check the SP is allowed to be StackSmall bytes below
// the stack guard.
//
// Functions that need frames <= StackSmall can perform the stack check
// using a single comparison directly between the stack guard and the SP
// because we ensure that StackSmall bytes of stack space are available
// beyond the stack guard.
export let StackSmall: number = 128

// Functions that need frames <= StackBig can assume that neither
// SP-framesize nor stackGuard-StackSmall will underflow, and thus use a
// more efficient check. In order to ensure this, StackBig must be <= the
// size of the unmapped space at zero.
export let StackBig: number = 4096


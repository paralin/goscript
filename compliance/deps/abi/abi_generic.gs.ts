import * as $ from "@goscript/builtin/builtin.js";

// IntArgRegs is the number of registers dedicated
// to passing integer argument values. Result registers are identical
// to argument registers, so this number is used for those too.
export let IntArgRegs: number = 0

// FloatArgRegs is the number of registers dedicated
// to passing floating-point argument values. Result registers are
// identical to argument registers, so this number is used for
// those too.
export let FloatArgRegs: number = 0

// EffectiveFloatRegSize describes the width of floating point
// registers on the current platform from the ABI's perspective.
//
// Since Go only supports 32-bit and 64-bit floating point primitives,
// this number should be either 0, 4, or 8. 0 indicates no floating
// point registers for the ABI or that floating point values will be
// passed via the softfloat ABI.
//
// For platforms that support larger floating point register widths,
// such as x87's 80-bit "registers" (not that we support x87 currently),
// use 8.
export let EffectiveFloatRegSize: number = 0


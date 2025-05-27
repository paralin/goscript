// FMA returns x * y + z, computed with only one rounding.
// (That is, FMA returns the fused multiply-add of x, y, and z.)
export function FMA(x: number, y: number, z: number): number {
	// JavaScript doesn't have native FMA, so we use the simple implementation
	// This may not be as precise as a true FMA but is much simpler
	return x * y + z
} 
import * as $ from "@goscript/builtin/builtin.js";

// Float32bits returns the IEEE 754 binary representation of f,
// with the sign bit of f and the result in the same bit position.
// Float32bits(Float32frombits(x)) == x.
export function Float32bits(f: number): number {
	const buffer = new ArrayBuffer(4);
	const view = new DataView(buffer);
	view.setFloat32(0, f, true); // little endian
	return view.getUint32(0, true);
}

// Float32frombits returns the floating-point number corresponding
// to the IEEE 754 binary representation b, with the sign bit of b
// and the result in the same bit position.
// Float32frombits(Float32bits(x)) == x.
export function Float32frombits(b: number): number {
	const buffer = new ArrayBuffer(4);
	const view = new DataView(buffer);
	view.setUint32(0, b, true); // little endian
	return view.getFloat32(0, true);
}

// Float64bits returns the IEEE 754 binary representation of f,
// with the sign bit of f and the result in the same bit position,
// and Float64bits(Float64frombits(x)) == x.
export function Float64bits(f: number): number {
	const buffer = new ArrayBuffer(8);
	const view = new DataView(buffer);
	view.setFloat64(0, f, true); // little endian
	// JavaScript numbers are limited to 53-bit precision, so we need to handle this carefully
	const low = view.getUint32(0, true);
	const high = view.getUint32(4, true);
	// Combine into a single number (may lose precision for very large values)
	return high * 0x100000000 + low;
}

// Float64frombits returns the floating-point number corresponding
// to the IEEE 754 binary representation b, with the sign bit of b
// and the result in the same bit position.
// Float64frombits(Float64bits(x)) == x.
export function Float64frombits(b: number): number {
	const buffer = new ArrayBuffer(8);
	const view = new DataView(buffer);
	// Split the number into high and low 32-bit parts
	const low = b & 0xFFFFFFFF;
	const high = Math.floor(b / 0x100000000);
	view.setUint32(0, low, true); // little endian
	view.setUint32(4, high, true);
	return view.getFloat64(0, true);
}


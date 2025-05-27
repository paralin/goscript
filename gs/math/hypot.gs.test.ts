import { describe, it, expect } from 'vitest';
import { Hypot, hypot } from './hypot.gs.js';
import { Inf, NaN as GoNaN, IsNaN, IsInf } from './bits.gs.js';

describe('Hypot', () => {
  it('should calculate hypotenuse correctly for basic cases', () => {
    expect(Hypot(3, 4)).toBeCloseTo(5, 10);
    expect(Hypot(5, 12)).toBeCloseTo(13, 10);
    expect(Hypot(8, 15)).toBeCloseTo(17, 10);
    expect(Hypot(1, 1)).toBeCloseTo(Math.sqrt(2), 10);
  });

  it('should handle zero values', () => {
    expect(Hypot(0, 0)).toBe(0);
    expect(Hypot(0, 5)).toBe(5);
    expect(Hypot(5, 0)).toBe(5);
    expect(Hypot(0, -5)).toBe(5);
    expect(Hypot(-5, 0)).toBe(5);
  });

  it('should handle negative values', () => {
    expect(Hypot(-3, 4)).toBeCloseTo(5, 10);
    expect(Hypot(3, -4)).toBeCloseTo(5, 10);
    expect(Hypot(-3, -4)).toBeCloseTo(5, 10);
    expect(Hypot(-5, -12)).toBeCloseTo(13, 10);
  });

  it('should handle infinity cases', () => {
    expect(Hypot(Inf(1), 5)).toBe(Inf(1));
    expect(Hypot(5, Inf(1))).toBe(Inf(1));
    expect(Hypot(Inf(-1), 5)).toBe(Inf(1));
    expect(Hypot(5, Inf(-1))).toBe(Inf(1));
    expect(Hypot(Inf(1), Inf(1))).toBe(Inf(1));
    expect(Hypot(Inf(-1), Inf(-1))).toBe(Inf(1));
  });

  it('should handle NaN cases', () => {
    expect(IsNaN(Hypot(GoNaN(), 5))).toBe(true);
    expect(IsNaN(Hypot(5, GoNaN()))).toBe(true);
    expect(IsNaN(Hypot(GoNaN(), GoNaN()))).toBe(true);
  });

  it('should handle very large values without overflow', () => {
    const large = 1e150;
    const result = Hypot(large, large);
    expect(result).toBeCloseTo(large * Math.sqrt(2), 5);
    expect(IsInf(result, 0)).toBe(false);
  });

  it('should handle very small values without underflow', () => {
    const small = 1e-150;
    const result = Hypot(small, small);
    expect(result).toBeCloseTo(small * Math.sqrt(2), 160);
    expect(result).toBeGreaterThan(0);
  });

  it('should be commutative', () => {
    expect(Hypot(3, 4)).toBe(Hypot(4, 3));
    expect(Hypot(-3, 4)).toBe(Hypot(4, -3));
    expect(Hypot(1.5, 2.5)).toBe(Hypot(2.5, 1.5));
  });
});

describe('hypot (lowercase)', () => {
  it('should work identically to Hypot', () => {
    expect(hypot(3, 4)).toBe(Hypot(3, 4));
    expect(hypot(5, 12)).toBe(Hypot(5, 12));
    expect(hypot(0, 0)).toBe(Hypot(0, 0));
    expect(hypot(-3, 4)).toBe(Hypot(-3, 4));
    expect(hypot(Inf(1), 5)).toBe(Hypot(Inf(1), 5));
    expect(IsNaN(hypot(GoNaN(), 5))).toBe(IsNaN(Hypot(GoNaN(), 5)));
  });
}); 
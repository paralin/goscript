import { describe, it, expect } from 'vitest';
import { FMA } from './fma.gs.js';
import { Inf, NaN, IsNaN, IsInf } from './bits.gs.js';

describe('FMA', () => {
  it('should compute fused multiply-add correctly for basic cases', () => {
    expect(FMA(2, 3, 4)).toBe(10); // 2*3 + 4 = 10
    expect(FMA(1.5, 2, 0.5)).toBe(3.5); // 1.5*2 + 0.5 = 3.5
    expect(FMA(0.1, 0.2, 0.3)).toBeCloseTo(0.32, 10); // 0.1*0.2 + 0.3 = 0.32
    expect(FMA(-2, 3, 1)).toBe(-5); // -2*3 + 1 = -5
  });

  it('should handle zero values', () => {
    expect(FMA(0, 5, 3)).toBe(3); // 0*5 + 3 = 3
    expect(FMA(5, 0, 3)).toBe(3); // 5*0 + 3 = 3
    expect(FMA(5, 3, 0)).toBe(15); // 5*3 + 0 = 15
    expect(FMA(0, 0, 0)).toBe(0); // 0*0 + 0 = 0
    expect(FMA(0, 0, 5)).toBe(5); // 0*0 + 5 = 5
  });

  it('should handle negative values', () => {
    expect(FMA(-2, -3, 4)).toBe(10); // -2*-3 + 4 = 10
    expect(FMA(-2, 3, -4)).toBe(-10); // -2*3 + -4 = -10
    expect(FMA(2, -3, -4)).toBe(-10); // 2*-3 + -4 = -10
    expect(FMA(-2, -3, -4)).toBe(2); // -2*-3 + -4 = 2
  });

  it('should handle infinity cases', () => {
    expect(FMA(Inf(1), 2, 3)).toBe(Inf(1)); // +Inf * 2 + 3 = +Inf
    expect(FMA(2, Inf(1), 3)).toBe(Inf(1)); // 2 * +Inf + 3 = +Inf
    expect(FMA(2, 3, Inf(1))).toBe(Inf(1)); // 2 * 3 + +Inf = +Inf
    expect(FMA(Inf(-1), 2, 3)).toBe(Inf(-1)); // -Inf * 2 + 3 = -Inf
    expect(FMA(Inf(1), Inf(1), 3)).toBe(Inf(1)); // +Inf * +Inf + 3 = +Inf
    expect(FMA(Inf(-1), Inf(-1), 3)).toBe(Inf(1)); // -Inf * -Inf + 3 = +Inf
  });

  it('should handle NaN cases', () => {
    expect(IsNaN(FMA(NaN(), 2, 3))).toBe(true);
    expect(IsNaN(FMA(2, NaN(), 3))).toBe(true);
    expect(IsNaN(FMA(2, 3, NaN()))).toBe(true);
    expect(IsNaN(FMA(NaN(), NaN(), NaN()))).toBe(true);
  });

  it('should handle special infinity and zero combinations', () => {
    // Inf * 0 should produce NaN
    expect(IsNaN(FMA(Inf(1), 0, 5))).toBe(true);
    expect(IsNaN(FMA(0, Inf(1), 5))).toBe(true);
    
    // But if the addition part is also infinity, behavior depends on implementation
    expect(IsNaN(FMA(Inf(1), 0, Inf(1)))).toBe(true);
  });

  it('should handle cancellation cases', () => {
    // Cases where x*y and z cancel out
    expect(FMA(2, 3, -6)).toBe(0); // 2*3 + (-6) = 0
    expect(FMA(-5, 4, 20)).toBe(0); // -5*4 + 20 = 0
    expect(FMA(0.5, 0.2, -0.1)).toBeCloseTo(0, 10); // 0.5*0.2 + (-0.1) = 0
  });

  it('should handle very large and small numbers', () => {
    const large = 1e100;
    const small = 1e-100;
    
    // Relax tolerance for very large/small number calculations
    const result1 = FMA(large, small, 1)
    expect(result1).toBeCloseTo(2, 0); // large*small is approximately 1, so result is approximately 2
    expect(FMA(small, small, large)).toBeCloseTo(large, 5); // small*small is negligible
    expect(FMA(large, large, -large * large)).toBeCloseTo(0, 5); // cancellation
  });

  it('should be equivalent to x * y + z for simple cases', () => {
    const testCases = [
      [1, 2, 3],
      [0.5, 0.25, 0.125],
      [-1, 2, -3],
      [10, 0.1, 5]
    ];

    testCases.forEach(([x, y, z]) => {
      expect(FMA(x, y, z)).toBeCloseTo(x * y + z, 10);
    });
  });
}); 
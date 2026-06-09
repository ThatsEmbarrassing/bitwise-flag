import type { Combinator } from "./types";

/**
 * Implements {@link Combinator} for JavaScript's built-in `number` type using
 * native 32-bit bitwise operators.
 *
 * Every operation delegates directly to JavaScript's `|`, `&`, `^`, `~` and
 * `<<` operators, which coerce their operands to a 32-bit signed integer
 * (Int32) before computing the result. The effective flag space is therefore
 * 32 bits (positions 0–31), and results are always returned as signed values.
 *
 * @category Combinator
 * @internal
 */
export class NumberCombinator implements Combinator<number> {
  /** Neutral element for bitwise OR — a `number` with no bits set. */
  zero: number = 0;

  /**
   * Counts the number of set bits (population count) in `a`.
   *
   * Reinterprets `a` as an unsigned 32-bit integer via `>>> 0` before
   * counting, so negative inputs are treated as their unsigned equivalent.
   *
   * @param a - Value whose set bits are counted.
   * @returns The count of bits set to `1` in the 32-bit unsigned representation of `a`.
   *
   * @example
   * ```ts
   * c.popcount(0b0111) // → 3
   * c.popcount(-1)     // → 32  (-1 is 0xFFFFFFFF unsigned)
   * ```
   */
  popcount(a: number): number {
    let n = a >>> 0;
    let c = 0;

    while (n) {
      n &= n - 1;
      c++;
    }

    return c;
  }

  /**
   * Returns the bitwise OR of `a` and `b`.
   *
   * @param a - First operand.
   * @param b - Second operand.
   * @returns `a | b` as a signed 32-bit integer.
   */
  or(a: number, b: number): number {
    return a | b;
  }

  /**
   * Returns the bitwise AND of `a` and `b`.
   *
   * @param a - First operand.
   * @param b - Second operand.
   * @returns `a & b` as a signed 32-bit integer.
   */
  and(a: number, b: number): number {
    return a & b;
  }

  /**
   * Returns the bitwise AND of `a` and `~b`.
   * Same as `combinator.and(a, combinator.not(b))`
   *
   * @param a - First operand.
   * @param b - Second operand.
   * @returns `a & ~b` as a signed 32-bit integer.
   */
  andNot(a: number, b: number): number {
    return a & ~b;
  }

  /**
   * Returns the bitwise XOR of `a` and `b`.
   *
   * @param a - First operand.
   * @param b - Second operand.
   * @returns `a ^ b` as a signed 32-bit integer.
   */
  xor(a: number, b: number): number {
    return a ^ b;
  }

  /**
   * Returns the bitwise NOT of `a` (one's complement inversion).
   *
   * @param a - Value to invert.
   * @returns `~a` as a signed 32-bit integer.
   */
  not(a: number): number {
    return ~a;
  }

  /**
   * Shifts `value` left by `shift` bit positions.
   *
   * @param value - Value to shift.
   * @param shift - Number of positions to shift left (valid range: 0–31).
   * @returns `value << shift` as a signed 32-bit integer.
   */
  shiftL(value: number, shift: number): number {
    return value << shift;
  }
}

import type { Bit } from "@/core/types";

/**
 * An abstract interface over a set of primitive bitwise operations for a given numeric
 * type `T`.
 *
 * @typeParam T - The numeric type over which bitwise operations are performed.
 *   Must be either `number` or `bigint` (i.e. {@link Bit}).
 *
 * @category Combinator
 */
export interface Combinator<T extends Bit> {
  /** The identity element for `or` — a value with no bits set (`0` or `0n`). */
  readonly zero: T;

  /**
   * Counts the number of bits set to `1` in `a` (population count).
   *
   * @param a - Value whose set bits are counted.
   * @returns The number of `1` bits in `a`.
   */
  popcount(a: T): number;

  /**
   * Returns the bitwise OR of `a` and `b`.
   *
   * @param a - First operand.
   * @param b - Second operand.
   * @returns `a | b`.
   */
  or(a: T, b: T): T;

  /**
   * Returns the bitwise AND of `a` and `b`.
   *
   * @param a - First operand.
   * @param b - Second operand.
   * @returns `a & b`.
   */
  and(a: T, b: T): T;

  /**
   * Returns the bitwise AND of `a` and `~b`.
   * Same as `combinator.and(a, combinator.not(b))`
   * 
   * @param a - First operand.
   * @param b - Second operand.
   * @returns `a & ~b`
   */
  andNot(a: T, b: T): T;

  /**
   * Returns the bitwise XOR of `a` and `b`.
   *
   * @param a - First operand.
   * @param b - Second operand.
   * @returns `a ^ b`.
   */
  xor(a: T, b: T): T;

  /**
   * Returns the bitwise NOT of `a` (one's complement inversion).
   *
   * @param a - Value to invert.
   * @returns `~a`.
   */
  not(a: T): T;

  /**
   * Shifts `value` left by `shift` bit positions.
   *
   * @param value - Value to shift.
   * @param shift - Number of positions to shift left.
   * @returns `value << shift`.
   */
  shiftL(value: T, shift: number): T;
}

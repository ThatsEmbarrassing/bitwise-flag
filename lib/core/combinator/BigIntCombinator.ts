import type { Combinator } from "./types";

/**
 * Implements {@link Combinator} for JavaScript's built-in `bigint` type using
 * native arbitrary-precision bitwise operators.
 *
 * Every operation delegates directly to JavaScript's `|`, `&`, `^`, `~` and
 * `<<` operators on `bigint` values. Unlike the `number`-based counterpart,
 * `bigint` is not constrained to a fixed word size: the effective flag space is
 * unbounded, and results are never truncated or sign-coerced by the engine.
 *
 * `bigint` uses two's complement with conceptually infinite precision: negative
 * values represent an infinite sequence of leading `1` bits. This makes `not`
 * always produce a negative result for any non-negative input, and makes
 * `popcount` reject negative inputs rather than silently reinterpret them.
 *
 * @category Combinator
 * @internal
 */
export class BigIntCombinator implements Combinator<bigint> {
  /** Neutral element for bitwise OR — a `bigint` with no bits set. */
  readonly zero = 0n;

  /**
   * Counts the number of set bits (population count) in `a`.
   *
   * Unlike the `number` variant, negative `bigint` values cannot be
   * reinterpreted as unsigned because `bigint` has no fixed width and a
   * negative value conceptually has infinitely many set bits. Passing a
   * negative value throws a RangeError with the offending value
   * included in the message.
   *
   * @param a - Non-negative value whose set bits are counted.
   * @returns The count of bits set to `1` in `a`.
   * @throws {RangeError} If `a` is negative.
   *
   * @example
   * ```ts
   * c.popcount(0n)                // → 0
   * c.popcount(0b0111n)           // → 3
   * c.popcount((1n << 128n) - 1n) // → 128
   * c.popcount(-1n)               // throws RangeError
   * ```
   */
  popcount(a: bigint): number {
    if (a < 0n)
      throw new RangeError(`popcount requires a non-negative bigint, got ${a}`);

    let n = a;
    let c = 0;

    while (n) {
      n &= n - 1n;
      c++;
    }

    return c;
  }

  /**
   * Returns the bitwise OR of `a` and `b`.
   *
   * @param a - First operand.
   * @param b - Second operand.
   * @returns `a | b` as a `bigint`.
   */
  or(a: bigint, b: bigint): bigint {
    return a | b;
  }

  /**
   * Returns the bitwise AND of `a` and `b`.
   *
   * @param a - First operand.
   * @param b - Second operand.
   * @returns `a & b` as a `bigint`.
   */
  and(a: bigint, b: bigint): bigint {
    return a & b;
  }

  /**
   * Returns the bitwise AND of `a` and `~b`.
   * Same as `combinator.and(a, combinator.not(b))`
   *
   * @param a - First operand.
   * @param b - Second operand.
   * @returns `a & ~b` as a `bigint`.
   */
  andNot(a: bigint, b: bigint): bigint {
    return a & ~b;
  }

  /**
   * Returns the bitwise XOR of `a` and `b`.
   *
   * @param a - First operand.
   * @param b - Second operand.
   * @returns `a ^ b` as a `bigint`.
   */
  xor(a: bigint, b: bigint): bigint {
    return a ^ b;
  }

  /**
   * Returns the bitwise NOT of `a` (one's complement inversion).
   *
   * @param a - Value to invert.
   * @returns `~a` as a `bigint`.
   */
  not(a: bigint): bigint {
    return ~a;
  }

  /**
   * Shifts `value` left by `shift` bit positions.
   *
   * The `shift` argument is a plain `number` and is converted to
   * `BigInt(shift)` internally. Unlike the `number` variant, there is no
   * 31-bit cap — values shifted beyond bit 31 or bit 63 remain exact and
   * positive.
   *
   * @param value - Value to shift.
   * @param shift - Number of positions to shift left (no upper bound enforced).
   * @returns `value << BigInt(shift)` as a `bigint`.
   *
   * @example
   * ```ts
   * c.shiftL(1n, 31)  // → 2147483648n  (not −2147483648 like number)
   * c.shiftL(1n, 100) // → 2n ** 100n
   * ```
   */
  shiftL(value: bigint, shift: number): bigint {
    return value << BigInt(shift);
  }
}

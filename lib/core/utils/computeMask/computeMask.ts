import type { Combinator } from "@/core/combinator/types";
import type { Bit } from "@/core/types";

/**
 * Combines an array of bit values into a single mask via bitwise OR.
 *
 * Order and duplicates do not affect the result — `OR` is commutative,
 * associative, and idempotent. Returns `combinator.zero` for an empty array.
 *
 * @typeParam T - The numeric type of the bit values (`number` or `bigint`).
 * @param combinator - Supplies `zero` (the fold seed) and `or` for the given `T`.
 * @param bits - The bit values to combine.
 * @returns The bitwise OR of all values in `bits`.
 *
 * @example
 * ```ts
 * computeMask(NUMBER_COMBINATOR, [1, 2, 4]); // 7
 * computeMask(NUMBER_COMBINATOR, []);        // 0
 * ```
 *
 * @internal
 */
export function computeMask<T extends Bit>(
  combinator: Combinator<T>,
  bits: readonly T[],
): T {
  return bits.reduce((mask, b) => combinator.or(mask, b), combinator.zero);
}

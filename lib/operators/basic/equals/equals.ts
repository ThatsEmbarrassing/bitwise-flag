import type { Bit } from "@/core/types";

import type { Flag } from "@/flags/types";

/**
 * Returns `true` if both flag boxes have identical bits AND belong to the same registry instance.
 * Boxes from different registry instances are never equal, even when their bits are identical.
 *
 * @example
 * const a = registry.of("read", "write");
 * const b = registry.of("read", "write");
 * equals(a, b); // true
 *
 * const other = NumberFlagRegistry.from("read", "write");
 * equals(a, other.of("read", "write")); // false — different registry instance
 */
export function equals<TFlags extends string, TBit extends Bit>(
  left: Flag<TFlags, TBit>,
  right: Flag<TFlags, TBit>,
) {
  return left.registry === right.registry && left.bits === right.bits;
}

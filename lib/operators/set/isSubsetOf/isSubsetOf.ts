import { assertSameRegistry } from "@/operators/utils";

import type { Bit } from "@/core/types";

import type { Flag } from "@/flags/types";

/**
 * Returns `true` if every flag in `left` is also set in `right` (left ⊆ right).
 * An empty box is a subset of any box, including another empty box.
 *
 * @throws {MixedRegistryError} if boxes belong to different registry instances.
 *
 * @example
 * const a = registry.of("read");
 * const b = registry.of("read", "write");
 * isSubsetOf(a, b); // true  — all of a's flags are in b
 * isSubsetOf(b, a); // false — "write" is not in a
 */
export function isSubsetOf<TFlags extends string, TBit extends Bit>(
  left: Flag<TFlags, TBit>,
  right: Flag<TFlags, TBit>,
) {
  assertSameRegistry(left, right);

  const { combinator } = left.registry;

  const bits = combinator.and(left.bits, right.bits);

  return bits === left.bits;
}

import { assertSameRegistry } from "@/operators/utils";

import type { Bit } from "@/core/types";

import type { Flag } from "@/flags/types";

/**
 * Returns `true` if `left` contains every flag that is set in `right` (left ⊇ right).
 * A full box is a superset of any box; an empty box is only a superset of another empty box.
 *
 * @throws {MixedRegistryError} if boxes belong to different registry instances.
 *
 * @example
 * const a = registry.of("read", "write");
 * const b = registry.of("read");
 * isSupersetOf(a, b); // true  — a contains all of b's flags
 * isSupersetOf(b, a); // false — b lacks "write"
 */
export function isSupersetOf<TFlags extends string, TBit extends Bit>(
  left: Flag<TFlags, TBit>,
  right: Flag<TFlags, TBit>,
) {
  assertSameRegistry(left, right);

  const { combinator } = left.registry;

  const bits = combinator.and(left.bits, right.bits);

  return bits === right.bits;
}

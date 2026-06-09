import { assertSameRegistry } from "@/operators/utils";

import type { Bit } from "@/core/types";

import type { Flag } from "@/flags/types";

/**
 * Returns `true` if the two flag boxes have at least one flag in common.
 *
 * @throws {MixedRegistryError} if boxes belong to different registry instances.
 *
 * @example
 * const a = registry.of("read", "write");
 * const b = registry.of("write", "execute");
 * overlaps(a, b); // true  — "write" is shared
 * overlaps(a, registry.of("admin")); // false — no common flags
 */
export function overlaps<TFlags extends string, TBit extends Bit>(
  left: Flag<TFlags, TBit>,
  right: Flag<TFlags, TBit>,
) {
  assertSameRegistry(left, right);

  const { combinator } = left.registry;

  return !!combinator.and(left.bits, right.bits);
}

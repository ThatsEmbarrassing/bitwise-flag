import { resolveMask } from "@/flags/utils";

import type { Bit } from "@/core/types";

import type { Flag } from "@/flags/types";

/**
 * Returns `true` only if the flag box contains ALL of the specified flags.
 *
 * @example
 * const box = registry.of("read", "write");
 * hasAll(box, "read", "write");   // true
 * hasAll(box, "read", "execute"); // false — "execute" is missing
 */
export function hasAll<TFlags extends string, TBit extends Bit, TBrand extends string | symbol>(
  flagBox: Flag<TFlags, TBit, TBrand>,
  ...flags: TFlags[]
): boolean {
  const { registry, bits } = flagBox;
  const { combinator } = registry;

  const mask = resolveMask(registry, flags);
  return combinator.and(bits, mask) === mask;
}

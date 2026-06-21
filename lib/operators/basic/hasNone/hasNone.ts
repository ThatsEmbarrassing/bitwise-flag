import { resolveMask } from "@/flags/utils"

import type { Bit } from "@/core/types";

import type { Flag } from "@/flags/types";

/**
 * Returns `true` if the flag box contains none of the specified flags.
 *
 * @example
 * const box = registry.of("read");
 * hasNone(box, "write", "admin"); // true  — neither is set
 * hasNone(box, "read", "write");  // false — "read" is set
 */
export function hasNone<TFlags extends string, TBit extends Bit, TBrand extends string | symbol>(
  flagBox: Flag<TFlags, TBit, TBrand>,
  ...flags: TFlags[]
): boolean {
  const { registry, bits } = flagBox;
  const { combinator } = registry;

  const mask = resolveMask(registry, flags);
  return combinator.and(bits, mask) === combinator.zero;
}

import type { Bit } from "@/core/types";

import type { Flag } from "@/flags/types";

/**
 * Returns `true` if the flag box contains at least one of the specified flags.
 *
 * @example
 * const box = registry.of("read");
 * hasAny(box, "read", "admin");  // true  — "read" is set
 * hasAny(box, "write", "admin"); // false — neither is set
 */
export function hasAny<TFlags extends string, TBit extends Bit>(
  flagBox: Flag<TFlags, TBit>,
  ...flags: TFlags[]
) {
  return flags.some((key) => flagBox.has(key));
}

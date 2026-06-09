import { FlagBox } from "@/flags/box";

import type { Bit } from "@/core/types";

import type { Flag } from "@/flags/types";

/**
 * Returns a new flag box containing every registered flag that is NOT set in the input.
 * Only flags known to the registry are considered — raw bit inversion is NOT performed.
 * Double complement is always identity: `complement(complement(x)).bits === x.bits`.
 *
 * @example
 * const box = registry.of("read");
 * // registry has: read, write, execute, admin
 * const result = complement(box);
 * result.has("read");    // false
 * result.has("write");   // true
 * result.has("execute"); // true
 * result.has("admin");   // true
 */
export function complement<TFlags extends string, TBit extends Bit>(
  flag: Flag<TFlags, TBit>,
) {
  const { registry } = flag;
  const { combinator } = registry;

  const bits = combinator.andNot(registry.fullBits, flag.bits);

  return new FlagBox(bits, registry);
}

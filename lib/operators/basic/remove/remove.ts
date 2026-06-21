import { FlagBox } from "@/flags/box";
import { resolveMask } from "@/flags/utils";

import type { Bit } from "@/core/types";

import type { Flag } from "@/flags/types";

/**
 * Returns a new flag box with the specified flags removed (bitwise AND NOT).
 * Idempotent: removing an unset flag leaves the bits unchanged.
 *
 * @throws {UnknownFlagError} if any name is not registered.
 *
 * @example
 * const box = registry.of("read", "write", "execute");
 * const result = remove(box, "write");
 * result.has("read");    // true
 * result.has("write");   // false
 * result.has("execute"); // true
 */
export function remove<
  TFlags extends string,
  TBit extends Bit,
  TBrand extends string | symbol,
>(
  flag: Flag<TFlags, TBit, TBrand>,
  ...names: TFlags[]
): Flag<TFlags, TBit, TBrand> {
  const { registry } = flagBox;
  const { combinator } = registry;

  const mask = resolveMask(registry, flags);
  const bits = combinator.andNot(flagBox.bits, mask);

  return new FlagBox(bits, registry);
}

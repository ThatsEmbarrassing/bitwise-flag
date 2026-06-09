import { FlagBox } from "@/flags/box";

import type { Bit } from "@/core/types";

import type { Flag } from "@/flags/types";

/**
 * Returns a new flag box with the specified flags toggled (bitwise XOR):
 * absent flags are added, present flags are removed.
 *
 * @throws {UnknownFlagError} if any name is not registered.
 *
 * @example
 * const box = registry.of("read", "write");
 * const result = toggle(box, "write", "execute");
 * result.has("read");    // true  — untouched
 * result.has("write");   // false — was present, removed
 * result.has("execute"); // true  — was absent, added
 */
export function toggle<
  TFlags extends string,
  TBit extends Bit,
  TBrand extends string | symbol,
>(
  flagBox: Flag<TFlags, TBit, TBrand>,
  ...flags: TFlags[]
): Flag<TFlags, TBit, TBrand> {
  const { repository, combinator } = flagBox.registry;

  const bits = flags
    .map((key) => repository.get(key))
    .reduce((acc, v) => combinator.xor(acc, v), flagBox.bits);

  return new FlagBox(bits, flagBox.registry);
}

import { FlagBox } from "@/flags/box";

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
  flagBox: Flag<TFlags, TBit, TBrand>,
  ...flags: TFlags[]
): Flag<TFlags, TBit, TBrand> {
  const { registry } = flagBox;
  const { repository, combinator } = registry;

  const bits = flags
    .map((key) => repository.get(key))
    .reduce((acc, v) => {
      return combinator.andNot(acc, v);
    }, flagBox.bits);

  return new FlagBox(bits, registry);
}

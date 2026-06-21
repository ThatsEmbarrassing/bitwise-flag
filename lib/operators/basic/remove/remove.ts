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
  flag: Flag<TFlags, TBit, TBrand>,
  ...names: TFlags[]
): Flag<TFlags, TBit, TBrand> {
  const { registry } = flag;
  const { repository, combinator } = registry;

  let bits = flag.bits;

  for (const nameItem of names) {
    const value = repository.get(nameItem);

    bits = combinator.andNot(bits, value);
  }

  return new FlagBox(bits, registry);
}

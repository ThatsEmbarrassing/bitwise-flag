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
  flag: Flag<TFlags, TBit, TBrand>,
  ...names: TFlags[]
): Flag<TFlags, TBit, TBrand> {
  const { repository, combinator } = flag.registry;

  let bits = flag.bits;

  for (const nameItem of names) {
    const value = repository.get(nameItem);

    bits = combinator.xor(bits, value);
  }

  return new FlagBox(bits, flag.registry);
}

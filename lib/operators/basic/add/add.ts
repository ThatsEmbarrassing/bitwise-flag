import { FlagBox } from "@/flags/box";

import type { Bit } from "@/core/types";

import type { Flag } from "@/flags/types";

/**
 * Returns a new flag box with the specified flags added (bitwise OR).
 * Idempotent: adding an already-set flag leaves the bits unchanged.
 *
 * @throws {UnknownFlagError} if any name is not registered.
 *
 * @example
 * const box = registry.of("read");
 * const result = add(box, "write", "execute");
 * result.has("read");    // true
 * result.has("write");   // true
 * result.has("execute"); // true
 */
export function add<
  TFlags extends string,
  TBit extends Bit,
  TBrand extends string | symbol,
>(
  flag: Flag<TFlags, TBit, TBrand>,
  ...names: TFlags[]
): Flag<TFlags, TBit, TBrand> {
  const { registry } = flag;
  const { repository, combinator } = registry;

  const bits = names
    .map((key) => repository.get(key))
    .reduce((acc, v) => combinator.or(acc, v), flag.bits);

  return new FlagBox(bits, registry);
}

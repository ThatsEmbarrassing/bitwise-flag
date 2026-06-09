import { FlagBox } from "@/flags/box";

import { assertSameRegistry } from "@/operators/utils";

import type { Bit } from "@/core";
import type { Flag } from "@/flags/types";

/**
 * Returns a new flag box with the flags of `first` that are absent in every subsequent box (successive AND NOT).
 * Non-commutative: `difference(a, b)` and `difference(b, a)` produce different results.
 *
 * @throws {MixedRegistryError} if boxes belong to different registry instances.
 *
 * @example
 * const a = registry.of("read", "write", "execute");
 * const b = registry.of("write");
 * const result = difference(a, b);
 * result.has("read");    // true
 * result.has("write");   // false — stripped by b
 * result.has("execute"); // true
 */
export function difference<
  TFlags extends string,
  TBit extends Bit,
  TBrand extends string | symbol,
>(
  first: Flag<TFlags, TBit, TBrand>,
  ...rest: Flag<TFlags, TBit, TBrand>[]
): Flag<TFlags, TBit, TBrand> {
  assertSameRegistry(first, ...rest);

  const { registry } = first;
  const { combinator } = registry;

  const bits = rest.reduce(
    (acc, v) => combinator.andNot(acc, v.bits),
    first.bits,
  );

  return new FlagBox(bits, registry);
}

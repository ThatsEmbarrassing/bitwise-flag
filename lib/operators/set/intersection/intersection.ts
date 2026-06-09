import { FlagBox } from "@/flags/box";

import { assertSameRegistry } from "@/operators/utils";

import type { Bit } from "@/core/types";

import type { Flag } from "@/flags/types";

/**
 * Returns a new flag box containing only flags that are set in ALL input boxes (bitwise AND).
 *
 * @throws {MixedRegistryError} if boxes belong to different registry instances.
 *
 * @example
 * const a = registry.of("read", "write");
 * const b = registry.of("write", "execute");
 * const result = intersection(a, b);
 * result.has("read");    // false
 * result.has("write");   // true  — present in both
 * result.has("execute"); // false
 */
export function intersection<
  TFlags extends string,
  TBit extends Bit,
  TBrand extends string | symbol,
>(first: Flag<TFlags, TBit, TBrand>, ...rest: Flag<TFlags, TBit, TBrand>[]) {
  assertSameRegistry(first, ...rest);

  const { combinator } = first.registry;

  const bits = rest.reduce((acc, v) => combinator.and(acc, v.bits), first.bits);

  return new FlagBox(bits, first.registry);
}

import { FlagBox } from "@/flags/box";

import { assertSameRegistry } from "@/operators/utils";

import type { Bit } from "@/core/types";

import type { Flag } from "@/flags/types";

/**
 * Returns a new flag box with every flag that is set in any of the input boxes (bitwise OR).
 *
 * @throws {MixedRegistryError} if boxes belong to different registry instances.
 *
 * @example
 * const a = registry.of("read", "write");
 * const b = registry.of("write", "execute");
 * const result = union(a, b);
 * result.has("read");    // true
 * result.has("write");   // true
 * result.has("execute"); // true
 * result.has("admin");   // false
 */
export function union<TFlags extends string, TBit extends Bit>(
  left: Flag<TFlags, TBit>,
  ...other: Flag<TFlags, TBit>[]
) {
  assertSameRegistry(left, ...other);

  const { combinator } = left.registry;

  const bits = other.reduce((acc, v) => combinator.or(acc, v.bits), left.bits);

  return new FlagBox(bits, left.registry);
}

import { FlagBox } from "@/flags/box";

import { assertSameRegistry } from "@/operators/utils";

import type { Bit } from "@/core/types";

import type { Flag } from "@/flags/types";

/**
 * Returns a new flag box containing only flags that appear in exactly one of the input boxes.
 * With 3+ boxes this is true set symmetric difference, not XOR chaining:
 * a flag shared by any two boxes is excluded regardless of how many boxes contain it.
 *
 * @throws {MixedRegistryError} if boxes belong to different registry instances.
 *
 * @example
 * // Two boxes: flags unique to each side survive.
 * symmetricDifference(registry.of("read", "write"), registry.of("write", "execute"));
 * // → { read, execute }   ("write" is shared → removed)
 *
 * // Three boxes: flags in 2+ boxes are removed.
 * symmetricDifference(registry.of("read", "write"), registry.of("write", "execute"), registry.of("execute", "admin"));
 * // → { read, admin }   ("write" in boxes 1+2, "execute" in boxes 2+3 → both removed)
 */
export function symmetricDifference<TFlags extends string, TBit extends Bit>(
  left: Flag<TFlags, TBit>,
  right: Flag<TFlags, TBit>,
  ...rest: Flag<TFlags, TBit>[]
) {
  assertSameRegistry(left, right, ...rest);

  const { combinator } = left.registry;

  if (rest.length === 0) {
    const bits = combinator.xor(left.bits, right.bits);

    return new FlagBox(bits, left.registry);
  }

  const all = [left, right, ...rest];

  const atLeastOne = all.reduce(
    (acc, v) => combinator.or(acc, v.bits),
    combinator.zero,
  );

  const atLeastTwo = all.reduce(
    (acc, v, i) =>
      all
        .slice(i + 1)
        .reduce(
          (acc2, f) => combinator.or(acc2, combinator.and(v.bits, f.bits)),
          acc,
        ),
    combinator.zero,
  );

  const bits = combinator.andNot(atLeastOne, atLeastTwo);

  return new FlagBox(bits, left.registry);
}

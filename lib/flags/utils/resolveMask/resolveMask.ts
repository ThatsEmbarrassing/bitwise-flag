import { computeMask } from "@/core/utils";

import type { Bit } from "@/core";

import type { FlagRegistry } from "@/flags/types";

/**
 * Resolves flag names to their bit values and combines them into a single
 * mask via bitwise OR.
 *
 * Order and duplicates do not affect the result — `OR` is commutative,
 * associative, and idempotent. Returns `combinator.zero` for an empty array.
 * Delegates the actual fold to {@link computeMask}.
 *
 * @typeParam TFlags - The union of registered flag names.
 * @typeParam TBit - The numeric type of the bit values (`number` or `bigint`).
 * @typeParam TBrand - The registry's brand, used to keep flags from different
 *   registries structurally distinct.
 * @param registry - Supplies the `repository` used to resolve each name to its
 *   bit value and the `combinator` used to fold them.
 * @param names - The flag names to combine.
 * @returns The bitwise OR of the bit values for all given `names`.
 * @throws {@link UnknownFlagError} if any name in `names` is not registered.
 *
 * @example
 * ```ts
 * computeMaskFromNames(registry, ["READ", "WRITE"]); // READ | WRITE
 * computeMaskFromNames(registry, []);                // registry.combinator.zero
 * ```
 */
export function resolveMask<
  TFlags extends string,
  TBit extends Bit,
  TBrand extends string | symbol,
>(
  registry: FlagRegistry<TFlags, TBit, TBrand>,
  names: readonly TFlags[],
): TBit {
  const { combinator, repository } = registry;

  const bits = names.map((key) => repository.get(key));

  return computeMask(combinator, bits);
}

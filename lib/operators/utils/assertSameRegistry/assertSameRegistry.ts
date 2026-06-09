import { MixedRegistryError } from "@/operators/errors";

import type { Bit } from "@/core";
import type { Flag } from "@/flags";

/**
 * Asserts that every flag originates from the same registry as `head`.
 *
 * Registries are compared by reference, so two distinct registries with
 * identical keys are still considered different. This guards operators
 * against combining bits that have incompatible meanings.
 *
 * @param head - The reference flag whose registry the rest must match.
 * @param rest - Additional flags to check against `head`'s registry.
 * @throws {MixedRegistryError} If any flag in `rest` belongs to a different
 * registry than `head`.
 */
export function assertSameRegistry<
  TFlags extends string,
  TBit extends Bit,
  TBrand extends string | symbol,
>(
  head: Flag<TFlags, TBit, TBrand>,
  ...rest: Flag<TFlags, TBit, TBrand>[]
): void {
  for (const flag of rest) {
    if (head.registry !== flag.registry) {
      throw new MixedRegistryError(head.registry.keys(), flag.registry.keys());
    }
  }
}

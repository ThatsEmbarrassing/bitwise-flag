import { BigIntCombinator } from "@/core";

import {
  DuplicateError,
  DuplicateFlagsError,
  NotPositiveError,
  NotPowerOfTwoError,
  ParseError,
} from "../errors";
import { Repository } from "../repository";

import { AbstractFlagRegistry } from "./AbstractFlagRegistry";

import type { Combinator } from "@/core";
import type { FlagRegistry } from "../types";

const BIGINT_COMBINATOR = new BigIntCombinator();

export class BigIntFlagRegistry<
  TFlags extends string,
  TBrand extends string | symbol = symbol,
> extends AbstractFlagRegistry<TFlags, bigint, TBrand> {
  /**
   * The bitwise combinator used internally to perform AND, OR, NOT, and other
   * operations on values of type `TBit`.
   */
  public readonly combinator: Combinator<bigint> = BIGINT_COMBINATOR;

  /**
   * The underlying read-only store that maps flag names to their bit values.
   */
  public readonly repository: Repository<TFlags, bigint>;

  /**
   * Validates that every flag in the map can form a well-formed bitfield.
   *
   * Each bit value must satisfy three conditions:
   * - **Positive** — value must be greater than `0n`.
   * - **Unique** — no two flags may share the same bit value.
   * - **Power of two** — value must have exactly one bit set (`value & (value - 1) === 0`).
   *
   * @param flags - Map of flag names to their `bigint` bit values.
   * @throws {@link NotPositiveError} if any value is `≤ 0n`.
   * @throws {@link DuplicateError} if any bit value appears more than once.
   * @throws {@link NotPowerOfTwoError} if any value is not a power of two.
   */
  private validateFlags<TFlags extends string>(flags: Map<TFlags, bigint>) {
    const seenBits = new Set<bigint>();

    const entries = flags.entries();

    for (const [key, value] of entries) {
      if (value <= 0n) {
        throw new NotPositiveError(key, value);
      }

      if (seenBits.has(value)) {
        throw new DuplicateError(key, value);
      }

      if (this.combinator.and(value, value - 1n) !== 0n) {
        throw new NotPowerOfTwoError(key, value);
      }

      seenBits.add(value);
    }
  }

  private coerceBigint(value: bigint): bigint {
    if (value < 0n) {
      throw new ParseError(value);
    }

    return value;
  }

  private coerceString(value: string): bigint {
    const normalized = value.trim();

    if (normalized.length === 0) {
      throw new ParseError(value);
    }

    try {
      const num = BigInt(normalized);

      return this.coerceBigint(num);
    } catch (e) {
      if (e instanceof ParseError) throw e;

      throw new ParseError(value);
    }
  }

  /**
   * Converts a raw value or string representation into the registry's native bit type `TBit`.
   *
   * @internal
   *
   * @param value - A native bit value or its string representation.
   * @returns The parsed value as `TBit`.
   * @throws {@link ParseError} if `value` cannot be converted to a valid non-negative `TBit`.
   */
  protected coerce(value: bigint | string): bigint {
    if (typeof value === "bigint") return this.coerceBigint(value);

    return this.coerceString(value);
  }

  private constructor(flags: Map<TFlags, bigint>) {
    super();

    this.validateFlags(flags);

    this.repository = new Repository(flags);
  }

  /**
   * Creates a `BigIntFlagRegistry` from an explicit name-to-bit mapping.
   *
   * Use this factory when you need precise control over bit values — for example,
   * when values must match an external protocol, a database column, or a legacy enum.
   *
   * @param flags - A plain object whose keys are flag names and values are the
   *   `bigint` bit values to assign to each flag.
   * @returns A new {@link FlagRegistry} typed to the given flag names and branded
   *   with `TBrand`.
   * @throws {@link NotPositiveError} if any value is `≤ 0n`.
   * @throws {@link DuplicateError} if two flags share the same bit value.
   * @throws {@link NotPowerOfTwoError} if any value is not a power of two.
   *
   * @example
   * ```ts
   * const registry = BigIntFlagRegistry.define({
   *   READ:    1n,
   *   WRITE:   2n,
   *   EXECUTE: 4n,
   * });
   *
   * registry.of("READ", "WRITE").bits; // 3n
   * ```
   */
  static define<TFlags extends string, TBrand extends string | symbol = symbol>(
    flags: Record<TFlags, bigint>,
  ): FlagRegistry<TFlags, bigint, TBrand> {
    const entries = Object.entries(flags) as [TFlags, bigint][];

    return new this(new Map(entries));
  }

  /**
   * Creates a `BigIntFlagRegistry` from a list of flag names, auto-assigning
   * consecutive powers of two as bit values.
   *
   * The first name receives `2n ** 0n = 1n`, the second `2n ** 1n = 2n`,
   * the third `2n ** 2n = 4n`, and so on. Because `bigint` has no fixed width,
   * the registry supports an unlimited number of flags.
   *
   * @param flags - Flag names in registration order. Each name must be unique.
   * @returns A new {@link FlagRegistry} typed to the given flag names and branded
   *   with `TBrand`.
   * @throws {@link DuplicateFlagsError} if any name appears more than once.
   *
   * @example
   * ```ts
   * const registry = BigIntFlagRegistry.from("READ", "WRITE", "EXECUTE");
   * // READ = 1n, WRITE = 2n, EXECUTE = 4n
   *
   * registry.of("READ", "EXECUTE").bits; // 5n
   * ```
   */
  static from<TFlags extends string, TBrand extends string | symbol = symbol>(
    ...flags: TFlags[]
  ): FlagRegistry<TFlags, bigint, TBrand> {
    if (this.hasDuplicates(flags)) {
      throw new DuplicateFlagsError(this.findDuplicates(flags));
    }

    const map = flags.reduce((acc, current, i) => {
      return acc.set(current, 2n ** BigInt(i));
    }, new Map<TFlags, bigint>());

    return new this(map);
  }
}

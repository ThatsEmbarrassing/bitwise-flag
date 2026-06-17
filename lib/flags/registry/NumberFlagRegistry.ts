import { NumberCombinator } from "@/core";

import {
  DuplicateError,
  DuplicateFlagsError,
  NotPositiveError,
  NotPowerOfTwoError,
  OverflowError,
  ParseError,
} from "../errors";
import { Repository } from "../repository";

import { AbstractFlagRegistry } from "./AbstractFlagRegistry";

import type { Combinator } from "@/core";
import type { FlagRegistry } from "../types";

const NUMBER_COMBINATOR = new NumberCombinator();

export class NumberFlagRegistry<
  TFlags extends string,
  TBrand extends string | symbol = symbol,
> extends AbstractFlagRegistry<TFlags, number, TBrand> {
  /**
   * The largest bit value that can be safely used as a flag (`0x40000000 = 2^30`).
   *
   * JavaScript bitwise operators work on 32-bit signed integers internally.
   * The most significant bit (bit 31) is the sign bit, so using it causes the
   * result to become negative. `MAX_SAFE_FLAG` is therefore capped at `2^30`,
   * leaving the sign bit untouched and keeping all flag values positive.
   * This limits a `NumberFlagRegistry` to at most 31 distinct flags.
   */
  static readonly MAX_SAFE_FLAG = 0x40000000;

  /**
   * The bitwise combinator used internally to perform AND, OR, NOT, and other
   * operations on values of type `TBit`.
   */
  public readonly combinator: Combinator<number> = NUMBER_COMBINATOR;

  /**
   * The underlying read-only store that maps flag names to their bit values.
   */
  public readonly repository: Repository<TFlags, number>;

  /**
   * Converts a raw value or string representation into the registry's native bit type `TBit`.
   *
   * @internal
   *
   * @param value - A native bit value or its string representation.
   * @returns The parsed value as `TBit`.
   * @throws {@link ParseError} if `value` cannot be converted to a valid non-negative `TBit`.
   */
  protected coerce(value: number | string): number {
    if (typeof value === "number") {
      if (!Number.isInteger(value) || value < 0) {
        throw new ParseError(value);
      }

      return value;
    }

    const n = Number(value.trim());

    if (!Number.isInteger(n) || n < 0 || Number.isNaN(n)) {
      throw new ParseError(value);
    }

    return n;
  }

  /**
   * Validates that every flag in the map can form a well-formed bitfield.
   *
   * Each bit value must satisfy four conditions:
   * - **Positive** — value must be greater than `0`.
   * - **Within range** — value must not exceed {@link MAX_SAFE_FLAG} (`2^30`).
   * - **Unique** — no two flags may share the same bit value.
   * - **Power of two** — value must have exactly one bit set (`value & (value - 1) === 0`).
   *
   * @param flags - Map of flag names to their `number` bit values.
   * @throws {@link NotPositiveError} if any value is `≤ 0`.
   * @throws {@link OverflowError} if any value exceeds {@link MAX_SAFE_FLAG}.
   * @throws {@link DuplicateError} if any bit value appears more than once.
   * @throws {@link NotPowerOfTwoError} if any value is not a power of two.
   */
  private validateFlags<TFlags extends string>(flags: Map<TFlags, number>) {
    const seenBits = new Set<number>();

    const entries = flags.entries();

    for (const [key, value] of entries) {
      if (value <= 0) {
        throw new NotPositiveError(key, value);
      }

      if (value > NumberFlagRegistry.MAX_SAFE_FLAG) {
        throw new OverflowError(key, value);
      }

      if (seenBits.has(value)) {
        throw new DuplicateError(key, value);
      }

      if (this.combinator.and(value, value - 1) !== 0) {
        throw new NotPowerOfTwoError(key, value);
      }

      seenBits.add(value);
    }
  }

  private constructor(flags: Map<TFlags, number>) {
    super();

    this.validateFlags(flags);

    this.repository = new Repository(flags);
  }

  /**
   * Creates a `NumberFlagRegistry` from an explicit name-to-bit mapping.
   *
   * Use this factory when you need precise control over bit values — for example,
   * when values must match an external protocol, a database column, or a legacy enum.
   *
   * @param flags - A plain object whose keys are flag names and values are the
   *   `number` bit values to assign to each flag.
   * @returns A new {@link FlagRegistry} typed to the given flag names and branded
   *   with `TBrand`.
   * @throws {@link NotPositiveError} if any value is `≤ 0`.
   * @throws {@link OverflowError} if any value exceeds {@link MAX_SAFE_FLAG} (`2^30`).
   * @throws {@link DuplicateError} if two flags share the same bit value.
   * @throws {@link NotPowerOfTwoError} if any value is not a power of two.
   *
   * @example
   * ```ts
   * const registry = NumberFlagRegistry.define({
   *   READ:    1,
   *   WRITE:   2,
   *   EXECUTE: 4,
   * });
   *
   * registry.of("READ", "WRITE").bits; // 3
   * ```
   */
  static define<TFlags extends string, TBrand extends string | symbol = symbol>(
    flags: Record<TFlags, number>,
  ): FlagRegistry<TFlags, number, TBrand> {
    const entries = Object.entries(flags) as [TFlags, number][];

    return new this(new Map(entries));
  }

  /**
   * Creates a `NumberFlagRegistry` from a list of flag names, auto-assigning
   * consecutive powers of two as bit values.
   *
   * The first name receives `2 ** 0 = 1`, the second `2 ** 1 = 2`,
   * the third `2 ** 2 = 4`, and so on. Because JS bitwise operators are limited
   * to 32-bit signed integers, the registry supports at most 31 flags
   * (up to `2 ** 30 =` {@link MAX_SAFE_FLAG}). For more flags use
   * BigIntFlagRegistry.from instead.
   *
   * @param flags - Flag names in registration order. Each name must be unique.
   * @returns A new {@link FlagRegistry} typed to the given flag names and branded
   *   with `TBrand`.
   * @throws {@link DuplicateFlagsError} if any name appears more than once.
   * @throws {@link OverflowError} if the number of flags exceeds 31.
   *
   * @example
   * ```ts
   * const registry = NumberFlagRegistry.from("READ", "WRITE", "EXECUTE");
   * // READ = 1, WRITE = 2, EXECUTE = 4
   *
   * registry.of("READ", "EXECUTE").bits; // 5
   * ```
   */
  static from<TFlags extends string, TBrand extends string | symbol = symbol>(
    ...flags: TFlags[]
  ): FlagRegistry<TFlags, number, TBrand> {
    if (this.hasDuplicates(flags)) {
      throw new DuplicateFlagsError(this.findDuplicates(flags));
    }

    const map = flags.reduce((acc, current, i) => {
      return acc.set(current, 2 ** i);
    }, new Map<TFlags, number>());

    return new this(map);
  }
}

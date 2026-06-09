import { UnknownFlagError } from "../errors";

import type { Bit } from "@/core";

/**
 * Read-only store that maps flag names to their bit values.
 *
 * It provides safe, typed access to registered flags and throws
 * {@link UnknownFlagError} when a requested flag does not exist.
 *
 * @typeParam TBit - The numeric primitive used for bit values (`number` or `bigint`).
 */
export class Repository<TFlags extends string, TBit extends Bit> {
  constructor(private flags: Map<TFlags, TBit>) {}

  /**
   * Returns the bit value for the given flag name.
   *
   * @param flag - The name of the registered flag.
   * @returns The bit value associated with `flag`.
   */
  get(flag: TFlags): TBit;
  /**
   * Returns the bit value for the given flag name.
   *
   * @param flag - The name of the registered flag.
   * @returns The bit value associated with `flag`.
   * @throws {@link UnknownFlagError} if `flag` is not registered.
   */
  get(flag: string): TBit;
  get(flag: string): TBit {
    const value = this.flags.get(flag as TFlags);

    if (value === undefined) throw new UnknownFlagError(flag);

    return value;
  }

  /**
   * Returns `true` if the given flag name is registered.
   *
   * @param flag - The name to look up.
   */
  has(flag: TFlags): boolean;
  /**
   * Returns `true` if the given flag name is registered.
   *
   * @param flag - The name to look up.
   */
  has(flag: string): boolean;
  has(flag: string): boolean {
    const value = this.flags.get(flag as TFlags);

    return !!value;
  }

  /** Returns all registered flag names. */
  keys(): TFlags[] {
    return this.flags.keys().toArray();
  }

  /** Returns all registered bit values. */
  values(): TBit[] {
    return this.flags.values().toArray();
  }

  /** Returns all `[name, bit]` pairs for registered flags. */
  entries(): [TFlags, TBit][] {
    return this.flags.entries().toArray();
  }
}

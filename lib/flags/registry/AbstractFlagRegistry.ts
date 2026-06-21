import { computeMask } from "@/core/utils";

import { FlagBox } from "../box";
import { UnknownBitsError } from "../errors";
import { resolveMask } from "../utils";

import type { Bit, Combinator } from "@/core";

import type { Repository } from "../repository";
import type { Flag, FlagRegistry } from "../types";

/**
 * @internal
 * @abstract
 */
export abstract class AbstractFlagRegistry<
  TFlags extends string,
  TBit extends Bit,
  TBrand extends string | symbol = symbol,
> implements FlagRegistry<TFlags, TBit, TBrand>
{
  private _fullBits: TBit | null = null;

  /**
   * Checks whether the passed array has duplicate values.
   *
   * @internal
   *
   * @param flags array with flag names.
   * @returns true if the array has duplicates and false otherwise.
   */
  protected static hasDuplicates(flags: string[]): boolean {
    return new Set(flags).size !== flags.length;
  }

  /**
   * Finds duplicates from the passed array.
   *
   * @internal
   *
   * @param flags array with flag names.
   * @returns array with all duplicates.
   */
  protected static findDuplicates(flags: string[]): string[] {
    return flags.filter((item, index) => flags.indexOf(item) !== index);
  }

  /**
   * Asserts that every bit in `bits` corresponds to at least one registered flag.
   *
   * Computes `bits & ~fullBits` to isolate any bits absent from the registry.
   * If the result is non-zero, those bits are unknown and the value is rejected.
   *
   * @param bits - The bit value to validate.
   * @throws {@link UnknownBitsError} if `bits` contains bits not covered by any registered flag.
   */
  private validateBits(bits: TBit): void {
    const unknownBits = this.combinator.andNot(bits, this.fullBits);

    if (unknownBits !== this.combinator.zero) {
      throw new UnknownBitsError(bits, unknownBits);
    }
  }

  /**
   * The bitwise combinator used internally to perform AND, OR, NOT, and other
   * operations on values of type `TBit`.
   */
  abstract readonly combinator: Combinator<TBit>;

  /**
   * The underlying read-only store that maps flag names to their bit values.
   */
  abstract readonly repository: Repository<TFlags, TBit>;

  /**
   * Converts a raw value or string representation into the registry's native bit type `TBit`.
   *
   * @internal
   *
   * @param value - A native bit value or its string representation.
   * @returns The parsed value as `TBit`.
   * @throws {@link ParseError} if `value` cannot be converted to a valid non-negative `TBit`.
   */
  protected abstract coerce(value: TBit | string): TBit;

  /**
   * Parses a raw bit value or string into a {@link Flag}.
   *
   * String values may use numeric prefixes: `"0b"` for binary, `"0o"` for octal,
   * `"0x"` for hexadecimal, or a plain decimal string.
   *
   * @param value - The bit value or string representation to parse.
   * @returns A {@link Flag} whose {@link Flag.bits} equal the parsed value.
   * @throws {@link ParseError} if `value` cannot be converted to `TBit`.
   * @throws {@link UnknownBitsError} if the parsed value contains bits not
   *   present in any registered flag.
   *
   * @example
   * ```ts
   * registry.parse(3);      // Flag with bits 3
   * registry.parse("0b11"); // Flag with bits 3
   * registry.parse("0x3");  // Flag with bits 3
   * ```
   */
  parse(value: TBit | string): Flag<TFlags, TBit, TBrand>;
  /**
   * @deprecated Do not pass radix parameter. Use prefixes (`0b`, `0o` or `0x`) or `parseInt` explicitly instead
   */
  parse(value: TBit | string, radix: unknown): Flag<TFlags, TBit, TBrand>;
  parse(value: TBit | string, radix?: unknown): Flag<TFlags, TBit, TBrand> {
    if (radix !== undefined) {
      throw new Error(
        "DEPRECATED: Do not pass radix parameter. Use prefixes (`0b`, `0o` or `0x`) or `parseInt` explicitly instead",
      );
    }

    const bits = this.coerce(value);

    this.validateBits(bits);

    return new FlagBox(bits, this);
  }

  /**
   * Creates a {@link Flag} from one or more flag names by combining their bit values
   * with bitwise OR.
   *
   * @param flags - The names of flags to combine.
   * @returns A {@link Flag} whose {@link Flag.bits} is the OR of all given flags.
   * @throws {@link UnknownFlagError} if any name is not registered.
   *
   * @example
   * ```ts
   * registry.of("READ", "WRITE").bits; // READ | WRITE
   * registry.of().isEmpty();           // true
   * ```
   */
  of(...flags: TFlags[]): Flag<TFlags, TBit, TBrand> {
    const bits = resolveMask(this, flags);

    return new FlagBox(bits, this);
  }

  /**
   * Creates a {@link Flag} from one or more flag names by combining their bit values
   * with bitwise OR.
   *
   * @param flags - The names of flags to combine.
   * @returns A {@link Flag} whose {@link Flag.bits} is the OR of all given flags.
   * @throws {@link UnknownFlagError} if any name is not registered.
   *
   * @example
   * ```ts
   * // READ = 1, WRITE = 2
   * registry.combine("READ", "WRITE").bits; // READ | WRITE = 1 | 2 = 3
   * registry.combine().isEmpty();           // true
   * ```
   *
   * @deprecated Use FlagRegistry.of instead.
   */
  combine(...flags: TFlags[]): Flag<TFlags, TBit, TBrand> {
    return this.of(...flags);
  }

  /**
   * Returns a {@link Flag} with no flags set (bits equal to zero).
   * Same as `registry.of()`.
   *
   * @example
   * ```ts
   * registry.empty().bits;    // 0
   * registry.empty().isEmpty(); // true
   * ```
   */
  empty(): Flag<TFlags, TBit, TBrand> {
    return new FlagBox(this.combinator.zero, this);
  }

  /**
   * Returns a {@link Flag} with every registered flag set (bits equal to {@link fullBits}).
   *
   * @example
   * ```ts
   * registry.full().isFull(); // true
   * ```
   */
  full(): Flag<TFlags, TBit, TBrand> {
    return new FlagBox(this.fullBits, this);
  }

  /**
   * Returns the raw bit value assigned to the given flag name.
   * Same as `registry.repository.get()`
   *
   * @param flagName - The registered flag name to look up.
   * @returns The bit value for `flagName`.
   * @throws {@link UnknownFlagError} if `flagName` is not registered.
   *
   * @example
   * ```ts
   * registry.get("READ"); // 1
   * ```
   */
  get(flagName: TFlags): TBit {
    return this.repository.get(flagName);
  }

  /**
   * Returns all registered flag names in registration order.
   * Same as `registry.repository.keys()`.
   *
   * @example
   * ```ts
   * registry.keys(); // ["READ", "WRITE", "EXEC"]
   * ```
   */
  keys(): TFlags[] {
    return this.repository.keys();
  }

  /**
   * Returns all registered bit values in registration order.
   * Same as `registry.repository.values()`.
   *
   * @example
   * ```ts
   * registry.values(); // [1, 2, 4]
   * ```
   */
  values(): TBit[] {
    return this.repository.values();
  }

  /**
   * Returns all `[name, bit]` pairs for registered flags in registration order.
   * Same as `registry.repository.entries()`.
   *
   * @example
   * ```ts
   * registry.entries(); // [["READ", 1], ["WRITE", 2], ["EXEC", 4]]
   * ```
   */
  entries(): [TFlags, TBit][] {
    return this.repository.entries();
  }

  /**
   * A bitmask with every registered flag set — the bitwise OR of all flag values.
   *
   * @example
   * ```ts
   * // For a registry with READ=1, WRITE=2, EXEC=4:
   * registry.fullBits; // 7
   * ```
   */
  get fullBits(): TBit {
    this._fullBits ??= computeMask(this.combinator, this.repository.values());

    return this._fullBits;
  }
}

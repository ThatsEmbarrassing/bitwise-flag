import type { Bit, Combinator } from "@/core";

import type { Repository } from "../repository";

import type { Flag } from "./Flag.interface";

export interface FlagRegistry<
  TFlags extends string,
  TBit extends Bit,
  TBrand extends string | symbol = symbol,
> {
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
  combine(...flags: TFlags[]): Flag<TFlags, TBit, TBrand>;

  /**
   * A bitmask with every registered flag set — the bitwise OR of all flag values.
   *
   * @example
   * ```ts
   * // For a registry with READ=1, WRITE=2, EXEC=4:
   * registry.fullBits; // 7
   * ```
   */
  readonly fullBits: TBit;

  /**
   * The bitwise combinator used internally to perform AND, OR, NOT, and other
   * operations on values of type `TBit`.
   */
  readonly combinator: Combinator<TBit>;

  /**
   * The underlying read-only store that maps flag names to their bit values.
   */
  readonly repository: Repository<TFlags, TBit>;

  /**
   * @deprecated Do not pass radix parameter. Use prefixes (`0b`, `0o` or `0x`) or `parseInt` explicitly instead
   */
  parse(value: TBit | string, radix: unknown): Flag<TFlags, TBit, TBrand>;

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
   * Returns a {@link Flag} with no flags set (bits equal to zero).
   * Same as `registry.of()`.
   *
   * @example
   * ```ts
   * registry.empty().bits;    // 0
   * registry.empty().isEmpty(); // true
   * ```
   */
  empty(): Flag<TFlags, TBit, TBrand>;

  /**
   * Returns a {@link Flag} with every registered flag set (bits equal to {@link fullBits}).
   *
   * @example
   * ```ts
   * registry.full().isFull(); // true
   * ```
   */
  full(): Flag<TFlags, TBit, TBrand>;

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
  of(...flags: TFlags[]): Flag<TFlags, TBit, TBrand>;

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
  get(flagName: TFlags): TBit;

  /**
   * Returns all registered flag names in registration order.
   * Same as `registry.repository.keys()`.
   *
   * @example
   * ```ts
   * registry.keys(); // ["READ", "WRITE", "EXEC"]
   * ```
   */
  keys(): TFlags[];

  /**
   * Returns all registered bit values in registration order.
   * Same as `registry.repository.values()`.
   *
   * @example
   * ```ts
   * registry.values(); // [1, 2, 4]
   * ```
   */
  values(): TBit[];

  /**
   * Returns all `[name, bit]` pairs for registered flags in registration order.
   * Same as `registry.repository.entries()`.
   *
   * @example
   * ```ts
   * registry.entries(); // [["READ", 1], ["WRITE", 2], ["EXEC", 4]]
   * ```
   */
  entries(): [TFlags, TBit][];
}

import { Flag } from "./Flag";

import type { FlagKey, IFlag, IFlagsRegistry } from "./types";

const unique = <T>(arr: T[]): T[] => [...new Set<T>(arr)];

/**
 * A registry for managing bitwise flags. This class maps flag keys (strings) to unique bit positions
 * using BigInt for scalable storage.
 *
 * @template TFlags - The type of flag keys, extending string.
 */
export class FlagsRegistry<TFlags extends FlagKey>
  implements IFlagsRegistry<TFlags>
{
  /**
   * Creates a new `FlagsRegistry` from the provided flag keys, assigning each a unique bit position.
   *
   * @param flagKeys - An array of flag keys to include in the registry.
   * @returns {FlagsRegistry<TFlags>} A new `FlagsRegistry` instance with the specified flags.
   *
   * @example
   * const registry = FlagsRegistry.from("READ", "WRITE", "EXECUTE");
   * console.log(registry.get("READ")); // 1n
   * console.log(registry.get("WRITE")); // 2n
   * console.log(registry.get("EXECUTE")); // 4n
   */
  static from<TFlags extends FlagKey>(
    ...flagKeys: TFlags[]
  ): FlagsRegistry<TFlags> {
    const flagsMap = unique(flagKeys).reduce((acc, current, i) => {
      const value = 1n << BigInt(i); // 1n << 0n, 1n << 1n, 1n << 2n, ...

      return acc.set(current, value);
    }, new Map<TFlags, bigint>());

    return new this(flagsMap);
  }

  /**
   *
   * @param flags - A map of flag keys to their corresponding BigInt values.
   */
  private constructor(private flags: Map<TFlags, bigint>) {}

  /**
   * Returns an iterator over the flag keys in the registry.
   *
   * @returns {MapIterator<TFlags>} An iterator over the flag keys.
   */
  keys(): MapIterator<TFlags> {
    return this.flags.keys();
  }

  /**
   * Returns an iterator over the flag values in the registry.
   *
   * @returns {MapIterator<bigint>} An iterator over the flag values.
   */
  values(): MapIterator<bigint> {
    return this.flags.values();
  }

  /**
   * Returns an iterator over the [key, value] pairs in the registry.
   *
   * @returns {MapIterator<[TFlags, bigint]>} An iterator over the [key, value] pairs.
   */
  entries(): MapIterator<[TFlags, bigint]> {
    return this.flags.entries();
  }

  /**
   * Retrieves the BigInt value associated with the given flag name.
   *
   * @param flagName - The name of the flag to retrieve.
   * @returns {bigint | undefined} The BigInt value of the flag, or `undefined` if not found.
   *
   * @example
   * const registry = FlagsRegistry.from("READ", "WRITE");
   * registry.get("READ"); // 1n
   * registry.get("WRITE"); // 2n
   * registry.get("EXECUTE"); // undefined
   */
  get(flagName: TFlags): bigint | undefined {
    return this.flags.get(flagName);
  }

  /**
   * Returns a flag instance representing no set flags (i.e., a bitmask value of `0n`).
   *
   * @returns {IFlag<TFlags>} A flag instance with no flags set.
   * @example
   * const registry = FlagsRegistry.from("READ", "WRITE");
   * const emptyFlag = registry.empty();
   * emptyFlag.isEmpty(); // true
   */
  empty(): IFlag<TFlags> {
    return new Flag(this, 0n);
  }

  /**
   * Parses a number value to create a flag instance.
   *
   * @param {number} value - The numeric value to parse.
   * @returns {IFlag<TFlags>} A flag instance representing the parsed value.
   * @throws {Error} If the value is negative or contains unknown flags.
   *
   * @example
   * const registry = FlagsRegistry.from("READ", "WRITE");
   * const flag = registry.parse(3); // Represents both READ and WRITE flags
   * flag.has("READ"); // true
   * flag.has("WRITE"); // true
   */
  parse(value: number): IFlag<TFlags>;
  /**
   * Parses a bigint value to create a flag instance.
   *
   * @param {bigint} value - The BigInt value to parse.
   * @returns {IFlag<TFlags>} A flag instance representing the parsed value.
   * @throws {Error} If the value is negative or contains unknown flags.
   *
   * @example
   * const registry = FlagsRegistry.from("READ", "WRITE");
   * const flag = registry.parse(3n); // Represents both READ and WRITE flags
   * flag.has("READ"); // true
   * flag.has("WRITE"); // true
   */
  parse(value: bigint): IFlag<TFlags>;
  /**
   * Parses a string value to create a flag instance.
   *
   * @param {string} value - The string value to parse.
   * @param {number} [radix=10] - The radix to use when parsing the string (default is 10).
   * @returns {IFlag<TFlags>} A flag instance representing the parsed value.
   * @throws {Error} If the value cannot be parsed, is negative, or contains unknown flags.
   *
   * @example
   * const registry = FlagsRegistry.from("READ", "WRITE");
   * const flag = registry.parse("3"); // Represents both READ and WRITE flags
   * flag.has("READ"); // true
   * flag.has("WRITE"); // true
   *
   * const hexFlag = registry.parse("3", 16); // Parses "3" as hexadecimal
   * hexFlag.has("READ"); // true
   * hexFlag.has("WRITE"); // true
   *
   * const binaryFlag = registry.parse("11", 2); // Parses "11" as binary
   * binaryFlag.has("READ"); // true
   * binaryFlag.has("WRITE"); // true
   */
  parse(value: string, radix?: number): IFlag<TFlags>;
  /**
   * Parses a value (string, number, or bigint) to create a flag instance.
   *
   * @param {string | number | bigint} value - The value to parse.
   * @param {number} [radix] - The radix to use when parsing a string value.
   * @returns {IFlag<TFlags>} A flag instance representing the parsed value.
   * @throws {Error} If the value cannot be parsed, is negative, or contains unknown flags.
   */
  parse(value: string | number | bigint, radix?: number): IFlag<TFlags> {
    if (typeof value === "bigint") return new Flag(this, value);

    if (typeof value === "number") return new Flag(this, BigInt(value));

    const parsedValue = parseInt(value, radix);

    if (isNaN(parsedValue)) {
      throw new Error(`Cannot parse value ${value} with radix ${radix ?? 10}.`);
    }

    return new Flag(this, BigInt(parsedValue));
  }

  /**
   * Combines multiple flag keys into a single flag instance.
   *
   * @param {TFlags[]} flagKeys - The flag keys to combine.
   * @returns {IFlag<TFlags>} A flag instance representing the combined flags.
   *
   * @example
   * const registry = FlagsRegistry.from("READ", "WRITE", "EXECUTE");
   * const combinedFlag = registry.combine("READ", "EXECUTE");
   * combinedFlag.has("READ"); // true
   * combinedFlag.has("WRITE"); // false
   * combinedFlag.has("EXECUTE"); // true
   */
  combine(...flagKeys: TFlags[]): IFlag<TFlags> {
    const value = flagKeys.reduce((acc, key) => {
      const flagValue = this.get(key);

      if (!flagValue) {
        throw new Error(`Flag with key ${String(key)} is not found.`);
      }

      return acc | flagValue;
    }, 0n);

    return new Flag(this, value);
  }
}

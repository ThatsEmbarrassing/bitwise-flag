/**
 * A type representing the key of a flag.
 */
export type FlagKey = string;

/**
 * Represents a bitwise combination of flags from a registry. This class encapsulates a bitmask value
 * derived from one or more flag keys, enabling efficient storage and manipulation of boolean states
 * (e.g., permissions, features, or configurations) using bitwise operations.
 */
export interface IFlag<TFlags extends FlagKey> {
  /**
   * The raw `BigInt` bitmask representing the combined flags in this instance.
   * This value is read-only and reflects the bitwise OR of all set flags.
   */
  readonly value: bigint;

  /**
   * A computed, human-readable alias for the flag combination.
   *
   * - For empty flags (value `0n`), returns `"EMPTY_FLAG"`.
   * - For single flags, returns e.g., `"[READ]"`.
   * - For multiple flags, returns e.g., `"[READ+WRITE]"`.
   */
  readonly alias: string;

  /**
   * Checks if this flag instance represents no set flags (i.e., the bitmask value is `0n`).
   *
   * @returns {boolean} `true` if the flag is empty, `false` otherwise.
   */
  isEmpty(): boolean;

  /**
   * Tests whether a specific flag key is set in this flag combination.
   *
   * Performs a bitwise AND between the instance's value and the bitmask of the given flag key.
   * Returns `false` if the key is not found in the registry.
   *
   * @param {TFlags} flagName - The flag key to check (must be a valid key in the registry).
   * @returns {boolean} `true` if the flag is set, `false` otherwise.
   */
  has(flagName: TFlags): boolean;

  /**
   * Adds one or more flag keys to this flag combination, creating a new instance with the updated bitmask.
   *
   * - Idempotent: If a flag is already set, it remains unchanged.
   * - Only adds flags that exist in the registry; unknown keys throw an error.
   * - Returns the current instance if no changes are made (e.g., all flags already present).
   *
   * @param {...TFlags[]} flagNames - One or more flag keys to add.
   * @returns {IFlag<TFlags>} A new `Flag` instance with the added flags, or the current instance if unchanged.
   * @throws {Error} If any `flagName` is not registered in the registry (e.g., `Flag with key UNKNOWN is not found.`).
   */
  add(...flagNames: TFlags[]): IFlag<TFlags>;

  /**
   * Removes one or more flag keys from this flag combination, creating a new instance with the updated bitmask.
   *
   * - Idempotent: If a flag is not set, it remains unchanged.
   * - Only removes flags that exist in the registry; unknown keys throw an error.
   * - Returns the current instance if no changes are made (e.g., none of the flags were present).
   *
   * @param {...TFlags[]} flagNames - One or more flag keys to remove.
   * @returns {IFlag<TFlags>} A new `Flag` instance with the removed flags, or the current instance if unchanged.
   * @throws {Error} If any `flagName` is not registered in the registry (e.g., `Flag with key UNKNOWN is not found.`).
   */
  remove(...flagNames: TFlags[]): IFlag<TFlags>;

  /**
   * Returns a human-readable string representation of this flag instance.
   *
   * The format is `Flag(${alias}: ${value})`, where `alias` is the computed alias (e.g., `[READ+WRITE]`)
   * and `value` is the raw `BigInt` bitmask.
   *
   * @returns {string} A string like `Flag([READ+WRITE]: 3)`.
   */
  toString(): string;
}

/**
 * A registry for managing bitwise flags. This class maps flag keys (strings) to unique bit positions
 * using BigInt for scalable storage.
 */
export interface IFlagsRegistry<TFlags extends FlagKey> {
  /**
   * Retrieves the BigInt value associated with the given flag name.
   *
   * @param flagName - The name of the flag to retrieve.
   * @returns {bigint | undefined} The BigInt value of the flag, or `undefined` if not found.
   */
  get(flagName: TFlags): bigint | undefined;

  /**
   * Combines multiple flag keys into a single flag instance.
   *
   * @param {TFlags[]} flagKeys - The flag keys to combine.
   * @returns {IFlag<TFlags>} A flag instance representing the combined flags.
   */
  combine(...flagKeys: TFlags[]): IFlag<TFlags>;

  /**
   * Returns an iterator over the flag keys in the registry.
   *
   * @returns {MapIterator<TFlags>} An iterator over the flag keys.
   */
  keys(): MapIterator<TFlags>;

  /**
   * Returns an iterator over the flag values in the registry.
   *
   * @returns {MapIterator<bigint>} An iterator over the flag values.
   */
  values(): MapIterator<bigint>;

  /**
   * Returns an iterator over the [key, value] pairs in the registry.
   *
   * @returns {MapIterator<[TFlags, bigint]>} An iterator over the [key, value] pairs.
   */
  entries(): MapIterator<[TFlags, bigint]>;

  /**
   * Returns a flag instance representing no set flags (i.e., a bitmask value of `0n`).
   *
   * @returns {IFlag<TFlags>} A flag instance with no flags set.
   */
  empty(): IFlag<TFlags>;

  /**
   * Parses a number value to create a flag instance.
   *
   * @param {number} value - The numeric value to parse.
   * @returns {IFlag<TFlags>} A flag instance representing the parsed value.
   * @throws {Error} If the value is negative or contains unknown flags.
   */
  parse(value: number): IFlag<TFlags>;
  /**
   * Parses a bigint value to create a flag instance.
   *
   * @param {bigint} value - The BigInt value to parse.
   * @returns {IFlag<TFlags>} A flag instance representing the parsed value.
   * @throws {Error} If the value is negative or contains unknown flags.
   */
  parse(value: bigint): IFlag<TFlags>;
  /**
   * Parses a string value to create a flag instance.
   *
   * @param {string} value - The string value to parse.
   * @param {number} [radix=10] - The radix to use when parsing the string (default is 10).
   * @returns {IFlag<TFlags>} A flag instance representing the parsed value.
   * @throws {Error} If the value cannot be parsed, is negative, or contains unknown flags.
   */
  parse(value: string, radix?: number): IFlag<TFlags>;
}

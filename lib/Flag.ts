import type { FlagKey, IFlag, IFlagsRegistry } from "./types";

/**
 * Represents a bitwise combination of flags from a registry. This class encapsulates a bitmask value
 * derived from one or more flag keys, enabling efficient storage and manipulation of boolean states
 * (e.g., permissions, features, or configurations) using bitwise operations.
 *
 * @template TFlags - The type of flag keys, extending `FlagKey` (string literals for type safety).
 * 
 * @example
 * const registry = FlagsRegistry.from("READ", "WRITE");
 * const readFlag = new Flag(registry, 1n); // Represents the "READ" flag
 * console.log(readFlag.value); // 1n
 */
export class Flag<TFlags extends FlagKey> implements IFlag<TFlags> {
  /**
   * Internal cache for the computed alias string.
   * @private
   * @type {string | null}
   * @internal
   */
  private _alias: string | null = null;

  /**
   * Validates the provided bitmask value to ensure it is non-negative and only uses known bits
   * from the registry. This method is called internally during construction.
   *
   * @param {bigint} value - The bitmask value to validate.
   * @private
   * @throws {Error} If `value` is negative.
   * @throws {Error} If `value` contains unknown flags (bits not defined in the registry).
   * @internal
   */
  private validate(value: bigint) {
    if (value < 0n) {
      throw new Error(`Flag value cannot be negative: ${value}`);
    }

    const knownFlags = this.context.values().reduce((acc, value) => {
      return acc | value;
    }, 0n);

    if ((value & ~knownFlags) !== 0n) {
      throw new Error("Flag value contains unknown flags");
    }
  }

  /**
   * @param {IFlagsRegistry<TFlags>} context - The registry defining the valid flags and their bit positions.
   * @param {bigint} value - The raw `BigInt` bitmask representing the combined flags (e.g., `3n` for bits 0 and 1 set).
   * @throws {Error} If `value` is negative (e.g., `Flag value cannot be negative: -1`).
   * @throws {Error} If `value` contains unknown bits (e.g., `Flag value contains unknown flags`).
   */
  constructor(
    private context: IFlagsRegistry<TFlags>,
    public readonly value: bigint,
  ) {
    this.validate(value);
  }

  /**
   * Checks if this flag instance represents no set flags (i.e., the bitmask value is `0n`).
   *
   * @returns {boolean} `true` if the flag is empty, `false` otherwise.
   * @example
   * const empty = registry.empty();
   * empty.isEmpty(); // true
   *
   * const full = registry.combine("READ", "WRITE");
   * full.isEmpty(); // false
   */
  isEmpty(): boolean {
    return this.value === 0n;
  }

  /**
   * Tests whether a specific flag key is set in this flag combination.
   *
   * Performs a bitwise AND between the instance's value and the bitmask of the given flag key.
   * Returns `false` if the key is not found in the registry.
   *
   * @param {TFlags} flagName - The flag key to check (must be a valid key in the registry).
   * @returns {boolean} `true` if the flag is set, `false` otherwise.
   * @example
   * const userFlag = registry.combine("READ", "EXECUTE");
   * userFlag.has("READ"); // true
   * userFlag.has("WRITE"); // false
   */
  has(flagName: TFlags): boolean {
    const value = this.context.get(flagName);

    if (!value) return false;

    return !!(this.value & value);
  }

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
   * @example
   * const base = registry.combine("READ");
   * const extended = base.add("WRITE", "EXECUTE");
   * extended.has("WRITE"); // true
   * base.has("WRITE"); // false (immutable)
   */
  add(...flagNames: TFlags[]): IFlag<TFlags> {
    const combinedValue = flagNames.reduce((acc, name) => {
      if (this.has(name)) return acc;

      const value = this.context.get(name);

      if (!value) {
        throw new Error(`Flag with key ${String(name)} is not found.`);
      }

      return acc | value;
    }, this.value);

    if (combinedValue === this.value) return this;

    return new Flag(this.context, combinedValue);
  }

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
   * @example
   * const full = registry.combine("READ", "WRITE");
   * const reduced = full.remove("WRITE");
   * reduced.has("WRITE"); // false
   * full.has("WRITE"); // true (immutable)
   */
  remove(...flagNames: TFlags[]): IFlag<TFlags> {
    const extractedValue = flagNames.reduce((acc, name) => {
      const value = this.context.get(name);

      if (!value) {
        throw new Error(`Flag with key ${String(name)} is not found.`);
      }

      if (!this.has(name)) return acc;

      return acc & ~value;
    }, this.value);

    if (extractedValue === this.value) return this;

    return new Flag(this.context, extractedValue);
  }

  /**
   * Returns a human-readable string representation of this flag instance.
   *
   * The format is `Flag(${alias}: ${value})`, where `alias` is the computed alias (e.g., `[READ+WRITE]`)
   * and `value` is the raw `BigInt` bitmask.
   *
   * @returns {string} A string like `Flag([READ+WRITE]: 3)`.
   * @example
   * const flag = registry.combine("READ");
   * flag.toString(); // "Flag([READ]: 1)"
   *
   * const empty = registry.empty();
   * empty.toString(); // "Flag(EMPTY_FLAG: 0)"
   */
  toString(): string {
    return `Flag(${this.alias}: ${this.value})`;
  }

  /**
   * A computed, human-readable alias for the flag combination.
   *
   * - For empty flags (value `0n`), returns `"EMPTY_FLAG"`.
   * - For single flags, returns e.g., `"[READ]"`.
   * - For multiple flags, returns e.g., `"[READ+WRITE]"`.
   *
   * @type {string}
   * @readonly
   * @example
   * flag.alias; // "[READ+WRITE]" for a combined flag
   */
  get alias(): string {
    if (this._alias) return this._alias;

    if (this.value === 0n) {
      this._alias = "EMPTY_FLAG";

      return this._alias;
    }

    const entries = this.context.entries();

    const activeFlags = entries
      .filter(([_, value]) => {
        return (this.value & value) === value;
      })
      .map(([key, _]) => key)
      .toArray()
      .join("+");

    this._alias = `[${activeFlags}]`;

    return this._alias;
  }
}

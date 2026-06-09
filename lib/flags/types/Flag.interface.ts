import type { FlagRegistry } from "./Registry.interface";

export interface Flag<
  TFlags extends string,
  TBit extends bigint | number,
  TBrand extends string | symbol = symbol,
> {
  /**
   * @internal Do not use. Exists only at the type level — never present at runtime.
   *
   * Phantom field that forces TypeScript to structurally distinguish flags from
   * different registries. Without it, two `Flag` types with different `TBrand`
   * parameters would be considered identical due to recursive structural checking.
   */
  readonly __brand: TBrand;

  /**
   * The raw bitwise value that encodes all active flags.
   *
   * @deprecated Use {@link Flag.bits} instead
   */
  readonly value: TBit;

  /**
   * @deprecated Use the `add` operator instead.
   *
   * ```ts
   * import { add } from "bitwise-flag/operators";
   *
   * const next = add(flag, "READ", "WRITE");
   * ```
   */
  add(..._flags: TFlags[]): never;

  /**
   * @deprecated Use the `remove` operator instead.
   *
   * ```ts
   * import { remove } from "bitwise-flag/operators";
   *
   * const next = remove(flag, "READ", "WRITE");
   * ```
   */
  remove(..._flags: TFlags[]): never;

  /**
   * Human-readable label for the active flags, formed by joining their names
   * with `"+"`. Returns `"EMPTY_FLAG"` when no flags are set.
   *
   * @example
   * ```ts
   * flag.alias; // "READ+WRITE"
   * emptyFlag.alias; // "EMPTY_FLAG"
   * ```
   */
  readonly alias: string;

  /**
   * The number of flags that are currently set (i.e. the popcount of {@link bits}).
   *
   * @example
   * ```ts
   * flag.size; // 2  (for READ | WRITE)
   * ```
   */
  readonly size: number;

  /**
   * The raw bitwise value that encodes all active flags.
   *
   * @example
   * ```ts
   * flag.bits; // 3n  (for READ=1n | WRITE=2n)
   * ```
   */
  readonly bits: TBit;

  /**
   * The registry this flag belongs to. Provides access to flag definitions,
   * the bitwise combinator, and the underlying repository.
   */
  readonly registry: FlagRegistry<TFlags, TBit, TBrand>;

  /**
   * Returns `true` when no flags are set (i.e. {@link bits} equals zero).
   *
   * @example
   * ```ts
   * registry.empty().isEmpty(); // true
   * ```
   */
  isEmpty(): boolean;

  /**
   * Returns `true` when every registered flag is set.
   *
   * @example
   * ```ts
   * registry.of("READ", "WRITE", "EXEC").isFull(); // true
   * ```
   */
  isFull(): boolean;

  /**
   * Returns an array of the names of all active flags in registration order.
   *
   * @example
   * ```ts
   * flag.toArray(); // ["READ", "WRITE"]
   * ```
   */
  toArray(): TFlags[];

  /**
   * Returns a record mapping every registered flag name to a boolean indicating
   * whether it is currently set.
   *
   * @example
   * ```ts
   * flag.toObject(); // { READ: true, WRITE: true, EXEC: false }
   * ```
   */
  toObject(): Record<TFlags, boolean>;

  /**
   * Returns a string in the format `Flag([<alias>]: <bits>)`.
   * If you need to format bits, use `flag.bits.toString()`.
   *
   * @param radix - The radix passed to the underlying numeric `toString` call
   *   (e.g. `2` for binary, `16` for hex). Defaults to `10`.
   *
   * @example
   * ```ts
   * flag.toString();   // "Flag([READ+WRITE]: 3)"
   * flag.toString(2);  // "Flag([READ+WRITE]: 11)"
   * ```
   */
  toString(radix?: number): string;

  /**
   * Returns `true` if the specified flag is currently set.
   *
   * @param flag - The flag name to test.
   *
   * @example
   * ```ts
   * flag.has("READ");  // true
   * flag.has("EXEC");  // false
   * ```
   */
  has(flag: TFlags): boolean;
}

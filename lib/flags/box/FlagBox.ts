import type { Bit } from "@/core/types";
import type { Flag, FlagRegistry } from "../types";

export class FlagBox<
  TFlags extends string,
  TBit extends Bit,
  TBrand extends string | symbol,
> implements Flag<TFlags, TBit, TBrand> {
  /**
   * @internal Do not use. Exists only at the type level — never present at runtime.
   *
   * Phantom field that forces TypeScript to structurally distinguish flags from
   * different registries. Without it, two `Flag` types with different `TBrand`
   * parameters would be considered identical due to recursive structural checking.
   */
  declare readonly __brand: TBrand;

  constructor(
    /**
     * The raw bitwise value that encodes all active flags.
     *
     * @example
     * ```ts
     * flag.bits; // 3n  (for READ=1n | WRITE=2n)
     * ```
     */
    public readonly bits: NoInfer<TBit>,

    /**
     * The registry this flag belongs to. Provides access to flag definitions,
     * the bitwise combinator, and the underlying repository.
     */
    public readonly registry: FlagRegistry<TFlags, TBit, TBrand>,
  ) {}

  /**
   * Returns `true` when no flags are set (i.e. {@link bits} equals zero).
   *
   * @example
   * ```ts
   * registry.empty().isEmpty(); // true
   * ```
   */
  isEmpty(): boolean {
    return this.bits === this.registry.combinator.zero;
  }

  /**
   * Returns `true` when every registered flag is set.
   *
   * @example
   * ```ts
   * registry.of("READ", "WRITE", "EXEC").isFull(); // true
   * ```
   */
  isFull(): boolean {
    return this.bits === this.registry.fullBits;
  }

  /**
   * Returns an array of the names of all active flags in registration order.
   *
   * @example
   * ```ts
   * flag.toArray(); // ["READ", "WRITE"]
   * ```
   */
  toArray(): TFlags[] {
    return this.registry.repository
      .entries()
      .filter(([_, value]) => !!this.registry.combinator.and(this.bits, value))
      .map(([key, _]) => key as TFlags);
  }

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
   * emptyFlag.toString();   // "Flag([EMPTY_FLAG]: 0)"
   * ```
   */
  toString(radix?: number): string {
    return `Flag([${this.alias}]: ${this.bits.toString(radix)})`;
  }

  /**
   * Returns a record mapping every registered flag name to a boolean indicating
   * whether it is currently set.
   *
   * @example
   * ```ts
   * flag.toObject(); // { READ: true, WRITE: true, EXEC: false }
   * ```
   */
  toObject(): Record<TFlags, boolean> {
    return Object.fromEntries(
      this.registry.repository
        .entries()
        .map(([key, value]) => [
          key,
          !!this.registry.combinator.and(this.bits, value),
        ]),
    ) as Record<TFlags, boolean>;
  }

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
  has(flag: TFlags): boolean {
    const value = this.registry.repository.get(flag);

    return (
      this.registry.combinator.and(this.bits, value) !==
      this.registry.combinator.zero
    );
  }

  /**
   * @deprecated Use the `add` operator instead.
   *
   * ```ts
   * import { add } from "bitwise-flag/operators";
   *
   * const next = add(flag, "READ", "WRITE");
   * ```
   */
  add(..._flags: TFlags[]): never {
    throw new Error(
      "DEPRECATED: FlagBox.add() was removed in 2.0.0. Use the `add` operator from 'bitwise-flag/operators' instead",
    );
  }

  /**
   * @deprecated Use the `remove` operator instead.
   *
   * ```ts
   * import { remove } from "bitwise-flag/operators";
   *
   * const next = remove(flag, "READ", "WRITE");
   * ```
   */
  remove(..._flags: TFlags[]): never {
    throw new Error(
      "DEPRECATED: FlagBox.remove() was removed in 2.0.0. Use the `remove` operator from 'bitwise-flag/operators' instead",
    );
  }

  /**
   * The raw bitwise value that encodes all active flags.
   *
   * @deprecated Use {@link Flag.bits} instead
   */
  get value(): TBit {
    return this.bits;
  }

  /**
   * The number of flags that are currently set (i.e. the popcount of {@link bits}).
   *
   * @example
   * ```ts
   * flag.size; // 2  (for READ | WRITE)
   * ```
   */
  get size(): number {
    return this.registry.combinator.popcount(this.bits);
  }

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
  get alias(): string {
    const flags = this.toArray();

    const alias = flags.length === 0 ? "EMPTY_FLAG" : flags.join("+");

    return alias;
  }
}

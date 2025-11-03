import type { FlagKey, IFlag, IFlagsRegistry } from "./types";

export class Flag<TFlags extends FlagKey> implements IFlag<TFlags> {
  private _alias: string | null = null;

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

  constructor(
    private context: IFlagsRegistry<TFlags>,
    public readonly value: bigint,
  ) {
    this.validate(value);
  }

  isEmpty(): boolean {
    return this.value === 0n;
  }

  has(flagName: TFlags): boolean {
    const value = this.context.get(flagName);

    if (!value) return false;

    return !!(this.value & value);
  }

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

  toString(): string {
    return `Flag(${this.alias}: ${this.value})`;
  }

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

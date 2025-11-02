export type FlagKey = string;

export interface IFlag<TFlags extends FlagKey> {
  readonly value: bigint;
  readonly alias: string;

  isEmpty(): boolean;
  has(flagName: TFlags): boolean;

  add(flagName: TFlags): IFlag<TFlags>;
  remove(flagName: TFlags): IFlag<TFlags>;

  toString(): string;
}

export interface IFlagsRegistry<TFlags extends FlagKey> {
  get(flagName: TFlags): bigint | undefined;
  combine(...flagKeys: TFlags[]): IFlag<TFlags>;

  keys(): MapIterator<TFlags>;
  values(): MapIterator<bigint>;
  entries(): MapIterator<[TFlags, bigint]>;

  empty(): IFlag<TFlags>;
}

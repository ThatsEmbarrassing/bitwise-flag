import { Flag } from "./Flag";

import type { FlagKey, IFlag, IFlagsRegistry } from "./types";

const unique = <T>(arr: T[]): T[] => [...new Set<T>(arr)];

export class FlagsRegistry<TFlags extends FlagKey>
  implements IFlagsRegistry<TFlags>
{
  static from<TFlags extends FlagKey>(
    ...flagKeys: TFlags[]
  ): FlagsRegistry<TFlags> {
    const flagsMap = unique(flagKeys).reduce((acc, current, i) => {
      const value = 1n << BigInt(i); // 1n << 0n, 1n << 1n, 1n << 2n, ...

      return acc.set(current, value);
    }, new Map<TFlags, bigint>());

    return new this(flagsMap);
  }

  private constructor(private flags: Map<TFlags, bigint>) {}

  keys(): MapIterator<TFlags> {
    return this.flags.keys();
  }
  values(): MapIterator<bigint> {
    return this.flags.values();
  }
  entries(): MapIterator<[TFlags, bigint]> {
    return this.flags.entries();
  }

  get(flagName: TFlags): bigint | undefined {
    return this.flags.get(flagName);
  }

  empty(): IFlag<TFlags> {
    return new Flag(this, 0n);
  }

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

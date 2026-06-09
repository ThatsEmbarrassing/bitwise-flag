import { InvalidFlagError } from "./InvalidFlagError";

export class OverflowError extends InvalidFlagError {
  constructor(flag: string, value: unknown) {
    super(
      `Flag "${flag}" value ${String(value)} exceeds the maximum safe value for NumberFlagRegistry (${0x40000000}). Use BigIntFlagRegistry for larger values.`,
      flag,
      value,
    );
    this.name = "OverflowError";
  }
}

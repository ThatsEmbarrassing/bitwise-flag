import { InvalidFlagError } from "./InvalidFlagError";

export class NotPowerOfTwoError extends InvalidFlagError {
  constructor(flag: string, value: unknown) {
    super(
      `Flag "${flag}" value must be a power of 2, got ${String(value)}`,
      flag,
      value,
    );
    this.name = "NotPowerOfTwoError";
  }
}

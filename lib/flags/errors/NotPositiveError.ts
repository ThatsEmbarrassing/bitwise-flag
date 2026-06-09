import { InvalidFlagError } from "./InvalidFlagError";

export class NotPositiveError extends InvalidFlagError {
  constructor(flag: string, value: unknown) {
    super(
      `Flag "${flag}" value must be positive, got ${String(value)}`,
      flag,
      value,
    );
    this.name = "NotPositiveError";
  }
}

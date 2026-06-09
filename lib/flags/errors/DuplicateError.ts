import { InvalidFlagError } from "./InvalidFlagError";

export class DuplicateError extends InvalidFlagError {
  constructor(flag: string, value: unknown) {
    super(
      `Flag "${flag}" has a duplicate value: ${String(value)}`,
      flag,
      value,
    );
    this.name = "DuplicateError";
  }
}

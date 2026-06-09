export class ParseError extends Error {
  readonly value: unknown;

  constructor(value: unknown) {
    super(`Cannot parse "${String(value)}" as a valid flag value`);
    this.name = "ParseError";
    this.value = value;
  }
}

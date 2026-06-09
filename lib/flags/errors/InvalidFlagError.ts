export class InvalidFlagError extends Error {
  readonly flag: string;
  readonly value: unknown;

  constructor(msg: string, flag: string, value: unknown) {
    super(msg);
    this.name = "InvalidFlag";
    this.flag = flag;
    this.value = value;
  }
}

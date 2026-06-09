export class UnknownFlagError extends Error {
  readonly flag: string;

  constructor(flag: string) {
    super(`Flag "${flag}" is not registered`);
    this.name = "UnknownFlagError";
    this.flag = flag;
  }
}

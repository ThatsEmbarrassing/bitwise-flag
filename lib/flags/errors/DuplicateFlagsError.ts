export class DuplicateFlagsError extends Error {
  constructor(public duplicates: string[]) {
    super(`Duplicated flags: ${duplicates.toString()}`);
    this.name = "DuplicateFlagsError";
  }
}

export class MixedRegistryError extends Error {
  readonly leftKeys: readonly string[];
  readonly rightKeys: readonly string[];

  constructor(leftKeys: string[], rightKeys: string[]) {
    super("Cannot mix flags from different registries");
    this.name = "MixedRegistryError";
    this.leftKeys = leftKeys;
    this.rightKeys = rightKeys;
  }
}
